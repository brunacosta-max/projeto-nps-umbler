// ─── Bloco 1: Dependências e setup ───────────────────────────────
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const DB_PATH = path.join(__dirname, '../models/database.json');

const { analisarComentario, gerarInsights } = require('../services/ai');

// ─── Bloco 2: Funções auxiliares ─────────────────────────────────
function lerBanco() {
  const conteudo = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(conteudo);
}

function salvarBanco(dados) {
  fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2));
}

// ─── Bloco 3: POST /api/nps ───────────────────────────────────────
router.post('/', async (req, res) => {
  console.log('POST recebido:', req.body);
  const { score, comment, product, customer_tier, plan } = req.body;

  if (score === undefined || score < 0 || score > 10) {
    return res.status(400).json({
      erro: 'A nota (score) é obrigatória e deve ser entre 0 e 10.'
    });
  }

  let analise;
  let erroIA = null;
  try {
    analise = await analisarComentario(score, comment, product || 'não informado');
  } catch (e) {
    erroIA = e.message;
    analise = { sentimento: 'neutro', categoria: 'outro', resumo: 'erro na IA' };
  }

  const novaResposta = {
    id:               Date.now().toString(),
    score:            Number(score),
    comment:          comment || '',
    product:          product || 'não informado',
    customer_tier:    customer_tier || 'não informado',
    plan:             plan || 'não informado',
    created_at:       new Date().toISOString(),
    ia_categoria:     analise.categoria,
    ia_subcategoria:  analise.subcategoria,
    ia_resumo:        analise.resumo
  };

  const banco = lerBanco();
  banco.responses.push(novaResposta);
  salvarBanco(banco);

  res.status(201).json({
    mensagem: 'Resposta registrada com sucesso!',
    dados: novaResposta,
    debug_ia: erroIA
  });
});

// ─── Bloco 4: GET /api/nps ────────────────────────────────────────
router.get('/', (req, res) => {
  const { product, customer_tier, plan, data_inicio, data_fim } = req.query;

  const banco = lerBanco();
  let respostas = banco.responses;

  if (product)       respostas = respostas.filter(r => r.product === product);
  if (customer_tier) respostas = respostas.filter(r => r.customer_tier === customer_tier);
  if (plan)          respostas = respostas.filter(r => r.plan === plan);
  if (data_inicio)   respostas = respostas.filter(r => r.created_at >= data_inicio);
  if (data_fim)      respostas = respostas.filter(r => r.created_at <= data_fim);

  res.status(200).json({
    total: respostas.length,
    respostas
  });
});

// ─── Bloco 5: GET /api/nps/score ─────────────────────────────────
router.get('/score', (req, res) => {
  const { product, customer_tier, plan, data_inicio, data_fim } = req.query;

  const banco = lerBanco();
  let respostas = banco.responses;

  if (product)       respostas = respostas.filter(r => r.product === product);
  if (customer_tier) respostas = respostas.filter(r => r.customer_tier === customer_tier);
  if (plan)          respostas = respostas.filter(r => r.plan === plan);
  if (data_inicio)   respostas = respostas.filter(r => r.created_at >= data_inicio);
  if (data_fim)      respostas = respostas.filter(r => r.created_at <= data_fim);

  if (respostas.length === 0) {
    return res.status(200).json({ nps: 0, total: 0, promotores: 0, neutros: 0, detratores: 0, mensagem: 'Nenhuma resposta ainda.' });
  }

  const promotores = respostas.filter(r => r.score >= 9).length;
  const detratores = respostas.filter(r => r.score <= 6).length;
  const total      = respostas.length;
  const nps        = Math.round(((promotores - detratores) / total) * 100);

  res.status(200).json({ nps, total, promotores, neutros: total - promotores - detratores, detratores });
});

// ─── Bloco 6: GET /api/nps/insights ──────────────────────────────
router.get('/insights', async (req, res) => {
  const { product, customer_tier, plan, data_inicio, data_fim } = req.query;

  const banco = lerBanco();
  let respostas = banco.responses;

  if (product)       respostas = respostas.filter(r => r.product === product);
  if (customer_tier) respostas = respostas.filter(r => r.customer_tier === customer_tier);
  if (plan)          respostas = respostas.filter(r => r.plan === plan);
  if (data_inicio)   respostas = respostas.filter(r => r.created_at >= data_inicio);
  if (data_fim)      respostas = respostas.filter(r => r.created_at <= data_fim);

  // Se nenhum filtro de produto, gera insights por produto separadamente
  if (!product) {
    const produtos = [...new Set(banco.responses.map(r => r.product))];
    const insightsPorProduto = await Promise.all(
      produtos.map(async p => {
        const resp = respostas.filter(r => r.product === p);
        if (resp.length === 0) return null;
        const insight = await gerarInsights(resp, p);
        return { produto: p, total: resp.length, ...insight };
      })
    );
    return res.status(200).json({
      modo: 'por_produto',
      insights: insightsPorProduto.filter(Boolean)
    });
  }

  const insights = await gerarInsights(respostas, product);
  res.status(200).json({ modo: 'produto_unico', ...insights });
});

// ─── Bloco 7: GET /api/nps/analytics ─────────────────────────────
router.get('/analytics', (req, res) => {
  const { product, customer_tier, plan, data_inicio, data_fim } = req.query;

  const banco = lerBanco();
  let respostas = banco.responses;

  if (product)       respostas = respostas.filter(r => r.product === product);
  if (customer_tier) respostas = respostas.filter(r => r.customer_tier === customer_tier);
  if (plan)          respostas = respostas.filter(r => r.plan === plan);
  if (data_inicio)   respostas = respostas.filter(r => r.created_at >= data_inicio);
  if (data_fim)      respostas = respostas.filter(r => r.created_at <= data_fim);

  // Radar de risco — detratores recentes agrupados
  const detratores = respostas
    .filter(r => r.score <= 6)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(r => ({
      id:            r.id,
      score:         r.score,
      product:       r.product,
      customer_tier: r.customer_tier,
      plan:          r.plan,
      comment:       r.comment,
      ia_categoria:  r.ia_categoria,
      created_at:    r.created_at,
      risco:         r.score <= 3 ? 'alto' : r.score <= 5 ? 'medio' : 'baixo'
    }));

  // Oportunidades de upsell — promotores em planos menores
  const oportunidades = respostas
    .filter(r => r.score >= 9 && (r.customer_tier === 'free' || r.plan === 'mensal'))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => ({
      id:            r.id,
      score:         r.score,
      product:       r.product,
      customer_tier: r.customer_tier,
      plan:          r.plan,
      comment:       r.comment,
      created_at:    r.created_at,
      oportunidade:  r.customer_tier === 'free' ? 'upgrade para pro'
                   : r.plan === 'mensal'         ? 'migrar para anual'
                   : 'expansão'
    }));

  // Voz do cliente — melhores comentários positivos e neutros por categoria
  const vozCliente = {
    social_proof: respostas
      .filter(r => r.score >= 9 && r.comment && r.comment.length > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => ({
        score:   r.score,
        comment: r.comment,
        product: r.product,
        aprovado: r.aprovado_social_proof || false
      })),
    roadmap: respostas
      .filter(r => r.score >= 7 && r.score <= 8 && r.comment && r.comment.length > 10)
      .reduce((acc, r) => {
        const cat = r.ia_categoria || 'outro';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(r.comment);
        return acc;
      }, {})
  };

  res.status(200).json({ detratores, oportunidades, voz_cliente: vozCliente });
});

// ─── Bloco 9: GET /api/nps/evolucao ──────────────────────────────
router.get('/evolucao', (req, res) => {
  const { product, customer_tier, plan, data_inicio, data_fim } = req.query;

  const banco = lerBanco();
  let respostas = banco.responses;

  if (product)       respostas = respostas.filter(r => r.product === product);
  if (customer_tier) respostas = respostas.filter(r => r.customer_tier === customer_tier);
  if (plan)          respostas = respostas.filter(r => r.plan === plan);
  if (data_inicio)   respostas = respostas.filter(r => r.created_at >= data_inicio);
  if (data_fim)      respostas = respostas.filter(r => r.created_at <= data_fim);

  // Decide granularidade: dias se período <= 31 dias, senão meses
  let granularidade = 'mes';
  if (data_inicio && data_fim) {
    const diff = (new Date(data_fim) - new Date(data_inicio)) / (1000 * 60 * 60 * 24);
    if (diff <= 31) granularidade = 'dia';
  }

  const porPeriodo = {};
  respostas.forEach(r => {
    const data  = new Date(r.created_at);
    const chave = granularidade === 'dia'
      ? `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
      : `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    if (!porPeriodo[chave]) porPeriodo[chave] = [];
    porPeriodo[chave].push(r.score);
  });

  const evolucao = Object.entries(porPeriodo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, scores]) => {
      const total      = scores.length;
      const promotores = scores.filter(s => s >= 9).length;
      const detratores = scores.filter(s => s <= 6).length;
      const nps        = Math.round(((promotores - detratores) / total) * 100);

      let label;
      if (granularidade === 'dia') {
        const [ano, mes, dia] = periodo.split('-');
        label = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      } else {
        const [ano, mes] = periodo.split('-');
        label = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      }

      return { periodo, label, nps, total, promotores, detratores, granularidade };
    });

  res.status(200).json({ evolucao, granularidade });
});

// ─── Bloco 8: PATCH /api/nps/:id/social-proof ────────────────────
router.patch('/:id/social-proof', (req, res) => {
  const banco = lerBanco();
  const idx   = banco.responses.findIndex(r => r.id === req.params.id);

  if (idx === -1) return res.status(404).json({ erro: 'Resposta não encontrada.' });

  banco.responses[idx].aprovado_social_proof = !banco.responses[idx].aprovado_social_proof;
  salvarBanco(banco);

  res.status(200).json({
    mensagem: 'Social proof atualizado!',
    aprovado: banco.responses[idx].aprovado_social_proof
  });
});

// ─── Exportar o router ────────────────────────────────────────────
module.exports = router;