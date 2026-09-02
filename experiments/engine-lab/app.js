(() => {
  const cfg = window.RETRODOS_ENGINE_LAB;
  const status = document.querySelector('#runtime-status');

  const setStatus = (text, state) => {
    status.textContent = text;
    status.dataset.state = state;
  };

  if (!cfg) {
    setStatus('ERREUR // CONFIG', 'error');
    return;
  }

  if (!window.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
    setStatus('ERREUR // ISOLATION REQUISE', 'error');
    console.error('RetroDOS Engine Lab requires COOP/COEP cross-origin isolation.');
    return;
  }

  window.EJS_player = '#game';
  window.EJS_gameName = cfg.game.title;
  window.EJS_gameUrl = cfg.game.packageUrl;
  window.EJS_core = cfg.emulator.core;
  window.EJS_pathtodata = cfg.emulator.pathToData;
  window.EJS_threads = cfg.emulator.threads;
  window.EJS_externalFiles = cfg.emulator.externalFiles;
  window.EJS_VirtualGamepadSettings = cfg.virtualGamepad;
  window.EJS_language = 'fr-FR';
  window.EJS_disableAutoLang = true;
  window.EJS_startOnLoaded = false;
  window.EJS_startButtonName = 'CHARGER DOOM';
  window.EJS_color = '#68f79a';
  window.EJS_backgroundColor = '#020805';
  window.EJS_askBeforeExit = false;

  window.EJS_ready = () => setStatus('MOTEUR // PRÊT', 'ready');
  window.EJS_onGameStart = () => setStatus('DOOM // EN COURS', 'running');
  window.EJS_onExit = () => setStatus('MOTEUR // ARRÊTÉ', 'idle');

  setStatus('MOTEUR // CHARGEMENT', 'loading');

  const loader = document.createElement('script');
  loader.src = cfg.emulator.pathToData + 'loader.js';
  loader.async = true;
  loader.onerror = () => setStatus('ERREUR // MOTEUR INDISPONIBLE', 'error');
  document.body.appendChild(loader);
})();
