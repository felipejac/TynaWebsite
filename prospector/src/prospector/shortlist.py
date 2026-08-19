"""Da base firmográfica à lista curta, com sinal verificado.

O problema que este módulo resolve: a base local do CNPJ tem 345 mil estabelecimentos e
**nenhum sinal de uso de IA** — e sinal é o que decide o ICP (25 dos 120 pontos). Ranquear
por capital social produziria uma lista de empresas grandes, que é exatamente o que a
Tyna não vende: o ICP escrito diz que o gatilho é *uso de IA já acontecendo sem regra*,
não tamanho.

O caminho aqui não depende de API de busca paga:

1. **Pré-filtro firmográfico** na base local — praça, CNAE de gatilho, matriz, capital.
2. **Adivinhação de domínio** a partir da razão social e do nome fantasia. Remove sufixo
   societário, junta as palavras que sobram e tenta `.com.br` e `.com`.
3. **Verificação** — o domínio resolve e responde? A maioria não resolve, e isso é dado:
   holding e SPE não têm site, e empresa sem site não tem como mostrar sinal nenhum.
4. **Rastreio educado** do site que resolveu, com `robots.txt` e intervalo por host.
5. **Detecção de sinal** pelo mesmo regex do pipeline, e **pontuação pela régua fixa** do
   ICP — sem LLM, para o resultado ser reproduzível e explicável.

A taxa de acerto da adivinhação de domínio é medida e sai no relatório. Não é uma técnica
elegante; é a que funciona sem fonte que ligue CNPJ a site, que não existe pública.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass, field

import httpx

from . import icp
from .guardrails import USER_AGENT, Guardrails
from .models import (
    CompanyData,
    Etapa,
    Metodo,
    Porte,
    Provenance,
    RunState,
    ScoredCompany,
    SinalIA,
)
from .sources import FonteSite

log = logging.getLogger("prospector.shortlist")

# Termos societários e genéricos que não fazem parte da marca. A ordem importa: os
# compostos saem antes dos simples, senão "COMERCIO DE ALIMENTOS" vira "DE".
RUIDO = (
    "sociedade anonima", "sociedade limitada", "comercio e industria",
    "industria e comercio", "importacao e exportacao", "empreendimentos imobiliarios",
    "participacoes e empreendimentos", "servicos financeiros", "administracao de bens",
    "participacoes", "empreendimentos", "distribuidora", "incorporadora",
    "representacoes", "administradora", "comercial", "industrial", "comercio",
    "industria", "servicos", "holding", "brasil", "ltda", "s/a", "s.a", " sa ",
    "eireli", " me ", " epp ", "mei", "grupo", "cia", "e cia", "do brasil",
)

SUFIXOS = (".com.br", ".com")

# Palavras genéricas demais para virarem domínio sozinhas. Sem esta lista, "BANCO HSBC
# S.A." vira `banco.com` e "INFRAESTRUTURA BRASIL HOLDING XX" vira `infraestrutura.com` —
# domínios que existem, respondem 200 e não têm nada a ver com a empresa. Falso positivo
# assim é pior que candidato perdido: ele entra no relatório parecendo verdade.
GENERICAS = frozenset({
    "banco", "bancos", "infraestrutura", "energia", "seguros", "seguradora", "saude",
    "educacao", "ensino", "colegio", "faculdade", "universidade", "hospital", "clinica",
    "laboratorio", "farmacia", "supermercado", "mercado", "loja", "lojas", "atacado",
    "varejo", "transportes", "transporte", "logistica", "engenharia", "construtora",
    "consultoria", "assessoria", "tecnologia", "sistemas", "solucoes", "digital",
    "capital", "investimentos", "credito", "financeira", "fundo", "agro", "alimentos",
    "brasileira", "brasileiro", "nacional", "central", "geral", "unida", "unidos",
    "primeira", "nova", "novo", "sao", "santa", "santo",
})


def _sem_acento(t: str) -> str:
    plano = unicodedata.normalize("NFKD", t.lower())
    return "".join(c for c in plano if not unicodedata.combining(c))


def candidatos_de_dominio(razao: str, fantasia: str | None) -> list[str]:
    """Gera domínios plausíveis a partir do nome. Nome fantasia primeiro — é a marca.

    `LOJAS CEM SA` → `lojascem.com.br`, `lojas.com.br`
    `NUTRIEN SOLUCOES AGRICOLAS LTDA` → `nutriensolucoesagricolas.com.br`, `nutrien.com.br`
    """
    vistos: list[str] = []
    for bruto in (fantasia, razao):
        if not bruto:
            continue
        t = f" {_sem_acento(bruto)} "
        for r in RUIDO:
            t = t.replace(f" {r.strip()} ", " ")
        palavras = [p for p in re.split(r"[^a-z0-9]+", t) if len(p) > 1]
        if not palavras:
            continue
        # marca inteira e só a primeira palavra: cobre "lojascem" e "nutrien"
        formas = ["".join(palavras[:3])]
        if len(palavras) >= 2:
            formas.append("".join(palavras[:2]))
        # a primeira palavra sozinha só vira palpite se for distintiva
        if len(palavras[0]) >= 4 and palavras[0] not in GENERICAS:
            formas.append(palavras[0])
        for forma in formas:
            if not (4 <= len(forma) <= 30):
                continue
            for suf in SUFIXOS:
                d = forma + suf
                if d not in vistos:
                    vistos.append(d)
    return vistos[:6]


@dataclass
class Resultado:
    """Contagens da passada, para o relatório dizer o que aconteceu de verdade."""

    candidatos: int = 0
    dominios_tentados: int = 0
    dominios_resolvidos: int = 0
    sites_lidos: int = 0
    com_sinal: int = 0
    pontuadas: list[ScoredCompany] = field(default_factory=list)

    @property
    def taxa_resolucao(self) -> float:
        return (self.dominios_resolvidos / self.candidatos * 100) if self.candidatos else 0.0

    @property
    def taxa_sinal(self) -> float:
        return (self.com_sinal / self.sites_lidos * 100) if self.sites_lidos else 0.0


class Shortlist:
    def __init__(self, repo, guardrails: Guardrails, site: FonteSite | None = None) -> None:
        self.repo = repo
        self.gr = guardrails
        self.site = site or FonteSite()
        self._http = httpx.Client(
            timeout=10.0, headers={"user-agent": USER_AGENT}, follow_redirects=True
        )

    def resolve(self, dominio: str) -> bool:
        """O domínio existe e serve HTML? Uma requisição, sem seguir para o conteúdo."""
        try:
            r = self._http.get(f"https://{dominio}", timeout=8.0)
            return r.status_code < 400 and "text/html" in r.headers.get("content-type", "")
        except Exception:
            return False

    def executar(
        self,
        estado: RunState,
        municipios: tuple[str, ...],
        prefixos_cnae: tuple[str, ...] = (),
        capital_minimo: float = 1_000_000.0,
        limite_candidatos: int = 120,
        max_paginas: int = 3,
    ) -> Resultado:
        r = Resultado()
        linhas = self.repo.buscar_cnpj_local(
            municipios, prefixos_cnae, capital_minimo=capital_minimo,
            apenas_matriz=True, limite=limite_candidatos,
        )
        r.candidatos = len(linhas)
        log.info("pré-filtro firmográfico: %d candidato(s)", r.candidatos)

        # Grupo econômico entra na base com vários CNPJs — SAFRA LEASING e SAFRA PHONE
        # resolvem para o mesmo safra.com.br. Sem deduplicar por domínio, o mesmo site é
        # rastreado duas vezes e o relatório mostra a mesma empresa como dois leads.
        ja_usados: dict[str, str] = {}

        for i, linha in enumerate(linhas, 1):
            d = dict(linha)
            try:
                self.gr.antes_do_no(estado, Etapa.EXTRAIR)
            except Exception:
                log.warning("guardrail interrompeu a passada em %d/%d", i, r.candidatos)
                break

            dominio = None
            for cand in candidatos_de_dominio(d["razao_social"], d.get("nome_fantasia")):
                r.dominios_tentados += 1
                if self.gr.supressao.bloqueado(dominio=cand):
                    continue
                estado.requisicoes_http += 1
                if self.resolve(cand):
                    dominio = cand
                    break
            if not dominio:
                continue
            if dominio in ja_usados:
                log.info("[%d/%d] %s: mesmo domínio de %s — agrupado", i, r.candidatos,
                         d["razao_social"][:34], ja_usados[dominio])
                continue
            ja_usados[dominio] = d["razao_social"]
            r.dominios_resolvidos += 1

            paginas = self.site.coletar(dominio, estado, self.gr, max_paginas=max_paginas)
            if not paginas:
                continue
            r.sites_lidos += 1

            sinais = FonteSite.detectar_sinais(paginas)
            if sinais:
                r.com_sinal += 1

            empresa = self._empresa(d, dominio, sinais)
            pontuada = icp.pontuar(empresa)
            r.pontuadas.append(pontuada)
            log.info("[%d/%d] %s → %s: %d pts (%s)", i, r.candidatos,
                     d["razao_social"][:34], dominio, pontuada.pontos, pontuada.faixa.value)

        r.pontuadas.sort(key=lambda p: -p.pontos)
        return r

    @staticmethod
    def _empresa(d: dict, dominio: str, sinais) -> CompanyData:
        porte = {"micro": Porte.ME, "pequena": Porte.EPP}.get(d.get("porte") or "", Porte.DESCONHECIDO)
        capital = d.get("capital_social")
        if porte is Porte.DESCONHECIDO and capital:
            porte = Porte.GRANDE if capital >= 10_000_000 else (
                Porte.MEDIA if capital >= 1_000_000 else Porte.DESCONHECIDO)
        return CompanyData(
            cnpj=d["cnpj"],
            razao_social=d["razao_social"],
            nome_fantasia=d.get("nome_fantasia"),
            municipio_ibge=d["municipio_ibge"],
            municipio=d["municipio"],
            cnae_principal=d["cnae"],
            porte=porte,
            capital_social=capital,
            situacao_cadastral="ATIVA",
            site=f"https://{dominio}",
            dominio=dominio,
            sinais=list(sinais),
            origem=Provenance(
                fonte="Receita Federal — Dados Abertos CNPJ",
                metodo=Metodo.REGISTRO_PUBLICO,
            ),
        )


# --------------------------------------------------------------------------- #
# Relatório                                                                   #
# --------------------------------------------------------------------------- #

ROTULO_SINAL = {
    SinalIA.PRODUTO_COM_IA: "IA no produto",
    SinalIA.CHATBOT_ATIVO: "assistente/chatbot",
    SinalIA.VAGA_IA: "vaga de IA",
    SinalIA.CASE_PUBLICO: "case público",
    SinalIA.MENCAO_GOVERNANCA: "menciona governança",
    SinalIA.DPO_PUBLICADO: "DPO publicado",
    SinalIA.VAGA_COMPLIANCE: "vaga de compliance",
    SinalIA.SETOR_REGULADO: "setor regulado",
}

PORTA_POR_SINAL = {
    SinalIA.CHATBOT_ATIVO: ("Diretoria de tecnologia", "governanca-de-agentes"),
    SinalIA.PRODUTO_COM_IA: ("Diretoria de tecnologia", "governanca-de-agentes"),
    SinalIA.VAGA_IA: ("Diretoria de tecnologia", "shadow-ai"),
    SinalIA.DPO_PUBLICADO: ("Jurídico / DPO", "lgpd-e-ia"),
    SinalIA.VAGA_COMPLIANCE: ("Compliance", "iso-42001"),
}


# Acima disto o capital declarado deixa de ser proxy de porte e vira sinal de alerta.
# O capital social do dump é AUTODECLARADO no registro e ninguém confere: a base tem
# "bancos" de nome genérico declarando R$ 18 bi, três deles com o mesmo valor redondo.
CAPITAL_IMPLAUSIVEL = 1_000_000_000.0


def _capital(v: float | None) -> str:
    """R$ 12.061 mi é lido como doze mil em português. Acima de mil milhões, vira bilhão.

    Valor implausível sai marcado — é autodeclarado, e empresa de fachada declara alto.
    """
    if not v:
        return "—"
    if v >= CAPITAL_IMPLAUSIVEL:
        return f"R$ {v/1_000_000_000:.1f} bi ⚠".replace(".", ",")
    return f"R$ {v/1_000_000:.1f} mi".replace(".", ",")


def relatorio(r: Resultado, contexto: dict) -> str:
    """Documento em Markdown, com o boletim de cada lead e a ressalva do método."""
    from datetime import date

    linhas: list[str] = []
    a = linhas.append

    a("# Leads potenciais — governança de IA")
    a("")
    a(f"Gerado em {date.today().strftime('%d/%m/%Y')} pelo motor de prospecção da Tyna "
      f"(`prospector shortlist`), sobre a base local dos Dados Abertos do CNPJ, "
      f"competência {contexto.get('competencia', '?')}.")
    a("")
    a("**Documento interno.** Não vai para o repositório público nem para o site — a lista "
      "nomeia empresas de terceiros e é material comercial da Tyna.")
    a("")
    a("---")
    a("")
    a("## Como esta lista foi montada")
    a("")
    a("A nota **não** foi dada por um modelo de linguagem. É aritmética sobre critérios de "
      "peso fixo, definidos em `icp.py` na versão `" + icp.VERSAO + "`, e cada linha do "
      "boletim traz a evidência. O mesmo insumo produz a mesma nota, hoje e em outubro.")
    a("")
    a("| Etapa | Resultado |")
    a("| --- | --- |")
    a(f"| Candidatos no pré-filtro firmográfico | {r.candidatos} |")
    a(f"| Domínios testados | {r.dominios_tentados} |")
    a(f"| Domínios que resolveram | **{r.dominios_resolvidos}** ({r.taxa_resolucao:.0f}% dos candidatos) |")
    a(f"| Sites efetivamente lidos | {r.sites_lidos} |")
    a(f"| Com algum sinal detectado | **{r.com_sinal}** ({r.taxa_sinal:.0f}% dos lidos) |")
    a("")
    a("O filtro firmográfico usado: " + contexto.get("filtro", "—") + ".")
    a("")

    # Dedup por domínio: grupo econômico entra na base com vários CNPJs e todos resolvem
    # para o mesmo site. Fica o de maior nota.
    por_dominio: dict[str, ScoredCompany] = {}
    for p in sorted(r.pontuadas, key=lambda x: -x.pontos):
        chave = p.empresa.dominio or p.empresa.cnpj
        por_dominio.setdefault(chave, p)

    por_faixa: dict[str, list[ScoredCompany]] = {}
    for p in por_dominio.values():
        # razão social degenerada ("." e afins) é lixo de parsing, não lead
        if len((p.empresa.nome_fantasia or p.empresa.razao_social).strip(" .-")) < 3:
            continue
        por_faixa.setdefault(p.faixa.value, []).append(p)

    titulos = {
        "prioritario": ("## Prioritários", "Uso de IA visível e nenhuma menção a política, comitê ou norma. É a lacuna que a Tyna vende, com evidência na própria página da empresa."),
        "qualificado": ("## Qualificados", "Sinal presente, mas o conjunto ainda não fecha. Vale abordagem com gancho específico."),
        "observar": ("## Observar", "Firmografia certa, sinal fraco ou ausente. Entra em nutrição, não em proposta."),
    }

    # "Observar" é a faixa de quem passou na firmografia e não mostrou sinal — todos com a
    # mesma nota. Detalhar 90 boletins idênticos enterra os poucos que importam, então essa
    # faixa vira tabela.
    observar = por_faixa.pop("observar", [])

    for faixa in ("prioritario", "qualificado"):
        itens = por_faixa.get(faixa, [])
        if not itens:
            a(f"{titulos[faixa][0]} — nenhum")
            a("")
            continue
        titulo, explicacao = titulos[faixa]
        a(f"{titulo} — {len(itens)}")
        a("")
        a(explicacao)
        a("")
        for p in itens:
            e = p.empresa
            a(f"### {e.nome_fantasia or e.razao_social}")
            a("")
            nome_oficial = f" · razão social: {e.razao_social}" if e.nome_fantasia else ""
            capital = _capital(e.capital_social)
            a(f"**{p.pontos}/{p.maximo} pontos** · {e.municipio} · CNAE {e.cnae_principal} · "
              f"capital {capital}{nome_oficial}")
            a("")
            a(f"- Site: {e.site}")
            a(f"- CNPJ: {e.cnpj}")
            sinais = sorted(e.tipos_de_sinal, key=lambda s: s.value)
            if sinais:
                a("- Sinais encontrados no site: " + ", ".join(ROTULO_SINAL.get(s, s.value) for s in sinais))
                porta = next((PORTA_POR_SINAL[s] for s in sinais if s in PORTA_POR_SINAL), None)
                if porta:
                    a(f"- **Porta de entrada sugerida:** {porta[0]} — abrir por "
                      f"https://tyna.com.br/{porta[1]}/")
            else:
                a("- Sinais encontrados no site: nenhum")
            a("")
            a("<details><summary>Boletim completo da nota</summary>")
            a("")
            a("```")
            a(p.explicar())
            a("```")
            a("")
            a("</details>")
            a("")

    if observar:
        a(f"## Observar — {len(observar)}")
        a("")
        a("Firmografia certa e **nenhum sinal de uso de IA** no site. Alguns têm sinal de LGPD, "
          "como encarregado de dados publicado, que não pontua como uso. Todos com nota parecida, "
          "por isso vão em tabela: detalhar boletins idênticos enterraria os poucos que "
          "importam. Entram em nutrição, não em proposta.")
        a("")
        a("| Empresa | Praça | CNAE | Capital | Site |")
        a("| --- | --- | --- | --- | --- |")
        for p in observar:
            e = p.empresa
            cap = _capital(e.capital_social)
            a(f"| {e.nome_fantasia or e.razao_social} | {e.municipio} | {e.cnae_principal} "
              f"| {cap} | {e.dominio} |")
        a("")

    a("---")
    a("")
    a("## Por que o rendimento foi este")
    a("")
    a(f"De {r.candidatos} candidatos firmográficos, {r.dominios_resolvidos} tiveram domínio "
      f"resolvido e apenas **{r.com_sinal} mostraram algum sinal de IA no site**. O número "
      "é baixo e as três causas são mensuráveis:")
    a("")
    a("1. **O sentido da busca está invertido.** Esta passada pega empresas por porte e "
      "setor e vai *conferir* se usam IA. O caminho de maior rendimento é o oposto: partir "
      "do sinal — vaga de engenheiro de ML, case publicado, assistente no site — e chegar "
      "na empresa. Isso é o canal de busca web do pipeline, que precisa de uma chave de API "
      "(Brave ou Tavily, ambas com camada gratuita) e ainda não foi configurada.")
    a("")
    a("2. **A leitura é de HTML estático.** Site montado em JavaScript devolve pouca coisa "
      "para o rastreador, e boa parte do site corporativo grande é assim. O que a empresa "
      "diz sobre IA costuma estar em página de imprensa, blog ou carreira — não na home.")
    a("")
    a("3. **Capital social é autodeclarado.** O valor vem do registro e ninguém confere. "
      "A base traz \"bancos\" de nome genérico declarando R$ 18 bi, três deles com o mesmo "
      "número redondo — padrão de empresa de fachada. Ordenar por capital põe fachada no "
      "topo, então ele vale como filtro grosso de porte e **não** como ranking. Valores "
      "acima de R$ 1 bi saem marcados com ⚠ nas tabelas.")
    a("")
    a("4. **O domínio é adivinhado.** Resolveu em "
      f"{r.taxa_resolucao:.0f}% dos casos, o que é melhor do que se esperaria, mas o terço "
      "que sobrou não é \"empresa sem site\": é palpite que errou.")
    a("")
    a("---")
    a("")
    a("## O que esta lista não é")
    a("")
    a("**Não é contato.** Não há nome, cargo, e-mail ou telefone de pessoa nenhuma aqui — "
      "isso é dado pessoal, exige base legal registrada e sai por outro caminho, com a "
      "avaliação de legítimo interesse aprovada antes.")
    a("")
    a("**O sinal é de superfície.** Foi lido do site público, por padrão de texto. "
      "\"Menciona IA no site\" não é o mesmo que \"opera IA em produção sem governança\" — "
      "é indício suficiente para justificar uma conversa, não para afirmar um diagnóstico. "
      "A confirmação é a primeira pergunta da abordagem, e ela já está escrita no ICP: "
      "*quem na empresa já está usando IA hoje, e sob que política?*")
    a("")
    a("**A resolução de domínio é heurística.** O nome do site foi adivinhado a partir da "
      "razão social e do nome fantasia. Domínio que não resolveu não significa empresa sem "
      "site — significa que o palpite errou. Por isso a taxa de resolução está no quadro "
      "acima, e não escondida.")
    a("")
    a("**Falta a maior parte da base.** A carga rodou com um décimo do dump da Receita. "
      "A varredura completa multiplica o universo por cerca de dez.")
    return "\n".join(linhas) + "\n"
