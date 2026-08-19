"""Guardrails — o que impede o agente de sair caro, ilegal ou mal-educado.

A distinção que a Tyna publica em /governanca-de-agentes/ vale para o agente dela
própria: **política é lida por pessoas e pode ser ignorada; guardrail é executado pela
máquina e não admite exceção silenciosa.** Tudo aqui é verificado em execução, e cada
recusa é registrada — não existe caminho que contorne.

Quatro classes de limite:

1. **Orçamento** — teto de chamadas de LLM, de requisições HTTP e de dólares por rodada.
2. **Educação de robô** — robots.txt respeitado, intervalo mínimo entre requisições ao
   mesmo host, User-Agent que identifica quem está batendo e como falar com a gente.
3. **Escopo de coleta** — allowlist de domínios de fonte, e bloqueio explícito de
   plataformas cujos termos proíbem raspagem.
4. **LGPD** — supressão (oposição do titular), minimização e retenção.
"""

from __future__ import annotations

import time
import urllib.robotparser
from dataclasses import dataclass, field
from datetime import date, timedelta
from urllib.parse import urlparse

from .models import Etapa, RunState


class GuardrailViolado(RuntimeError):
    """Levantada quando o limite é duro. Aborta a rodada, e isso é o comportamento certo."""


class ColetaRecusada(Exception):
    """Levantada quando uma coleta específica é negada. A rodada continua sem ela."""


# --------------------------------------------------------------------------- #
# 1. Orçamento                                                                #
# --------------------------------------------------------------------------- #


@dataclass
class Orcamento:
    """Teto duro da rodada. Existe porque agente sem teto é fatura sem teto."""

    max_chamadas_llm: int = 120
    max_requisicoes_http: int = 600
    max_custo_usd: float = 5.0
    max_duracao_s: int = 1800

    def conferir(self, estado: RunState) -> None:
        if estado.chamadas_llm >= self.max_chamadas_llm:
            raise GuardrailViolado(f"teto de chamadas de LLM atingido ({self.max_chamadas_llm})")
        if estado.requisicoes_http >= self.max_requisicoes_http:
            raise GuardrailViolado(f"teto de requisições HTTP atingido ({self.max_requisicoes_http})")
        if estado.custo_llm_usd >= self.max_custo_usd:
            raise GuardrailViolado(f"teto de custo atingido (US$ {self.max_custo_usd})")
        decorrido = (
            (estado.encerrado_em or _agora()) - estado.iniciado_em
        ).total_seconds()
        if decorrido >= self.max_duracao_s:
            raise GuardrailViolado(f"teto de duração atingido ({self.max_duracao_s}s)")


def _agora():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------- #
# 2. Educação de robô                                                         #
# --------------------------------------------------------------------------- #

# Plataformas cujos termos de uso proíbem coleta automatizada. A lista não é sobre
# ser possível — é sobre ser permitido. Raspar o LinkedIn viola os termos dele, e uma
# consultoria de governança que faz isso perde o direito de cobrar coerência do cliente.
DOMINIOS_PROIBIDOS: frozenset[str] = frozenset({
    "linkedin.com", "www.linkedin.com", "br.linkedin.com",
    "facebook.com", "instagram.com", "x.com", "twitter.com",
    "glassdoor.com.br", "glassdoor.com",
})

USER_AGENT = (
    "TynaProspector/0.1 (+https://tyna.com.br/; contato@tyna.com.br) "
    "pesquisa-de-mercado-b2b"
)


@dataclass
class PolidezHTTP:
    """Um crawler educado: robots.txt, intervalo por host e identificação honesta."""

    intervalo_min_s: float = 2.0
    _ultimo_acesso: dict[str, float] = field(default_factory=dict)
    _robots: dict[str, urllib.robotparser.RobotFileParser | None] = field(default_factory=dict)

    def host(self, url: str) -> str:
        return urlparse(url).netloc.lower()

    def permitido(self, url: str) -> bool:
        """Nega domínio proibido por termos e caminho negado pelo robots.txt do site."""
        h = self.host(url)
        raiz = ".".join(h.split(".")[-2:]) if h.count(".") >= 1 else h
        if h in DOMINIOS_PROIBIDOS or raiz in DOMINIOS_PROIBIDOS:
            return False
        rp = self._carregar_robots(h)
        if rp is None:
            # Sem robots.txt legível, o padrão é permitir — é o que a norma prevê.
            return True
        return rp.can_fetch(USER_AGENT, url)

    def _carregar_robots(self, host: str) -> urllib.robotparser.RobotFileParser | None:
        if host in self._robots:
            return self._robots[host]
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(f"https://{host}/robots.txt")
        try:
            rp.read()
        except Exception:
            rp = None  # host sem robots.txt acessível
        self._robots[host] = rp
        return rp

    def aguardar(self, url: str) -> None:
        """Segura a requisição até o intervalo mínimo daquele host ter passado."""
        h = self.host(url)
        ultimo = self._ultimo_acesso.get(h)
        if ultimo is not None:
            espera = self.intervalo_min_s - (time.monotonic() - ultimo)
            if espera > 0:
                time.sleep(espera)
        self._ultimo_acesso[h] = time.monotonic()


# --------------------------------------------------------------------------- #
# 3 e 4. LGPD: supressão, minimização, retenção                               #
# --------------------------------------------------------------------------- #

RETENCAO_PADRAO_DIAS = 180

# Campos que o pipeline nunca coleta sobre pessoa natural, mesmo se estiverem visíveis.
# Minimização não é o que dá para pegar: é o que é necessário para a finalidade.
CAMPOS_VEDADOS: frozenset[str] = frozenset({
    "cpf", "rg", "data_nascimento", "endereco_residencial", "telefone_pessoal",
    "email_pessoal", "estado_civil", "foto", "genero", "religiao", "filiacao_politica",
    "orientacao_sexual", "dado_de_saude", "biometria",
})


@dataclass
class ListaDeSupressao:
    """Oposição do titular (art. 18 da LGPD) e bloqueio por domínio.

    Consultada **antes de armazenar** e novamente antes de qualquer contato futuro.
    Uma lista consultada só no envio já falhou: o dado ficou guardado no meio-tempo.
    """

    emails: set[str] = field(default_factory=set)
    dominios: set[str] = field(default_factory=set)
    cnpjs: set[str] = field(default_factory=set)

    @classmethod
    def de_arquivo(cls, caminho) -> "ListaDeSupressao":
        """Carrega de um arquivo texto: uma entrada por linha, '#' comenta."""
        from pathlib import Path

        p = Path(caminho)
        lista = cls()
        if not p.exists():
            return lista
        for linha in p.read_text(encoding="utf-8").splitlines():
            item = linha.split("#")[0].strip().lower()
            if not item:
                continue
            if "@" in item:
                lista.emails.add(item)
            elif item.isdigit():
                lista.cnpjs.add(item)
            else:
                lista.dominios.add(item.removeprefix("www."))
        return lista

    def bloqueado(self, *, email: str | None = None, dominio: str | None = None,
                  cnpj: str | None = None) -> bool:
        if email and email.lower() in self.emails:
            return True
        if dominio and dominio.lower().removeprefix("www.") in self.dominios:
            return True
        if cnpj and "".join(c for c in cnpj if c.isdigit()) in self.cnpjs:
            return True
        return False


def prazo_de_retencao(dias: int = RETENCAO_PADRAO_DIAS) -> date:
    """Data de descarte. Retenção indefinida não é retenção, é acúmulo."""
    return date.today() + timedelta(days=dias)


def validar_minimizacao(dados: dict) -> None:
    """Recusa qualquer payload que traga campo vedado sobre pessoa natural."""
    achados = sorted(set(dados) & CAMPOS_VEDADOS)
    if achados:
        raise ColetaRecusada(
            "campos vedados por minimização não podem ser coletados: " + ", ".join(achados)
        )


# --------------------------------------------------------------------------- #
# Fachada                                                                     #
# --------------------------------------------------------------------------- #


@dataclass
class Guardrails:
    """Reúne os quatro limites num objeto só, que o harness consulta a cada nó."""

    orcamento: Orcamento = field(default_factory=Orcamento)
    polidez: PolidezHTTP = field(default_factory=PolidezHTTP)
    supressao: ListaDeSupressao = field(default_factory=ListaDeSupressao)
    retencao_dias: int = RETENCAO_PADRAO_DIAS

    def antes_do_no(self, estado: RunState, etapa: Etapa) -> None:
        """Chamado na entrada de cada nó do harness. Estoura antes de gastar, não depois."""
        try:
            self.orcamento.conferir(estado)
        except GuardrailViolado as e:
            estado.registrar(etapa, "orcamento", str(e))
            raise

    def pode_coletar(self, url: str, estado: RunState) -> bool:
        """Porta única de saída para a internet. Nada busca sem passar por aqui."""
        if not self.polidez.permitido(url):
            estado.registrar(Etapa.BUSCAR, "coleta_negada", "robots.txt ou termos de uso", url)
            return False
        return True
