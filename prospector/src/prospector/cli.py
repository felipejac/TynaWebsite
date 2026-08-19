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

        if a.cmd == "purgar":
            print(f"{repo.purgar_expirados()} registro(s) de dado pessoal apagado(s)")
            return 0
    finally:
        repo.fechar()
    return 0


if __name__ == "__main__":
    sys.exit(main())
