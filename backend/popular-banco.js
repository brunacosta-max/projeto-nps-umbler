const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'models/database.json');
const banco   = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

const tiers  = ['free', 'pro', 'enterprise'];
const planos = ['mensal', 'anual'];

const categorias = ['suporte', 'performance', 'usabilidade', 'preco', 'estabilidade', 'recursos'];
const subcats = {
  suporte:      ['tempo de resposta', 'qualidade da solução', 'cordialidade'],
  performance:  ['lentidão', 'instabilidade', 'tempo de carregamento'],
  usabilidade:  ['interface confusa', 'fluxo complexo', 'onboarding'],
  preco:        ['custo elevado', 'custo-benefício', 'falta de transparência'],
  estabilidade: ['serviço fora do ar', 'erros recorrentes'],
  recursos:     ['funcionalidade faltante', 'integração', 'automação']
};

const comentarios = {
  positivo: [
    'Plataforma excelente, recomendo muito!',
    'Melhor hospedagem que já usei.',
    'Suporte muito ágil e atencioso.',
    'Interface intuitiva e fácil de usar.',
    'Ótimo custo-benefício.',
    'Migrei para a Umbler e não me arrependo.',
    'Serviço muito estável e confiável.'
  ],
  neutro: [
    'Funciona bem, mas poderia ter mais opções.',
    'Bom serviço, mas o suporte pode melhorar.',
    'Atende as necessidades básicas.',
    'Estável, mas faltam alguns recursos.',
    'Preço justo para o que oferece.'
  ],
  negativo: [
    'Suporte demorou muito para responder.',
    'Serviço ficou instável essa semana.',
    'Interface poderia ser mais intuitiva.',
    'Preço aumentou sem melhoras no serviço.',
    'Tive quedas frequentes no serviço.',
    'Faltam recursos que os concorrentes têm.',
    'Dificuldade para configurar o painel.'
  ]
};

function dataAleatoria(mesesAtras) {
  const data = new Date();
  data.setMonth(data.getMonth() - mesesAtras);
  data.setDate(Math.floor(Math.random() * 28) + 1);
  data.setHours(Math.floor(Math.random() * 12) + 8);
  return data.toISOString();
}

// Perfil de NPS por produto — realista e variado
const perfisProduto = {
  'hospedagem': {
    // Bom NPS — produto maduro e estável
    meses: [
      { mes: 5, scores: [7, 8, 9, 8, 7, 9, 6, 9, 10, 8] },
      { mes: 4, scores: [8, 9, 7, 9, 8, 10, 9, 7, 9, 8] },
      { mes: 3, scores: [9, 8, 9, 10, 8, 9, 7, 9, 10, 9] },
      { mes: 2, scores: [9, 10, 9, 8, 10, 9, 9, 10, 8, 9] },
      { mes: 1, scores: [10, 9, 10, 9, 10, 9, 8, 10, 9, 10] },
    ]
  },
  'email': {
    // NPS médio — melhorando ao longo do tempo
    meses: [
      { mes: 5, scores: [5, 6, 4, 7, 5, 6, 7, 5, 8, 6] },
      { mes: 4, scores: [6, 7, 5, 8, 6, 7, 8, 6, 7, 8] },
      { mes: 3, scores: [7, 8, 6, 9, 7, 8, 7, 9, 8, 7] },
      { mes: 2, scores: [8, 9, 7, 9, 8, 9, 8, 7, 9, 8] },
      { mes: 1, scores: [9, 9, 8, 10, 9, 8, 9, 10, 9, 8] },
    ]
  },
  'umbler-talk': {
    // NPS crítico — produto novo com problemas
    meses: [
      { mes: 5, scores: [2, 3, 2, 4, 3, 2, 5, 3, 4, 2] },
      { mes: 4, scores: [3, 4, 3, 5, 4, 3, 6, 4, 3, 5] },
      { mes: 3, scores: [4, 5, 4, 6, 5, 4, 6, 5, 7, 4] },
      { mes: 2, scores: [5, 6, 5, 7, 6, 5, 7, 6, 5, 7] },
      { mes: 1, scores: [6, 7, 6, 8, 7, 6, 8, 7, 6, 8] },
    ]
  },
  'dominio': {
    // NPS estável e alto — produto simples
    meses: [
      { mes: 5, scores: [8, 9, 8, 9, 7, 9, 8, 10, 9, 8] },
      { mes: 4, scores: [9, 8, 9, 10, 8, 9, 9, 8, 10, 9] },
      { mes: 3, scores: [9, 10, 9, 8, 9, 10, 9, 8, 9, 10] },
      { mes: 2, scores: [10, 9, 10, 9, 10, 9, 10, 9, 8, 10] },
      { mes: 1, scores: [10, 10, 9, 10, 9, 10, 10, 9, 10, 10] },
    ]
  }
};

const novasRespostas = [];

Object.entries(perfisProduto).forEach(([produto, perfil]) => {
  perfil.meses.forEach(({ mes, scores }) => {
    scores.forEach((score, i) => {
      const tier   = tiers[i % tiers.length];
      const plano  = planos[i % planos.length];
      const cat    = categorias[i % categorias.length];
      const subcat = subcats[cat][i % subcats[cat].length];
      const tipo   = score >= 9 ? 'positivo' : score >= 7 ? 'neutro' : 'negativo';
      const comment = comentarios[tipo][i % comentarios[tipo].length];

      novasRespostas.push({
        id:              `historico-${produto}-${mes}-${i}`,
        score,
        comment,
        product:         produto,
        customer_tier:   tier,
        plan:            plano,
        created_at:      dataAleatoria(mes),
        ia_categoria:    cat,
        ia_subcategoria: subcat,
        ia_resumo:       score >= 9 ? `Cliente satisfeito com ${produto}.` : `Cliente insatisfeito com ${produto}.`
      });
    });
  });
});

banco.responses = [...novasRespostas, ...banco.responses];
fs.writeFileSync(DB_PATH, JSON.stringify(banco, null, 2));
console.log(`✅ ${novasRespostas.length} respostas históricas adicionadas!`);
console.log(`📊 Total no banco: ${banco.responses.length} respostas`);
console.log('');
console.log('Perfil de NPS por produto:');
console.log('  hospedagem  → NPS alto e estável');
console.log('  email       → NPS médio em crescimento');
console.log('  umbler-talk → NPS crítico em recuperação');
console.log('  dominio     → NPS excelente e consistente');