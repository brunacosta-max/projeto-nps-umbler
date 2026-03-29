// ─── Embed do NPS Umbler ──────────────────────────────────────────
// Este é o único arquivo que precisa ser inserido nos produtos.
// Ele carrega o CSS e o JS do widget automaticamente.

(function () {
  const BASE = 'http://localhost:3000';

  const v = Date.now();

  // Carrega o CSS
  const link  = document.createElement('link');
  link.rel    = 'stylesheet';
  link.href   = `${BASE}/snippet/widget.css?v=${v}`;
  document.head.appendChild(link);

  // Carrega o JS
  const script = document.createElement('script');
  script.src   = `${BASE}/snippet/widget.js?v=${v}`;
  document.body.appendChild(script);
})();