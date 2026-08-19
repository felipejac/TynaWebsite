"""Contratos de dados do motor de prospecção — a especificação vem antes do código.

A separação central deste módulo não é técnica, é jurídica: `CompanyData` descreve
uma **pessoa jurídica** (dado público de registro empresarial, fora do escopo da LGPD)
e `LeadProfile` descreve uma **pessoa natural** (dado pessoal, com base legal, prazo de
retenção e direito de oposição). Misturar os dois num modelo único é o erro que
transforma um pipeline de prospecção em passivo — e seria especialmente constrangedor
numa consultoria que vende governança de IA.

Todo campo derivado de fonte externa carrega `Provenance`. Sem isso não existe trilha
de auditoria, e sem trilha não há como responder "de onde veio esse dado?" — que é
exatamente a pergunta que a Tyna faz aos clientes dela.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum
from typing import Annotated, Generic, Literal, TypeVar

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)

T = TypeVar("T")


def agora() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------- #
# Proveniência — o que sustenta a auditabilidade                              #
# --------------------------------------------------------------------------- #


class Metodo(str, Enum):
    """Como o dado chegou. Determina o que pode ser feito com ele."""

    REGISTRO_PUBLICO = "registro_publico"      # Receita Federal / dados abertos
    BUSCA_WEB = "busca_web"                    # API de busca
    SITE_PROPRIO = "site_proprio"              # crawl do site da empresa, com robots.txt
    EXTRACAO_LLM = "extracao_llm"              # inferido por modelo a partir de texto coletado
    ENTRADA_MANUAL = "entrada_manual"          # digitado por uma pessoa


class Provenance(BaseModel):
    """Origem de um valor. Anexada a todo campo que não foi digitado por uma pessoa."""

    model_config = ConfigDict(frozen=True)

    fonte: str = Field(description="Nome legível da fonte, ex.: 'BrasilAPI/CNPJ'")
    url: HttpUrl | None = Field(default=None, description="URL exata de onde o valor saiu")
    metodo: Metodo
    coletado_em: datetime = Field(default_factory=agora)
    modelo: str | None = Field(
        default=None,
        description="ID do modelo, quando metodo=extracao_llm. Ex.: 'claude-opus-5'",
    )

    @model_validator(mode="after")
    def _llm_declara_modelo(self) -> "Provenance":
        if self.metodo is Metodo.EXTRACAO_LLM and not self.modelo:
            raise ValueError("extração por LLM precisa declarar qual modelo produziu o valor")
        return self


class Rastreado(BaseModel, Generic[T]):
    """Um valor mais a origem dele. `Rastreado[str]`, `Rastreado[int]`, etc."""

    valor: T
    origem: Provenance
    confianca: Annotated[float, Field(ge=0.0, le=1.0)] = 1.0


# --------------------------------------------------------------------------- #
# SearchQuery — o plano de busca, versionado e reproduzível                   #
# --------------------------------------------------------------------------- #


class Praca(str, Enum):
    """Recorte geográfico da fase 1. Código IBGE do município no valor."""

    SAO_PAULO = "3550308"
    SOROCABA = "3552205"
    CAMPINAS = "3509502"

    @property
    def nome(self) -> str:
        return {"3550308": "São Paulo", "3552205": "Sorocaba", "3509502": "Campinas"}[self.value]

    @property
    def uf(self) -> str:
        return "SP"


class Canal(str, Enum):
    CNPJ_ABERTO = "cnpj_aberto"
    BUSCA_WEB = "busca_web"
    SITE_EMPRESA = "site_empresa"


class SearchQuery(BaseModel):
    """Uma unidade de trabalho de descoberta.

    É serializável e determinística de propósito: a mesma query, no mesmo dia, com o
    mesmo `icp_versao`, deve produzir o mesmo conjunto de candidatos. Isso é o que
    permite explicar por que um lead entrou na lista.
    """

    model_config = ConfigDict(frozen=True)

    id: str = Field(description="Hash estável da query; chave de deduplicação e cache")
    canal: Canal
    praca: Praca
    termos: str = Field(description="String de busca ou filtro estruturado serializado")
    cnaes: tuple[str, ...] = Field(
        default=(),
        description="Prefixos de CNAE a incluir, quando canal=cnpj_aberto",
    )
    max_resultados: Annotated[int, Field(ge=1, le=200)] = 50
    icp_versao: str = Field(description="Versão do ICP que gerou esta query, ex.: 'icp-2026-08'")
    criada_em: datetime = Field(default_factory=agora)

    @field_validator("termos")
    @classmethod
    def _sem_termos_vazios(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("query sem termos não é executável")
        return v


# --------------------------------------------------------------------------- #
# CompanyData — pessoa jurídica. NÃO é dado pessoal.                          #
# --------------------------------------------------------------------------- #


class Porte(str, Enum):
    MEI = "mei"
    ME = "micro"
    EPP = "pequena"
    MEDIA = "media"
    GRANDE = "grande"
    DESCONHECIDO = "desconhecido"


class SinalIA(str, Enum):
    """Evidência observável de que a empresa já usa IA — o gatilho do ICP da Tyna.

    O ICP escrito diz: o sinal que qualifica não é interesse em IA, é uso já
    acontecendo sem regra. Estes são os proxies públicos disso.
    """

    VAGA_IA = "vaga_ia"                            # vaga aberta citando IA/ML/LLM
    CASE_PUBLICO = "case_publico"                  # case ou release citando uso de IA
    PRODUTO_COM_IA = "produto_com_ia"              # produto/feature de IA no site
    CHATBOT_ATIVO = "chatbot_ativo"                # assistente no site ou WhatsApp
    MENCAO_GOVERNANCA = "mencao_governanca"        # política de IA, comitê, ISO 42001
    DPO_PUBLICADO = "dpo_publicado"                # encarregado de dados nomeado (LGPD)
    VAGA_COMPLIANCE = "vaga_compliance"            # vaga de compliance/privacidade
    SETOR_REGULADO = "setor_regulado"              # CNAE em setor com gatilho forte


class CompanyData(BaseModel):
    """Empresa candidata. Dado de registro público e de site institucional."""

    model_config = ConfigDict(validate_assignment=True)

    cnpj: str = Field(description="Somente dígitos, 14 posições")
    razao_social: str
    nome_fantasia: str | None = None
    municipio_ibge: str
    municipio: str
    uf: str = "SP"

    cnae_principal: str | None = None
    cnae_descricao: str | None = None
    porte: Porte = Porte.DESCONHECIDO
    capital_social: float | None = None
    data_abertura: date | None = None
    situacao_cadastral: str | None = None

    site: HttpUrl | None = None
    dominio: str | None = Field(default=None, description="Domínio normalizado, sem www")

    sinais: list[Rastreado[SinalIA]] = Field(default_factory=list)
    dores_observadas: list[Rastreado[str]] = Field(
        default_factory=list,
        description="Trechos citáveis que indicam dor de governança, com a URL de origem",
    )
    stack_observado: list[Rastreado[str]] = Field(
        default_factory=list,
        description="Tecnologias detectadas publicamente (headers, scripts, vagas)",
    )

    origem: Provenance
    descoberta_por: str | None = Field(default=None, description="SearchQuery.id que a encontrou")
    atualizado_em: datetime = Field(default_factory=agora)

    @field_validator("cnpj")
    @classmethod
    def _cnpj_valido(cls, v: str) -> str:
        digitos = "".join(c for c in v if c.isdigit())
        if len(digitos) != 14:
            raise ValueError(f"CNPJ precisa de 14 dígitos, veio com {len(digitos)}")
        return digitos

    @field_validator("dominio")
    @classmethod
    def _dominio_normalizado(cls, v: str | None) -> str | None:
        if v is None:
            return None
        d = v.strip().lower().removeprefix("http://").removeprefix("https://")
        return d.removeprefix("www.").split("/")[0] or None

    @property
    def tipos_de_sinal(self) -> set[SinalIA]:
        return {s.valor for s in self.sinais}


# --------------------------------------------------------------------------- #
# LeadProfile — pessoa natural. É DADO PESSOAL. Tem regra própria.            #
# --------------------------------------------------------------------------- #


class BaseLegal(str, Enum):
    """Base legal do tratamento, art. 7º da LGPD.

    Para prospecção B2B a base viável é legítimo interesse, e ela **exige avaliação
    registrada** (LIA) e direito de oposição operante. Não é caixinha para marcar.
    """

    LEGITIMO_INTERESSE = "legitimo_interesse"
    CONSENTIMENTO = "consentimento"


class Papel(str, Enum):
    """Papéis do ICP. Cada um entra por uma porta diferente do site da Tyna."""

    C_LEVEL = "c_level"
    TECNOLOGIA = "tecnologia"
    JURIDICO = "juridico"
    COMPLIANCE = "compliance"
    OUTRO = "outro"


class LeadProfile(BaseModel):
    """Pessoa de contato em uma empresa candidata.

    Minimização por construção: só cargo, nome e **canal profissional publicado**.
    Sem telefone pessoal, sem e-mail pessoal, sem dado inferido sobre a pessoa.
    """

    model_config = ConfigDict(validate_assignment=True)

    id: str = Field(description="Hash de (cnpj, nome normalizado, cargo)")
    cnpj_empresa: str
    nome: str
    cargo: str
    papel: Papel = Papel.OUTRO

    perfil_publico: HttpUrl | None = Field(
        default=None,
        description="URL do perfil profissional público citado por fonte legítima",
    )
    email_corporativo: str | None = Field(
        default=None,
        description="Somente se publicado pela própria empresa em canal institucional",
    )

    # ---- Bloco de conformidade. Não é opcional. ----
    base_legal: BaseLegal = BaseLegal.LEGITIMO_INTERESSE
    lia_ref: str = Field(
        description="Identificador da avaliação de legítimo interesse que cobre este tratamento"
    )
    finalidade: str = Field(
        default="Prospecção comercial B2B de serviços de governança de IA",
        description="Finalidade específica. 'Marketing' não é finalidade.",
    )
    retencao_ate: date = Field(description="Data de descarte automático")
    opt_out: bool = Field(default=False, description="Oposição exercida pelo titular")
    opt_out_em: datetime | None = None

    origem: Provenance
    atualizado_em: datetime = Field(default_factory=agora)

    @model_validator(mode="after")
    def _coerencia_do_opt_out(self) -> "LeadProfile":
        if self.opt_out and self.opt_out_em is None:
            raise ValueError("oposição registrada precisa de data — é ela que prova o atendimento")
        return self

    @field_validator("email_corporativo")
    @classmethod
    def _email_plausivel(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError(f"e-mail malformado: {v!r}")
        return v


# --------------------------------------------------------------------------- #
# Pontuação e resultado — a decisão é determinística e explicável             #
# --------------------------------------------------------------------------- #


class Faixa(str, Enum):
    DESCARTAR = "descartar"
    OBSERVAR = "observar"
    QUALIFICADO = "qualificado"
    PRIORITARIO = "prioritario"


class CriterioPontuado(BaseModel):
    """Uma linha do boletim. Existe para que a nota seja auditável, e não mágica."""

    model_config = ConfigDict(frozen=True)

    criterio: str
    peso: int
    atendido: bool
    evidencia: str | None = None
    url_evidencia: HttpUrl | None = None

    @property
    def pontos(self) -> int:
        return self.peso if self.atendido else 0


class ScoredCompany(BaseModel):
    """Empresa com nota de aderência ao ICP e a justificativa completa."""

    empresa: CompanyData
    criterios: list[CriterioPontuado]
    icp_versao: str
    avaliado_em: datetime = Field(default_factory=agora)

    @property
    def pontos(self) -> int:
        return sum(c.pontos for c in self.criterios)

    @property
    def maximo(self) -> int:
        return sum(c.peso for c in self.criterios)

    @property
    def percentual(self) -> float:
        return (self.pontos / self.maximo * 100) if self.maximo else 0.0

    @property
    def faixa(self) -> Faixa:
        p = self.percentual
        if p >= 75:
            return Faixa.PRIORITARIO
        if p >= 50:
            return Faixa.QUALIFICADO
        if p >= 25:
            return Faixa.OBSERVAR
        return Faixa.DESCARTAR

    def explicar(self) -> str:
        """Uma linha por critério atendido. É o que vai para o CRM e para a revisão."""
        linhas = [f"{self.empresa.razao_social} — {self.pontos}/{self.maximo} ({self.faixa.value})"]
        for c in sorted(self.criterios, key=lambda x: -x.pontos):
            marca = "+" if c.atendido else " "
            linhas.append(f"  {marca} [{c.pontos:>2}] {c.criterio}" + (f" — {c.evidencia}" if c.evidencia else ""))
        return "\n".join(linhas)


# --------------------------------------------------------------------------- #
# Estado do harness — o que atravessa o loop                                  #
# --------------------------------------------------------------------------- #


class Etapa(str, Enum):
    PLANEJAR = "planejar"
    BUSCAR = "buscar"
    EXTRAIR = "extrair"
    VALIDAR = "validar"
    ARMAZENAR = "armazenar"
    FIM = "fim"
    ABORTADO = "abortado"


class Incidente(BaseModel):
    """Falha registrada sem derrubar a execução. O agente falha barulhento, não mudo."""

    model_config = ConfigDict(frozen=True)

    etapa: Etapa
    tipo: str
    detalhe: str
    alvo: str | None = None
    em: datetime = Field(default_factory=agora)


class RunState(BaseModel):
    """Estado único que atravessa todas as etapas.

    Os nós do harness são funções puras `(RunState) -> RunState`. É a mesma assinatura
    que o LangGraph espera, o que permite portar sem reescrever a lógica.
    """

    model_config = ConfigDict(validate_assignment=True)

    run_id: str
    etapa: Etapa = Etapa.PLANEJAR
    icp_versao: str

    queries: list[SearchQuery] = Field(default_factory=list)
    queries_executadas: list[str] = Field(default_factory=list)
    empresas: dict[str, CompanyData] = Field(default_factory=dict)
    pontuadas: list[ScoredCompany] = Field(default_factory=list)
    leads: list[LeadProfile] = Field(default_factory=list)

    incidentes: list[Incidente] = Field(default_factory=list)
    chamadas_llm: int = 0
    custo_llm_usd: float = 0.0
    requisicoes_http: int = 0

    iniciado_em: datetime = Field(default_factory=agora)
    encerrado_em: datetime | None = None

    def registrar(self, etapa: Etapa, tipo: str, detalhe: str, alvo: str | None = None) -> None:
        self.incidentes.append(Incidente(etapa=etapa, tipo=tipo, detalhe=detalhe, alvo=alvo))

    @property
    def resumo(self) -> dict[str, object]:
        por_faixa: dict[str, int] = {}
        for s in self.pontuadas:
            por_faixa[s.faixa.value] = por_faixa.get(s.faixa.value, 0) + 1
        return {
            "run_id": self.run_id,
            "etapa": self.etapa.value,
            "queries": len(self.queries),
            "empresas": len(self.empresas),
            "por_faixa": por_faixa,
            "leads": len(self.leads),
            "incidentes": len(self.incidentes),
            "chamadas_llm": self.chamadas_llm,
            "custo_llm_usd": round(self.custo_llm_usd, 4),
            "requisicoes_http": self.requisicoes_http,
        }
