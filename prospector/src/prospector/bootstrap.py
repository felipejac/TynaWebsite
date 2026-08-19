"""Carga local dos Dados Abertos do CNPJ da Receita Federal.

É o que fecha o buraco da fase 1: a BrasilAPI resolve um CNPJ por vez e não busca por
município e CNAE. O dump da Receita busca — depois de carregado, a varredura das três
praças vira uma consulta SQL.

**A fonte mudou de lugar e não está documentada em lugar nenhum.** Os caminhos que
circulam em tutorial e em projeto de GitHub (`.../dados/cnpj/dados_abertos_cnpj/AAAA-MM/`)
respondem 404 hoje. A Receita publica por **link compartilhado do Nextcloud**, e o acesso
programático é o WebDAV público:

    https://arquivos.receitafederal.gov.br/public.php/webdav/<AAAA-MM>/<arquivo>.zip

com autenticação Basic usando o token do compartilhamento como usuário e senha vazia.
Confirmado por PROPFIND em 18/08/2026; a competência mais recente era 2026-08.

Layout dos arquivos conforme `cnpj-metadados.pdf`, publicado pela própria Receita:
CSV sem cabeçalho, separador `;`, aspas `"`, codificação **ISO-8859-1** (latin-1).

Decisão de minimização, e ela é deliberada: **o arquivo de Estabelecimentos traz
`correio_eletronico`, telefone e fax, e este carregador não lê nenhum dos três.** Em
empresa pequena esses campos costumam ser o e-mail e o celular pessoal do sócio. São
dados pessoais, o pipeline não precisa deles para qualificar empresa, e coletar "porque
veio junto" é exatamente o oposto de minimização.
"""

from __future__ import annotations

import csv
import io
import logging
import re
import tempfile
import zipfile
from collections.abc import Iterator
from dataclasses import dataclass, field
from pathlib import Path

import httpx

from .guardrails import USER_AGENT
from .models import Praca

log = logging.getLogger("prospector.bootstrap")

HOST = "https://arquivos.receitafederal.gov.br"
WEBDAV = f"{HOST}/public.php/webdav"
# Token do compartilhamento público. Se a Receita trocar o link, é a única coisa a mudar
# aqui — e o sintoma será 401 em vez de 404, o que facilita o diagnóstico.
TOKEN = "YggdBLfdninEJX9"

ENCODING = "latin-1"
SEP = ";"

# Índices dos campos, conforme o PDF de metadados da Receita. Numerados a partir de zero.
EMP_CNPJ_BASICO, EMP_RAZAO, EMP_CAPITAL, EMP_PORTE = 0, 1, 4, 5
EST_CNPJ_BASICO, EST_ORDEM, EST_DV = 0, 1, 2
EST_MATRIZ_FILIAL, EST_NOME_FANTASIA, EST_SITUACAO = 3, 4, 5
EST_DATA_INICIO, EST_CNAE_PRINCIPAL = 10, 11
EST_UF, EST_MUNICIPIO = 19, 20

SITUACAO_ATIVA = {"2", "02"}
PORTE_RECEITA = {"00": "desconhecido", "01": "micro", "03": "pequena", "05": "demais"}


# --------------------------------------------------------------------------- #
# Acesso ao compartilhamento                                                  #
# --------------------------------------------------------------------------- #


def _cliente() -> httpx.Client:
    return httpx.Client(
        timeout=httpx.Timeout(60.0, read=300.0),
        headers={"user-agent": USER_AGENT},
        auth=(TOKEN, ""),
        follow_redirects=True,
    )


def listar(caminho: str = "") -> list[tuple[str, int]]:
    """PROPFIND de um nível. Devolve [(nome, tamanho_em_bytes)]; diretório vem com 0."""
    with _cliente() as c:
        r = c.request("PROPFIND", f"{WEBDAV}/{caminho}", headers={"Depth": "1"})
        r.raise_for_status()
    itens: list[tuple[str, int]] = []
    for bloco in re.findall(r"<d:response>(.*?)</d:response>", r.text, re.S):
        href = re.search(r"<d:href>([^<]+)</d:href>", bloco)
        if not href:
            continue
        nome = href.group(1).rstrip("/").rsplit("/", 1)[-1]
        if not nome or nome == caminho.rstrip("/"):
            continue
        tam = re.search(r"<d:getcontentlength>(\d+)</d:getcontentlength>", bloco)
        itens.append((nome, int(tam.group(1)) if tam else 0))
    return itens


def competencia_mais_recente() -> str:
    """A competência AAAA-MM mais nova publicada. A Receita atualiza mensalmente."""
    meses = [n for n, _ in listar() if re.fullmatch(r"\d{4}-\d{2}", n)]
    if not meses:
        raise RuntimeError("nenhuma competência encontrada no compartilhamento da Receita")
    return max(meses)


def _baixar(mes: str, arquivo: str, destino: Path) -> Path:
    """Baixa um ZIP para disco em blocos. Não cabe em memória: Estabelecimentos0 tem 2,2 GB."""
    url = f"{WEBDAV}/{mes}/{arquivo}"
    destino.parent.mkdir(parents=True, exist_ok=True)
    with _cliente() as c, c.stream("GET", url) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        baixado = 0
        marco = 0
        with destino.open("wb") as f:
            for pedaco in r.iter_bytes(chunk_size=1 << 20):
                f.write(pedaco)
                baixado += len(pedaco)
                if total and baixado - marco > total / 10:
                    marco = baixado
                    log.info("  %s: %.0f%%", arquivo, baixado / total * 100)
    return destino


def _linhas(zip_path: Path) -> Iterator[list[str]]:
    """Lê o CSV de dentro do ZIP sem descompactar para disco.

    O nome do membro varia por competência (`K3241.K03200Y0.D30513.ESTABELE` e afins),
    então pega-se o primeiro — os arquivos da Receita têm um membro só.
    """
    with zipfile.ZipFile(zip_path) as z:
        membro = z.namelist()[0]
        with z.open(membro) as bruto:
            texto = io.TextIOWrapper(bruto, encoding=ENCODING, newline="")
            for linha in csv.reader(texto, delimiter=SEP, quotechar='"'):
                yield linha


# --------------------------------------------------------------------------- #
# Carga                                                                       #
# --------------------------------------------------------------------------- #

# Nome do município como a Receita escreve: sem acento e em caixa alta.
NOME_RECEITA_POR_PRACA: dict[str, Praca] = {
    "SAO PAULO": Praca.SAO_PAULO,
    "SOROCABA": Praca.SOROCABA,
    "CAMPINAS": Praca.CAMPINAS,
}


@dataclass
class Carga:
    """Resultado de uma carga, para o relatório e para a tabela de controle."""

    mes: str
    lidos: int = 0
    aceitos: int = 0
    arquivos: list[str] = field(default_factory=list)

    @property
    def taxa(self) -> float:
        return (self.aceitos / self.lidos * 100) if self.lidos else 0.0


def resolver_municipios(mes: str, tmp: Path) -> dict[str, Praca]:
    """Mapeia código de município da Receita → praça do ICP.

    O código do município no arquivo de Estabelecimentos é **da Receita, não do IBGE** —
    é o erro clássico de quem carrega esse dump pela primeira vez. A tradução vem do
    próprio `Municipios.zip`, casada por nome; o `Praca` guarda o código IBGE, que é o
    que o resto do sistema usa.
    """
    caminho = _baixar(mes, "Municipios.zip", tmp / "Municipios.zip")
    mapa: dict[str, Praca] = {}
    for linha in _linhas(caminho):
        if len(linha) < 2:
            continue
        codigo, nome = linha[0].strip(), linha[1].strip().upper()
        praca = NOME_RECEITA_POR_PRACA.get(nome)
        if praca:
            mapa[codigo] = praca
    caminho.unlink(missing_ok=True)
    if len(mapa) < len(NOME_RECEITA_POR_PRACA):
        faltando = set(NOME_RECEITA_POR_PRACA) - {p.nome.upper() for p in mapa.values()}
        log.warning("municípios não resolvidos no dump: %s", faltando)
    return mapa


def carregar(
    repo,
    mes: str | None = None,
    prefixos_cnae: tuple[str, ...] = (),
    arquivos: int = 10,
    tmp_dir: Path | None = None,
) -> Carga:
    """Baixa, filtra e grava a base local das três praças.

    A filtragem acontece durante a leitura, e é o que torna isso viável: o dump inteiro
    tem dezenas de milhões de estabelecimentos, e o recorte de três municípios com CNAE
    de interesse e situação ativa devolve alguns milhares. Nada disso passa por memória
    de uma vez.

    `arquivos` limita quantos dos dez pedaços de cada tabela são processados — útil para
    ensaiar a carga com 10% do volume antes de rodar o conjunto todo.
    """
    from .icp import CNAE_GATILHO_FORTE, CNAE_GATILHO_MEDIO

    mes = mes or competencia_mais_recente()
    prefixos = set(prefixos_cnae) or set(CNAE_GATILHO_FORTE) | set(CNAE_GATILHO_MEDIO)
    tmp = tmp_dir or Path(tempfile.gettempdir()) / "tyna-cnpj"
    tmp.mkdir(parents=True, exist_ok=True)
    carga = Carga(mes=mes)

    log.info("competência %s | %d prefixos de CNAE | %d arquivo(s) por tabela",
             mes, len(prefixos), arquivos)

    municipios = resolver_municipios(mes, tmp)
    log.info("municípios do recorte resolvidos: %d código(s) da Receita", len(municipios))

    # ---- passo 1: estabelecimentos das três praças ----
    # Vem primeiro porque é ele que define o conjunto de CNPJ básicos que interessa;
    # o arquivo de Empresas é então filtrado por esse conjunto, e não o contrário.
    estabelecimentos: dict[str, dict] = {}
    for i in range(arquivos):
        nome = f"Estabelecimentos{i}.zip"
        log.info("baixando %s", nome)
        caminho = _baixar(mes, nome, tmp / nome)
        carga.arquivos.append(nome)
        try:
            for linha in _linhas(caminho):
                carga.lidos += 1
                if len(linha) <= EST_MUNICIPIO:
                    continue
                if linha[EST_UF].strip() != "SP":
                    continue
                praca = municipios.get(linha[EST_MUNICIPIO].strip())
                if praca is None:
                    continue
                if linha[EST_SITUACAO].strip() not in SITUACAO_ATIVA:
                    continue
                cnae = linha[EST_CNAE_PRINCIPAL].strip()
                if cnae[:2] not in prefixos:
                    continue
                basico = linha[EST_CNPJ_BASICO].strip()
                estabelecimentos[basico] = {
                    "cnpj": basico + linha[EST_ORDEM].strip() + linha[EST_DV].strip(),
                    "nome_fantasia": linha[EST_NOME_FANTASIA].strip() or None,
                    "cnae": cnae,
                    "municipio_ibge": praca.value,
                    "municipio": praca.nome,
                    "matriz": linha[EST_MATRIZ_FILIAL].strip() == "1",
                    "data_inicio": linha[EST_DATA_INICIO].strip() or None,
                }
                # Note o que NÃO é lido: correio_eletronico, telefone e fax.
        finally:
            caminho.unlink(missing_ok=True)
        log.info("  acumulado: %d estabelecimento(s) no recorte", len(estabelecimentos))

    # ---- passo 2: dados da empresa para os básicos encontrados ----
    for i in range(arquivos):
        if not estabelecimentos:
            break
        nome = f"Empresas{i}.zip"
        log.info("baixando %s", nome)
        caminho = _baixar(mes, nome, tmp / nome)
        carga.arquivos.append(nome)
        try:
            for linha in _linhas(caminho):
                if len(linha) <= EMP_PORTE:
                    continue
                basico = linha[EMP_CNPJ_BASICO].strip()
                alvo = estabelecimentos.get(basico)
                if alvo is None:
                    continue
                alvo["razao_social"] = linha[EMP_RAZAO].strip()
                alvo["capital_social"] = _valor(linha[EMP_CAPITAL])
                alvo["porte_receita"] = PORTE_RECEITA.get(linha[EMP_PORTE].strip(), "desconhecido")
        finally:
            caminho.unlink(missing_ok=True)

    # ---- passo 3: gravação ----
    for basico, d in estabelecimentos.items():
        if "razao_social" not in d:
            # Estabelecimento sem empresa correspondente nos arquivos processados.
            # Acontece quando `arquivos` < 10; gravar sem razão social só suja a base.
            continue
        repo.salvar_cnpj_local(
            cnpj=d["cnpj"], cnpj_basico=basico, razao_social=d["razao_social"],
            nome_fantasia=d["nome_fantasia"], municipio_ibge=d["municipio_ibge"],
            municipio=d["municipio"], cnae=d["cnae"], porte=d["porte_receita"],
            capital_social=d["capital_social"], matriz=d["matriz"],
            data_inicio=d["data_inicio"], competencia=mes,
        )
        carga.aceitos += 1

    repo.registrar_bootstrap(mes, carga.lidos, carga.aceitos, carga.arquivos)
    log.info("carga concluída: %d de %d linhas (%.4f%%)", carga.aceitos, carga.lidos, carga.taxa)
    return carga


def _valor(bruto: str) -> float | None:
    """Capital social vem com vírgula decimal: '1000000,00'."""
    try:
        return float(bruto.strip().replace(",", ".")) if bruto.strip() else None
    except ValueError:
        return None
