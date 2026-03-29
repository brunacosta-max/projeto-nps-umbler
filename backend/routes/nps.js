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
    id:            Date.now().toString(),
    score:         Number(score),
    comment:       comment || '',
    product:       product || 'não informado',
    customer_tier: customer_tier || 'não informado',
    plan:          plan || 'não informado',
    created_at:    new Date().toISOString(),
    ia_sentimento: analise.sentimento,
    ia_categoria:  analise.categoria,
    ia_resumo:     analise.resumo
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
  const banco = lerBanco();
  const respostas = banco.responses;

  if (respostas.length === 0) {
    return res.status(200).json({ nps: 0, mensagem: 'Nenhuma resposta ainda.' });
  }

  const promotores = respostas.filter(r => r.score >= 9).length;
  const detratores = respostas.filter(r => r.score <= 6).length;
  const total      = respostas.length;

  const nps = Math.round(((promotores - detratores) / total) * 100);

  res.status(200).json({
    nps,
    total,
    promotores,
    neutros:   total - promotores - detratores,
    detratores
  });
});

// ─── Bloco 6: GET /api/nps/insights ──────────────────────────────
router.get('/insights', async (req, res) => {
  const banco     = lerBanco();
  const insights  = await gerarInsights(banco.responses);
  res.status(200).json(insights);
});

// ─── Exportar o router ────────────────────────────────────────────
module.exports = router;