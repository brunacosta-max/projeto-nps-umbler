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
    <div id="umbler-nps-widget" style="position:fixed!important;bottom:24px!important;right:24px!important;top:auto!important;left:auto!important;width:368px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.12);overflow:hidden;z-index:999999;animation:nps-slide-in 0.35s cubic-bezier(0.16,1,0.3,1)">
      <div class="nps-topbar" style="background:#1A1A2E;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
        <div class="nps-brand" style="display:flex;align-items:center;gap:8px">
          <div class="nps-logo" style="width:24px;height:24px;background:#00C853;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white">U</div>
          <span class="nps-brand-name" style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.9)">Umbler</span>
        </div>
        <button class="nps-close" id="nps-fechar" style="background:none;border:none;font-size:16px;color:rgba(255,255,255,0.5);cursor:pointer">✕</button>
      </div>

      <div class="nps-body" style="padding:20px">
        <p class="nps-title" style="font-size:14px;font-weight:600;color:#1A1A2E;line-height:1.5;margin-bottom:16px">${titulo}</p>

        <div class="nps-scale" id="nps-escala" style="display:flex;gap:3px;margin-bottom:6px">
          ${Array.from({ length: 11 }, (_, i) => `
            <button class="nps-btn" data-valor="${i}" style="flex:1;height:34px;border:1.5px solid #E5E7EB;border-radius:8px;background:#F9FAFB;font-size:12px;font-weight:600;color:#6B7280;cursor:pointer">${i}</button>
          `).join('')}
        </div>

        <div class="nps-labels" style="display:flex;justify-content:space-between;margin-bottom:14px">
          <span style="font-size:10px;color:#9CA3AF">Nada provável</span>
          <span style="font-size:10px;color:#9CA3AF">Muito provável</span>
        </div>

        <textarea
          class="nps-comment"
          id="nps-comentario"
          placeholder="Conte-nos o motivo da sua nota (opcional)"
          style="width:100%;height:68px;border:1.5px solid #E5E7EB;border-radius:10px;padding:10px 12px;font-size:13px;color:#1A1A2E;background:#F9FAFB;resize:none;margin-bottom:14px;font-family:inherit"
        ></textarea>

        <button class="nps-submit" id="nps-enviar" disabled
          style="width:100%;height:40px;background:#00C853;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;opacity:0.5">
          Enviar feedback
        </button>
      </div>
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
      botoes.forEach(b => {
        b.classList.remove('selecionado');
        b.style.background = '#F9FAFB';
        b.style.borderColor = '#E5E7EB';
        b.style.color = '#6B7280';
      });
      btn.classList.add('selecionado');
      btn.style.background = '#00C853';
      btn.style.borderColor = '#00C853';
      btn.style.color = '#fff';
      notaSelecionada = Number(btn.dataset.valor);
      enviar.disabled = false;
      enviar.style.opacity = '1';
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
          product:       CONFIG.product       || 'não informado',
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

// ─── Inicializar o widget ─────────────────────────────────────────
function init() {
  if (jaRespondeu()) return;

  const delay = CONFIG.delay_ms || 3000;
  setTimeout(() => {
    criarWidget();
    iniciarEventos();
  }, delay);
}

init();