"""Fontes de dados. Toda saída para a internet passa por aqui, e por um guardrail.

Três fontes, escolhidas por serem legítimas **e** boas — nesta ordem:

1. **CNPJ aberto (Receita Federal via BrasilAPI)** — a espinha dorsal. É dado público
   de registro empresarial, gratuito, e traz exatamente os filtros do recorte: município,
   CNAE, porte, capital social e situação cadastral. Nenhuma raspagem envolvida.
2. **API de busca (Brave ou Tavily)** — descoberta de sinal. Procura evidência de uso de
   IA, não nome de empresa.
3. **Site da própria empresa** — leitura educada, com robots.txt respeitado, para
   confirmar sinal e capturar trecho citável.

O que **não** está aqui, de propósito: raspador de LinkedIn. Os termos de uso da
plataforma proíbem coleta automatizada, e o dado de lá é pessoal por natureza. Para
contato nominal o caminho é a interface oficial (Sales Navigator, operada por gente) ou
página institucional publicada pela própria empresa.
"""

from __future__ import annotations

import re
from typing import Protocol

import httpx

from .config import settings
from .guardrails import USER_AGENT, Guardrails
from .models import (
    CompanyData,
    Metodo,
    Porte,
    Provenance,
    Rastreado,
    RunState,
    SearchQuery,
    SinalIA,
)


class Fonte(Protocol):
    """Contrato de qualquer fonte. Recebe uma query, devolve empresas parciais."""

    nome: str

    def buscar(self, query: SearchQuery, estado: RunState, gr: Guardrails) -> list[CompanyData]:
        ...


# --------------------------------------------------------------------------- #
# 1. Registro público de CNPJ                                                 #
# --------------------------------------------------------------------------- #

_PORTE_RECEITA = {
    "MICRO EMPRESA": Porte.ME,
    "EMPRESA DE PEQUENO PORTE": Porte.EPP,
    "DEMAIS": Porte.DESCONHECIDO,  # a Receita não separa média de grande; capital decide
}


class FonteCNPJ:
    """Consulta o registro público da Receita Federal via BrasilAPI.

    Ressalva honesta de arquitetura: a BrasilAPI resolve **um CNPJ por vez**, ela não
    tem busca por município e CNAE. Para varredura por praça, a fonte real é o dump de
    dados abertos da Receita (dados.gov.br), carregado uma vez num banco local e
    consultado com SQL — está descrito no README como passo de bootstrap. Esta classe
    faz o enriquecimento de um CNPJ já descoberto, que é o uso do dia a dia.
    """

    nome = "BrasilAPI/CNPJ"

    def __init__(self, cliente: httpx.Client | None = None) -> None:
        self._c = cliente or httpx.Client(
            timeout=20.0, headers={"user-agent": USER_AGENT}, follow_redirects=True
        )

    def enriquecer(self, cnpj: str, estado: RunState, gr: Guardrails) -> CompanyData | None:
        digitos = "".join(c for c in cnpj if c.isdigit())
        if len(digitos) != 14:
            return None
        url = f"{settings.brasilapi_base}/cnpj/v1/{digitos}"
        if not gr.pode_coletar(url, estado):
            return None
        gr.polidez.aguardar(url)
        try:
            r = self._c.get(url)
            estado.requisicoes_http += 1
            if r.status_code == 404:
                return None
            r.raise_for_status()
            d = r.json()
        except Exception as e:  # rede, JSON, rate limit — nenhum derruba a rodada
            from .models import Etapa

            estado.registrar(Etapa.BUSCAR, "falha_cnpj", f"{type(e).__name__}: {e}", digitos)
            return None

        origem = Provenance(fonte=self.nome, url=url, metodo=Metodo.REGISTRO_PUBLICO)
        porte = _PORTE_RECEITA.get((d.get("porte") or "").upper(), Porte.DESCONHECIDO)
        capital = _float(d.get("capital_social"))
        if porte is Porte.DESCONHECIDO and capital:
            from .icp import CAPITAL_GRANDE_EMPRESA, CAPITAL_MEDIA_EMPRESA

            if capital >= CAPITAL_GRANDE_EMPRESA:
                porte = Porte.GRANDE
            elif capital >= CAPITAL_MEDIA_EMPRESA:
                porte = Porte.MEDIA

        return CompanyData(
            cnpj=digitos,
            razao_social=d.get("razao_social") or d.get("nome_fantasia") or "(sem razão social)",
            nome_fantasia=d.get("nome_fantasia") or None,
            municipio_ibge=str(d.get("codigo_municipio_ibge") or ""),
            municipio=d.get("municipio") or "",
            uf=d.get("uf") or "SP",
            cnae_principal=str(d.get("cnae_fiscal") or "") or None,
            cnae_descricao=d.get("cnae_fiscal_descricao") or None,
            porte=porte,
            capital_social=capital,
            situacao_cadastral=d.get("descricao_situacao_cadastral") or None,
            origem=origem,
        )


def _float(v) -> float | None:
    try:
        return float(v) if v not in (None, "") else None
    except (TypeError, ValueError):
        return None


# --------------------------------------------------------------------------- #
# 2. Busca web                                                                #
# --------------------------------------------------------------------------- #


class ResultadoBusca(dict):
    """{'titulo','url','trecho'} — dicionário simples para não acoplar ao provedor."""


class FonteBusca:
    """Adaptador de API de busca. Brave e Tavily por trás da mesma assinatura.

    API de busca, e não raspagem de SERP: raspar resultado de buscador viola os termos
    de uso de todos eles e quebra na primeira mudança de layout.
    """

    nome = "busca-web"

    def __init__(self, cliente: httpx.Client | None = None) -> None:
        self._c = cliente or httpx.Client(timeout=25.0, headers={"user-agent": USER_AGENT})

    def buscar(self, query: SearchQuery, estado: RunState, gr: Guardrails) -> list[ResultadoBusca]:
        prov = settings.busca_provedor
        try:
            if prov == "brave":
                itens = self._brave(query)
            elif prov == "tavily":
                itens = self._tavily(query)
            else:
                raise ValueError(f"provedor de busca desconhecido: {prov}")
            estado.requisicoes_http += 1
        except Exception as e:
            from .models import Etapa

            estado.registrar(Etapa.BUSCAR, "falha_busca", f"{type(e).__name__}: {e}", query.termos)
            return []
        # O filtro de domínio proibido vale também para o que a busca devolve.
        return [i for i in itens if gr.polidez.permitido(i["url"])]

    def _brave(self, query: SearchQuery) -> list[ResultadoBusca]:
        r = self._c.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": query.termos, "count": query.max_resultados, "country": "br",
                    "search_lang": "pt", "safesearch": "moderate"},
            headers={"x-subscription-token": settings.brave_api_key or "", "accept": "application/json"},
        )
        r.raise_for_status()
        return [
            ResultadoBusca(titulo=x.get("title", ""), url=x.get("url", ""),
                           trecho=_limpar(x.get("description", "")))
            for x in r.json().get("web", {}).get("results", [])
            if x.get("url")
        ]

    def _tavily(self, query: SearchQuery) -> list[ResultadoBusca]:
        r = self._c.post(
            "https://api.tavily.com/search",
            json={"api_key": settings.tavily_api_key, "query": query.termos,
                  "max_results": query.max_resultados, "search_depth": "basic"},
        )
        r.raise_for_status()
        return [
            ResultadoBusca(titulo=x.get("title", ""), url=x.get("url", ""),
                           trecho=_limpar(x.get("content", "")))
            for x in r.json().get("results", [])
            if x.get("url")
        ]


def _limpar(t: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t or "")).strip()


# --------------------------------------------------------------------------- #
# 3. Site da empresa                                                          #
# --------------------------------------------------------------------------- #

# Padrões de sinal detectáveis sem LLM. Regex resolve o barato; o modelo entra só no
# que exige julgamento. Rodar LLM sobre todo HTML coletado seria caro e pior.
PADROES_SINAL: dict[SinalIA, tuple[str, ...]] = {
    SinalIA.PRODUTO_COM_IA: (
        r"intelig[êe]ncia artificial", r"\bmachine learning\b", r"\bIA generativa\b",
        r"\bcopilot\b", r"\bLLM\b", r"assistente de IA",
    ),
    SinalIA.CHATBOT_ATIVO: (
        r"\bchatbot\b", r"assistente virtual", r"atendimento automatizado",
        r"blip\.ai", r"zenvia", r"take\.net", r"intercom", r"drift\.com",
    ),
    SinalIA.MENCAO_GOVERNANCA: (
        r"pol[íi]tica de (uso de )?intelig[êe]ncia artificial", r"governan[çc]a de IA",
        r"comit[êe] de IA", r"ISO[ /]?42001", r"uso respons[áa]vel de IA",
    ),
    SinalIA.DPO_PUBLICADO: (
        r"encarregado(a)? (de|pelo) (tratamento de )?dados", r"\bDPO\b",
        r"data protection officer",
    ),
    SinalIA.VAGA_IA: (
        r"vaga.{0,40}(intelig[êe]ncia artificial|machine learning|cientista de dados)",
        r"(engenheiro|engenheira|analista).{0,20}(de )?(IA|machine learning)",
    ),
    SinalIA.VAGA_COMPLIANCE: (
        r"vaga.{0,40}(compliance|privacidade|prote[çc][ãa]o de dados)",
    ),
}

CAMINHOS_UTEIS = ("", "/sobre", "/institucional", "/privacidade", "/politica-de-privacidade",
                  "/lgpd", "/carreiras", "/trabalhe-conosco", "/vagas", "/tecnologia", "/inovacao")


class FonteSite:
    """Lê algumas páginas públicas do site da empresa, com educação."""

    nome = "site-empresa"

    def __init__(self, cliente: httpx.Client | None = None) -> None:
        self._c = cliente or httpx.Client(
            timeout=20.0, headers={"user-agent": USER_AGENT}, follow_redirects=True
        )

    def coletar(self, dominio: str, estado: RunState, gr: Guardrails,
                max_paginas: int = 4) -> list[tuple[str, str]]:
        """Devolve [(url, texto)] das páginas que puderam ser lidas."""
        paginas: list[tuple[str, str]] = []
        for caminho in CAMINHOS_UTEIS:
            if len(paginas) >= max_paginas:
                break
            url = f"https://{dominio}{caminho}"
            if not gr.pode_coletar(url, estado):
                continue
            gr.polidez.aguardar(url)
            try:
                r = self._c.get(url)
                estado.requisicoes_http += 1
                if r.status_code != 200 or "text/html" not in r.headers.get("content-type", ""):
                    continue
                paginas.append((url, _texto_de(r.text)))
            except Exception:
                continue  # site fora do ar não é incidente digno de registro
        return paginas

    @staticmethod
    def detectar_sinais(paginas: list[tuple[str, str]]) -> list[Rastreado[SinalIA]]:
        achados: list[Rastreado[SinalIA]] = []
        vistos: set[SinalIA] = set()
        for url, texto in paginas:
            for sinal, padroes in PADROES_SINAL.items():
                if sinal in vistos:
                    continue
                if any(re.search(p, texto, re.IGNORECASE) for p in padroes):
                    vistos.add(sinal)
                    achados.append(
                        Rastreado[SinalIA](
                            valor=sinal,
                            origem=Provenance(
                                fonte="site-empresa", url=url, metodo=Metodo.SITE_PROPRIO
                            ),
                            confianca=0.8,  # regex acha menção, não confirma uso
                        )
                    )
        return achados


def _texto_de(html: str) -> str:
    """Extrai texto sem dependência pesada: script/style fora, tags fora, espaço normal."""
    sem_script = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    return _limpar(re.sub(r"<[^>]+>", " ", sem_script))[:20000]
