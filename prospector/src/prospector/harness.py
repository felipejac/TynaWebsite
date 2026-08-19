"""O harness — o loop com começo, meio, fim e botão de desligar.

Máquina de estados explícita: `planejar → buscar → extrair → validar → armazenar → fim`.
Cada nó é uma função pura `(RunState) -> RunState`, que é exatamente a assinatura de nó
do LangGraph — portar é registrar as funções num `StateGraph`, sem reescrever lógica.
Enquanto o pipeline for linear, o grafo não paga o próprio custo.

Quatro propriedades que o loop garante, e que são o que separa "agente" de "script que
às vezes roda":

1. **Guardrail antes de cada nó** — o teto estoura antes do gasto, não depois.
2. **Falha isolada** — erro em uma empresa vira incidente registrado; a rodada segue.
3. **Observabilidade** — todo nó emite evento com contadores; a rodada inteira é
   reconstruível a partir da tabela `execucoes`.
4. **Ponto de parada humano** — `modo_seco=True` executa tudo e não grava nada;
   `revisar=True` interrompe antes de armazenar. É o escalonamento humano do agente.
"""

from __future__ import annotations

import logging
import uuid
from collections.abc import Callable
from datetime import datetime, timezone

from . import icp
from .config import settings
from .extract import Extrator
from .guardrails import GuardrailViolado, Guardrails, Orcamento, PolidezHTTP, ListaDeSupressao
from .models import Canal, CompanyData, Etapa, Praca, RunState, ScoredCompany
from .sources import FonteBusca, FonteCNPJ, FonteSite
from .storage import Repositorio

log = logging.getLogger("prospector")

No = Callable[[RunState], RunState]


class Prospector:
    """Orquestra a rodada. Recebe as dependências prontas — testar não exige rede."""

    def __init__(
        self,
        repo: Repositorio,
        guardrails: Guardrails | None = None,
        fonte_cnpj: FonteCNPJ | None = None,
        fonte_busca: FonteBusca | None = None,
        fonte_site: FonteSite | None = None,
        extrator: Extrator | None = None,
        modo_seco: bool = False,
        revisar: bool = False,
    ) -> None:
        self.repo = repo
        self.gr = guardrails or Guardrails(
            orcamento=Orcamento(
                max_chamadas_llm=settings.max_chamadas_llm,
                max_requisicoes_http=settings.max_requisicoes_http,
                max_custo_usd=settings.max_custo_usd,
                max_duracao_s=settings.max_duracao_s,
            ),
            polidez=PolidezHTTP(intervalo_min_s=settings.intervalo_http_s),
            supressao=ListaDeSupressao.de_arquivo(settings.supressao),
            retencao_dias=settings.retencao_dias,
        )
        self.cnpj = fonte_cnpj or FonteCNPJ()
        self.busca = fonte_busca or FonteBusca()
        self.site = fonte_site or FonteSite()
        self.extrator = extrator or Extrator()
        self.modo_seco = modo_seco
        self.revisar = revisar

    # ------------------------------------------------------------------ #
    # Nós                                                                 #
    # ------------------------------------------------------------------ #

    def planejar(self, s: RunState, pracas: tuple[Praca, ...]) -> RunState:
        self.gr.antes_do_no(s, Etapa.PLANEJAR)
        s.queries = icp.planejar_queries(pracas)
        log.info("plano: %d queries em %d praças", len(s.queries), len(pracas))
        s.etapa = Etapa.BUSCAR
        return s

    def buscar(self, s: RunState) -> RunState:
        """Descobre domínios candidatos. Empresa entra pelo site, não pela razão social.

        A busca devolve URL; o domínio é a chave de deduplicação até o CNPJ aparecer.
        Resolver domínio → CNPJ com confiabilidade exige o dump da Receita (ver README);
        sem ele, o domínio já é suficiente para pontuar sinal e priorizar revisão.
        """
        self.gr.antes_do_no(s, Etapa.BUSCAR)
        dominios: dict[str, str] = {}  # dominio -> url de descoberta

        for q in s.queries:
            if q.canal is not Canal.BUSCA_WEB:
                continue
            try:
                self.gr.antes_do_no(s, Etapa.BUSCAR)
            except GuardrailViolado:
                break
            for r in self.busca.buscar(q, s, self.gr):
                d = self.gr.polidez.host(r["url"]).removeprefix("www.")
                if not d or d in dominios:
                    continue
                if self.gr.supressao.bloqueado(dominio=d):
                    s.registrar(Etapa.BUSCAR, "suprimido", "domínio na lista de oposição", d)
                    continue
                dominios[d] = r["url"]
            s.queries_executadas.append(q.id)

        s.__dict__["_dominios"] = dominios  # trânsito interno entre nós
        log.info("busca: %d domínios candidatos", len(dominios))
        s.etapa = Etapa.EXTRAIR
        return s

    def extrair(self, s: RunState) -> RunState:
        """Lê o site de cada candidato, detecta sinal por regex e chama o LLM só quando vale."""
        self.gr.antes_do_no(s, Etapa.EXTRAIR)
        dominios: dict[str, str] = s.__dict__.get("_dominios", {})

        for dominio, url_descoberta in dominios.items():
            try:
                self.gr.antes_do_no(s, Etapa.EXTRAIR)
            except GuardrailViolado:
                break

            paginas = self.site.coletar(dominio, s, self.gr)
            if not paginas:
                continue

            sinais = FonteSite.detectar_sinais(paginas)
            # Porta de economia: sem nenhum sinal barato, o LLM não é chamado. Boa parte
            # dos domínios que a busca devolve é agregador, notícia ou fornecedor.
            if not sinais:
                s.registrar(Etapa.EXTRAIR, "sem_sinal", "nenhum padrão encontrado", dominio)
                continue

            empresa = self._empresa_provisoria(dominio, url_descoberta, sinais)
            empresa = self._enriquecer_pela_base_local(empresa, s)
            analise = self.extrator.analisar(empresa, paginas, s, self.gr)
            if analise:
                empresa = Extrator.aplicar(empresa, analise)
            s.empresas[empresa.cnpj] = empresa

        log.info("extração: %d empresas com sinal", len(s.empresas))
        s.etapa = Etapa.VALIDAR
        return s

    def validar(self, s: RunState) -> RunState:
        """Pontua pela régua fixa do ICP e descarta o que não passa do piso."""
        self.gr.antes_do_no(s, Etapa.VALIDAR)
        for empresa in s.empresas.values():
            pontuada: ScoredCompany = icp.pontuar(empresa)
            if pontuada.faixa.value == "descartar":
                s.registrar(Etapa.VALIDAR, "descartado",
                            f"{pontuada.pontos}/{pontuada.maximo}", empresa.dominio)
                continue
            s.pontuadas.append(pontuada)
        s.pontuadas.sort(key=lambda p: -p.pontos)
        log.info("validação: %d empresas acima do piso", len(s.pontuadas))
        s.etapa = Etapa.ARMAZENAR
        return s

    def armazenar(self, s: RunState) -> RunState:
        self.gr.antes_do_no(s, Etapa.ARMAZENAR)
        if self.modo_seco:
            log.info("modo seco: %d resultados NÃO gravados", len(s.pontuadas))
            s.etapa = Etapa.FIM
            return s
        for p in s.pontuadas:
            self.repo.salvar_empresa(p.empresa)
            self.repo.salvar_pontuacao(p)
        apagados = self.repo.purgar_expirados()
        if apagados:
            s.registrar(Etapa.ARMAZENAR, "retencao", f"{apagados} lead(s) expirado(s) apagado(s)")
        s.etapa = Etapa.FIM
        return s

    # ------------------------------------------------------------------ #
    # Loop                                                                #
    # ------------------------------------------------------------------ #

    def executar(self, pracas: tuple[Praca, ...] = tuple(Praca)) -> RunState:
        s = RunState(run_id=uuid.uuid4().hex[:12], icp_versao=icp.VERSAO)
        log.info("rodada %s iniciada — praças: %s", s.run_id, ", ".join(p.nome for p in pracas))

        etapas: dict[Etapa, No] = {
            Etapa.PLANEJAR: lambda st: self.planejar(st, pracas),
            Etapa.BUSCAR: self.buscar,
            Etapa.EXTRAIR: self.extrair,
            Etapa.VALIDAR: self.validar,
            Etapa.ARMAZENAR: self.armazenar,
        }

        try:
            while s.etapa in etapas:
                atual = s.etapa
                if atual is Etapa.ARMAZENAR and self.revisar:
                    # Escalonamento humano: para antes de gravar e devolve o estado.
                    log.info("revisão pedida — parando antes de armazenar")
                    s.registrar(atual, "revisao_humana", "execução pausada para conferência")
                    break
                s = etapas[atual](s)
                if s.etapa is atual:  # nó que não avança seria laço infinito
                    raise RuntimeError(f"nó {atual.value} não avançou o estado")
        except GuardrailViolado as e:
            log.warning("rodada abortada por guardrail: %s", e)
            s.etapa = Etapa.ABORTADO
        except Exception as e:  # falha inesperada não pode perder o que já foi coletado
            log.exception("falha inesperada")
            s.registrar(s.etapa, "falha_inesperada", f"{type(e).__name__}: {e}")
            s.etapa = Etapa.ABORTADO
        finally:
            s.encerrado_em = datetime.now(timezone.utc)
            if not self.modo_seco:
                self.repo.salvar_execucao(s)
            log.info("rodada %s encerrada: %s", s.run_id, s.resumo)
        return s

    # ------------------------------------------------------------------ #

    def _enriquecer_pela_base_local(self, empresa: CompanyData, s: RunState) -> CompanyData:
        """Troca o CNPJ sintético pelo real quando a base carregada da Receita casa.

        O casamento é por marca e falha em holding cuja razão social não parece com o
        site — por isso entra com confiança reduzida e registra um incidente do tipo
        `casamento_heuristico`, que é a fila de conferência humana, não um fato.
        """
        if not empresa.dominio:
            return empresa
        linha = self.repo.casar_por_dominio(empresa.dominio)
        if linha is None:
            return empresa

        from .models import Porte

        d = dict(linha)
        porte = {"micro": Porte.ME, "pequena": Porte.EPP}.get(d.get("porte") or "", Porte.DESCONHECIDO)
        capital = d.get("capital_social")
        if porte is Porte.DESCONHECIDO and capital:
            porte = Porte.GRANDE if capital >= 10_000_000 else (
                Porte.MEDIA if capital >= 1_000_000 else Porte.DESCONHECIDO)

        atualizada = empresa.model_copy(update={
            "cnpj": d["cnpj"],
            "razao_social": d["razao_social"],
            "nome_fantasia": d.get("nome_fantasia"),
            "municipio_ibge": d["municipio_ibge"],
            "municipio": d["municipio"],
            "cnae_principal": d["cnae"],
            "porte": porte,
            "capital_social": capital,
            "situacao_cadastral": "ATIVA",  # a carga só aceita situação ativa
        })
        s.registrar(Etapa.EXTRAIR, "casamento_heuristico",
                    f"{empresa.dominio} → {d['razao_social']} (via {d['via']})", d["cnpj"])
        return atualizada

    @staticmethod
    def _empresa_provisoria(dominio: str, url: str, sinais) -> CompanyData:
        """Empresa antes de o CNPJ ser resolvido.

        Usa CNPJ sintético derivado do domínio para não colidir com registro real: os
        dois primeiros dígitos ficam em '00', que não existe em CNPJ válido. Assim a
        chave primária funciona e ninguém confunde candidato com empresa identificada.
        """
        import hashlib

        from .models import Metodo, Provenance

        h = hashlib.sha256(dominio.encode()).hexdigest()
        sintetico = "00" + "".join(c for c in h if c.isdigit())[:12].ljust(12, "0")
        return CompanyData(
            cnpj=sintetico,
            razao_social=dominio,
            municipio_ibge="",
            municipio="",
            site=f"https://{dominio}",
            dominio=dominio,
            sinais=list(sinais),
            origem=Provenance(fonte="busca-web", url=url, metodo=Metodo.BUSCA_WEB),
        )
