// ─── Bloco 1: Dependências ───────────────────────────────────────
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();
const path = require('path');

// ─── Bloco 2: App e porta ─────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Bloco 3: Middlewares ─────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());

// ─── Bloco 3.5: Arquivos estáticos ────────────────────────────────
app.use('/snippet',   express.static(path.join(__dirname, '../frontend/snippet')));
app.use('/dashboard', express.static(path.join(__dirname, '../frontend/dashboard')));
app.use('/teste',     express.static(path.join(__dirname, '../')));

// ─── Bloco 4: Rotas ───────────────────────────────────────────────
const npsRoutes = require('./routes/nps');
app.use('/api/nps', npsRoutes);

// ─── Bloco 5: Iniciar servidor ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor NPS rodando em http://localhost:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
});