"""Persistência em SQLite. Um arquivo, zero servidor, migração trivial para Postgres.

Duas escolhas que importam mais do que parecem:

- **Empresa e pessoa vivem em tabelas separadas**, com prazo de retenção só na segunda.
  É o que permite `purgar_expirados()` apagar dado pessoal sem perder o inventário de
  empresas — a retenção incide sobre o que é dado pessoal, não sobre tudo.
- **Toda gravação registra a proveniência serializada.** É o que responde "de onde veio
  esse dado?" seis meses depois, que é a pergunta que a Tyna faz aos clientes dela.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import date
from pathlib import Path

from .models import CompanyData, LeadProfile, RunState, ScoredCompany

ESQUEMA = """
CREATE TABLE IF NOT EXISTS empresas (
    cnpj              TEXT PRIMARY KEY,
    razao_social      TEXT NOT NULL,
    nome_fantasia     TEXT,
    municipio_ibge    TEXT NOT NULL,
    municipio         TEXT,
    uf                TEXT,
    cnae_principal    TEXT,
    porte             TEXT,
    capital_social    REAL,
    situacao          TEXT,
    dominio           TEXT,
    payload           TEXT NOT NULL,   -- CompanyData completo em JSON, com proveniência
    atualizado_em     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_empresas_municipio ON empresas(municipio_ibge);
CREATE INDEX IF NOT EXISTS ix_empresas_dominio   ON empresas(dominio);

CREATE TABLE IF NOT EXISTS pontuacoes (
    cnpj         TEXT NOT NULL,
    icp_versao   TEXT NOT NULL,
    pontos       INTEGER NOT NULL,
    maximo       INTEGER NOT NULL,
    faixa        TEXT NOT NULL,
    criterios    TEXT NOT NULL,       -- boletim completo, para explicar a nota depois
    avaliado_em  TEXT NOT NULL,
    PRIMARY KEY (cnpj, icp_versao),
    FOREIGN KEY (cnpj) REFERENCES empresas(cnpj)
);
CREATE INDEX IF NOT EXISTS ix_pontuacoes_faixa ON pontuacoes(faixa, pontos DESC);

-- Dado pessoal. Tabela separada, com retenção e oposição próprias.
CREATE TABLE IF NOT EXISTS leads (
    id                TEXT PRIMARY KEY,
    cnpj_empresa      TEXT NOT NULL,
    nome              TEXT NOT NULL,
    cargo             TEXT NOT NULL,
    papel             TEXT NOT NULL,
    email_corporativo TEXT,
    perfil_publico    TEXT,
    base_legal        TEXT NOT NULL,
    lia_ref           TEXT NOT NULL,
    finalidade        TEXT NOT NULL,
    retencao_ate      TEXT NOT NULL,
    opt_out           INTEGER NOT NULL DEFAULT 0,
    opt_out_em        TEXT,
    origem            TEXT NOT NULL,
    atualizado_em     TEXT NOT NULL,
    FOREIGN KEY (cnpj_empresa) REFERENCES empresas(cnpj)
);
CREATE INDEX IF NOT EXISTS ix_leads_retencao ON leads(retencao_ate);
CREATE INDEX IF NOT EXISTS ix_leads_empresa  ON leads(cnpj_empresa);

-- Base local dos Dados Abertos do CNPJ da Receita, recortada nas três praças.
-- É o que permite varrer por município e CNAE sem depender de API que resolve um por vez.
-- Não guarda e-mail nem telefone do arquivo de Estabelecimentos: em empresa pequena esses
-- campos são dado pessoal do sócio, e o pipeline não precisa deles para qualificar empresa.
CREATE TABLE IF NOT EXISTS cnpj_local (
    cnpj           TEXT PRIMARY KEY,
    cnpj_basico    TEXT NOT NULL,
    razao_social   TEXT NOT NULL,
    nome_fantasia  TEXT,
    municipio_ibge TEXT NOT NULL,
    municipio      TEXT NOT NULL,
    cnae           TEXT NOT NULL,
    porte          TEXT,
    capital_social REAL,
    matriz         INTEGER NOT NULL DEFAULT 1,
    data_inicio    TEXT,
    competencia    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cnpj_local_praca ON cnpj_local(municipio_ibge, cnae);
CREATE INDEX IF NOT EXISTS ix_cnpj_local_porte ON cnpj_local(porte, capital_social DESC);
CREATE INDEX IF NOT EXISTS ix_cnpj_local_basico ON cnpj_local(cnpj_basico);

CREATE TABLE IF NOT EXISTS bootstrap (
    competencia  TEXT PRIMARY KEY,
    lidos        INTEGER NOT NULL,
    aceitos      INTEGER NOT NULL,
    arquivos     TEXT NOT NULL,
    carregado_em TEXT NOT NULL
);

-- Trilha de execução: uma linha por rodada, para comparar rodadas e auditar custo.
CREATE TABLE IF NOT EXISTS execucoes (
    run_id       TEXT PRIMARY KEY,
    icp_versao   TEXT NOT NULL,
    iniciado_em  TEXT NOT NULL,
    encerrado_em TEXT,
    resumo       TEXT NOT NULL,
    incidentes   TEXT NOT NULL
);
"""


class Repositorio:
    def __init__(self, caminho: Path) -> None:
        caminho.parent.mkdir(parents=True, exist_ok=True)
        self.con = sqlite3.connect(caminho)
        self.con.row_factory = sqlite3.Row
        self.con.execute("PRAGMA foreign_keys = ON")
        self.con.executescript(ESQUEMA)
        self.con.commit()

    # ---- escrita ----

    def salvar_empresa(self, e: CompanyData) -> None:
        self.con.execute(
            """INSERT INTO empresas (cnpj, razao_social, nome_fantasia, municipio_ibge, municipio,
                   uf, cnae_principal, porte, capital_social, situacao, dominio, payload, atualizado_em)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(cnpj) DO UPDATE SET
                   razao_social=excluded.razao_social, nome_fantasia=excluded.nome_fantasia,
                   porte=excluded.porte, dominio=excluded.dominio,
                   payload=excluded.payload, atualizado_em=excluded.atualizado_em""",
            (e.cnpj, e.razao_social, e.nome_fantasia, e.municipio_ibge, e.municipio, e.uf,
             e.cnae_principal, e.porte.value, e.capital_social, e.situacao_cadastral, e.dominio,
             e.model_dump_json(), e.atualizado_em.isoformat()),
        )
        self.con.commit()

    def salvar_pontuacao(self, s: ScoredCompany) -> None:
        self.con.execute(
            """INSERT INTO pontuacoes (cnpj, icp_versao, pontos, maximo, faixa, criterios, avaliado_em)
               VALUES (?,?,?,?,?,?,?)
               ON CONFLICT(cnpj, icp_versao) DO UPDATE SET
                   pontos=excluded.pontos, faixa=excluded.faixa,
                   criterios=excluded.criterios, avaliado_em=excluded.avaliado_em""",
            (s.empresa.cnpj, s.icp_versao, s.pontos, s.maximo, s.faixa.value,
             json.dumps([c.model_dump(mode="json") for c in s.criterios], ensure_ascii=False),
             s.avaliado_em.isoformat()),
        )
        self.con.commit()

    def salvar_lead(self, l: LeadProfile) -> None:  # noqa: E741
        self.con.execute(
            """INSERT INTO leads (id, cnpj_empresa, nome, cargo, papel, email_corporativo,
                   perfil_publico, base_legal, lia_ref, finalidade, retencao_ate, opt_out,
                   opt_out_em, origem, atualizado_em)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
               ON CONFLICT(id) DO UPDATE SET
                   cargo=excluded.cargo, papel=excluded.papel,
                   email_corporativo=excluded.email_corporativo,
                   atualizado_em=excluded.atualizado_em""",
            (l.id, l.cnpj_empresa, l.nome, l.cargo, l.papel.value, l.email_corporativo,
             str(l.perfil_publico) if l.perfil_publico else None, l.base_legal.value, l.lia_ref,
             l.finalidade, l.retencao_ate.isoformat(), int(l.opt_out),
             l.opt_out_em.isoformat() if l.opt_out_em else None,
             l.origem.model_dump_json(), l.atualizado_em.isoformat()),
        )
        self.con.commit()

    def salvar_execucao(self, estado: RunState) -> None:
        self.con.execute(
            """INSERT INTO execucoes (run_id, icp_versao, iniciado_em, encerrado_em, resumo, incidentes)
               VALUES (?,?,?,?,?,?)
               ON CONFLICT(run_id) DO UPDATE SET
                   encerrado_em=excluded.encerrado_em, resumo=excluded.resumo,
                   incidentes=excluded.incidentes""",
            (estado.run_id, estado.icp_versao, estado.iniciado_em.isoformat(),
             estado.encerrado_em.isoformat() if estado.encerrado_em else None,
             json.dumps(estado.resumo, ensure_ascii=False),
             json.dumps([i.model_dump(mode="json") for i in estado.incidentes], ensure_ascii=False)),
        )
        self.con.commit()

    def salvar_cnpj_local(self, **c) -> None:
        self.con.execute(
            """INSERT INTO cnpj_local (cnpj, cnpj_basico, razao_social, nome_fantasia,
                   municipio_ibge, municipio, cnae, porte, capital_social, matriz,
                   data_inicio, competencia)
               VALUES (:cnpj,:cnpj_basico,:razao_social,:nome_fantasia,:municipio_ibge,
                       :municipio,:cnae,:porte,:capital_social,:matriz,:data_inicio,:competencia)
               ON CONFLICT(cnpj) DO UPDATE SET
                   razao_social=excluded.razao_social, nome_fantasia=excluded.nome_fantasia,
                   porte=excluded.porte, capital_social=excluded.capital_social,
                   competencia=excluded.competencia""",
            {**c, "matriz": int(c.get("matriz", True))},
        )

    def inserir_estabelecimento(self, **c) -> None:
        """Fase 1 da carga: grava o estabelecimento com razão social ainda vazia.

        A carga completa casa ~5,3 milhões de estabelecimentos. Acumular isso num dict
        Python antes de gravar custa alguns GB de RAM e derruba a máquina no meio de um
        download de 28 GB — por isso a gravação é incremental, e o nome da empresa entra
        depois, por UPDATE.
        """
        self.con.execute(
            """INSERT INTO cnpj_local (cnpj, cnpj_basico, razao_social, nome_fantasia,
                   municipio_ibge, municipio, cnae, porte, capital_social, matriz,
                   data_inicio, competencia)
               VALUES (:cnpj,:cnpj_basico,'',:nome_fantasia,:municipio_ibge,
                       :municipio,:cnae,NULL,NULL,:matriz,:data_inicio,:competencia)
               ON CONFLICT(cnpj) DO UPDATE SET
                   nome_fantasia=excluded.nome_fantasia, cnae=excluded.cnae,
                   competencia=excluded.competencia""",
            {**c, "matriz": int(c.get("matriz", True))},
        )

    def completar_empresa(self, cnpj_basico: str, razao_social: str,
                          capital_social: float | None, porte: str | None) -> int:
        """Fase 2: preenche os dados da empresa nos estabelecimentos já gravados."""
        cur = self.con.execute(
            "UPDATE cnpj_local SET razao_social=?, capital_social=?, porte=? "
            "WHERE cnpj_basico=? AND razao_social=''",
            (razao_social, capital_social, porte, cnpj_basico),
        )
        return cur.rowcount

    def descartar_incompletos(self) -> int:
        """Fase 3: estabelecimento sem empresa correspondente só sujaria a base."""
        cur = self.con.execute("DELETE FROM cnpj_local WHERE razao_social = ''")
        self.con.commit()
        return cur.rowcount

    def commit(self) -> None:
        self.con.commit()

    def registrar_bootstrap(self, competencia: str, lidos: int, aceitos: int,
                            arquivos: list[str]) -> None:
        from datetime import datetime, timezone

        self.con.execute(
            """INSERT INTO bootstrap (competencia, lidos, aceitos, arquivos, carregado_em)
               VALUES (?,?,?,?,?)
               ON CONFLICT(competencia) DO UPDATE SET
                   lidos=excluded.lidos, aceitos=excluded.aceitos,
                   arquivos=excluded.arquivos, carregado_em=excluded.carregado_em""",
            (competencia, lidos, aceitos, json.dumps(arquivos), datetime.now(timezone.utc).isoformat()),
        )
        self.con.commit()

    # ---- leitura ----

    def ja_conhecida(self, cnpj: str) -> bool:
        cur = self.con.execute("SELECT 1 FROM empresas WHERE cnpj = ?", (cnpj,))
        return cur.fetchone() is not None

    def ranking(self, faixa: str | None = None, limite: int = 50) -> list[sqlite3.Row]:
        sql = ("SELECT e.razao_social, e.municipio, e.dominio, p.pontos, p.maximo, p.faixa, p.criterios "
               "FROM pontuacoes p JOIN empresas e USING (cnpj) ")
        args: tuple = ()
        if faixa:
            sql += "WHERE p.faixa = ? "
            args = (faixa,)
        sql += "ORDER BY p.pontos DESC LIMIT ?"
        return self.con.execute(sql, (*args, limite)).fetchall()

    def bootstrap_status(self) -> list[sqlite3.Row]:
        return self.con.execute(
            "SELECT competencia, lidos, aceitos, carregado_em FROM bootstrap "
            "ORDER BY competencia DESC"
        ).fetchall()

    def buscar_cnpj_local(self, municipios_ibge: tuple[str, ...],
                          prefixos_cnae: tuple[str, ...] = (),
                          capital_minimo: float | None = None,
                          apenas_matriz: bool = False,
                          exigir_fantasia: bool = False,
                          limite: int = 200) -> list[sqlite3.Row]:
        """Varredura firmográfica que a API pública não faz: município + CNAE + porte.

        Ordena por capital social porque, na ausência de classificação de porte acima de
        EPP na base da Receita, é o melhor proxy de tamanho disponível.

        `apenas_matriz` costuma ser o que se quer para o ICP: a base traz estabelecimentos,
        então uma agência do Itaú em Campinas aparece como empresa de Campinas. Ela é
        Campinas para efeito de endereço, mas quem decide sobre governança de IA está na
        matriz — e a matriz não está nesta praça.
        """
        sql = ["SELECT * FROM cnpj_local WHERE municipio_ibge IN (%s)"
               % ",".join("?" * len(municipios_ibge))]
        args: list = list(municipios_ibge)
        if prefixos_cnae:
            sql.append("AND (" + " OR ".join("cnae LIKE ?" for _ in prefixos_cnae) + ")")
            args += [f"{p}%" for p in prefixos_cnae]
        if capital_minimo is not None:
            sql.append("AND capital_social >= ?")
            args.append(capital_minimo)
        if apenas_matriz:
            sql.append("AND matriz = 1")
        if exigir_fantasia:
            # Empresa com nome fantasia declarado tende a ser operação com marca; SPE e
            # veículo societário raramente têm. É o filtro mais barato contra fachada.
            sql.append("AND nome_fantasia IS NOT NULL AND length(trim(nome_fantasia)) > 2")
        sql.append("ORDER BY capital_social DESC NULLS LAST LIMIT ?")
        args.append(limite)
        return self.con.execute(" ".join(sql), args).fetchall()

    def casar_por_dominio(self, dominio: str) -> sqlite3.Row | None:
        """Tenta resolver domínio → CNPJ pela marca. É heurística, e é assumida como tal.

        `magazineluiza.com.br` → "magazineluiza" → casa com "MAGAZINE LUIZA S/A" depois de
        remover espaço e pontuação. Funciona bem para marca forte e falha em holding com
        razão social que não parece com o site — por isso o resultado entra com confiança
        reduzida e fica marcado para confirmação humana, em vez de virar fato.

        O dump da Receita não traz domínio; enquanto não houver fonte que traga, é isto
        ou nada.
        """
        marca = dominio.split(".")[0].lower()
        if len(marca) < 4:  # sigla curta gera falso positivo demais
            return None
        cur = self.con.execute(
            """SELECT *, 'fantasia' AS via FROM cnpj_local
               WHERE replace(replace(replace(lower(coalesce(nome_fantasia,'')),' ',''),'.',''),'-','') = ?
               UNION ALL
               SELECT *, 'razao' AS via FROM cnpj_local
               WHERE replace(replace(replace(lower(razao_social),' ',''),'.',''),'-','') LIKE ?
               LIMIT 2""",
            (marca, marca + "%"),
        )
        linhas = cur.fetchall()
        # Duas empresas casando com a mesma marca significa ambiguidade: melhor não decidir.
        return linhas[0] if len(linhas) == 1 else None

    # ---- LGPD em operação ----

    def registrar_oposicao(self, *, email: str | None = None, cnpj: str | None = None) -> int:
        """Marca oposição e limpa o contato. Direito do titular tem que ser executável em uma chamada."""
        from datetime import datetime, timezone

        agora = datetime.now(timezone.utc).isoformat()
        if email:
            cur = self.con.execute(
                "UPDATE leads SET opt_out=1, opt_out_em=?, email_corporativo=NULL WHERE email_corporativo=?",
                (agora, email.lower()))
        elif cnpj:
            cur = self.con.execute(
                "UPDATE leads SET opt_out=1, opt_out_em=?, email_corporativo=NULL WHERE cnpj_empresa=?",
                (agora, "".join(c for c in cnpj if c.isdigit())))
        else:
            raise ValueError("informe email ou cnpj")
        self.con.commit()
        return cur.rowcount

    def purgar_expirados(self, hoje: date | None = None) -> int:
        """Apaga dado pessoal vencido. Chamado no fim de toda rodada, sem exceção."""
        cur = self.con.execute("DELETE FROM leads WHERE retencao_ate < ?",
                               ((hoje or date.today()).isoformat(),))
        self.con.commit()
        return cur.rowcount

    def fechar(self) -> None:
        self.con.close()
