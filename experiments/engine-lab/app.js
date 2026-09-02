(() => {
  'use strict';

  const BUNDLE_URL = 'https://v8.js-dos.com/bundles/doom.jsdos';
  const MIN_HOLD_MS = 90;
  const KEY = Object.freeze({
    UP: 265, DOWN: 264, LEFT: 263, RIGHT: 262,
    CTRL: 341, SHIFT: 340, ALT: 342, SPACE: 32,
    ESC: 256, ENTER: 257, TAB: 258,
  });

  const $ = (q) => document.querySelector(q);
  const els = {
    dos: $('#dos'), boot: $('#bootOverlay'), start: $('#startBtn'), error: $('#bootError'),
    progress: $('#progressBar'), dataState: $('#dataState'), dataLabel: $('#downloadLabel'), bytes: $('#downloadBytes'),
    engineState: $('#engineState'), inputState: $('#inputState'), command: $('#bootCommand'), status: $('#statusText'),
    gameMode: $('#gameModeBtn'), portraitMode: $('#portraitModeBtn'), hud: $('#gameHud'),
    joystick: $('#joystick'), knob: $('#joystickKnob'), weaponDock: $('#weaponDock'), rightRail: $('.right-rail'),
    menuBtn: $('#hudMenuBtn'), menu: $('#hudMenu'), hideHud: $('#hideHudBtn'), showHud: $('#showHudBtn'), exitMode: $('#exitModeBtn'),
    save: $('#saveBtn'), portraitSave: $('#portraitSaveBtn'), mute: $('#muteBtn'), portraitMute: $('#portraitMuteBtn'),
    portraitJoystickSlot: $('#portraitJoystickSlot'), portraitActionsSlot: $('#portraitActionsSlot'), portraitWeaponsSlot: $('#portraitWeaponsSlot')
  };

  let ci = null;
  let player = null;
  let bundleObjectUrl = null;
  let started = false;
  let muted = false;
  let joystickPointer = null;
  let joystickKeys = new Set();
  let idleTimer = null;

  const keyChains = new Map();
  const keyDownAt = new Map();
  const keyRefs = new Map();
  const heldByElement = new WeakMap();
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function queueKey(code, pressed) {
    if (!ci) return Promise.resolve();
    const previous = keyChains.get(code) || Promise.resolve();
    const next = previous.then(async () => {
      if (!ci) return;
      if (pressed) {
        keyDownAt.set(code, performance.now());
        ci.sendKeyEvent(code, true);
        return;
      }
      const downAt = keyDownAt.get(code);
      keyDownAt.delete(code);
      const heldFor = downAt == null ? MIN_HOLD_MS : performance.now() - downAt;
      if (heldFor < MIN_HOLD_MS) await wait(MIN_HOLD_MS - heldFor);
      ci.sendKeyEvent(code, false);
    });
    keyChains.set(code, next.catch(() => {}));
    return next;
  }

  function keyDown(code) {
    const count = keyRefs.get(code) || 0;
    keyRefs.set(code, count + 1);
    if (count === 0) queueKey(code, true);
  }

  function keyUp(code) {
    const count = keyRefs.get(code) || 0;
    if (count <= 1) {
      keyRefs.delete(code);
      queueKey(code, false);
    } else {
      keyRefs.set(code, count - 1);
    }
  }

  function tapKey(code) {
    keyDown(code);
    setTimeout(() => keyUp(code), MIN_HOLD_MS + 20);
  }

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

  function resetJoystickVisual() {
    els.knob.style.transform = 'translate(-50%,-50%)';
    els.joystick.classList.remove('is-active');
  }

  function setJoystickKeys(nextKeys) {
    const next = new Set(nextKeys);
    for (const code of joystickKeys) if (!next.has(code)) keyUp(code);
    for (const code of next) if (!joystickKeys.has(code)) keyDown(code);
    joystickKeys = next;
  }

  function updateJoystick(event) {
    const rect = els.joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const radius = rect.width * 0.31;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      dx *= radius / distance;
      dy *= radius / distance;
    }
    const threshold = radius * 0.22;
    const keys = [];
    if (dy < -threshold) keys.push(KEY.UP);
    if (dy > threshold) keys.push(KEY.DOWN);
    if (dx < -threshold) keys.push(KEY.LEFT);
    if (dx > threshold) keys.push(KEY.RIGHT);
    setJoystickKeys(keys);
    els.knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    els.joystick.classList.toggle('is-active', keys.length > 0);
    wakeHud();
  }

  function wireJoystick() {
    els.joystick.addEventListener('pointerdown', (event) => {
      if (!ci || joystickPointer !== null) return;
      event.preventDefault();
      joystickPointer = event.pointerId;
      els.joystick.setPointerCapture?.(event.pointerId);
      updateJoystick(event);
      navigator.vibrate?.(5);
    });
    els.joystick.addEventListener('pointermove', (event) => {
      if (event.pointerId !== joystickPointer) return;
      event.preventDefault();
      updateJoystick(event);
    });
    const end = (event) => {
      if (event.pointerId !== joystickPointer) return;
      event.preventDefault();
      setJoystickKeys([]);
      joystickPointer = null;
      resetJoystickVisual();
      wakeHud();
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => els.joystick.addEventListener(name, end));
  }

  function wireHoldButtons() {
    document.querySelectorAll('[data-hold]').forEach((button) => {
      const code = Number(button.dataset.hold);
      button.addEventListener('pointerdown', (event) => {
        if (!ci || heldByElement.has(button)) return;
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        heldByElement.set(button, { pointerId: event.pointerId, code });
        keyDown(code);
        button.classList.add('is-pressed');
        navigator.vibrate?.(5);
        wakeHud();
      });
      const release = (event) => {
        const held = heldByElement.get(button);
        if (!held || held.pointerId !== event.pointerId) return;
        event.preventDefault();
        keyUp(held.code);
        heldByElement.delete(button);
        button.classList.remove('is-pressed');
        wakeHud();
      };
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => button.addEventListener(name, release));
    });
  }

  function wireTapButtons() {
    document.querySelectorAll('[data-tap]').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        if (!ci) return;
        event.preventDefault();
        tapKey(Number(button.dataset.tap));
        button.classList.add('is-pressed');
        setTimeout(() => button.classList.remove('is-pressed'), 120);
        navigator.vibrate?.(4);
        wakeHud();
      });
    });
  }

  function releaseEverything() {
    if (ci) for (const code of keyRefs.keys()) queueKey(code, false);
    keyRefs.clear();
    joystickKeys.clear();
    document.querySelectorAll('.is-pressed').forEach((el) => el.classList.remove('is-pressed'));
    resetJoystickVisual();
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
      els.dataState.textContent = 'OK';
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
        fsChanges: { local: true, urlToKey: async () => 'retrodos-engine-lab-doom' },
        onEvent: async (event, arg) => {
          if (event === 'emu-ready') {
            els.engineState.textContent = 'READY';
            els.engineState.style.color = 'var(--green)';
          }
          if (event === 'ci-ready') {
            ci = arg;
            els.inputState.textContent = 'READY';
            els.inputState.style.color = 'var(--green)';
            els.status.textContent = 'RUNNING';
            wireRuntimeEvents();
          }
        }
      });
      player.setNoCloud?.(true);
    } catch (error) {
      started = false;
      els.start.disabled = false;
      els.status.textContent = 'ERREUR';
      els.error.hidden = false;
      els.error.textContent = `Erreur : ${error.message}. Recharge la page et réessaie.`;
      console.error(error);
    }
  }

  function wireRuntimeEvents() {
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
      releaseEverything();
      els.status.textContent = 'STOP';
    });
  }

  function moveControlsForPortrait() {
    if (!els.portraitJoystickSlot.contains(els.joystick)) els.portraitJoystickSlot.appendChild(els.joystick);
    if (!els.portraitActionsSlot.contains(els.rightRail)) els.portraitActionsSlot.appendChild(els.rightRail);
    if (!els.portraitWeaponsSlot.contains(els.weaponDock)) els.portraitWeaponsSlot.appendChild(els.weaponDock);
  }

  function moveControlsForGameMode() {
    let rail = els.hud.querySelector('.left-rail');
    if (!rail) {
      rail = document.createElement('div');
      rail.className = 'left-rail';
      els.hud.prepend(rail);
    }
    rail.appendChild(els.joystick);
    els.hud.appendChild(els.rightRail);
    els.hud.prepend(els.weaponDock);
  }

  async function enterGameMode() {
    moveControlsForGameMode();
    document.body.classList.add('game-mode');
    wakeHud();
    try { await document.documentElement.requestFullscreen?.(); } catch {}
    try { await screen.orientation?.lock?.('landscape'); } catch {}
    setTimeout(() => window.scrollTo(0, 0), 50);
  }

  function exitGameMode() {
    releaseEverything();
    document.body.classList.remove('game-mode');
    els.hud.classList.remove('is-hidden', 'is-idle');
    els.showHud.hidden = true;
    els.menu.hidden = true;
    moveControlsForPortrait();
    try { screen.orientation?.unlock?.(); } catch {}
  }

  function wakeHud() {
    if (!document.body.classList.contains('game-mode')) return;
    els.hud.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => els.hud.classList.add('is-idle'), 2600);
  }

  async function saveGame() {
    if (!player) return;
    const buttons = [els.save, els.portraitSave];
    buttons.forEach((b) => { b.textContent = 'SAVE…'; });
    let ok = false;
    try { ok = !!(await player.save?.()); } catch {}
    buttons.forEach((b) => { b.textContent = ok ? 'SAUVÉ ✓' : 'SAVE INDISPO'; });
    setTimeout(() => { els.save.textContent = 'SAVE'; els.portraitSave.textContent = 'SAUVEGARDER'; }, 1500);
  }

  function toggleMute() {
    if (!ci) return;
    muted = !muted;
    muted ? ci.mute() : ci.unmute();
    els.mute.textContent = muted ? 'SON OFF' : 'SON ON';
    els.portraitMute.textContent = muted ? 'SON OFF' : 'SON ON';
  }

  wireJoystick();
  wireHoldButtons();
  wireTapButtons();
  moveControlsForPortrait();
  els.start.addEventListener('click', bootGame);
  els.gameMode.addEventListener('click', enterGameMode);
  els.portraitMode.addEventListener('click', enterGameMode);
  els.menuBtn.addEventListener('click', () => { els.menu.hidden = !els.menu.hidden; wakeHud(); });
  els.hideHud.addEventListener('click', () => { els.hud.classList.add('is-hidden'); els.menu.hidden = true; els.showHud.hidden = false; });
  els.showHud.addEventListener('click', () => { els.hud.classList.remove('is-hidden'); els.showHud.hidden = true; wakeHud(); });
  els.exitMode.addEventListener('click', async () => { try { await document.exitFullscreen?.(); } catch {}; exitGameMode(); });
  els.save.addEventListener('click', saveGame);
  els.portraitSave.addEventListener('click', saveGame);
  els.mute.addEventListener('click', toggleMute);
  els.portraitMute.addEventListener('click', toggleMute);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('game-mode')) exitGameMode(); });
  window.addEventListener('blur', releaseEverything);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseEverything(); });
  window.addEventListener('beforeunload', () => {
    releaseEverything();
    if (bundleObjectUrl) URL.revokeObjectURL(bundleObjectUrl);
    player?.stop?.();
  });
})();
