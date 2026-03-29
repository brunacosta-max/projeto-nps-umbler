// ─── Dependências ────────────────────────────────────────────────
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

console.log('Chave API carregada:', process.env.ANTHROPIC_API_KEY ? 'SIM' : 'NÃO');

// ─── Analisar comentário individual ──────────────────────────────
async function analisarComentario(score, comment, product) {
  if (!comment || comment.trim() === '') {
    return {
      sentimento: score >= 9 ? 'positivo' : score >= 7 ? 'neutro' : 'negativo',
      categoria:  'sem comentário',
      resumo:     'Cliente não deixou comentário.'
    };
  }

  const prompt = `Você é um analista de NPS da empresa Umbler, que oferece serviços de hospedagem, email, domínios e Umbler Talk.

Um cliente avaliou o produto "${product}" com nota ${score}/10 e deixou o seguinte comentário:
"${comment}"

Responda APENAS com um JSON válido, sem texto adicional, neste formato exato:
{
  "sentimento": "positivo" | "neutro" | "negativo",
  "categoria": "suporte" | "performance" | "preco" | "usabilidade" | "estabilidade" | "recursos" | "outro",
  "resumo": "uma frase curta de até 15 palavras resumindo o feedback"
}`;

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages:   [{ role: 'user', content: prompt }]
    });

    const texto = response.content[0].text.trim();
    return JSON.parse(texto);

  } catch (erro) {
    console.error('Erro na análise de IA:', erro.status, erro.message, erro.error);
    return {
      sentimento: 'neutro',
      categoria:  'outro',
      resumo:     'Não foi possível analisar o comentário.'
    };
  }
}

// ─── Gerar insights do conjunto de respostas ──────────────────────
async function gerarInsights(respostas) {
  if (respostas.length === 0) {
    return { insights: 'Nenhuma resposta coletada ainda.' };
  }

  const resumo = respostas.slice(-50).map(r =>
    `- Nota ${r.score} | ${r.product} | ${r.customer_tier} | "${r.comment || 'sem comentário'}"`
  ).join('\n');

  const prompt = `Você é um analista de NPS da Umbler. Analise as últimas respostas coletadas e gere insights acionáveis para o time de produto.

Respostas recentes:
${resumo}

Responda APENAS com um JSON válido, sem texto adicional, neste formato exato:
{
  "pontos_criticos": "frase descrevendo o principal problema identificado",
  "pontos_positivos": "frase descrevendo o principal elogio identificado",
  "produto_mais_critico": "nome do produto com mais insatisfação",
  "acao_recomendada": "uma ação concreta que o time deveria tomar agora",
  "alerta": true | false
}`;

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }]
    });

    const texto = response.content[0].text.trim();
    return JSON.parse(texto);

  } catch (erro) {
    console.error('Erro ao gerar insights:', erro.message);
    return {
      pontos_criticos:      'Não foi possível analisar.',
      pontos_positivos:     'Não foi possível analisar.',
      produto_mais_critico: 'indefinido',
      acao_recomendada:     'Tente novamente mais tarde.',
      alerta:               false
    };
  }
}

module.exports = { analisarComentario, gerarInsights };