// Biblioteca de Prompts — Tyna · valores do exemplo preenchido (campanha fictícia Serra Alta)
// Exemplo preenchido — uma campanha fictícia única atravessando os 29 casos.
// Marca: Serra Alta, café especial brasileiro. Mesma paleta e mesma lógica de luz
// em tudo, de propósito: é a consistência que a biblioteca prega, demonstrada.
const EXAMPLES = {
'KV-01':{SUJEITO:'um produtor de café segurando grãos na palma da mão',AMBIENTE:'um terreiro de secagem ao amanhecer',QUALIDADE_LUZ:'rasante e dourada',DIREÇÃO:'esquerda',COR_1:'verde-musgo',COR_2:'terracota queimada',LADO:'direito'},
'KV-02':{PRODUTO:'um pacote kraft de café Serra Alta',SUPERFÍCIE:'uma bancada de granito escuro',COR_FUNDO:'bege-areia'},
'KV-03':{PERFIL_PESSOA:'uma barista de trinta e poucos anos, avental de linho',PRODUTO:'um pacote de café Serra Alta',AMBIENTE:'uma cafeteria de bairro',PALETA:'verde-musgo, terracota e creme'},
'KV-04':{SUJEITO_DA_PEÇA:'um moedor manual de café sobre bancada de madeira',URL_OU_CÓDIGO:'1842739405'},
'FD-01':{CENA:'os utensílios de um ritual de café coado',PALETA:'verde-musgo, terracota e creme',COR:'creme'},
'FD-02':{MATERIAL:'grãos de café torrados',COR:'terracota queimada',TEXTO_DA_CITAÇÃO:'Café bom não tem pressa',COR_DO_TEXTO:'creme',ASSINATURA:'Serra Alta'},
'FD-03':{ELEMENTO_DO_CARD:'uma prensa francesa',ESTILO:'linha contínua',COR_1:'verde-musgo',COR_2:'terracota',COR_3:'creme',COR_FUNDO:'creme',CÓDIGO_DA_MARCA:'1842739405'},
'FD-04':{SÍMBOLO_DA_DATA:'o número 14 do Dia Nacional do Café',MATERIAL:'grãos de café',PALETA:'verde-musgo e creme'},
'ST-01':{CENA:'o vapor subindo de uma xícara sobre a bancada',QUALIDADE_LUZ:'suave de janela',PALETA:'creme e terracota'},
'ST-02':{PERFIL_PESSOA:'uma barista de cabelo preso',EXPRESSÃO:'concentrada e satisfeita',COR:'verde-musgo'},
'ST-03':{FORMA:'grãos de café estilizados',COR_1:'terracota',COR_2:'creme',ESTILO:'geométrico minimalista'},
'TH-01':{SUJEITO:'uma barista provando o café na colher',EXPRESSÃO:'de surpresa',COR_SATURADA:'terracota',TEXTO_CURTO:'ERREI A DOSE',COR_DO_TEXTO:'creme'},
'TH-02':{OBJETO_A:'uma prensa francesa',OBJETO_B:'um coador de pano',COR_1:'verde-musgo',COR_2:'terracota'},
'PR-01':{PRODUTO:'um pacote kraft de 250 g de café Serra Alta',COR:'branco'},
'PR-02':{PRODUTO:'um pacote de café Serra Alta',AMBIENTE:'uma cozinha de manhã cedo',PALETA:'creme, madeira clara e verde-musgo'},
'PR-03':{DETALHE_DO_PRODUTO:'a costura da borda do pacote kraft',MATERIAL:'papel kraft texturizado'},
'PR-04':{PRODUTO:'um pacote de café Serra Alta',COR:'verde-musgo',ELEMENTO_GRÁFICO:'grãos de café'},
'BN-01':{SUJEITO:'uma xícara de café fumegante',COR:'creme',QUALIDADE_LUZ:'suave e difusa',AMBIENTE:'uma bancada de madeira clara'},
'BN-02':{SUJEITO:'uma xícara de café vista de lado',FUNDO_CONTRASTANTE:'um campo terracota chapado'},
'RT-01':{PERFIL_PESSOA:'a fundadora da Serra Alta, cinquenta e poucos anos',COR:'verde-musgo',EXPRESSÃO:'serena e direta',ROUPA:'camisa de linho creme'},
'RT-02':{PERFIL_PESSOA:'um mestre de torra',LOCAL_DE_TRABALHO:'galpão de torrefação',ELEMENTOS_DO_OFÍCIO:'sacas de juta, torrador de tambor e provetas de amostra'},
'VD-01':{CENA_INICIAL:'O vapor sobe de uma xícara recém-servida',AMBIENTE:'um balcão de cafeteria',PERFIL_PESSOA:'uma barista de avental de linho',POSIÇÃO:'costas para o balcão',DETALHE_DISTINTIVO:'com um pano de prova no ombro',FONTE:'a janela lateral',CLIMA:'calmo e matinal',AÇÃO_1:'ela gira a xícara meia volta sobre o pires',AÇÃO_2:'olha para a câmera e sorri de canto',SOM_DIEGÉTICO:'Chiado da máquina de espresso ao fundo'},
'VD-02':{DESCRIÇÃO_DA_CENA_EM_PROSA:'Uma barista está atrás do balcão de uma cafeteria de bairro, com prateleiras de pacotes kraft ao fundo',PERFIL_PESSOA:'uma barista de avental de linho',PERSONAGEM:'Barista',FALA_DE_ATÉ_OITO_PALAVRAS:'Esse veio da fazenda do seu Antônio',LOCAL:'uma cafeteria movimentada'},
'VD-03':{PRODUTO:'um pacote kraft de café Serra Alta',FACE_A:'frente com o rótulo',FACE_B:'lateral com a data de torra',SUPERFÍCIE:'uma bancada de granito escuro'},
'VD-04':{PRODUTO:'um pacote kraft de café Serra Alta',SUPERFÍCIE:'uma bancada de granito escuro',AMBIENTE:'um estúdio de produto',COR:'bege-areia',PARTE_DO_PRODUTO:'a etiqueta de data de torra'},
'VD-05':{PERFIL_PESSOA:'a fundadora da Serra Alta',DESCRIÇÃO_VISUAL:'cinquenta e poucos anos, camisa de linho creme',AMBIENTE:'o galpão de torrefação',ELEMENTOS_AO_FUNDO:'sacas de juta empilhadas',CLIMA:'quente e confiante',PERSONAGEM:'Fundadora',FALA:'A gente compra de doze famílias, sempre as mesmas',LOCAL:'um galpão de torrefação'},
'VD-06':{ELEMENTO_GRÁFICO_DA_MARCA:'a montanha estilizada da Serra Alta',MATERIAL_OU_PARTÍCULA:'grãos de café em queda',COR:'creme'},
'VD-07':{AMBIENTE:'um terreiro de secagem de café',HORÁRIO:'o amanhecer',MOVIMENTO_SUTIL_DO_AMBIENTE:'a neblina se dissolve sobre os grãos espalhados',FONTE_NATURAL:'o sol baixo',QUALIDADE:'rasante e dourada',CLIMA:'silencioso',LOCAL:'uma fazenda de montanha'},
'VD-08':{CENA_A:'o terreiro de secagem ao ar livre',CENA_B:'o interior do galpão de torrefação',LUZ_A:'sol rasante dourado',LUZ_B:'penumbra quente de lâmpada'}
};

// Contrair preposição + artigo só na junção com um valor inserido.
// Sem isso, {AMBIENTE} = "o galpão" produz "em o galpão".
const CONTR = {
  de:  {o:'do',   a:'da',   os:'dos',   as:'das'},
  em:  {o:'no',   a:'na',   os:'nos',   as:'nas'},
  por: {o:'pelo', a:'pela', os:'pelos', as:'pelas'},
  a:   {o:'ao',   a:'à',    os:'aos',   as:'às'}
};
const MARK = '\u0001';

// substitui {VAR} e {VAR: dica} pelo valor do exemplo
function fill(text, id){
  const vals = EXAMPLES[id] || {};
  const out = text.replace(/\{([^}]+)\}/g, (m, inner) => {
    const key = inner.split(':')[0].trim();
    return Object.prototype.hasOwnProperty.call(vals, key) ? MARK + vals[key] : m;
  });
  return out
    .replace(new RegExp('\\b(de|em|por|a) ' + MARK + '(o|a|os|as)\\b', 'gi'), (m, prep, art) => {
      const t = CONTR[prep.toLowerCase()][art.toLowerCase()];
      return prep[0] === prep[0].toUpperCase() ? t[0].toUpperCase() + t.slice(1) : t;
    })
    .split(MARK).join('');
}
