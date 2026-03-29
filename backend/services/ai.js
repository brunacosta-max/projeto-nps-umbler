const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log('Groq API carregada:', process.env.GROQ_API_KEY ? 'SIM' : 'NÃO');

async function analisarComentario(score, comment, product) {
  console.log('analisarComentario chamado:', { score, comment, product });

  if (!comment || comment.trim() === '') {
    console.log('Sem comentário — retornando padrão');
    return {
      categoria:    'sem comentário',
      subcategoria: 'sem comentário',
      resumo:       'Cliente não deixou comentário.'
    };
  }

  console.log('Chamando Groq...');

  const prompt = `Você é um analista de NPS da Umbler. Um cliente avaliou o produto "${product}" com nota ${score}/10 e disse: "${comment}".

Responda APENAS com JSON válido sem markdown:
{"categoria":"suporte","subcategoria":"tempo de resposta","resumo":"frase curta de até 10 palavras"}

Categorias e subcategorias válidas:
- suporte: tempo de resposta, qualidade da solução, cordialidade, disponibilidade
- performance: lentidão, instabilidade, quedas, tempo de carregamento
- preco: custo elevado, falta de transparência, custo-benefício, cobrança indevida
- usabilidade: interface confusa, fluxo complexo, falta de documentação, onboarding
- estabilidade: serviço fora do ar, erros recorrentes, perda de dados
- recursos: funcionalidade faltante, integração, customização, automação
- outro: geral`;

  try {
    const response = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  150,
      temperature: 0.1
    });
    const texto  = response.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(texto);
    console.log('Groq respondeu:', parsed);
    return {
      categoria:    parsed.categoria    || 'outro',
      subcategoria: parsed.subcategoria || 'geral',
      resumo:       parsed.resumo       || 'Sem resumo.'
    };
  } catch (erro) {
    console.error('Erro análise Groq:', erro.message);
    return {
      categoria:    'outro',
      subcategoria: 'geral',
      resumo:       'Não foi possível analisar.'
    };
  }
}

async function gerarInsights(respostas) {
  if (respostas.length === 0) {
    return {
      pontos_criticos:      'Nenhuma resposta coletada ainda.',
      pontos_positivos:     'Nenhuma resposta coletada ainda.',
      produto_mais_critico: 'indefinido',
      acao_recomendada:     'Colete mais respostas para gerar insights.',
      alerta:               false
    };
  }

  const resumo = respostas.slice(-30).map(r =>
    `- Nota ${r.score} | ${r.product} | ${r.customer_tier} | Categoria: ${r.ia_categoria || '?'} | Subcategoria: ${r.ia_subcategoria || '?'} | "${r.comment || 'sem comentário'}"`
  ).join('\n');

  const prompt = `Você é um analista de NPS da Umbler. Analise as respostas abaixo e gere insights acionáveis.

Respostas:
${resumo}

Responda APENAS com JSON válido sem markdown:
{"pontos_criticos":"texto","pontos_positivos":"texto","produto_mais_critico":"nome","acao_recomendada":"texto","alerta":true}

O campo alerta deve ser true se houver 30% ou mais de detratores.`;

  try {
    const response = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  300,
      temperature: 0.1
    });
    const texto = response.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    return JSON.parse(texto);
  } catch (erro) {
    console.error('Erro insights Groq:', erro.message);
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