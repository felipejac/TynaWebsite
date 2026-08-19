"""Testes do carregador dos Dados Abertos do CNPJ.

Nenhum toca a rede: o que é testado aqui é o parser, que é onde erro passa despercebido.
Um índice de campo trocado não quebra — ele carrega a base inteira com o valor errado, e
isso só aparece semanas depois, quando alguém estranha o ranking.

Os registros de exemplo seguem o layout do `cnpj-metadados.pdf` da Receita: CSV com `;`,
aspas duplas e codificação latin-1.
"""

from __future__ import annotations

import csv
import io
import zipfile
from pathlib import Path

import pytest

from prospector.bootstrap import (
    EMP_CAPITAL,
    EMP_CNPJ_BASICO,
    EMP_PORTE,
    EMP_RAZAO,
    EST_CNAE_PRINCIPAL,
    EST_CNPJ_BASICO,
    EST_MUNICIPIO,
    EST_NOME_FANTASIA,
    EST_SITUACAO,
    EST_UF,
    ENCODING,
    PORTE_RECEITA,
    SITUACAO_ATIVA,
    _linhas,
    _valor,
)
from prospector.models import Praca


def linha_estabelecimento(**kw) -> list[str]:
    """Um registro de ESTABELECIMENTOS com os 30 campos do layout oficial."""
    campos = [""] * 30
    campos[0] = kw.get("basico", "11222333")
    campos[1] = kw.get("ordem", "0001")
    campos[2] = kw.get("dv", "81")
    campos[3] = kw.get("matriz", "1")
    campos[4] = kw.get("fantasia", "LOJA EXEMPLO")
    campos[5] = kw.get("situacao", "02")
    campos[10] = kw.get("data_inicio", "20100115")
    campos[11] = kw.get("cnae", "4711302")
    campos[19] = kw.get("uf", "SP")
    campos[20] = kw.get("municipio", "7107")  # código da Receita para São Paulo
    campos[27] = kw.get("email", "socio@exemplo.com.br")  # existe no arquivo, não é lido
    return campos


def linha_empresa(**kw) -> list[str]:
    campos = [""] * 7
    campos[0] = kw.get("basico", "11222333")
    campos[1] = kw.get("razao", "EXEMPLO COMERCIO LTDA")
    campos[4] = kw.get("capital", "5000000,00")
    campos[5] = kw.get("porte", "05")
    return campos


def zip_com(linhas: list[list[str]], destino: Path, membro: str = "K3241.K03200Y0.D60812.ESTABELE") -> Path:
    buf = io.StringIO()
    csv.writer(buf, delimiter=";", quotechar='"', quoting=csv.QUOTE_ALL,
               lineterminator="\n").writerows(linhas)
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(membro, buf.getvalue().encode(ENCODING, "replace"))
    return destino


class TestLeituraDoZip:
    def test_le_csv_latin1_de_dentro_do_zip(self, tmp_path):
        """Acentuação é o teste real: UTF-8 no lugar de latin-1 quebra razão social."""
        linhas = [linha_empresa(razao="COMÉRCIO DE AÇÚCAR E CAFÉ LTDA")]
        z = zip_com(linhas, tmp_path / "Empresas0.zip", membro="K3241.EMPRECSV")
        lidas = list(_linhas(z))
        assert len(lidas) == 1
        assert lidas[0][EMP_RAZAO] == "COMÉRCIO DE AÇÚCAR E CAFÉ LTDA"

    def test_membro_de_nome_variavel(self, tmp_path):
        """O nome do arquivo dentro do ZIP muda a cada competência — pega-se o primeiro."""
        z = zip_com([linha_empresa()], tmp_path / "x.zip", membro="QUALQUER.NOME.ESTRANHO")
        assert len(list(_linhas(z))) == 1

    def test_campo_com_ponto_e_virgula_dentro_de_aspas(self, tmp_path):
        """Razão social com ';' existe e quebraria um split ingênuo."""
        z = zip_com([linha_empresa(razao="A; B COMERCIO LTDA")], tmp_path / "y.zip")
        assert list(_linhas(z))[0][EMP_RAZAO] == "A; B COMERCIO LTDA"


class TestIndicesDoLayout:
    """Se algum destes falhar, a base carrega valor errado no campo certo — sem erro."""

    def test_estabelecimento_mapeia_os_campos_que_importam(self):
        linha = linha_estabelecimento(basico="99888777", fantasia="MERCADO X",
                                      situacao="02", cnae="4711302", uf="SP", municipio="6291")
        assert linha[EST_CNPJ_BASICO] == "99888777"
        assert linha[EST_NOME_FANTASIA] == "MERCADO X"
        assert linha[EST_SITUACAO] in SITUACAO_ATIVA
        assert linha[EST_CNAE_PRINCIPAL] == "4711302"
        assert linha[EST_UF] == "SP"
        assert linha[EST_MUNICIPIO] == "6291"

    def test_empresa_mapeia_os_campos_que_importam(self):
        linha = linha_empresa(basico="99888777", razao="MERCADO X SA", capital="1234,56", porte="05")
        assert linha[EMP_CNPJ_BASICO] == "99888777"
        assert linha[EMP_RAZAO] == "MERCADO X SA"
        assert _valor(linha[EMP_CAPITAL]) == pytest.approx(1234.56)
        assert PORTE_RECEITA[linha[EMP_PORTE]] == "demais"


class TestValorMonetario:
    @pytest.mark.parametrize("bruto,esperado", [
        ("5000000,00", 5_000_000.0),
        ("0,00", 0.0),
        ("1234,56", 1234.56),
        ("", None),
        ("   ", None),
        ("não é número", None),
    ])
    def test_virgula_decimal(self, bruto, esperado):
        """A Receita usa vírgula decimal; float() puro devolveria erro ou o valor errado."""
        r = _valor(bruto)
        assert r is None if esperado is None else r == pytest.approx(esperado)


class TestPorteESituacao:
    def test_codigos_de_porte_do_pdf(self):
        assert PORTE_RECEITA == {"00": "desconhecido", "01": "micro",
                                 "03": "pequena", "05": "demais"}

    def test_ativa_aceita_as_duas_grafias(self):
        """O PDF escreve '2 – ATIVA' e os arquivos trazem '02'. Aceitar as duas evita
        descartar a base inteira por causa de um zero à esquerda."""
        assert "2" in SITUACAO_ATIVA and "02" in SITUACAO_ATIVA
        assert "03" not in SITUACAO_ATIVA  # suspensa não entra


class TestRecorteGeografico:
    def test_praca_guarda_codigo_ibge_nao_o_da_receita(self):
        """A confusão que derruba quem carrega esse dump pela primeira vez: o município
        no arquivo de Estabelecimentos é código da Receita (São Paulo = 7107), e o resto
        do sistema fala IBGE (3550308). A tradução sai do Municipios.zip."""
        assert Praca.SAO_PAULO.value == "3550308"
        assert Praca.CAMPINAS.value == "3509502"
        assert Praca.SOROCABA.value == "3552205"
        assert all(p.uf == "SP" for p in Praca)
