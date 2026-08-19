# Distribuição — páginas-pilar

Criado em 17/08/2026 e ampliado em 18/08/2026, junto com as páginas. Conteúdo sem
canal não conta: é a regra da seção 8 do [plano de crescimento](plano-de-crescimento.md),
e foi o que produziu 50 posts sem leitor. Este arquivo é o canal das seis páginas.

Páginas (as seis publicadas em 17 e 18/08/2026):

- https://tyna.com.br/shadow-ai/ — checklist de mapeamento em 12 passos
- https://tyna.com.br/pl-2338/ — status verificado do Marco Legal da IA
- https://tyna.com.br/ai-gateway/ — o que unifica, e quando não faz sentido
- https://tyna.com.br/governanca-de-agentes/ — quatro controles e dez perguntas
- https://tyna.com.br/politica-de-uso-de-ia/ — template inteiro, copiável
- https://tyna.com.br/lgpd-e-ia/ — as três portas do dado pessoal

**Postar no perfil pessoal do Felipe**, não em página de empresa. Perfil pessoal
tem alcance orgânico muito maior no LinkedIn, e a autoridade nos seis temas é
pessoal: quem já colocou agente em produção e quem foi conferir a tramitação na fonte.

---

## Post 1 — Shadow AI (o checklist)

Ângulo: dar a ferramenta inteira de graça. Ninguém publica o roteiro completo; todo
mundo publica o alerta e guarda o método para a proposta comercial. O checklist
aberto é o que faz a pessoa salvar o post e mandar para o time de TI.

> Pergunte ao seu diretor de TI quantas ferramentas de IA a empresa usa.
>
> Ele vai responder um número fechado: cinco, oito, doze. O ChatGPT corporativo, o
> Copilot, um assistente de vendas.
>
> Esse número está errado, e não é culpa dele. Inventário de software foi feito para
> encontrar software: instalação, licença, chamado. Uma ferramenta de IA em camada
> gratuita, aberta no navegador com login pessoal, não instala nada e não abre
> chamado nenhum.
>
> O erro mais comum no mapeamento é começar por TI. O time entrega o que os sistemas
> dele enxergam — e o que os sistemas dele enxergam é a menor parte.
>
> Comece pelo financeiro.
>
> Fatura de cartão corporativo dos últimos 12 meses, cobrança recorrente em dólar
> abaixo de US$ 100. Assinatura deixa rastro em fatura mesmo quando não deixa rastro
> em log. É a fonte mais rápida e a menos usada.
>
> Depois vêm os logs de DNS, os apps de terceiros autorizados no "entrar com Google"
> e as chaves de API vivas em repositório.
>
> E aí vem a parte que decide se o resto funciona: perguntar para as pessoas. Só que
> isso exige uma anistia por escrito, assinada pela liderança, antes da primeira
> pergunta. Mapeamento que vira caça às bruxas rende uma rodada de respostas e nunca
> mais.
>
> Publiquei o checklist inteiro, os 12 passos, na ordem em que funcionam. É o mesmo
> que uso em projeto. Copia e roda: tyna.com.br/shadow-ai/
>
> Um aviso sobre o final: bloquear não resolve. Empurra o uso para o celular
> pessoal, onde não há log nenhum. O critério de sucesso não é quantas ferramentas
> foram bloqueadas — é o caminho autorizado ter ficado mais conveniente que o atalho.

**Comentário para o próprio post** (o primeiro comentário puxa alcance):

> O passo 12 é o que costuma destravar orçamento: somar o gasto total com IA. O
> mapeamento quase nunca é aprovado pelo argumento de risco. É aprovado quando
> alguém pergunta quanto a empresa gasta e ninguém consegue responder.

---

## Post 2 — PL 2338 (o status honesto)

Ângulo: corrigir desinformação com fonte, sem alarmismo. Muito material em
circulação dá a entender que o Marco Legal já vigora — inclusive material de
consultoria. Dizer "não é lei, e aqui está o link para conferir" é o oposto do que o
segmento faz, e é o que gera confiança.

> Vi mais uma apresentação essa semana dizendo que a empresa precisa se adequar ao
> Marco Legal da IA "que entrou em vigor".
>
> Não entrou. O PL 2338/2023 não é lei, e nenhum artigo dele vigora hoje.
>
> Onde ele está, com data:
>
> Aprovado no Plenário do Senado em 10/12/2024, na forma do substitutivo do relator
> Eduardo Gomes. Na Câmara dos Deputados desde 17/03/2025. Está em comissão especial,
> sob relatoria do deputado Aguinaldo Ribeiro, com situação registrada como
> "Aguardando Parecer". A votação chegou a ser prevista para o fim de 2025 e foi
> adiada. Não há data.
>
> Você não precisa acreditar em mim: a ficha de tramitação da Câmara é pública e leva
> dez segundos para conferir. Deixei o link direto na página.
>
> Agora a parte que importa, e que a discussão sobre a lei costuma atrapalhar:
>
> Esperar a votação para começar é o erro caro. Não porque a lei vem aí — porque
> quatro coisas já valem hoje, sem depender de uma linha do texto:
>
> 1. A LGPD está em vigor desde 2020, e prompt com dado pessoal é tratamento de dado
> pessoal.
> 2. Cláusula de IA em contrato e questionário de segurança em RFP chegaram antes do
> regulador. Quem não tem inventário responde "não sei" por escrito, para um cliente.
> 3. Quem tem operação ou cliente na União Europeia já responde ao AI Act.
> 4. Inventariar, classificar por risco e instrumentar auditoria leva meses. O prazo
> de adequação não começa no dia da sanção.
>
> Escrevi o status completo, com as duas fontes primárias e as seis frentes que
> nenhuma versão do texto vai dispensar: tyna.com.br/pl-2338/
>
> A página tem data de última conferência. Quando o projeto andar, ela muda.

---

## Post 3 — AI Gateway (o que ninguém diz)

Ângulo: publicar quando **não** contratar. Todo material sobre AI Gateway é de
fornecedor, e fornecedor nunca escreve a seção "quando isso não faz sentido". É o
post que dá credibilidade para os outros dois.

> Uma coisa que consultoria não costuma escrever: na maioria das empresas que me
> procuram falando em AI Gateway, o gateway não é o próximo passo.
>
> Os três casos em que ele atrapalha:
>
> 1. Uma ferramenta, um time, nenhum dado regulado. Pouca superfície, pouco risco.
> Gateway aqui é operação a mais para resolver problema que não existe.
>
> 2. Antes de existir mapeamento. Unificar o que ninguém inventariou só muda o lugar
> da desorganização — e é pior, porque o tráfego que continua fora some do relatório e
> vira sensação de cobertura.
>
> 3. Quando a liderança quer bloquear. Gateway que só nega é contornado pelo celular
> pessoal, onde não há log nenhum. O critério de sucesso não é quantas chamadas foram
> barradas: é quanto do tráfego real passou a acontecer dentro dele.
>
> Quando faz sentido, o teste é mais simples do que parece. Três perguntas:
>
> Quanto gastamos com IA neste trimestre, por área? Que dado saiu da empresa, para
> qual fornecedor? O que o agente leu e decidiu no atendimento número 4.312?
>
> Se as três já têm resposta confiável, o gateway resolve pouco. Se nenhuma tem, ele é
> o próximo passo — e o mais barato deles.
>
> Escrevi o guia inteiro, incluindo a comparação entre camada fina, produto de mercado
> e construção própria, e os quatro números que dizem se funcionou:
> tyna.com.br/ai-gateway/

---

## Post 4 — Governança de agentes (84,2%)

Ângulo: o número que contraria a expectativa vendida em reunião. Funciona porque é
caso real, com fonte, e porque a conclusão é contraintuitiva.

> 84,2% de assertividade.
>
> Esse é o número real de um agente de IA em produção que eu ajudei a colocar de pé:
> o cliente manda a foto do painel do carro pelo WhatsApp, o agente lê o alerta e
> responde na hora. Rodando em cinco marcas do grupo Stellantis. (fonte: blip.ai)
>
> 84,2% significa que **cerca de um em cada seis casos ele não resolve sozinho**.
>
> E o NPS do pós-venda é 86,8%.
>
> Os dois números convivem, e é isso que quase toda apresentação de IA erra. A
> satisfação não veio de o agente nunca errar. Veio de existir um caminho para a
> pessoa — com critério claro de quando acionar e com o contexto inteiro chegando
> junto, sem o cliente repetir nada.
>
> Por isso a pergunta certa numa reunião de aprovação não é "qual a taxa de acerto".
>
> É: o que acontece nos casos que ele não resolve, e quem descobre primeiro — nós ou
> o cliente?
>
> Publiquei os quatro controles que sustentam isso (escopo de autonomia, guardrail em
> execução, escalonamento e trilha de auditoria) e um roteiro de dez perguntas para
> usar antes de qualquer agente ir ao ar: tyna.com.br/governanca-de-agentes/

---

## Post 5 — Política de uso de IA (o template aberto)

Ângulo: entregar o documento inteiro, de graça, sem formulário. É o oposto do padrão
da categoria, onde template é isca de captura de e-mail. Quem copia leva pronto; quem
precisa adaptar à própria operação é exatamente o lead que interessa.

> A política de IA da sua empresa provavelmente não está sendo seguida. E o motivo
> cabe em uma frase.
>
> Ela proíbe sem dizer o que fazer no lugar.
>
> "Não cole dado de cliente em ferramenta pública." Ok. E aí? A pessoa tem uma entrega
> para hoje e um caso real na mão. Sem alternativa no mesmo parágrafo, a regra não
> reduz o uso — reduz só o que a empresa consegue enxergar. É assim que shadow AI nasce
> dentro de empresa que tem política.
>
> A regra de redação que muda isso: nenhuma linha proíbe algo sem apontar o caminho
> autorizado ali mesmo. Se não existir alternativa possível, a proibição precisa
> explicar por quê — senão é ignorada, e leva as outras junto.
>
> As outras três causas, na ordem em que aparecem:
>
> Documento longo demais (vinte páginas não são lidas às três da tarde). Ausência de
> prazo de resposta a exceção (quem tem prazo de projeto não espera duas semanas por
> autorização). E template copiado sem adaptação — exemplo genérico é reconhecido na
> primeira leitura, e política que parece genérica não é levada a sério.
>
> Publiquei o template inteiro que uso em projeto. Sem formulário, sem e-mail: está na
> página, dá para copiar e colar. Sete seções, classificação de dado em três níveis, e
> as três substituições obrigatórias antes de publicar.
>
> tyna.com.br/politica-de-uso-de-ia/

---

## Post 6 — LGPD em fluxos de IA (as três portas)

Ângulo: específico e técnico o suficiente para quem é da área reconhecer que o autor
opera de verdade. As três portas não aparecem em material genérico de LGPD.

> Onde o dado pessoal entra num fluxo de IA? Quase nunca pela porta que o inventário
> vigia.
>
> Três portas, e nenhuma se parece com banco de dados:
>
> **1. O prompt.** Alguém cola um caso real para pedir ajuda — e o caso real tem nome,
> CPF e histórico. O tratamento acontece no instante em que o texto sai do perímetro,
> sem passar por processo nenhum.
>
> **2. A base de conhecimento.** Um RAG montado sobre a pasta compartilhada indexa
> tudo que está nela. E aqui está a parte que costuma passar batido: permissão de
> pasta não vira permissão de resposta sozinha. Dado que dependia de saber onde
> procurar passa a vir sozinho, para quem fizer a pergunta certa.
>
> **3. O log.** A observabilidade que o time montou para depurar o agente guarda a
> conversa inteira. Em semanas, virou um repositório de dado pessoal sem prazo de
> retenção, sem base legal declarada e às vezes em ferramenta de terceiro contratada
> pela engenharia.
>
> E tem um erro estrutural que aparece em quase todo projeto: base legal definida por
> sistema, quando ela é por finalidade. "Usamos IA no atendimento" não é finalidade —
> é lugar. Responder ao cliente é uma finalidade. Treinar modelo com aquele histórico
> é outra, com outra base. Análise interna é uma terceira.
>
> Nada disso depende do Marco Legal da IA, que segue parado na Câmara. A LGPD está em
> vigor desde 2020 e já alcança tudo isso.
>
> Escrevi o que fazer em cada porta, e as seis frentes na ordem que funciona:
> tyna.com.br/lgpd-e-ia/

---

## Ordem e ritmo

1. **Post do Shadow AI primeiro.** Tema perene, é ferramenta, e o pedido de salvar
   e compartilhar é natural. Serve de porta para o diagnóstico.
2. **Post do PL 2338 dois ou três dias depois.** Corrigir informação errada rende
   comentário e alcance, mas é o tipo de post que fica pior se vier logo em seguida
   de outro post técnico do mesmo autor.
3. **Os outros quatro, um por semana**, na ordem em que aparecem acima. Seis posts
   em seis dias queimam a lista; um por semana mantém presença sem cansar, e cada um
   tem cauda longa própria na busca. Se for para escolher só dois além dos primeiros:
   **política de uso** (maior intenção comercial) e **LGPD** (maior volume de busca).
4. **As mensagens diretas continuam sendo o que responde pela maior parte do
   resultado.** As duas páginas dão motivo para a mensagem — "escrevi o checklist
   que a gente usa, dá uma olhada e me diz se falta alguma frente" abre conversa
   melhor do que qualquer pitch.

## O que medir depois

- `checklist_copiado` no GA4 — evento novo, dispara quando alguém copia o checklist.
  É o sinal mais direto de que a página virou ferramenta, e não leitura.
- Sessões orgânicas nas duas URLs, no Search Console, a partir da terceira semana.
- Consultas com impressão e sem clique nas duas páginas: se aparecerem buscas por
  "pl 2338 é lei" sem clique, o título precisa dizer a resposta, não a pergunta.
