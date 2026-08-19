"""O ICP em código — versionado, determinístico e auditável.

Duas decisões de projeto que valem explicação, porque são o oposto do que a maioria
dos "agentes de prospecção" faz:

1. **O LLM não dá a nota.** Ele extrai evidência de texto; a pontuação é aritmética
   sobre critérios com peso fixo. Isso torna o resultado reproduzível e explicável —
   e é a mesma exigência que a Tyna coloca nos clientes: decisão automatizada precisa
   ser reconstruível.
2. **O ICP é versionado.** Mudar peso é mudar `VERSAO`. Sem isso, um lead pontuado em
   agosto e outro em outubro não são comparáveis, e ninguém percebe.

Fonte do conteúdo: docs/kb/posicionamento/icp.md do repositório da Tyna.
"""

from __future__ import annotations

from .models import (
    CompanyData,
    CriterioPontuado,
    Papel,
    Porte,
    ScoredCompany,
    SinalIA,
)

VERSAO = "icp-2026-08"

# --------------------------------------------------------------------------- #
# Recorte de mercado                                                          #
# --------------------------------------------------------------------------- #

# Prefixos de CNAE por setor. O ICP escrito nomeia varejo, financeiro, saúde e
# educação como gatilho mais forte — volume de dado pessoal e exposição regulatória.
CNAE_GATILHO_FORTE: dict[str, str] = {
    "64": "Serviços financeiros",
    "65": "Seguros e previdência",
    "66": "Atividades auxiliares de serviços financeiros",
    "86": "Atenção à saúde humana",
    "85": "Educação",
    "47": "Comércio varejista",
    "46": "Comércio atacadista",
}

# Setores que usam IA pesado mas compram governança por outro caminho.
CNAE_GATILHO_MEDIO: dict[str, str] = {
    "62": "Serviços de TI",
    "63": "Serviços de informação",
    "61": "Telecomunicações",
    "35": "Energia elétrica",
    "49": "Transporte terrestre",
    "52": "Armazenamento e apoio ao transporte",
    "10": "Produtos alimentícios",
    "21": "Farmoquímicos e farmacêuticos",
}

# Capital social como proxy de porte quando a Receita não classifica.
# A Receita marca porte apenas até EPP; acima disso vem "DEMAIS", que não distingue
# média de grande — por isso o capital entra como segundo sinal, e não como único.
CAPITAL_MEDIA_EMPRESA = 1_000_000.0
CAPITAL_GRANDE_EMPRESA = 10_000_000.0

# Cargos que caem em cada papel do ICP. Casamento por substring, minúsculo, sem acento.
PADROES_DE_PAPEL: dict[Papel, tuple[str, ...]] = {
    Papel.C_LEVEL: (
        "ceo", "chief executive", "presidente", "diretor presidente", "socio diretor",
        "founder", "fundador", "coo", "chief operating", "vice presidente", "vp ",
        "board", "conselho de administracao",
    ),
    Papel.TECNOLOGIA: (
        "cio", "cto", "chief information", "chief technology", "diretor de tecnologia",
        "diretor de ti", "head of technology", "head de tecnologia", "diretor de inovacao",
        "chief data", "cdo", "head de dados", "diretor de engenharia", "chief digital",
    ),
    Papel.JURIDICO: (
        "juridico", "legal", "general counsel", "diretor juridico", "head juridico",
        "advogado chefe", "chief legal",
    ),
    Papel.COMPLIANCE: (
        "compliance", "risco", "risk", "dpo", "encarregado de dados", "privacidade",
        "chief risk", "auditoria interna", "governanca corporativa", "seguranca da informacao",
        "ciso", "chief information security",
    ),
}


def classificar_papel(cargo: str) -> Papel:
    """Mapeia um cargo livre para um dos quatro papéis do ICP.

    A ordem de teste importa: 'Diretor Jurídico e de Compliance' deve cair em jurídico,
    porque é a porta de entrada da conversa. Ordem = prioridade comercial.
    """
    c = _normalizar(cargo)
    for papel in (Papel.C_LEVEL, Papel.TECNOLOGIA, Papel.JURIDICO, Papel.COMPLIANCE):
        if any(p in c for p in PADROES_DE_PAPEL[papel]):
            return papel
    return Papel.OUTRO


# Formas femininas do cargo. Sem isto, "Diretora de Inovação" não casa com o padrão
# "diretor de inovacao" e a pessoa some do funil — um bug que só aparece na metade dos
# cargos e que passou batido até o teste parametrizado pegar.
FLEXOES: tuple[tuple[str, str], ...] = (
    ("diretora", "diretor"),
    ("presidenta", "presidente"),
    ("encarregada", "encarregado"),
    ("engenheira", "engenheiro"),
    ("socia", "socio"),
    ("gestora", "gestor"),
    ("coordenadora", "coordenador"),
    ("supervisora", "supervisor"),
    ("advogada", "advogado"),
    ("fundadora", "fundador"),
    ("conselheira", "conselheiro"),
    # adjetivos do cargo, não só o substantivo: "Diretora Jurídica" precisa dos dois
    ("juridica", "juridico"),
    ("executiva", "executivo"),
    ("administrativa", "administrativo"),
    ("tecnologica", "tecnologico"),
    ("corporativa", "corporativo"),
)


def _normalizar(texto: str) -> str:
    """Minúsculas, sem acento e com o feminino reduzido à forma dos padrões."""
    import unicodedata

    sem_acento = unicodedata.normalize("NFKD", texto.lower())
    plano = "".join(c for c in sem_acento if not unicodedata.combining(c))
    for feminino, masculino in FLEXOES:
        plano = plano.replace(feminino, masculino)
    return plano


# --------------------------------------------------------------------------- #
# Pontuação                                                                   #
# --------------------------------------------------------------------------- #

# Os pesos codificam a tese do ICP: o que qualifica é uso de IA já acontecendo, não
# tamanho nem setor. Por isso o bloco de sinais vale mais que o bloco de firmografia.
PESOS: dict[str, int] = {
    "praca": 10,              # está em SP capital, Sorocaba ou Campinas
    "porte": 15,              # média ou grande — abaixo disso não há o que governar
    "setor_forte": 10,        # varejo, financeiro, saúde, educação
    "setor_medio": 5,
    "ativa": 5,               # situação cadastral ativa
    "site": 5,                # tem site — sem isso não há como ler sinal nenhum
    "usa_ia": 25,             # O SINAL QUE QUALIFICA. Vale mais que tudo.
    "ia_em_produto": 10,      # IA tocando cliente, não só piloto interno
    "sem_governanca": 15,     # usa IA e não menciona política/comitê/norma
    "gatilho_lgpd": 10,       # DPO publicado ou vaga de compliance — porta de entrada
    "dor_declarada": 10,      # trecho público citável sobre o problema
}


def pontuar(empresa: CompanyData) -> ScoredCompany:
    """Aplica a régua do ICP a uma empresa. Sem LLM, sem aleatoriedade."""
    sinais = empresa.tipos_de_sinal
    criterios: list[CriterioPontuado] = []

    def add(chave: str, atendido: bool, evidencia: str | None = None, url=None) -> None:
        criterios.append(
            CriterioPontuado(
                criterio=chave, peso=PESOS[chave], atendido=atendido,
                evidencia=evidencia, url_evidencia=url,
            )
        )

    # ---- firmografia: filtro, não diferencial ----
    from .models import Praca

    pracas = {p.value for p in Praca}
    add("praca", empresa.municipio_ibge in pracas, empresa.municipio)

    porte_ok = empresa.porte in (Porte.MEDIA, Porte.GRANDE)
    if not porte_ok and empresa.capital_social:
        porte_ok = empresa.capital_social >= CAPITAL_MEDIA_EMPRESA
    add(
        "porte",
        porte_ok,
        f"{empresa.porte.value}"
        + (f", capital R$ {empresa.capital_social:,.0f}" if empresa.capital_social else ""),
    )

    div = (empresa.cnae_principal or "")[:2]
    add("setor_forte", div in CNAE_GATILHO_FORTE, CNAE_GATILHO_FORTE.get(div))
    add("setor_medio", div in CNAE_GATILHO_MEDIO, CNAE_GATILHO_MEDIO.get(div))

    add("ativa", (empresa.situacao_cadastral or "").upper().startswith("ATIVA"), empresa.situacao_cadastral)
    add("site", empresa.site is not None, empresa.dominio)

    # ---- sinais: é aqui que o ICP realmente discrimina ----
    sinais_de_uso = {SinalIA.VAGA_IA, SinalIA.CASE_PUBLICO, SinalIA.PRODUTO_COM_IA, SinalIA.CHATBOT_ATIVO}
    usa = sinais & sinais_de_uso
    ev_uso = next((s.origem.url for s in empresa.sinais if s.valor in usa), None)
    add("usa_ia", bool(usa), ", ".join(sorted(s.value for s in usa)) or None, ev_uso)

    em_produto = sinais & {SinalIA.PRODUTO_COM_IA, SinalIA.CHATBOT_ATIVO}
    add("ia_em_produto", bool(em_produto), ", ".join(sorted(s.value for s in em_produto)) or None)

    # O núcleo da tese: usa IA E não dá sinal de governança. Empresa que já publicou
    # política de IA não deixa de ser lead, mas entra por outra conversa — por isso o
    # critério só pontua quando há uso sem estrutura.
    sem_gov = bool(usa) and SinalIA.MENCAO_GOVERNANCA not in sinais
    add("sem_governanca", sem_gov, "usa IA e não publica política, comitê ou norma" if sem_gov else None)

    gatilho = sinais & {SinalIA.DPO_PUBLICADO, SinalIA.VAGA_COMPLIANCE}
    add("gatilho_lgpd", bool(gatilho), ", ".join(sorted(s.value for s in gatilho)) or None)

    dor = empresa.dores_observadas[0] if empresa.dores_observadas else None
    add(
        "dor_declarada",
        dor is not None,
        (dor.valor[:160] if dor else None),
        (dor.origem.url if dor else None),
    )

    return ScoredCompany(empresa=empresa, criterios=criterios, icp_versao=VERSAO)


# --------------------------------------------------------------------------- #
# Geração do plano de busca                                                   #
# --------------------------------------------------------------------------- #

# Consultas de descoberta por praça. Cada uma procura um SINAL, não uma empresa —
# procurar "empresas em Campinas" devolve listas; procurar "vaga engenheiro de IA
# Campinas" devolve empresa que já está fazendo.
GANCHOS_DE_BUSCA: tuple[str, ...] = (
    'vaga "inteligência artificial" {cidade} empresa contratando',
    '"engenheiro de machine learning" OR "cientista de dados" vaga {cidade}',
    'empresa {cidade} "assistente virtual" OR "chatbot" atendimento cliente case',
    '"transformação digital" OR "inteligência artificial" case empresa {cidade}',
    'empresa {cidade} "encarregado de dados" OR "DPO" LGPD contato',
    '"política de uso de inteligência artificial" empresa {cidade}',
)


def planejar_queries(
    pracas: tuple["Praca", ...],
    max_por_query: int = 25,
) -> list["SearchQuery"]:
    """Monta o plano de busca da rodada.

    Dois canais por praça: o registro público (BrasilAPI/Receita), que dá a base
    firmográfica confiável, e a busca web, que dá o sinal de uso de IA. Nenhum dos
    dois sozinho identifica o ICP — o cruzamento é que identifica.
    """
    import hashlib

    from .models import Canal, Praca, SearchQuery  # noqa: F811

    queries: list[SearchQuery] = []

    def _id(*partes: str) -> str:
        return hashlib.sha256("|".join(partes).encode()).hexdigest()[:16]

    for praca in pracas:
        cnaes = tuple(sorted(CNAE_GATILHO_FORTE)) + tuple(sorted(CNAE_GATILHO_MEDIO))
        queries.append(
            SearchQuery(
                id=_id(VERSAO, Canal.CNPJ_ABERTO.value, praca.value),
                canal=Canal.CNPJ_ABERTO,
                praca=praca,
                termos=f"municipio={praca.value};porte=media,grande",
                cnaes=cnaes,
                max_resultados=max_por_query * 2,
                icp_versao=VERSAO,
            )
        )
        for gancho in GANCHOS_DE_BUSCA:
            termos = gancho.format(cidade=praca.nome)
            queries.append(
                SearchQuery(
                    id=_id(VERSAO, Canal.BUSCA_WEB.value, praca.value, termos),
                    canal=Canal.BUSCA_WEB,
                    praca=praca,
                    termos=termos,
                    max_resultados=max_por_query,
                    icp_versao=VERSAO,
                )
            )
    return queries
