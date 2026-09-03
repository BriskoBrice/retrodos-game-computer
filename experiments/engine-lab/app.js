(() => {
  'use strict';

  const BUNDLE_URL = 'https://v8.js-dos.com/bundles/doom.jsdos';
  const nativeInput = window.RetroDOSNativeInput;
  const $ = (q) => document.querySelector(q);
  const els = {
    dos: $('#dos'), boot: $('#bootOverlay'), start: $('#startBtn'), error: $('#bootError'),
    progress: $('#progressBar'), dataState: $('#dataState'), dataLabel: $('#downloadLabel'), bytes: $('#downloadBytes'),
    engineState: $('#engineState'), inputState: $('#inputState'), command: $('#bootCommand'), status: $('#statusText'),
    gameMode: $('#gameModeBtn'), portraitMode: $('#portraitModeBtn'), mirrorMode: $('#gameModeBtnMirror'), exitMode: $('#exitModeBtn'),
    save: $('#saveBtn'), mute: $('#muteBtn'), nativeBadge: $('#nativeBadge')
  };

  let ci = null;
  let player = null;
  let bundleObjectUrl = null;
  let started = false;
  let muted = false;
  let runtimeWired = false;

  function formatBytes(value) {
    if (!Number.isFinite(value) || value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    return `${(value / 1024 ** i).toFixed(i < 2 ? 0 : 1)} ${units[i]}`;
  }

  async function fetchBundleWithProgress(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Téléchargement impossible (${response.status})`);
    const total = Number(response.headers.get('content-length')) || 0;
    if (!response.body) return response.arrayBuffer();

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      if (total) {
        const percent = Math.min(100, Math.round((loaded / total) * 100));
        els.progress.style.width = `${percent}%`;
        els.dataState.textContent = `${percent}%`;
        els.bytes.textContent = `${formatBytes(loaded)} / ${formatBytes(total)}`;
      } else {
        els.dataState.textContent = formatBytes(loaded);
        els.bytes.textContent = formatBytes(loaded);
      }
    }

    const merged = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    els.progress.style.width = '100%';
    els.dataState.textContent = 'OK';
    return merged.buffer;
  }

  async function detectNativeControls() {
    try {
      const config = await ci.config();
      const ready = nativeInput?.hasNativeMobileControls(config) === true;
      els.inputState.textContent = ready ? 'NATIVE ✓' : 'AUCUN';
      els.inputState.style.color = ready ? 'var(--green)' : 'var(--amber)';
      els.nativeBadge.textContent = ready ? 'JSDOS NATIVE LAYERS ✓' : 'AUCUN LAYER TACTILE DÉTECTÉ';
      els.nativeBadge.classList.toggle('is-warning', !ready);
    } catch (error) {
      els.inputState.textContent = 'BUNDLE';
      els.nativeBadge.textContent = 'LAYER BUNDLE — DÉTECTION INDISPONIBLE';
      console.warn('RetroDOS: lecture de la configuration tactile impossible', error);
    }
  }

  function wireRuntimeEvents() {
    if (runtimeWired || !ci) return;
    runtimeWired = true;
    let firstFrame = true;
    ci.events().onFrame(() => {
      if (!firstFrame) return;
      firstFrame = false;
      els.command.textContent = 'C:\\GAMES\\DOOM> DOOM.EXE';
      setTimeout(() => {
        els.boot.classList.add('is-hidden');
        setTimeout(() => els.boot.classList.add('is-gone'), 560);
      }, 180);
    });
    ci.events().onExit(() => {
      els.status.textContent = 'STOP';
    });
  }

  async function bootGame() {
    if (started) return;
    started = true;
    els.start.disabled = true;
    els.error.hidden = true;
    els.status.textContent = 'CHARGEMENT';
    els.dataLabel.textContent = 'Téléchargement réel du bundle…';
    els.command.textContent = 'C:\\RETRODOS> FETCH DOOM.JSDOS';

    try {
      const bundle = await fetchBundleWithProgress(BUNDLE_URL);
      els.engineState.textContent = 'INIT';
      els.command.textContent = 'C:\\RETRODOS> INIT DOS ENGINE';
      bundleObjectUrl = URL.createObjectURL(new Blob([bundle], { type: 'application/octet-stream' }));

      player = Dos(els.dos, {
        url: bundleObjectUrl,
        autoStart: true,
        kiosk: true,
        style: 'none',
        noSideBar: true,
        noFullscreen: true,
        noSocialLinks: true,
        backend: 'dosbox',
        backendLocked: true,
        renderAspect: '4/3',
        imageRendering: 'pixelated',
        softFullscreen: false,
        noCursor: true,
        scaleControls: 0.9,
        fsChanges: { local: true, urlToKey: async () => 'retrodos-engine-lab-doom' },
        onEvent: async (event, arg) => {
          if (event === 'emu-ready') {
            els.engineState.textContent = 'READY';
            els.engineState.style.color = 'var(--green)';
          }
          if (event === 'ci-ready') {
            ci = arg;
            els.status.textContent = 'RUNNING';
            wireRuntimeEvents();
            await detectNativeControls();
          }
        }
      });
      player.setNoCloud?.(true);
      player.setScaleControls?.(0.9);
    } catch (error) {
      started = false;
      els.start.disabled = false;
      els.status.textContent = 'ERREUR';
      els.error.hidden = false;
      els.error.textContent = `Erreur : ${error.message}. Recharge la page et réessaie.`;
      console.error(error);
    }
  }

  async function enterGameMode() {
    document.body.classList.add('game-mode');
    try { await document.documentElement.requestFullscreen?.(); } catch {}
    try { await screen.orientation?.lock?.('landscape'); } catch {}
    setTimeout(() => window.scrollTo(0, 0), 50);
  }

  function exitGameMode() {
    document.body.classList.remove('game-mode');
    try { screen.orientation?.unlock?.(); } catch {}
  }

  async function saveGame() {
    if (!player) return;
    const original = els.save.textContent;
    els.save.textContent = 'SAVE…';
    let ok = false;
    try { ok = !!(await player.save?.()); } catch {}
    els.save.textContent = ok ? 'SAUVÉ ✓' : 'SAVE INDISPO';
    setTimeout(() => { els.save.textContent = original; }, 1400);
  }

  function toggleMute() {
    if (!ci) return;
    muted = !muted;
    muted ? ci.mute() : ci.unmute();
    els.mute.textContent = muted ? 'SON OFF' : 'SON ON';
  }

  els.start.addEventListener('click', bootGame);
  els.gameMode.addEventListener('click', enterGameMode);
  els.portraitMode.addEventListener('click', enterGameMode);
  els.mirrorMode.addEventListener('click', enterGameMode);
  els.exitMode.addEventListener('click', async () => {
    try { await document.exitFullscreen?.(); } catch {}
    exitGameMode();
  });
  els.save.addEventListener('click', saveGame);
  els.mute.addEventListener('click', toggleMute);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('game-mode')) exitGameMode();
  });
  window.addEventListener('beforeunload', () => {
    if (bundleObjectUrl) URL.revokeObjectURL(bundleObjectUrl);
  });
})();
