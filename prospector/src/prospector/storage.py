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
