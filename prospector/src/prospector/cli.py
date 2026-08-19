"""Interface de linha de comando. Quatro verbos, nenhum deles surpreendente."""

from __future__ import annotations

import argparse
import json
import logging
import sys

from .config import settings
from .harness import Prospector
from .models import Praca
from .storage import Repositorio


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser("prospector", description="Motor de prospecção da Tyna")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("rodar", help="executa uma rodada de prospecção")
    r.add_argument("--praca", action="append", choices=[x.name.lower() for x in Praca],
                   help="repetível; padrão é todas")
    r.add_argument("--seco", action="store_true", help="executa sem gravar nada")
    r.add_argument("--revisar", action="store_true", help="para antes de armazenar")

    l = sub.add_parser("listar", help="mostra o ranking armazenado")
    l.add_argument("--faixa", choices=["prioritario", "qualificado", "observar"])
    l.add_argument("--limite", type=int, default=25)

    o = sub.add_parser("opor", help="registra oposição do titular (art. 18 da LGPD)")
    o.add_argument("--email")
    o.add_argument("--cnpj")

    sub.add_parser("purgar", help="apaga dado pessoal com retenção vencida")

    sl = sub.add_parser("shortlist", help="lista curta de leads, com sinal lido do site")
    sl.add_argument("--limite", type=int, default=120, help="candidatos do pré-filtro")
    sl.add_argument("--capital-minimo", type=float, default=1_000_000.0)
    sl.add_argument("--praca", action="append", choices=[x.name.lower() for x in Praca])
    sl.add_argument("--saida", default="data/leads-quentes.md")

    b = sub.add_parser("bootstrap", help="carrega a base local do CNPJ (Dados Abertos da Receita)")
    b.add_argument("--mes", help="competência AAAA-MM; padrão é a mais recente publicada")
    b.add_argument("--arquivos", type=int, default=10,
                   help="quantos dos 10 pedaços de cada tabela processar (use 1 para ensaiar)")
    b.add_argument("--status", action="store_true", help="só mostra o que já foi carregado")

    a = p.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    repo = Repositorio(settings.banco)

    try:
        if a.cmd == "rodar":
            if not a.seco:
                settings.validar_para_execucao()
            pracas = tuple(Praca[n.upper()] for n in (a.praca or [])) or tuple(Praca)
            estado = Prospector(repo, modo_seco=a.seco, revisar=a.revisar).executar(pracas)
            print(json.dumps(estado.resumo, ensure_ascii=False, indent=2))
            for pontuada in estado.pontuadas[:10]:
                print()
                print(pontuada.explicar())
            return 0 if estado.etapa.value != "abortado" else 1

        if a.cmd == "listar":
            linhas = repo.ranking(a.faixa, a.limite)
            if not linhas:
                print("nada armazenado ainda — rode `prospector rodar`")
                return 0
            for x in linhas:
                print(f"{x['pontos']:>3}/{x['maximo']} {x['faixa']:<12} "
                      f"{x['razao_social'][:44]:<44} {x['dominio'] or ''}")
            return 0

        if a.cmd == "opor":
            n = repo.registrar_oposicao(email=a.email, cnpj=a.cnpj)
            print(f"{n} registro(s) marcado(s) com oposição e contato removido")
            return 0

        if a.cmd == "shortlist":
            import uuid
            from pathlib import Path

            from .guardrails import Guardrails, ListaDeSupressao, Orcamento, PolidezHTTP
            from .icp import CNAE_GATILHO_FORTE, VERSAO
            from .models import RunState
            from .shortlist import Shortlist, relatorio

            pracas = tuple(Praca[n.upper()] for n in (a.praca or [])) or tuple(Praca)
            gr = Guardrails(
                orcamento=Orcamento(max_requisicoes_http=20_000, max_duracao_s=7200,
                                    max_chamadas_llm=0, max_custo_usd=0.0),
                polidez=PolidezHTTP(intervalo_min_s=settings.intervalo_http_s),
                supressao=ListaDeSupressao.de_arquivo(settings.supressao),
            )
            estado = RunState(run_id=uuid.uuid4().hex[:12], icp_versao=VERSAO)
            prefixos = tuple(sorted(CNAE_GATILHO_FORTE))
            r = Shortlist(repo, gr).executar(
                estado,
                municipios=tuple(p.value for p in pracas),
                prefixos_cnae=prefixos,
                capital_minimo=a.capital_minimo,
                limite_candidatos=a.limite,
            )
            comp = repo.bootstrap_status()
            texto = relatorio(r, {
                "competencia": comp[0]["competencia"] if comp else "?",
                "filtro": (f"matriz ativa em {', '.join(p.nome for p in pracas)}, "
                           f"capital social ≥ R$ {a.capital_minimo/1e6:.0f} mi, "
                           f"CNAE de gatilho forte (financeiro, seguros, saúde, educação, varejo, atacado)"),
            })
            saida = Path(a.saida)
            saida.parent.mkdir(parents=True, exist_ok=True)
            saida.write_text(texto, encoding="utf-8")
            print(f"{r.dominios_resolvidos} de {r.candidatos} domínios resolvidos · "
                  f"{r.com_sinal} com sinal · relatório em {saida}")
            return 0

        if a.cmd == "bootstrap":
            from .bootstrap import carregar, competencia_mais_recente

            if a.status:
                linhas = repo.bootstrap_status()
                if not linhas:
                    print("nenhuma carga feita — rode `prospector bootstrap`")
                    print(f"competência mais recente publicada: {competencia_mais_recente()}")
                    return 0
                for x in linhas:
                    print(f"{x['competencia']}  {x['aceitos']:>7} aceitos de {x['lidos']:>10} lidos"
                          f"  ({x['carregado_em'][:10]})")
                return 0
            carga = carregar(repo, mes=a.mes, arquivos=a.arquivos)
            print(f"competência {carga.mes}: {carga.aceitos} empresa(s) no recorte, "
                  f"de {carga.lidos} linha(s) lidas ({carga.taxa:.4f}%)")
            return 0

        if a.cmd == "purgar":
            print(f"{repo.purgar_expirados()} registro(s) de dado pessoal apagado(s)")
            return 0
    finally:
        repo.fechar()
    return 0


if __name__ == "__main__":
    sys.exit(main())
