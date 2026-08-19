"""Configuração por ambiente. Nada de segredo em código, nada de default surpresa."""

from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

RAIZ = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", env_prefix="PROSPECTOR_", extra="ignore"
    )

    # ---- LLM ----
    # Opus 5 é o padrão. O nó de extração é o único ponto do pipeline com LLM, e é
    # onde erro custa caro: um cargo mal classificado contamina o funil inteiro.
    modelo: str = "claude-opus-5"
    esforco: str = Field(default="medium", description="low | medium | high | xhigh | max")
    max_tokens: int = 8000

    # ---- Fontes ----
    # BrasilAPI expõe os dados abertos de CNPJ da Receita Federal, sem chave.
    brasilapi_base: str = "https://brasilapi.com.br/api"
    busca_provedor: str = Field(default="brave", description="brave | tavily")
    brave_api_key: str | None = None
    tavily_api_key: str | None = None

    # ---- Armazenamento ----
    banco: Path = RAIZ / "data" / "prospector.db"
    supressao: Path = RAIZ / "data" / "supressao.txt"

    # ---- Guardrails (espelham prospector.guardrails.Orcamento) ----
    max_chamadas_llm: int = 120
    max_requisicoes_http: int = 600
    max_custo_usd: float = 5.0
    max_duracao_s: int = 1800
    intervalo_http_s: float = 2.0
    retencao_dias: int = 180

    # ---- Conformidade ----
    # Sem LIA registrada o pipeline não roda. É guardrail, não formalidade: legítimo
    # interesse sem avaliação documentada não é base legal, é alegação.
    lia_ref: str = Field(
        default="",
        description="Identificador da Avaliação de Legítimo Interesse que cobre a prospecção",
    )

    def validar_para_execucao(self) -> None:
        faltando: list[str] = []
        if not self.lia_ref.strip():
            faltando.append("PROSPECTOR_LIA_REF (avaliação de legítimo interesse)")
        if self.busca_provedor == "brave" and not self.brave_api_key:
            faltando.append("PROSPECTOR_BRAVE_API_KEY")
        if self.busca_provedor == "tavily" and not self.tavily_api_key:
            faltando.append("PROSPECTOR_TAVILY_API_KEY")
        if faltando:
            raise RuntimeError("configuração incompleta: " + ", ".join(faltando))


settings = Settings()
