(() => {
  'use strict';

  const BUNDLE_URL = 'https://v8.js-dos.com/bundles/doom.jsdos';
  const core = window.RetroDosControls;
  const $ = (q) => document.querySelector(q);
  const els = {
    dos: $('#dos'), boot: $('#bootOverlay'), start: $('#startBtn'), error: $('#bootError'),
    progress: $('#progressBar'), dataState: $('#dataState'), dataLabel: $('#downloadLabel'), bytes: $('#downloadBytes'),
    engineState: $('#engineState'), inputState: $('#inputState'), command: $('#bootCommand'), status: $('#statusText'),
    gameMode: $('#gameModeBtn'), portraitMode: $('#portraitModeBtn'), hud: $('#gameHud'),
    joystick: $('#joystick'), knob: $('#joystickKnob'), weaponDock: $('#weaponDock'), rightRail: $('.right-rail'),
    mappingSource: $('#mappingSource'), menuBtn: $('#hudMenuBtn'), menu: $('#hudMenu'),
    hideHud: $('#hideHudBtn'), showHud: $('#showHudBtn'), exitMode: $('#exitModeBtn'),
    save: $('#saveBtn'), portraitSave: $('#portraitSaveBtn'), mute: $('#muteBtn'), portraitMute: $('#portraitMuteBtn'),
    portraitJoystickSlot: $('#portraitJoystickSlot'), portraitActionsSlot: $('#portraitActionsSlot'), portraitWeaponsSlot: $('#portraitWeaponsSlot')
  };

  let ci = null;
  let player = null;
  let bundleObjectUrl = null;
  let started = false;
  let muted = false;
  let movementMap = core.extractMovementMap({});
  let actionMap = core.extractActionMap({});
  let joystickKeys = [];
  let joystickPointer = null;
  const keyRefs = new Map();
  const heldByElement = new WeakMap();
  let idleTimer = null;

  function formatBytes(value) {
    if (!Number.isFinite(value) || value <= 0) return '0 B';
    const units = ['B','KB','MB','GB'];
    const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    return `${(value / 1024 ** i).toFixed(i < 2 ? 0 : 1)} ${units[i]}`;
  }

  async function fetchBundleWithProgress(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Téléchargement impossible (${response.status})`);
    const total = Number(response.headers.get('content-length')) || 0;
    if (!response.body) {
      const buffer = await response.arrayBuffer();
      els.progress.style.width = '100%'; els.dataState.textContent = '100%'; els.bytes.textContent = formatBytes(buffer.byteLength);
      return buffer;
    }
    const reader = response.body.getReader();
    const chunks = []; let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); loaded += value.byteLength;
      if (total) {
        const percent = Math.min(100, Math.round(loaded / total * 100));
        els.progress.style.width = `${percent}%`; els.dataState.textContent = `${percent}%`;
        els.bytes.textContent = `${formatBytes(loaded)} / ${formatBytes(total)}`;
      } else {
        els.dataState.textContent = formatBytes(loaded); els.bytes.textContent = formatBytes(loaded);
      }
    }
    const merged = new Uint8Array(loaded); let offset = 0;
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
    els.progress.style.width = '100%'; els.dataState.textContent = 'OK';
    return merged.buffer;
  }

  function keyDown(code) {
    if (!ci) return;
    const count = keyRefs.get(code) || 0;
    keyRefs.set(code, count + 1);
    if (count === 0) ci.sendKeyEvent(code, true);
  }
  function keyUp(code) {
    if (!ci) return;
    const count = keyRefs.get(code) || 0;
    if (count <= 1) { keyRefs.delete(code); ci.sendKeyEvent(code, false); }
    else keyRefs.set(code, count - 1);
  }
  function releaseEverything() {
    if (ci) for (const code of keyRefs.keys()) ci.sendKeyEvent(code, false);
    keyRefs.clear(); joystickKeys = [];
    document.querySelectorAll('.is-pressed').forEach((el) => el.classList.remove('is-pressed'));
    resetJoystickVisual();
  }

  function replaceJoystickKeys(next) {
    const transition = core.keyTransition(joystickKeys, next);
    transition.release.forEach(keyUp); transition.press.forEach(keyDown);
    joystickKeys = next.slice();
  }

  function resetJoystickVisual() {
    if (!els.knob || !els.joystick) return;
    els.knob.style.transform = 'translate(-50%,-50%)';
    els.joystick.classList.remove('is-active');
  }

  function setJoystickFromPointer(event) {
    const rect = els.joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let dx = event.clientX - cx, dy = event.clientY - cy;
    const max = rect.width * .31;
    const distance = Math.hypot(dx, dy);
    if (distance > max) { dx *= max / distance; dy *= max / distance; }
    const direction = core.directionFromVector(dx, dy, max, .20);
    replaceJoystickKeys(direction ? (movementMap[direction] || []) : []);
    els.knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    els.joystick.classList.toggle('is-active', !!direction);
    wakeHud();
  }

  function wireJoystick() {
    els.joystick.addEventListener('pointerdown', (event) => {
      if (!ci || joystickPointer !== null) return;
      event.preventDefault(); joystickPointer = event.pointerId;
      els.joystick.setPointerCapture?.(event.pointerId); setJoystickFromPointer(event); navigator.vibrate?.(5);
    });
    els.joystick.addEventListener('pointermove', (event) => {
      if (event.pointerId !== joystickPointer) return; event.preventDefault(); setJoystickFromPointer(event);
    });
    const end = (event) => {
      if (event.pointerId !== joystickPointer) return; event.preventDefault();
      replaceJoystickKeys([]); joystickPointer = null; resetJoystickVisual(); wakeHud();
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach((name) => els.joystick.addEventListener(name, end));
  }

  function wireHoldButtons() {
    document.querySelectorAll('[data-action]').forEach((button) => {
      const action = button.dataset.action;
      button.addEventListener('pointerdown', (event) => {
        if (!ci || heldByElement.has(button)) return;
        event.preventDefault(); button.setPointerCapture?.(event.pointerId);
        const codes = (actionMap[action] || []).slice(); heldByElement.set(button, { pointerId: event.pointerId, codes });
        codes.forEach(keyDown); button.classList.add('is-pressed'); navigator.vibrate?.(5); wakeHud();
      });
      const release = (event) => {
        const held = heldByElement.get(button); if (!held || held.pointerId !== event.pointerId) return;
        event.preventDefault(); held.codes.forEach(keyUp); heldByElement.delete(button); button.classList.remove('is-pressed'); wakeHud();
      };
      ['pointerup','pointercancel','lostpointercapture'].forEach((name) => button.addEventListener(name, release));
    });
  }

  function wireTapButtons() {
    document.querySelectorAll('[data-tap]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault(); if (!ci) return;
        const code = Number(button.dataset.tap); ci.simulateKeyPress(code); button.classList.add('is-pressed'); navigator.vibrate?.(4);
        setTimeout(() => button.classList.remove('is-pressed'), 110); wakeHud();
      });
    });
  }

  async function deriveMappings() {
    let config = {};
    try { config = await ci.config(); } catch (error) { console.warn('Unable to read js-dos config', error); }
    const layers = core.getLayers(config);
    movementMap = core.extractMovementMap(config); actionMap = core.extractActionMap(config);
    const bundleMapped = layers.some((layer) => Array.isArray(layer.controls) && layer.controls.some((c) => c.type === 'NippleActivator'));
    els.mappingSource.textContent = bundleMapped ? 'BUNDLE NATIF ✓' : 'FPS GÉNÉRIQUE';
    els.inputState.textContent = bundleMapped ? 'BUNDLE MAP' : 'FPS DEFAULT';
    els.inputState.style.color = 'var(--green)';
    console.info('[RetroDOS] movement map', movementMap, 'actions', actionMap, 'source', bundleMapped ? 'bundle' : 'fallback');
  }

  async function bootGame() {
    if (started) return; started = true; els.start.disabled = true; els.error.hidden = true;
    els.status.textContent = 'CHARGEMENT'; els.dataLabel.textContent = 'Téléchargement réel du bundle…';
    els.command.textContent = 'C:\\RETRODOS> FETCH DOOM.JSDOS';
    try {
      const bundle = await fetchBundleWithProgress(BUNDLE_URL);
      els.dataLabel.textContent = 'Données reçues.'; els.dataState.textContent = 'OK'; els.dataState.style.color = 'var(--green)';
      els.engineState.textContent = 'INIT'; els.command.textContent = 'C:\\RETRODOS> INIT DOS ENGINE';
      bundleObjectUrl = URL.createObjectURL(new Blob([bundle], { type: 'application/octet-stream' }));
      player = Dos(els.dos, {
        url: bundleObjectUrl,
        autoStart: true,
        kiosk: true,
        style: 'none',
        noSideBar: true,
        noFullscreen: true,
        noSocialLinks: true,
        backend: 'dosbox', backendLocked: true,
        renderAspect: '4/3', imageRendering: 'pixelated', softFullscreen: false, noCursor: true,
        fsChanges: { local: true, urlToKey: async () => 'retrodos-touch-lab2-doom' },
        onEvent: async (event, arg) => {
          if (event === 'emu-ready') { els.engineState.textContent = 'READY'; els.engineState.style.color = 'var(--green)'; }
          if (event === 'ci-ready') {
            ci = arg; await deriveMappings(); els.status.textContent = 'RUNNING';
            wireRuntimeEvents();
          }
        }
      });
      player.setNoCloud?.(true);
    } catch (error) {
      started = false; els.start.disabled = false; els.status.textContent = 'ERREUR'; els.error.hidden = false;
      els.error.textContent = `Erreur : ${error.message}. Recharge la page et réessaie.`; console.error(error);
    }
  }

  function wireRuntimeEvents() {
    let firstFrame = true;
    ci.events().onFrame(() => {
      if (!firstFrame) return; firstFrame = false;
      els.command.textContent = 'C:\\GAMES\\DOOM> DOOM.EXE';
      setTimeout(() => { els.boot.classList.add('is-hidden'); setTimeout(() => els.boot.classList.add('is-gone'), 560); }, 220);
    });
    ci.events().onExit(() => { releaseEverything(); els.status.textContent = 'STOP'; });
  }

  function moveControlsForPortrait() {
    if (!els.portraitJoystickSlot.contains(els.joystick)) els.portraitJoystickSlot.appendChild(els.joystick);
    const actions = els.rightRail;
    if (!els.portraitActionsSlot.contains(actions)) els.portraitActionsSlot.appendChild(actions);
    if (!els.portraitWeaponsSlot.contains(els.weaponDock)) els.portraitWeaponsSlot.appendChild(els.weaponDock);
  }

  function moveControlsForGameMode() {
    if (!els.hud.contains(els.joystick.parentElement) || !els.joystick.parentElement.classList.contains('left-rail')) {
      let rail = els.hud.querySelector('.left-rail');
      if (!rail) { rail = document.createElement('div'); rail.className = 'left-rail'; els.hud.prepend(rail); }
      rail.appendChild(els.joystick);
    }
    let right = els.hud.querySelector('.right-rail');
    if (!right) { right = els.rightRail; els.hud.appendChild(right); }
    else if (right !== els.rightRail) right.replaceWith(els.rightRail);
    if (!els.hud.contains(els.weaponDock)) els.hud.prepend(els.weaponDock);
  }

  async function enterGameMode() {
    moveControlsForGameMode(); document.body.classList.add('game-mode'); wakeHud();
    try { await document.documentElement.requestFullscreen?.(); } catch {}
    try { await screen.orientation?.lock?.('landscape'); } catch {}
    setTimeout(() => window.scrollTo(0, 0), 50);
  }
  function exitGameMode() {
    releaseEverything(); document.body.classList.remove('game-mode'); els.hud.classList.remove('is-hidden','is-idle');
    els.showHud.hidden = true; els.menu.hidden = true; moveControlsForPortrait();
    try { screen.orientation?.unlock?.(); } catch {}
  }

  function wakeHud() {
    if (!document.body.classList.contains('game-mode')) return;
    els.hud.classList.remove('is-idle'); clearTimeout(idleTimer);
    idleTimer = setTimeout(() => els.hud.classList.add('is-idle'), 2600);
  }

  async function saveGame(buttons) {
    if (!player) return;
    buttons.forEach((b) => b.textContent = 'SAVE…');
    let ok = false; try { ok = !!(await player.save?.()); } catch {}
    buttons.forEach((b) => b.textContent = ok ? 'SAUVÉ ✓' : 'SAVE INDISPO');
    setTimeout(() => { els.save.textContent = 'SAVE'; els.portraitSave.textContent = 'SAUVEGARDER'; }, 1500);
  }
  function toggleMute() {
    if (!ci) return; muted = !muted; muted ? ci.mute() : ci.unmute();
    els.mute.textContent = muted ? 'SON OFF' : 'SON ON'; els.portraitMute.textContent = muted ? 'SON OFF' : 'SON ON';
  }

  wireJoystick(); wireHoldButtons(); wireTapButtons(); moveControlsForPortrait();
  els.start.addEventListener('click', bootGame); els.gameMode.addEventListener('click', enterGameMode); els.portraitMode.addEventListener('click', enterGameMode);
  els.menuBtn.addEventListener('click', () => { els.menu.hidden = !els.menu.hidden; els.menuBtn.setAttribute('aria-expanded', String(!els.menu.hidden)); wakeHud(); });
  els.hideHud.addEventListener('click', () => { els.hud.classList.add('is-hidden'); els.menu.hidden = true; els.showHud.hidden = false; });
  els.showHud.addEventListener('click', () => { els.hud.classList.remove('is-hidden'); els.showHud.hidden = true; wakeHud(); });
  els.exitMode.addEventListener('click', async () => { try { await document.exitFullscreen?.(); } catch {}; exitGameMode(); });
  els.save.addEventListener('click', () => saveGame([els.save, els.portraitSave])); els.portraitSave.addEventListener('click', () => saveGame([els.save, els.portraitSave]));
  els.mute.addEventListener('click', toggleMute); els.portraitMute.addEventListener('click', toggleMute);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('game-mode')) exitGameMode(); });
  document.addEventListener('pointerdown', wakeHud, { passive: true }); window.addEventListener('blur', releaseEverything);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseEverything(); });
  window.addEventListener('beforeunload', () => { releaseEverything(); if (bundleObjectUrl) URL.revokeObjectURL(bundleObjectUrl); player?.stop?.(); });
})();
