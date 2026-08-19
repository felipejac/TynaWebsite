"""Testes da régua do ICP. Nenhum toca rede nem LLM — é essa a razão de a nota ser
determinística: dá para testar a decisão comercial como se testa qualquer função pura."""

from __future__ import annotations

import pytest

from prospector.icp import VERSAO, classificar_papel, planejar_queries, pontuar
from prospector.models import (
    Canal,
    CompanyData,
    Faixa,
    Metodo,
    Papel,
    Porte,
    Praca,
    Provenance,
    Rastreado,
    SinalIA,
)

ORIGEM = Provenance(fonte="teste", url="https://exemplo.com.br", metodo=Metodo.SITE_PROPRIO)


def empresa(**kw) -> CompanyData:
    base = dict(
        cnpj="11222333000181",
        razao_social="Exemplo Varejo S.A.",
        municipio_ibge=Praca.SAO_PAULO.value,
        municipio="São Paulo",
        cnae_principal="4711302",
        porte=Porte.GRANDE,
        situacao_cadastral="ATIVA",
        site="https://exemplo.com.br",
        dominio="exemplo.com.br",
        origem=ORIGEM,
    )
    base.update(kw)
    return CompanyData(**base)


def sinal(tipo: SinalIA) -> Rastreado[SinalIA]:
    return Rastreado[SinalIA](valor=tipo, origem=ORIGEM)


class TestPontuacao:
    def test_empresa_ideal_e_prioritaria(self):
        """Varejo grande em SP que usa IA em produto e não fala de governança: o alvo."""
        e = empresa(sinais=[sinal(SinalIA.PRODUTO_COM_IA), sinal(SinalIA.CHATBOT_ATIVO),
                            sinal(SinalIA.DPO_PUBLICADO)])
        s = pontuar(e)
        assert s.faixa is Faixa.PRIORITARIO
        assert s.percentual >= 75

    def test_sem_sinal_de_ia_nao_qualifica(self):
        """O ICP escrito é explícito: sem uso de IA acontecendo, não há o que governar."""
        s = pontuar(empresa())
        assert s.faixa in (Faixa.DESCARTAR, Faixa.OBSERVAR)
        assert not next(c for c in s.criterios if c.criterio == "usa_ia").atendido

    def test_governanca_publicada_derruba_o_criterio_de_lacuna(self):
        """Quem já publicou política continua sendo empresa — só não é ESTE lead."""
        com = pontuar(empresa(sinais=[sinal(SinalIA.PRODUTO_COM_IA)]))
        sem = pontuar(empresa(sinais=[sinal(SinalIA.PRODUTO_COM_IA),
                                      sinal(SinalIA.MENCAO_GOVERNANCA)]))
        assert com.pontos > sem.pontos
        assert next(c for c in com.criterios if c.criterio == "sem_governanca").atendido
        assert not next(c for c in sem.criterios if c.criterio == "sem_governanca").atendido

    def test_fora_das_tres_pracas_perde_pontos(self):
        fora = pontuar(empresa(municipio_ibge="3304557", municipio="Rio de Janeiro"))
        assert not next(c for c in fora.criterios if c.criterio == "praca").atendido

    def test_capital_social_supre_porte_desconhecido(self):
        """A Receita agrupa média e grande em 'DEMAIS'; o capital é o segundo sinal."""
        pequena = pontuar(empresa(porte=Porte.DESCONHECIDO, capital_social=50_000.0))
        media = pontuar(empresa(porte=Porte.DESCONHECIDO, capital_social=5_000_000.0))
        assert not next(c for c in pequena.criterios if c.criterio == "porte").atendido
        assert next(c for c in media.criterios if c.criterio == "porte").atendido

    def test_pontuacao_e_reproduzivel(self):
        e = empresa(sinais=[sinal(SinalIA.VAGA_IA)])
        assert pontuar(e).pontos == pontuar(e).pontos

    def test_explicacao_cita_todo_criterio_atendido(self):
        s = pontuar(empresa(sinais=[sinal(SinalIA.VAGA_IA)]))
        texto = s.explicar()
        for c in s.criterios:
            if c.atendido:
                assert c.criterio in texto

    def test_versao_do_icp_viaja_com_a_nota(self):
        assert pontuar(empresa()).icp_versao == VERSAO


class TestClassificacaoDePapel:
    @pytest.mark.parametrize(
        "cargo,esperado",
        [
            ("CEO", Papel.C_LEVEL),
            ("Diretor Presidente", Papel.C_LEVEL),
            ("CIO", Papel.TECNOLOGIA),
            ("Diretora de Inovação", Papel.TECNOLOGIA),
            ("Head de Dados", Papel.TECNOLOGIA),
            ("Diretor Jurídico", Papel.JURIDICO),
            ("General Counsel", Papel.JURIDICO),
            ("Gerente de Compliance", Papel.COMPLIANCE),
            ("Encarregado de Dados", Papel.COMPLIANCE),
            ("CISO", Papel.COMPLIANCE),
            ("Analista de Marketing", Papel.OUTRO),
            # Feminino: metade dos cargos do ICP vem assim, e o padrão é escrito no masculino.
            ("Diretora Jurídica", Papel.JURIDICO),
            ("Sócia Diretora", Papel.C_LEVEL),
            ("Encarregada de Dados", Papel.COMPLIANCE),
        ],
    )
    def test_cargos(self, cargo, esperado):
        assert classificar_papel(cargo) is esperado

    def test_acento_e_caixa_nao_importam(self):
        assert classificar_papel("DIRETOR JURÍDICO") is classificar_papel("diretor juridico")

    def test_cargo_hibrido_cai_na_porta_de_entrada_certa(self):
        """'Jurídico e Compliance' entra por jurídico — é quem responde primeiro."""
        assert classificar_papel("Diretor Jurídico e de Compliance") is Papel.JURIDICO


class TestPlanoDeBusca:
    def test_gera_os_dois_canais_por_praca(self):
        qs = planejar_queries((Praca.CAMPINAS,))
        canais = {q.canal for q in qs}
        assert Canal.CNPJ_ABERTO in canais and Canal.BUSCA_WEB in canais

    def test_ids_sao_estaveis_entre_execucoes(self):
        """Id instável quebra deduplicação e cache — e ninguém percebe até a fatura."""
        a = {q.id for q in planejar_queries(tuple(Praca))}
        b = {q.id for q in planejar_queries(tuple(Praca))}
        assert a == b

    def test_cidade_entra_nos_termos(self):
        qs = planejar_queries((Praca.SOROCABA,))
        web = [q for q in qs if q.canal is Canal.BUSCA_WEB]
        assert all("Sorocaba" in q.termos for q in web)

    def test_toda_query_carrega_a_versao_do_icp(self):
        assert all(q.icp_versao == VERSAO for q in planejar_queries(tuple(Praca)))
