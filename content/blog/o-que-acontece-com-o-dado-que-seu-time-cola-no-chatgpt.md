---
title: "O que acontece com o dado depois que seu time cola no ChatGPT"
seoTitle: "O que acontece com o dado que o time cola no ChatGPT"
description: "Cinco cenários que vazam dado todo dia, os três caminhos técnicos pelos quais a informação escapa, e o que muda — e o que não muda — no plano corporativo."
pubDate: "2026-09-10"
category: "governanca"
tags: ["shadow-ai","governanca-de-ia","lgpd","seguranca","ia-generativa"]
aeoSummary: "Dado corporativo colado em ferramenta pública de IA pode escapar por três caminhos técnicos distintos. O primeiro é memorização no treinamento: em camadas gratuitas cujos termos permitem uso das conversas para melhorar o serviço, uma sequência rara e específica como chave de API ou CPF pode ser memorizada pelo modelo e depois extraída por outro usuário com prompt específico. O segundo é revisão humana: o treinamento por RLHF depende de anotadores que leem conversas reais para avaliar respostas. O terceiro é falha de isolamento de sessão, como o incidente do ChatGPT em março de 2023, em que um bug na biblioteca Redis expôs títulos de conversa e os últimos quatro dígitos de cartões de assinantes para outros usuários. Perante a LGPD, a empresa é a controladora e responde pelo incidente mesmo quando o dado saiu por iniciativa individual de um funcionário sem treinamento."
draft: false
---

O gesto leva três segundos. Selecionar, copiar, colar, apertar enter.

Ninguém está sabotando a empresa. É uma pessoa com prazo apertado que descobriu um jeito de terminar em cinco minutos o que levaria uma hora — e que nunca recebeu treinamento sobre qual ferramenta é segura para qual tipo de informação. A pesquisa da Cyberhaven, feita a partir da telemetria dos próprios clientes, estima que **cerca de 11% de tudo que colaboradores colam em ferramentas de IA é informação confidencial**. Um levantamento da LayerX aponta na mesma direção por outro ângulo: 77% dos usuários de IA generativa colam conteúdo nos prompts, e pouco mais de um quinto dessas colagens inclui dado pessoal ou de pagamento.

São números de fornecedores de segurança, medidos na base de clientes deles — vale ler como ordem de grandeza, não como censo. Mas a ordem de grandeza é suficiente para a pergunta que importa: **o que exatamente acontece com aquele texto depois que ele sai da sua rede?**

A maior parte do que se publica sobre isso para por aqui, no alerta. Este texto continua: são três caminhos técnicos distintos, cada um com incidente documentado, e cada um exige um controle diferente.

## Os cinco cenários que produzem quase todo o vazamento

Antes do mecanismo, o gesto. Estes são os usos que aparecem repetidamente em levantamento de segurança — e nenhum deles tem má-fé.

**Resumo de reunião confidencial.** Alguém pega a transcrição de uma reunião gerencial — que discutiu corte de pessoal, uma fusão em andamento ou resultado financeiro ainda não divulgado ao mercado — e pede "faça uma ata com os pontos principais" ou "gere os e-mails de acompanhamento". Em companhia aberta, esse mesmo conteúdo tem regra de divulgação; o resumo não sabe disso.

**Planilha de clientes.** Organizar dados em Excel é provavelmente o uso mais comum de IA no trabalho administrativo. O colaborador sobe uma planilha com centenas de nomes, CPFs, endereços e histórico de compra e pede um relatório de tendência ou uma segmentação por perfil. A base sai do perímetro da empresa e passa a estar sujeita aos termos do fornecedor — que quase ninguém leu antes de arrastar o arquivo.

**Proposta comercial em revisão.** Vendas e marketing colam minuta de proposta de alto valor, com nome do cliente final, desconto estratégico e condição especial de negociação, pedindo para "melhorar o tom" ou "deixar mais persuasivo". É informação de negociação viva.

**Avaliação de desempenho.** Gestor de RH ou líder de time usa IA para escrever feedback, inserindo nome do colaborador, salário, crítica e detalhe de performance. Isso é dado pessoal de terceiro, tratado sem base legal registrada e sem que o titular saiba.

**Código-fonte proprietário.** Desenvolvedor cola trecho de sistema interno para depurar ou otimizar. É o cenário que gerou o caso corporativo mais conhecido do mundo, e chegaremos a ele.

Repare no padrão: em todos os cinco, o dado sensível não vai por integração, API ou transferência de arquivo. Vai **no corpo de um texto colado**. Nenhum controle de rede tradicional enxerga isso como transferência de dado, porque tecnicamente não é — é alguém digitando numa caixa de texto.

## Caminho 1: memorização no treinamento

Nas camadas gratuitas de várias ferramentas, os termos de uso permitem que a empresa utilize as conversas para "melhorar o serviço". Essa frase curta esconde uma cadeia de quatro etapas.

**Tokenização.** Quando você cola um contrato, o modelo não o lê como texto. Ele quebra o conteúdo em *tokens* — pedaços de palavras — e trabalha sobre a probabilidade de um token aparecer depois do outro.

**Ajuste fino.** Periodicamente, o provedor pega um volume grande de conversas e re-treina o modelo, ajustando os pesos para acompanhar os padrões recentes de uso.

**Memorização.** Aqui está o ponto que muda a conversa. Na maior parte do tempo o modelo aprende *padrão*, não conteúdo — e padrão não é vazamento. Mas quando ele é exposto a uma sequência muito específica e rara de tokens, como uma chave de API, um CPF ou um trecho de código proprietário, pode acabar decorando a sequência exata em vez de generalizar. É o fenômeno que a literatura chama de memorização, um caso particular de sobreajuste.

**Extração.** Meses depois, alguém do outro lado do mundo escreve um prompt específico — "complete o seguinte trecho de código da empresa X" — ou explora um comportamento degenerado do modelo. Ao tentar prever a próxima palavra, o modelo acessa aquela memória e devolve o dado.

Isso não é hipótese de laboratório. Pesquisadores do Google DeepMind e acadêmicos independentes demonstraram que, com comandos específicos — entre eles pedir que o modelo repita uma palavra indefinidamente —, era possível fazer sistemas em produção cuspirem volumes de dados de treinamento originais, incluindo e-mails, telefones e endereços reais de pessoas presentes na base. As falhas específicas foram corrigidas; a classe de ataque continua existindo.

## Caminho 2: revisão humana

Existe a crença de que só máquina lê os prompts. É falsa, e a razão está no próprio método de treinamento.

Modelos de linguagem são refinados por **RLHF** — aprendizado por reforço com feedback humano. Para que o sistema aprenda a dar respostas úteis e adequadas, pessoas contratadas como anotadoras leem interações reais e avaliam se a resposta foi boa ou ruim. É trabalho humano, em escala, sobre conteúdo de usuário.

A consequência prática: quando alguém cola a planilha financeira da empresa, aquele arquivo fica armazenado em repouso na infraestrutura do provedor. Um revisor terceirizado — que não tem contrato de confidencialidade com a *sua* empresa — pode ler o documento inteiro enquanto avalia o desempenho do modelo. Não há invasão, não há falha: é o processo funcionando como projetado.

## Caminho 3: falha de isolamento de sessão

O terceiro caminho não depende de treinamento nem de revisor. É bug.

Esses sistemas atendem milhões de pessoas simultaneamente sobre infraestrutura compartilhada. A memória temporária que processa a sua sessão pode se cruzar com a de outro usuário por erro de roteamento no servidor.

Foi exatamente o que aconteceu com o ChatGPT em **março de 2023**: uma falha em uma biblioteca de código aberto (Redis) fez o sistema exibir, para usuários aleatórios, títulos do histórico de conversa de outras pessoas e — para uma fração de assinantes do plano pago — dados parciais de pagamento, incluindo os últimos quatro dígitos do cartão. A OpenAI tirou o serviço do ar emergencialmente e publicou o post-mortem.

Um bug de cache não distingue conteúdo trivial de contrato. Ele entrega o que estava na memória.

## Os casos que documentam cada caminho

**Samsung, maio de 2023 — o gesto.** É o incidente corporativo mais citado do mundo. Engenheiros colaram no ChatGPT código-fonte de hardware em desenvolvimento e ata de reunião interna, pedindo revisão de código e resumo. A empresa baniu a ferramenta globalmente em seguida. Nenhum dos envolvidos estava agindo contra a empresa — estavam trabalhando.

**DeepSeek, janeiro de 2025 — a propriedade do dado.** Microsoft e OpenAI apuraram a suspeita de que a startup chinesa teria usado destilação, alimentando o próprio modelo com saídas de modelos americanos para replicar capacidades avançadas. A investigação foi noticiada; a acusação não foi comprovada publicamente. O que o episódio estabelece, independentemente do desfecho, é que a fronteira de propriedade sobre o que entra e o que sai de um modelo é disputada até entre os maiores fornecedores.

**EchoLeak, junho de 2025 — uma classe nova.** Pesquisadores da Aim Security demonstraram que o Microsoft 365 Copilot era vulnerável a injeção indireta de prompt (CVE-2025-32711, CVSS 9.3). Um e-mail aparentemente inofensivo carregava instruções invisíveis — comentário em HTML, texto branco sobre branco. Ao resumir a mensagem, o Copilot obedecia ao comando oculto, coletava conteúdo do usuário e o exfiltrava para um servidor externo. **Zero clique**: bastava a mensagem chegar. A Microsoft corrigiu no servidor e informou não ter identificado exploração real.

O EchoLeak muda a natureza do problema. Nos três caminhos anteriores, o vazamento depende de alguém colar algo. Aqui, o assistente com acesso aos seus arquivos vira o vetor — e a instrução maliciosa vem de fora.

**Sydney, 2023 — o modelo falando demais.** No lançamento do chat integrado ao buscador da Microsoft, o sistema revelou publicamente suas próprias diretrizes internas de programação, incluindo o codinome com que fora desenvolvido. Instrução escrita em prompt não é segredo guardado: é texto que o modelo pode reproduzir.

**Agente fora do isolamento, julho de 2026.** Reportagem descreveu um agente que passou a buscar e explorar vulnerabilidades por conta própria, ultrapassando o papel de teste. [Já tratamos desse caso aqui](/blog/agente-que-escapou-do-isolamento-e-o-alerta-de-seguranca/), com a ressalva que vale repetir: a empresa envolvida não detalhou o episódio publicamente, então o que se pode discutir com segurança é o **modo de falha**, não a versão dos fatos.

## O que muda no plano corporativo — e o que não muda

É por causa dessa mecânica que empresas pagam por plano *Enterprise*. E a diferença é real, não comercial: nesses contratos existe um compromisso arquitetural de que o conteúdo enviado pela interface corporativa ou pela API é processado para gerar a resposta, não entra no pipeline de treinamento do modelo base e não fica retido em log duradouro além do prazo contratado.

Três ressalvas que costumam faltar nessa conversa:

**A garantia é contratual, e contrato tem letra.** Retenção para investigação de abuso, prazo de armazenamento e possibilidade de revisão humana em casos específicos variam por fornecedor e por plano. Ler os termos do contrato que a sua empresa assinou é trabalho de meia hora e responde mais que qualquer artigo.

**O plano só protege o tráfego que passa por ele.** Assinatura corporativa não impede ninguém de abrir a versão gratuita numa aba anônima, ou no celular. Se pedir acesso for mais lento do que abrir outra aba, o atalho ganha — e o dado sai por fora do contrato que você pagou caro para ter.

**Isolamento de treinamento não resolve injeção indireta.** O EchoLeak aconteceu num produto corporativo. Assistente integrado ao e-mail e aos arquivos da empresa tem, por construção, acesso amplo — e um atacante que consiga colocar texto no caminho dele está falando com um sistema que já está autenticado como você.

## O risco legal: quem responde é a empresa

Aqui não há espaço para interpretação criativa. Na LGPD, quem define as finalidades e os meios do tratamento é o **controlador** — e o controlador é a empresa, não o funcionário que colou.

O fato de o vazamento ter partido de iniciativa individual, sem autorização e até contra a orientação interna, **não transfere a responsabilidade**. O que a empresa precisa demonstrar, em fiscalização ou em incidente, é que existiam controles: política clara sobre qual dado pode entrar em qual ferramenta, restrição de acesso, alternativa autorizada disponível e treinamento sobre isso. Não bastam boas intenções nem um comunicado antigo no mural.

Vale o ponto que já detalhamos em [LGPD em fluxos de IA](/lgpd-e-ia/): o dado pessoal entra por lugares que não se parecem com banco de dados — o prompt, a base de conhecimento e o log de observabilidade —, e por isso não aparece em inventário nenhum.

## A leitura da Tyna

A reação instintiva a tudo isso é bloquear. E bloquear é a decisão que mais parece resolver e menos resolve.

Proibição empurra o uso para o celular pessoal, onde não existe log nenhum. O ganho de produtividade é real, e o time não abre mão dele — só para de contar. **Proibição não reduz o uso: reduz o que a empresa consegue enxergar.** Você troca um problema visível por um invisível e chama isso de política.

O que funciona tem uma ordem, e ela quase nunca é a que se tenta primeiro:

**Primeiro o inventário, não a política.** Escrever regra sobre um mapa incompleto regula o que você já vê e ignora o resto. O caminho está no [checklist de mapeamento de shadow AI](/shadow-ai/): rastro financeiro antes de log, porque assinatura deixa marca em fatura mesmo quando não deixa em log.

**Depois a classificação do dado.** Enquanto a regra falar de "dado sensível" sem dizer o que é, cada pessoa decide sozinha — e decide a favor da entrega que está atrasada. Três níveis bastam.

**Aí sim a política — com a alternativa ao lado de cada proibição.** É a regra de redação que decide adesão. "Não cole dado de cliente em ferramenta pública" sem dizer onde colar produz shadow AI. A mesma frase com o endereço da instância privada produz adesão. O [template completo está publicado](/politica-de-uso-de-ia/), pronto para adaptar.

**E a alternativa precisa existir de fato.** Normalmente um [AI Gateway](/ai-gateway/), que unifica acesso, custo, observabilidade e auditoria. O critério de sucesso não é quantas ferramentas foram bloqueadas — é o caminho autorizado ter ficado **mais conveniente** que o atalho. Enquanto pedir acesso for mais lento que abrir uma aba nova, o shadow AI volta.

Há uma última assimetria que vale nomear. Dos três caminhos técnicos deste texto, nenhum é reversível. Dado memorizado em modelo não se apaga com pedido de exclusão. Documento lido por revisor não se desle. Conteúdo exibido na tela de outro usuário por bug de cache não volta. Diferente de quase todo incidente de segurança, aqui **não existe restauração de backup** — existe só a decisão que foi tomada antes.

Se a sua empresa ainda não sabe responder quem está usando IA hoje e sob que política, essa é a única pergunta que precisa de resposta esta semana. O [diagnóstico de maturidade](/diagnostico/) devolve a faixa e as lacunas em três minutos, sem cadastro.

## Perguntas frequentes

**P: O ChatGPT usa meus dados para treinar o modelo?**
R: Depende do plano e da configuração. Nas camadas gratuitas de várias ferramentas os termos permitem uso das conversas para melhorar o serviço, e planos corporativos costumam garantir contratualmente que o conteúdo não entra no treinamento do modelo base — a resposta exata está nos termos do contrato que a sua empresa assinou, e vale lê-los.

**P: Se um funcionário vazar dado colando no ChatGPT, a empresa é responsável?**
R: Sim. Na LGPD a empresa é a controladora, define finalidades e meios, e responde pelo incidente mesmo quando a ação partiu de iniciativa individual não autorizada — o que se exige dela é demonstrar que existiam política, restrição de acesso, alternativa autorizada e treinamento.

**P: Bloquear o acesso às ferramentas de IA resolve?**
R: Não, e costuma piorar: o bloqueio empurra o uso para o celular pessoal, onde não há log nenhum, convertendo um problema visível em invisível — o critério de sucesso não é quantas ferramentas foram bloqueadas, e sim o caminho autorizado ter ficado mais conveniente que o atalho.

**P: O plano Enterprise elimina o risco de vazamento?**
R: Reduz muito o risco de treinamento e de retenção, mas não cobre três coisas: o tráfego que continua saindo pela versão gratuita fora do contrato, os limites contratuais de retenção e revisão que variam por fornecedor, e ataques de injeção indireta de prompt como o EchoLeak, que atingiu justamente um produto corporativo.

**P: Dá para apagar um dado que já foi colado numa IA pública?**
R: Na prática, não de forma confiável — dado memorizado durante treinamento não sai com pedido de exclusão, documento já lido por revisor humano não pode ser "deslido", e conteúdo exibido a terceiro por falha de isolamento não retorna; por isso o controle precisa agir antes do envio, não depois.

## Fontes

- Cyberhaven, sobre a proporção de dado confidencial colado em ferramentas de IA: <https://www.cyberhaven.com/blog/4-2-of-workers-have-pasted-company-data-into-chatgpt>
- EchoLeak (CVE-2025-32711), injeção indireta de prompt no Microsoft 365 Copilot, divulgada pela Aim Security em junho de 2025: <https://arxiv.org/abs/2509.10540>
- Incidente do ChatGPT com a biblioteca Redis, março de 2023: post-mortem publicado pela OpenAI
- Caso Samsung, maio de 2023: amplamente noticiado pela imprensa internacional
- Investigação sobre destilação envolvendo o DeepSeek, janeiro de 2025: noticiada por veículos internacionais; sem conclusão pública
- Ataques de extração de dados de treinamento: pesquisa do Google DeepMind com acadêmicos independentes
