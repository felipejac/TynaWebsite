# -*- coding: utf-8 -*-
"""Normaliza a planilha de AI Gateways e gera o corpo da tabela + o CSV.

A planilha traz o texto como foi anotado ("Self-hosted (K8s)", "Não (baseado em
Envoy OSS)"), o que é bom para leitura e péssimo para filtro. Aqui cada campo ganha
DOIS valores: o rótulo normalizado, que vira facet, e o texto original, que fica
visível na célula. Nada é descartado.
"""

import csv
import html
import io
import json
import os
import re
import sys
from collections import Counter, OrderedDict

sys.stdout.reconfigure(encoding="utf-8")

RAIZ = os.path.dirname(os.path.abspath(__file__))
ORIGEM = os.path.join(RAIZ, "ai-gateways-set-2026.json")
MOLDE = os.path.join(RAIZ, "comparativo-molde.html")
SAIDA_PAGINA = os.path.join(RAIZ, "..", "..", "ai-gateway", "comparativo", "index.html")
SAIDA_CSV = os.path.join(RAIZ, "..", "..", "ai-gateway", "comparativo",
                         "ai-gateways-set-2026.csv")

dados = json.load(io.open(ORIGEM, encoding="utf-8"))
K = list(dados[0].keys())
C_NOME, C_CAT, C_ENT, C_OSS, C_LIC = K[1], K[2], K[3], K[4], K[5]
C_EMP, C_ORI, C_STA, C_COB, C_DES = K[6], K[7], K[8], K[9], K[10]
C_SITE, C_FONTE = K[11], K[12]


def limpo(v):
    v = (v or "").strip()
    return "" if v in ("—", "-", "a verificar", "A verificar") else v


def n_entrega(v):
    s = (v or "").lower()
    if not s or "a verificar" in s:
        return "A verificar"
    if "híbrido" in s or ("self-hosted" in s and "saas" in s):
        return "Híbrido"
    if "self-hosted" in s:
        return "Self-hosted"
    if "saas" in s:
        return "SaaS"
    return "A verificar"


def n_oss(v):
    s = (v or "").lower()
    if "open core" in s:
        return "Open core"
    if s.startswith("sim"):
        return "Sim"
    if s.startswith("não"):
        return "Não"
    return "A verificar"


def n_licenca(v):
    s = (v or "").lower()
    if "apache" in s:
        return "Apache-2.0"
    if "agpl" in s:
        return "AGPL-3.0"
    if re.search(r"\bmit\b", s):
        return "MIT"
    if "comercial" in s:
        return "Comercial"
    return "A verificar"


def n_origem(v):
    s = limpo(v)
    if not s:
        return "Não informada"
    return s.replace(" (UE)", "")


def n_status(v):
    s = (v or "").lower()
    for chave, rot in (
        ("ativo", "Ativo"), ("inativo", "Inativo"), ("arquivado", "Arquivado"),
        ("adquirido", "Adquirido"), ("early stage", "Early stage"),
        ("research preview", "Research preview"),
    ):
        if s.startswith(chave):
            return rot
    # "inativo" começa com "i", não colide com "ativo" — a ordem acima já resolve
    return "A verificar"


itens = []
for r in dados:
    nome = (r[C_NOME] or "").strip()
    if not nome:
        continue
    itens.append(OrderedDict(
        nome=nome,
        cat=(r[C_CAT] or "").strip() or "A verificar",
        ent=n_entrega(r[C_ENT]), ent_txt=(r[C_ENT] or "").strip(),
        oss=n_oss(r[C_OSS]), oss_txt=(r[C_OSS] or "").strip(),
        lic=n_licenca(r[C_LIC]), lic_txt=(r[C_LIC] or "").strip(),
        emp=(r[C_EMP] or "").strip(),
        ori=n_origem(r[C_ORI]),
        sta=n_status(r[C_STA]), sta_txt=(r[C_STA] or "").strip(),
        cob=limpo(r[C_COB]),
        des=limpo(r[C_DES]),
        site=limpo(r[C_SITE]),
        fonte=(r[C_FONTE] or "").strip(),
    ))

print(f"{len(itens)} ferramentas")
for campo in ("cat", "ent", "oss", "lic", "ori", "sta"):
    print(" ", campo, dict(Counter(i[campo] for i in itens).most_common()))

# --------------------------------------------------------------------------- #
# CSV — o mesmo recorte, para quem quer levar embora                          #
# --------------------------------------------------------------------------- #

with io.open(SAIDA_CSV, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["Nome", "Categoria", "Entrega", "Entrega (original)", "Codigo aberto",
                "Codigo aberto (original)", "Licenca", "Licenca (original)",
                "Empresa/mantenedor", "Origem", "Status set/2026", "Status (original)",
                "Modelo de cobranca", "Destaques", "Site ou repositorio", "Fonte"])
    for i in itens:
        w.writerow([i["nome"], i["cat"], i["ent"], i["ent_txt"], i["oss"], i["oss_txt"],
                    i["lic"], i["lic_txt"], i["emp"], i["ori"], i["sta"], i["sta_txt"],
                    i["cob"], i["des"], i["site"], i["fonte"]])

# --------------------------------------------------------------------------- #
# tbody — todas as 124 linhas no HTML, não montadas por JS                    #
# O JS só filtra e ordena o que já está indexável.                            #
# --------------------------------------------------------------------------- #

e = html.escape


def celula(rotulo, valor, classe=""):
    cl = f' class="{classe}"' if classe else ""
    return f'<td{cl} data-r="{rotulo}">{valor}</td>'


CHAVE_STA = {"Ativo": "ok", "Early stage": "aviso", "Research preview": "aviso",
             "Adquirido": "aviso", "Arquivado": "fim", "Inativo": "fim",
             "A verificar": "vazio"}
CHAVE_OSS = {"Sim": "ok", "Open core": "aviso", "Não": "neutro", "A verificar": "vazio"}

linhas = []
for n, i in enumerate(itens):
    idr = re.sub(r"[^a-z0-9]+", "-", i["nome"].lower()).strip("-") or f"gw-{n}"
    busca = " ".join([i["nome"], i["emp"], i["des"], i["cat"], i["cob"]]).lower()
    nome_html = e(i["nome"])
    if i["site"]:
        nome_html = (f'<a href="{e(i["site"])}" target="_blank" rel="noopener nofollow">'
                     f'{nome_html}</a>')
    attrs = (f'data-cat="{e(i["cat"])}" data-ent="{e(i["ent"])}" data-oss="{e(i["oss"])}" '
             f'data-lic="{e(i["lic"])}" data-ori="{e(i["ori"])}" data-sta="{e(i["sta"])}" '
             f'data-busca="{e(busca)}" data-nome="{e(i["nome"].lower())}"')
    linhas.append(
        f'<tr class="cmp-row" id="gw-{idr}" {attrs}>'
        f'<th scope="row" data-r="Ferramenta"><button type="button" class="cmp-exp" '
        f'aria-expanded="false" aria-controls="det-{idr}"><span aria-hidden="true">+</span>'
        f'<span class="sr-only">Detalhes de {e(i["nome"])}</span></button>'
        f'<span class="cmp-nome">{nome_html}</span>'
        f'<span class="cmp-emp">{e(i["emp"])}</span></th>'
        + celula("Categoria", f'<span class="cmp-tag">{e(i["cat"])}</span>')
        + celula("Entrega", e(i["ent_txt"] or i["ent"]))
        + celula("Código aberto",
                 f'<span class="cmp-mark m-{CHAVE_OSS[i["oss"]]}">{e(i["oss_txt"] or i["oss"])}</span>')
        + celula("Licença", e(i["lic_txt"] or i["lic"]))
        + celula("Origem", e(i["ori"]))
        + celula("Status",
                 f'<span class="cmp-mark m-{CHAVE_STA[i["sta"]]}">{e(i["sta_txt"] or i["sta"])}</span>')
        + "</tr>"
        + f'<tr class="cmp-det" id="det-{idr}" hidden><td colspan="7"><dl>'
        + (f'<dt>Destaques</dt><dd>{e(i["des"])}</dd>' if i["des"] else '<dt>Destaques</dt><dd class="cmp-vazio">sem nota de destaque</dd>')
        + (f'<dt>Modelo de cobrança</dt><dd>{e(i["cob"])}</dd>' if i["cob"] else
           '<dt>Modelo de cobrança</dt><dd class="cmp-vazio">não informado</dd>')
        + (f'<dt>Site ou repositório</dt><dd><a href="{e(i["site"])}" target="_blank" '
           f'rel="noopener nofollow">{e(i["site"])}</a></dd>' if i["site"] else "")
        + (f'<dt>Fonte do mapeamento</dt><dd>{e(i["fonte"])}</dd>' if i["fonte"] else "")
        + "</dl></td></tr>"
    )

tbody = "\n".join("            " + l for l in linhas)

# --------------------------------------------------------------------------- #
# Os seis selects, com contagem — a contagem é o que evita filtro que zera     #
# --------------------------------------------------------------------------- #

FACETS = [
    ("cat", "Categoria", "Todas as categorias"),
    ("ent", "Entrega", "Qualquer entrega"),
    ("oss", "Código aberto", "Aberto ou fechado"),
    ("lic", "Licença", "Qualquer licença"),
    ("ori", "Origem", "Qualquer origem"),
    ("sta", "Status", "Qualquer status"),
]
ORDEM = {
    "ent": ["Self-hosted", "SaaS", "Híbrido", "A verificar"],
    "oss": ["Sim", "Open core", "Não", "A verificar"],
    "sta": ["Ativo", "Early stage", "Research preview", "Adquirido", "Arquivado",
            "Inativo", "A verificar"],
}
partes = []
for campo, rotulo, vazio in FACETS:
    cont = Counter(i[campo] for i in itens)
    if campo in ORDEM:
        chaves = [c for c in ORDEM[campo] if c in cont]
    else:
        chaves = [c for c, _ in cont.most_common()]
    ops = "".join(f'<option value="{e(c)}">{e(c)} ({cont[c]})</option>' for c in chaves)
    partes.append(
        f'<label class="cmp-f"><span>{e(rotulo)}</span>'
        f'<select data-campo="{campo}"><option value="">{e(vazio)}</option>{ops}</select></label>'
    )
selects = "\n".join("        " + l for l in partes)

# --------------------------------------------------------------------------- #
# A página: o molde mais as duas peças geradas                                #
# --------------------------------------------------------------------------- #

pagina = io.open(MOLDE, encoding="utf-8").read()
assert "__TBODY__" in pagina and "__SELECTS__" in pagina, "o molde perdeu os marcadores"
pagina = pagina.replace("__SELECTS__", selects).replace("__TBODY__", tbody)
io.open(SAIDA_PAGINA, "w", encoding="utf-8", newline="\n").write(pagina)
print("ok: CSV e ai-gateway/comparativo/index.html regravados")
