// ─── Configuração vinda do produto que instalou o snippet ────────
const CONFIG = window.UmblerNPS || {};
const API_URL = CONFIG.api_url || 'http://localhost:3000';

// ─── Verificar se já respondeu recentemente ───────────────────────
function jaRespondeu() {
  const ultima = localStorage.getItem('umbler_nps_respondido');
  if (!ultima) return false;
  const dias = (Date.now() - Number(ultima)) / (1000 * 60 * 60 * 24);
  return dias < (CONFIG.cooldown_dias || 90);
}

// ─── Criar o HTML do widget ───────────────────────────────────────
function criarWidget() {
  const titulo = CONFIG.titulo || 'O quanto você recomendaria a Umbler para um amigo?';

  const html = `
    <div id="umbler-nps-widget">
      <div class="nps-header">
        <p class="nps-title">${titulo}</p>
        <button class="nps-close" id="nps-fechar">✕</button>
      </div>

      <div class="nps-scale" id="nps-escala">
        ${Array.from({ length: 11 }, (_, i) => `
          <button class="nps-btn" data-valor="${i}">${i}</button>
        `).join('')}
      </div>

      <div class="nps-labels">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>

      <textarea
        class="nps-comment"
        id="nps-comentario"
        placeholder="Conte-nos o motivo da sua nota (opcional)"
      ></textarea>

      <button class="nps-submit" id="nps-enviar" disabled>
        Enviar feedback
      </button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
}

// ─── Lógica de interação ──────────────────────────────────────────
function iniciarEventos() {
  let notaSelecionada = null;

  const botoes  = document.querySelectorAll('.nps-btn');
  const enviar  = document.getElementById('nps-enviar');
  const fechar  = document.getElementById('nps-fechar');
  const widget  = document.getElementById('umbler-nps-widget');

  botoes.forEach(btn => {
    btn.addEventListener('click', () => {
      botoes.forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      notaSelecionada = Number(btn.dataset.valor);
      enviar.disabled = false;
    });
  });

  fechar.addEventListener('click', () => widget.remove());

  enviar.addEventListener('click', async () => {
    if (notaSelecionada === null) return;

    const comentario = document.getElementById('nps-comentario').value;

    enviar.disabled = true;
    enviar.textContent = 'Enviando...';

    try {
      await fetch(`${API_URL}/api/nps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score:         notaSelecionada,
          comment:       comentario,
          product:       CONFIG.product      || 'não informado',
          customer_tier: CONFIG.customer_tier || 'não informado',
          plan:          CONFIG.plan          || 'não informado'
        })
      });

      localStorage.setItem('umbler_nps_respondido', Date.now().toString());

      widget.innerHTML = `
        <div class="nps-obrigado">
          <p>Obrigado pelo seu feedback! 💜</p>
          <span>Sua opinião é muito importante para nós.</span>
        </div>
      `;

      setTimeout(() => widget.remove(), 3000);

    } catch (erro) {
      enviar.disabled = false;
      enviar.textContent = 'Enviar feedback';
      console.error('Erro ao enviar NPS:', erro);
    }
  });
}

// ─── FUNÇÃO PRINCIPAL (O aperto de mão com o embed.js) ────────────
function initUmblerWidget() {
  console.log("🛠️ Widget: Verificando se deve aparecer...");
  
  if (jaRespondeu()) {
    console.log("ℹ️ Widget: Usuário já respondeu (cooldown ativo).");
    return;
  }

  criarWidget();
  iniciarEventos();
  
  console.log("✨ Widget: Criado com sucesso no navegador!");
}