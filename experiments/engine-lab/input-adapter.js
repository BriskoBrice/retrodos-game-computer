(() => {
  'use strict';

  const FALLBACK = Object.freeze({
    up: [265],
    down: [264],
    left: [263],
    right: [262],
  });

  function getLayers(config) {
    if (!config || typeof config !== 'object') return [];
    if (Array.isArray(config.layers)) return config.layers;
    if (config.layers && Array.isArray(config.layers.layers)) return config.layers.layers;
    if (config.layersConfig && Array.isArray(config.layersConfig.layers)) return config.layersConfig.layers;
    if (config.jsdosConf?.layersConfig && Array.isArray(config.jsdosConf.layersConfig.layers)) {
      return config.jsdosConf.layersConfig.layers;
    }
    return [];
  }

  function findKeyAt(controls, row, column) {
    const control = controls.find((item) => item && item.type === 'Key' && item.row === row && item.column === column);
    if (!control || !Array.isArray(control.mapTo) || !control.mapTo.length) return null;
    return control.mapTo.map(Number).filter(Number.isFinite);
  }

  function extractMovement(config) {
    for (const layer of getLayers(config)) {
      const controls = Array.isArray(layer.controls) ? layer.controls : [];
      const nipple = controls.find((item) => item && item.type === 'NippleActivator');
      if (!nipple) continue;
      const movement = {
        up: findKeyAt(controls, nipple.row - 1, nipple.column),
        down: findKeyAt(controls, nipple.row + 1, nipple.column),
        left: findKeyAt(controls, nipple.row, nipple.column - 1),
        right: findKeyAt(controls, nipple.row, nipple.column + 1),
      };
      if (movement.up && movement.down && movement.left && movement.right) return movement;
    }
    return FALLBACK;
  }

  async function mappedCommandInterface(ci) {
    let movement = FALLBACK;
    try { movement = extractMovement(await ci.config()); } catch {}

    window.__RETRODOS_INPUT_MAP = movement;
    const rawSendKeyEvent = ci.sendKeyEvent.bind(ci);
    const redirect = new Map([
      [265, movement.up],
      [264, movement.down],
      [263, movement.left],
      [262, movement.right],
    ]);

    return new Proxy(ci, {
      get(target, prop) {
        if (prop === 'sendKeyEvent') {
          return (code, pressed) => {
            const mapped = redirect.get(Number(code));
            if (!mapped || !mapped.length) return rawSendKeyEvent(code, pressed);
            for (const mappedCode of new Set(mapped)) rawSendKeyEvent(mappedCode, pressed);
          };
        }
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  const originalDos = window.Dos;
  if (typeof originalDos !== 'function') return;

  function RetroDosMappedDos(root, options = {}) {
    const originalOnEvent = options.onEvent;
    return originalDos(root, {
      ...options,
      onEvent: async (event, arg) => {
        let forwarded = arg;
        if (event === 'ci-ready' && arg) forwarded = await mappedCommandInterface(arg);
        return originalOnEvent?.(event, forwarded);
      },
    });
  }

  Object.assign(RetroDosMappedDos, originalDos);
  window.Dos = RetroDosMappedDos;
})();
