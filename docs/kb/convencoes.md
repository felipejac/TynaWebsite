---
titulo: Convenções da base de conhecimento
id: convencoes
tipo: operacao
tags: [meta, site]
resumo: As dez regras de escrita desta base, e o motivo de cada uma em termos de recuperação por busca semântica.
atualizado: 2026-08-14
confianca: alta
---

# Convenções da base de conhecimento

Esta base existe para ser **recuperada por máquina** antes de ser lida por gente.
Um sistema de RAG não lê o arquivo inteiro: ele quebra o texto em pedaços de algumas
centenas de palavras, transforma cada pedaço em vetor e devolve os três ou cinco mais
próximos da pergunta. Quem escreve para esse consumidor escreve diferente.

Toda regra abaixo existe por causa dessa mecânica. Nenhuma é estética.

## 1. Uma nota, um fato recuperável

Se a nota responde a duas perguntas independentes, são duas notas. Uma nota que
mistura "o que é ISO 42001" com "quanto custa um projeto de ISO 42001" vai ser
recuperada pela metade em qualquer uma das duas buscas, e a metade errada vem junto
ocupando espaço no contexto.

O teste: **consigo escrever um título que seja uma pergunta única?** Se preciso de
"e" no título, provavelmente são duas notas.

## 2. A resposta curta vem primeiro

Todo arquivo abre com um bloco `## Resposta curta` de 40 a 80 palavras que responde
sozinho, sem depender de nada abaixo dele.

Isso não é resumo executivo por gentileza. É que o primeiro trecho é o que tem maior
chance de ser recuperado, e frequentemente é o *único* recuperado. Se ele for
introdução — "neste documento vamos abordar" — o sistema recupera uma promessa em vez
de uma resposta.

## 3. Autossuficiência: nenhum pedaço depende de outro

Proibido dentro do corpo: "como vimos acima", "esse cliente", "conforme a tabela
anterior", "isso". Um trecho chega ao modelo sem os vizinhos. "Esse cliente" vira uma
referência a ninguém.

Escreva **Hering**, não "o cliente do varejo". Escreva **ISO/IEC 42001**, não "a
norma". A repetição que soa redundante para um leitor humano é exatamente o que torna
o pedaço recuperável isoladamente.

## 4. Frontmatter obrigatório, vocabulário fechado

Todo arquivo carrega o cabeçalho YAML. Os campos não são decoração: são o que permite
filtrar antes de buscar — recuperar só entre `tipo: case`, só o que tem
`confianca: alta`, só o que serve ao `publico: juridico`.

| Campo | Obrigatório | Valores |
| --- | --- | --- |
| `titulo` | sim | texto livre |
| `id` | sim | minúsculas com hífens; é o alvo dos links, e **deve ser igual ao nome do arquivo** |
| `tipo` | sim | `conceito` · `servico` · `case` · `concorrente` · `posicionamento` · `mercado` · `operacao` · `decisao` |
| `tags` | sim | do vocabulário em [[00-INDICE]]; não invente sinônimo |
| `resumo` | sim | uma frase autossuficiente |
| `publico` | quando aplicável | `c-level` · `ti` · `juridico` · `compliance` · `interno` |
| `fonte` | quando há número | URL ou nome da publicação **com data** |
| `atualizado` | sim | AAAA-MM-DD, data absoluta sempre |
| `confianca` | sim | `alta` · `media` · `estimativa` |

## 5. Cabeçalho a cada 150–300 palavras

Os trechos são cortados preferencialmente nas fronteiras de cabeçalho. Parágrafo
gigante sem `##` vira trecho cortado no meio de um raciocínio.

Cabeçalho descritivo, não genérico: `## Prazo para quem já tem ISO 27001` recupera
bem; `## Detalhes` não recupera nunca.

## 6. Todo número anda com fonte e data

Nunca `123x de ROAS`. Sempre `123x de ROAS (fonte: case Hering, publicado por
omni.chat)`. Um número sem procedência é um passivo: quando alguém perguntar de onde
veio, seis meses depois, ninguém vai saber — e é exatamente esse número que acaba
indo parar num slide de proposta.

## 7. Confiança declarada, sem maquiagem

O campo `confianca` separa o que a Tyna sustenta em público do que é leitura de
mercado:

- **alta** — publicado no site da Tyna ou com fonte nomeada e verificável
- **media** — referência de mercado, praticada mas não auditada pela Tyna
- **estimativa** — inferência interna; **não usar em material de venda**

Misturar os três níveis sem marcação é como a base começa a mentir sem ninguém
perceber.

## 8. Link com generosidade

Todo conceito citado vira link de colchete duplo. Isso constrói o grafo que o Obsidian desenha e
que uma recuperação por travessia percorre: achou [[shadow-ai]], puxa junto
[[ai-gateway]] porque a nota aponta para lá.

Link para nota que ainda não existe é legítimo — marca o que falta escrever, e o
Obsidian mostra esses links como pendentes.

## 9. Vocabulário controlado

O mesmo conceito com o mesmo nome, sempre. `shadow AI` — nunca "IA sombra", "IA
paralela" ou "uso não autorizado". Sinônimo espalhado fragmenta o espaço vetorial:
metade das notas fica perto de um termo, metade de outro, e nenhuma busca acha o
conjunto.

Sinônimos reais que o cliente usa entram **de propósito** no campo `tags` ou numa
linha "também chamado de", concentrados em um lugar só.

## 10. Um lar canônico por fato

O fato mora em um arquivo. Os outros linkam. Copiar e colar entre notas produz duas
verdades que divergem na primeira atualização — e a busca vai devolver justamente a
desatualizada metade das vezes.

## O que não entra aqui

Não duplique o que o repositório já conta sozinho: estrutura de pastas, histórico do
git, o que está no código. A base guarda o que **não é derivável** — decisão e o
porquê dela, número com fonte, leitura de mercado, posicionamento.
