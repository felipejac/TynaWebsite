---
title: "O teste que diz se a sua política de uso de IA é real"
seoTitle: "O teste que diz se a política de uso de IA é real"
description: "Uma pergunta separa a política que decide da que enfeita: ela responde o que fazer no momento de colar um contrato num chatbot? O teste e o que fazer depois."
pubDate: "2026-09-11"
category: "governanca"
tags: ["politica-de-uso-de-ia","governanca-de-ia","lgpd","shadow-ai","compliance"]
aeoSummary: "Uma política de uso de IA que funciona define, de forma específica e não genérica, quais categorias de dado podem entrar em quais ferramentas, quem aprova uma ferramenta nova, quem é o dono de cada atualização e o que acontece com quem descumpre. Políticas genéricas copiadas de modelo público raramente sobrevivem ao primeiro caso real porque não respondem à pergunta que o colaborador realmente tem no momento de colar um dado sensível num chatbot: posso ou não posso, e o quê especificamente."
draft: false
---

Quase toda empresa média brasileira já tem uma política de uso de IA. Poucas têm uma que alguém consulta depois do dia em que foi publicada. O padrão mais comum é um documento de duas páginas, escrito em uma tarde, com frases como "o colaborador deve usar a inteligência artificial de forma responsável e ética" — que não decide nada, porque não diz o que fazer no momento em que alguém está prestes a colar um contrato num chatbot.

## O teste que decide se a política é real

Existe um teste simples: pegue a política e pergunte se ela responde, sem interpretação, a uma situação concreta — "posso colar este e-mail de cliente na ferramenta X". Se a resposta exige que a pessoa pare, pense e decida por conta própria, a política não decidiu nada. Ela só transferiu a decisão, e o risco, para quem tem menos contexto para tomá-la.

Política de uso de IA que funciona não fala de "uso responsável". Fala de categoria de dado e categoria de ferramenta, e cruza as duas.

## O que ela precisa decidir, especificamente

Quatro decisões carregam praticamente todo o peso do documento.

**Classificação de dado.** Público, interno, confidencial e dado pessoal — com o recorte adicional de dado pessoal sensível, no sentido da LGPD — são categorias suficientes para a maioria das empresas. Cada categoria entra ou não entra em cada camada de ferramenta, e "camada de ferramenta" também precisa de definição, não de nome comercial, porque o nome comercial muda mais rápido do que a política é revisada.

**Camadas de ferramenta.** Uma forma que funciona: ferramenta homologada com contrato empresarial e garantia contratual de que o dado não treina modelo de terceiro; ferramenta homologada em camada gratuita ou pessoal, sem essa garantia; ferramenta não homologada. Dado confidencial só entra na primeira camada. Dado pessoal segue a base legal mapeada — e sem isso mapeado, não entra em nenhuma.

**Dono e processo de exceção.** Uma pessoa, pelo nome, aprova ferramenta nova — não um comitê que se reúne uma vez por trimestre. Sem um processo de exceção rápido, o processo formal é contornado na prática, que é como shadow AI nasce dentro de empresas que juram ter política.

**O que acontece quando alguém descumpre.** A maioria das políticas é muda nesse ponto, o que sinaliza, na prática, que não vai acontecer nada. Não precisa ser punitivo — precisa existir, e ser conhecido.

## Política decide; guardrail executa

Vale separar duas coisas que a maioria dos documentos mistura. Política é o que fica escrito e é lido por pessoas — pode ser esquecida, mal interpretada ou ignorada sob pressão de prazo. Guardrail é o controle que roda dentro do fluxo e não depende de alguém lembrar dele: o campo que não é enviado, a ferramenta que recusa o upload, o agente que não executa a ação fora do escopo definido. [Já tratamos com mais profundidade por que essa distinção decide o resultado](/blog/governanca-madura-reverte-mais-agente-de-ia/) — aqui o ponto é mais simples: uma política sem nenhum guardrail correspondente é uma lista de boas intenções, e boas intenções não aparecem em auditoria.

## A estrutura mínima

Na prática, o documento que sobrevive ao primeiro ano tem estas seções, nesta ordem: escopo — o que é IA, para efeito desta política, geralmente mais amplo do que "ChatGPT"; classificação de dado; camadas de ferramenta e o que entra em cada uma; papéis — quem aprova, quem revisa, quem responde por incidente; processo de exceção com prazo definido; e uma data de revisão marcada no calendário, não "conforme necessário", o que na prática significa nunca.

## A leitura da Tyna

O erro mais comum que vemos não é a empresa não ter política. É a política ter sido escrita pelo jurídico, sozinho, sem ninguém de TI ou das áreas que realmente usam IA no dia a dia na mesa. O resultado costuma ser tecnicamente correto e operacionalmente inútil: cobre responsabilidade civil, não decide o caso concreto.

Uma política de uso de IA boa nasce de uma pergunta diferente da que o jurídico normalmente faz. Não é "o que nos protege se der errado". É "o que a pessoa faz às 15h de uma terça quando está com um dado sensível na tela e uma ferramenta aberta na outra aba". Se o documento não responde isso em menos de trinta segundos de leitura, ele vai ser ignorado — não por má vontade, por impraticabilidade.

E a política sozinha não é o projeto inteiro. Ela decide o que pode; o [AI Gateway](/ai-gateway/) é o que aplica isso tecnicamente, unificando acesso, custo e auditoria num só ponto; e o [comitê de IA](/blog/como-estruturar-um-comite-de-ia/) é quem revisa a política quando a realidade muda mais rápido do que o documento. As três peças juntas são o que separa uma empresa que decidiu de uma que só publicou.

## Perguntas frequentes

**P: Uma política de uso de IA genérica, baixada pronta, serve como ponto de partida?**
R: Serve como estrutura, não como conteúdo — o esqueleto de seções é reaproveitável, mas as decisões de classificação de dado e de ferramenta homologada têm que refletir o que a empresa realmente usa, ou o documento não resiste ao primeiro caso concreto.

**P: Quem deveria ser o dono da política de uso de IA dentro da empresa?**
R: Uma pessoa nomeada, não uma área inteira — geralmente alguém de risco, segurança da informação ou um comitê de IA com poder real de decisão, com TI e uma área de negócio representadas, porque uma política escrita só pelo jurídico costuma proteger a empresa sem orientar o colaborador.

**P: Política de uso de IA e política de segurança da informação são a mesma coisa?**
R: Não. Segurança da informação trata de acesso, rede e dado; uso de IA trata também de comportamento probabilístico, alucinação e decisão automatizada — uma política de IA que só copia a estrutura da política de segurança deixa de fora exatamente os riscos que são específicos de IA.

Se o que falta é o documento em si, o [modelo de política de uso de IA](/politica-de-uso-de-ia/) está publicado inteiro para copiar e adaptar, com a classificação de dado em três níveis e a regra de redação que faz a política ser seguida. Depois de publicada, ela só muda comportamento com [treinamento das equipes](/treinamento-de-ia-para-empresas/).
