// ─── Bloco 1: Dependências ───────────────────────────────────────
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();

// ─── Bloco 2: App e porta ─────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Bloco 3: Middlewares ─────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ─── Bloco 4: Rotas ───────────────────────────────────────────────
const npsRoutes = require('./routes/nps');
app.use('/api/nps', npsRoutes);

// ─── Bloco 5: Iniciar servidor ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor NPS rodando em http://localhost:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
});