(function () {
  const BASE = 'http://localhost:3000';
  console.log("🚀 NPS Umbler: Iniciando carregamento...");

  // 1. Carrega o CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${BASE}/snippet/widget.css`;
  document.head.appendChild(link);

  // 2. Carrega o JS do Widget
  const script = document.createElement('script');
  script.src = `${BASE}/snippet/widget.js`;
  script.async = true;

  // 3. Só tenta iniciar quando o script terminar de carregar
  script.onload = function() {
    console.log("✅ NPS Umbler: Widget.js carregado!");
    
    // Aguarda o delay configurado ou 2 segundos por padrão
    const delay = (window.UmblerNPS && window.UmblerNPS.delay_ms) || 2000;
    
    setTimeout(() => {
      if (typeof initUmblerWidget === 'function') {
        initUmblerWidget();
        console.log("🎈 NPS Umbler: Widget exibido!");
      } else {
        console.error("❌ NPS Umbler: Função initUmblerWidget não encontrada no widget.js");
      }
    }, delay);
  };

  document.body.appendChild(script);
})();