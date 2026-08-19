"""O único nó com LLM do pipeline — e ele tem escopo de autonomia escrito.

Escopo de autonomia (a mesma disciplina que a Tyna publica em /governanca-de-agentes/):

- **O que o modelo decide sozinho:** se um texto coletado indica uso de IA, qual o
  trecho citável da dor, e como normalizar um cargo.
- **O que ele propõe e o código confirma:** nada aqui — toda saída passa por schema.
- **O que ele nunca faz:** dar a nota do lead, inventar contato, inferir dado pessoal
  não publicado, ou decidir se a empresa entra na lista. Isso é `icp.pontuar`,
  determinístico.

A saída é validada por schema (`messages.parse` + Pydantic), então "o modelo alucinou um
campo" não é um modo de falha possível — o modo de falha possível é ele preencher um
campo verdadeiro-em-forma e falso-em-conteúdo, e é por isso que **todo achado carrega a
URL de onde saiu**, para revisão humana por amostragem.
"""

from __future__ import annotations

from typing import Annotated

import anthropic
from pydantic import BaseModel, Field

from .config import settings
from .guardrails import Guardrails
from .models import (
    CompanyData,
    Etapa,
    Metodo,
    Provenance,
    Rastreado,
    RunState,
    SinalIA,
)

# Preço por 1M de tokens do Claude Opus 5, para o contador de orçamento.
USD_ENTRADA_POR_MTOK = 5.0
USD_SAIDA_POR_MTOK = 25.0

SISTEMA = """Você analisa texto público de sites de empresas brasileiras para uma \
consultoria de governança de IA.

Sua tarefa é identificar EVIDÊNCIA, não opinar. Regras:

- Só afirme o que o texto fornecido sustenta. Se o texto não diz, o campo fica vazio.
- Nunca infira sobre pessoas. Não deduza cargo, contato ou senioridade que não esteja escrito.
- Trecho citável significa trecho LITERAL do texto, no máximo 200 caracteres.
- "Usa IA" exige menção a uso concreto (produto, atendimento, vaga, case). Menção \
institucional genérica do tipo "acreditamos em inovação" não conta.
- "Menciona governança" exige referência a política de uso de IA, comitê, norma ou \
uso responsável — não basta citar LGPD.

Você não decide se a empresa é um bom lead. Isso é feito depois, por regra fixa."""


class SinalExtraido(BaseModel):
    """Um achado com a prova ao lado. Sem trecho literal, o achado não entra."""

    tipo: Annotated[str, Field(description=
        "Um de: vaga_ia, case_publico, produto_com_ia, chatbot_ativo, "
        "mencao_governanca, dpo_publicado, vaga_compliance")]
    trecho: Annotated[str, Field(max_length=220, description="Citação literal do texto")]
    url: Annotated[str, Field(description="URL da página onde o trecho aparece")]
    confianca: Annotated[float, Field(ge=0.0, le=1.0)]


class AnaliseDeEmpresa(BaseModel):
    """Contrato de saída do nó de extração. É o schema que o modelo é obrigado a preencher."""

    usa_ia: bool
    sinais: list[SinalExtraido] = Field(default_factory=list, max_length=8)
    dores: list[str] = Field(
        default_factory=list, max_length=3,
        description="Trechos literais que indicam dor de governança, risco ou falta de controle",
    )
    stack: list[str] = Field(
        default_factory=list, max_length=10,
        description="Tecnologias citadas explicitamente no texto",
    )
    resumo: Annotated[str, Field(max_length=400, description=
        "Duas frases sobre o que a empresa faz e onde a IA aparece. Sem adjetivo de venda.")]


class Extrator:
    """Envolve a chamada ao modelo, contabiliza custo e nunca deixa erro subir sozinho."""

    def __init__(self, cliente: anthropic.Anthropic | None = None) -> None:
        self._c = cliente or anthropic.Anthropic()

    def analisar(
        self,
        empresa: CompanyData,
        paginas: list[tuple[str, str]],
        estado: RunState,
        gr: Guardrails,
    ) -> AnaliseDeEmpresa | None:
        if not paginas:
            return None
        gr.antes_do_no(estado, Etapa.EXTRAIR)

        corpo = "\n\n".join(f"### {url}\n{texto[:6000]}" for url, texto in paginas)
        prompt = (
            f"Empresa: {empresa.razao_social}"
            + (f" (nome fantasia: {empresa.nome_fantasia})" if empresa.nome_fantasia else "")
            + f"\nCNAE: {empresa.cnae_descricao or 'não informado'}"
            f"\nMunicípio: {empresa.municipio}/{empresa.uf}\n\n"
            f"Texto público coletado do site:\n\n{corpo}"
        )

        try:
            resposta = self._c.messages.parse(
                model=settings.modelo,
                max_tokens=settings.max_tokens,
                system=SISTEMA,
                thinking={"type": "adaptive"},
                output_config={"effort": settings.esforco},
                messages=[{"role": "user", "content": prompt}],
                output_format=AnaliseDeEmpresa,
            )
        except anthropic.RateLimitError as e:
            estado.registrar(Etapa.EXTRAIR, "llm_rate_limit", str(e), empresa.cnpj)
            return None
        except anthropic.APIStatusError as e:
            estado.registrar(Etapa.EXTRAIR, "llm_erro_api", f"{e.status_code}: {e}", empresa.cnpj)
            return None
        except anthropic.APIConnectionError as e:
            estado.registrar(Etapa.EXTRAIR, "llm_conexao", str(e), empresa.cnpj)
            return None

        estado.chamadas_llm += 1
        u = resposta.usage
        estado.custo_llm_usd += (
            u.input_tokens / 1_000_000 * USD_ENTRADA_POR_MTOK
            + u.output_tokens / 1_000_000 * USD_SAIDA_POR_MTOK
        )

        if resposta.stop_reason == "refusal":
            estado.registrar(Etapa.EXTRAIR, "llm_recusa",
                             getattr(resposta.stop_details, "category", "?"), empresa.cnpj)
            return None
        return resposta.parsed_output

    @staticmethod
    def aplicar(empresa: CompanyData, analise: AnaliseDeEmpresa) -> CompanyData:
        """Funde a análise na empresa, mantendo proveniência campo a campo.

        Sinal com tipo desconhecido é descartado em silêncio de propósito: o schema
        garante que o campo existe, não que o valor pertence ao enum — e inventar um
        SinalIA novo a partir de string de modelo é como enums viram lixo.
        """
        origem_llm = lambda url: Provenance(  # noqa: E731
            fonte="extracao-llm", url=url, metodo=Metodo.EXTRACAO_LLM, modelo=settings.modelo
        )
        validos = {s.value for s in SinalIA}
        ja_tem = empresa.tipos_de_sinal

        for s in analise.sinais:
            if s.tipo not in validos or SinalIA(s.tipo) in ja_tem:
                continue
            empresa.sinais.append(
                Rastreado[SinalIA](valor=SinalIA(s.tipo), origem=origem_llm(s.url),
                                   confianca=s.confianca)
            )
        for dor in analise.dores:
            empresa.dores_observadas.append(
                Rastreado[str](valor=dor, origem=origem_llm(str(empresa.site or "")), confianca=0.7)
            )
        for tec in analise.stack:
            empresa.stack_observado.append(
                Rastreado[str](valor=tec, origem=origem_llm(str(empresa.site or "")), confianca=0.7)
            )
        return empresa
