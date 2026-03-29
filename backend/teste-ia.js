require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function testar() {
  console.log('Chave carregada:', process.env.ANTHROPIC_API_KEY ? 'SIM' : 'NÃO');
  console.log('Chave:', process.env.ANTHROPIC_API_KEY?.substring(0, 20) + '...');

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages:   [{ role: 'user', content: 'Responda apenas: {"teste": "ok"}' }]
    });
    console.log('Resposta da IA:', response.content[0].text);
  } catch (erro) {
    console.error('ERRO COMPLETO:', JSON.stringify(erro, null, 2));
  }
}

testar();