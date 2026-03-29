const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log('Groq API carregada:', process.env.GROQ_API_KEY ? 'SIM' : 'NÃO');

async function analisarComentario(score, comment, product) {
  if (!comment || comment.trim() === '') {
    return {
      categoria:    'sem comentário',
      subcategoria: 'sem comentário',
      resumo:       'Cliente não deixou comentário.'
    };
  }

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

async function gerarInsights(respostas, produto) {
  if (respostas.length === 0) {
    return {
      pontos_criticos:      'Nenhuma resposta coletada ainda.',
      pontos_positivos:     'Nenhuma resposta coletada ainda.',
      produto_mais_critico: 'indefinido',
      acao_recomendada:     'Colete mais respostas para gerar insights.',
      alerta:               false
    };
  }

  const detratores = respostas.filter(r => r.score <= 6).length;
  const pctDetrat  = Math.round((detratores / respostas.length) * 100);

  const resumo = respostas.slice(-30).map(r =>
    `Nota ${r.score} | ${r.product} | ${r.ia_categoria || '?'} | ${r.ia_subcategoria || '?'}`
  ).join('\n');

  const contextoProduto = produto
    ? `O filtro ativo é o produto: ${produto}. Como o produto já está filtrado, no campo "categoria_mais_critica" informe a CATEGORIA com mais problemas (ex: suporte, performance, usabilidade), não o nome do produto.`
    : 'Analise todos os produtos e informe o produto com mais detratores no campo "produto_mais_critico".';

  const prompt = `Você é um analista sênior de NPS da Umbler. ${contextoProduto}

Dados das últimas respostas (nota | produto | categoria | subcategoria):
${resumo}

Com base nesses dados, gere uma análise SINTETIZADA e ACIONÁVEL. NÃO liste comentários. Resuma padrões encontrados.

Responda APENAS com JSON válido sem markdown:
{
  "pontos_criticos": "síntese em 1 frase do principal problema identificado nos dados",
  "pontos_positivos": "síntese em 1 frase do principal ponto forte identificado nos dados",
  "produto_mais_critico": "${produto ? 'categoria com mais problemas (ex: suporte, performance)' : 'nome do produto com mais detratores'}",
  "acao_recomendada": "1 ação concreta e específica que o time deveria tomar agora",
  "alerta": true
}

O campo alerta é true se detratores >= 30%. Atualmente: ${pctDetrat}% de detratores.
Seja direto e objetivo. Máximo 20 palavras por campo.`;

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