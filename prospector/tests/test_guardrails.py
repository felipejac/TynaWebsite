"""Testes dos guardrails e dos contratos de conformidade.

Se algum destes falhar, o pipeline não deve rodar em produção. Não é teste de
funcionalidade: é teste do que impede o agente de custar caro ou de virar passivo.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from prospector.guardrails import (
    CAMPOS_VEDADOS,
    DOMINIOS_PROIBIDOS,
    ColetaRecusada,
    GuardrailViolado,
    ListaDeSupressao,
    Orcamento,
    PolidezHTTP,
    prazo_de_retencao,
    validar_minimizacao,
)
from prospector.models import (
    BaseLegal,
    LeadProfile,
    Metodo,
    Provenance,
    RunState,
)

ORIGEM = Provenance(fonte="teste", metodo=Metodo.ENTRADA_MANUAL)


def estado(**kw) -> RunState:
    return RunState(run_id="teste", icp_versao="icp-teste", **kw)


class TestOrcamento:
    def test_estoura_no_teto_de_llm(self):
        with pytest.raises(GuardrailViolado, match="chamadas de LLM"):
            Orcamento(max_chamadas_llm=10).conferir(estado(chamadas_llm=10))

    def test_estoura_no_teto_de_custo(self):
        with pytest.raises(GuardrailViolado, match="custo"):
            Orcamento(max_custo_usd=1.0).conferir(estado(custo_llm_usd=1.5))

    def test_estoura_no_teto_de_http(self):
        with pytest.raises(GuardrailViolado, match="HTTP"):
            Orcamento(max_requisicoes_http=5).conferir(estado(requisicoes_http=99))

    def test_estoura_por_duracao(self):
        antigo = estado()
        antigo.iniciado_em = datetime.now(timezone.utc) - timedelta(hours=2)
        with pytest.raises(GuardrailViolado, match="duração"):
            Orcamento(max_duracao_s=60).conferir(antigo)

    def test_dentro_do_teto_nao_levanta(self):
        Orcamento().conferir(estado(chamadas_llm=1, custo_llm_usd=0.01))


class TestPolidez:
    @pytest.mark.parametrize("url", [
        "https://www.linkedin.com/in/alguem",
        "https://br.linkedin.com/company/x",
        "https://www.facebook.com/empresa",
        "https://glassdoor.com.br/empresa",
    ])
    def test_plataformas_com_termos_restritivos_sao_negadas(self, url):
        """Não é sobre ser possível raspar — é sobre os termos proibirem."""
        assert not PolidezHTTP().permitido(url)

    def test_a_propria_tyna_esta_fora_da_lista_de_proibidos(self):
        assert "tyna.com.br" not in DOMINIOS_PROIBIDOS

    def test_host_normaliza(self):
        assert PolidezHTTP().host("https://WWW.Exemplo.com.BR/pagina") == "www.exemplo.com.br"


class TestSupressao:
    def test_bloqueia_por_email_dominio_e_cnpj(self):
        l = ListaDeSupressao(emails={"a@x.com"}, dominios={"x.com"}, cnpjs={"11222333000181"})
        assert l.bloqueado(email="A@X.com")
        assert l.bloqueado(dominio="www.x.com")
        assert l.bloqueado(cnpj="11.222.333/0001-81")
        assert not l.bloqueado(email="outro@y.com")

    def test_lista_vazia_nao_bloqueia_nada(self):
        assert not ListaDeSupressao().bloqueado(email="qualquer@x.com")

    def test_carrega_arquivo_ignorando_comentario(self, tmp_path):
        p = tmp_path / "sup.txt"
        p.write_text("# comentário\nx.com\na@b.com\n11222333000181\n\n", encoding="utf-8")
        l = ListaDeSupressao.de_arquivo(p)
        assert l.dominios == {"x.com"} and l.emails == {"a@b.com"}
        assert l.cnpjs == {"11222333000181"}

    def test_arquivo_ausente_nao_quebra(self, tmp_path):
        assert ListaDeSupressao.de_arquivo(tmp_path / "nao-existe.txt").emails == set()


class TestMinimizacao:
    def test_campo_vedado_e_recusado(self):
        with pytest.raises(ColetaRecusada, match="cpf"):
            validar_minimizacao({"nome": "Fulano", "cpf": "000"})

    def test_payload_limpo_passa(self):
        validar_minimizacao({"nome": "Fulano", "cargo": "CIO"})

    def test_dado_sensivel_esta_na_lista(self):
        for campo in ("dado_de_saude", "biometria", "religiao", "orientacao_sexual"):
            assert campo in CAMPOS_VEDADOS


class TestContratoDoLead:
    def base(self, **kw):
        d = dict(
            id="abc", cnpj_empresa="11222333000181", nome="Fulano de Tal",
            cargo="CIO", lia_ref="LIA-2026-01", retencao_ate=prazo_de_retencao(), origem=ORIGEM,
        )
        d.update(kw)
        return d

    def test_lead_valido(self):
        l = LeadProfile(**self.base())
        assert l.base_legal is BaseLegal.LEGITIMO_INTERESSE
        assert l.retencao_ate > date.today()

    def test_oposicao_sem_data_e_recusada(self):
        """A data é o que prova o atendimento do direito. Sem ela, não houve atendimento."""
        with pytest.raises(ValidationError, match="data"):
            LeadProfile(**self.base(opt_out=True))

    def test_lia_e_obrigatoria(self):
        d = self.base()
        del d["lia_ref"]
        with pytest.raises(ValidationError):
            LeadProfile(**d)

    def test_email_malformado_e_recusado(self):
        with pytest.raises(ValidationError, match="malformado"):
            LeadProfile(**self.base(email_corporativo="isso-nao-e-email"))

    def test_retencao_padrao_e_finita(self):
        assert prazo_de_retencao(30) == date.today() + timedelta(days=30)


class TestProveniencia:
    def test_extracao_por_llm_exige_declarar_o_modelo(self):
        with pytest.raises(ValidationError, match="modelo"):
            Provenance(fonte="x", metodo=Metodo.EXTRACAO_LLM)

    def test_com_modelo_passa(self):
        p = Provenance(fonte="x", metodo=Metodo.EXTRACAO_LLM, modelo="claude-opus-5")
        assert p.modelo == "claude-opus-5"


class TestEstado:
    def test_incidente_nao_derruba_e_fica_registrado(self):
        s = estado()
        from prospector.models import Etapa

        s.registrar(Etapa.BUSCAR, "falha", "host fora do ar", "x.com")
        assert len(s.incidentes) == 1
        assert s.resumo["incidentes"] == 1
