(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RetroDosControls = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_MOVEMENT = Object.freeze({
    up: [265],
    'up-right': [265, 262],
    right: [262],
    'down-right': [264, 262],
    down: [264],
    'down-left': [264, 263],
    left: [263],
    'up-left': [265, 263]
  });

  const DEFAULT_ACTIONS = Object.freeze({
    fire: [341],
    use: [32],
    run: [340],
    strafe: [342]
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
    return control && Array.isArray(control.mapTo) && control.mapTo.length ? control.mapTo.slice() : null;
  }

  function extractMovementMap(config) {
    for (const layer of getLayers(config)) {
      const controls = Array.isArray(layer.controls) ? layer.controls : [];
      const nipple = controls.find((item) => item && item.type === 'NippleActivator');
      if (!nipple) continue;
      const r = nipple.row;
      const c = nipple.column;
      const candidate = {
        up: findKeyAt(controls, r - 1, c),
        'up-right': findKeyAt(controls, r - 1, c + 1),
        right: findKeyAt(controls, r, c + 1),
        'down-right': findKeyAt(controls, r + 1, c + 1),
        down: findKeyAt(controls, r + 1, c),
        'down-left': findKeyAt(controls, r + 1, c - 1),
        left: findKeyAt(controls, r, c - 1),
        'up-left': findKeyAt(controls, r - 1, c - 1)
      };
      if (candidate.up && candidate.down && candidate.left && candidate.right) {
        const out = {};
        for (const key of Object.keys(DEFAULT_MOVEMENT)) out[key] = candidate[key] || DEFAULT_MOVEMENT[key].slice();
        return out;
      }
    }
    const fallback = {};
    for (const [key, value] of Object.entries(DEFAULT_MOVEMENT)) fallback[key] = value.slice();
    return fallback;
  }

  function extractActionMap(config) {
    const found = {};
    const desired = { fire: 341, use: 32, run: 340, strafe: 342 };
    for (const layer of getLayers(config)) {
      const controls = Array.isArray(layer.controls) ? layer.controls : [];
      for (const control of controls) {
        if (!control || control.type !== 'Key' || !Array.isArray(control.mapTo)) continue;
        for (const [name, code] of Object.entries(desired)) {
          if (!found[name] && control.mapTo.includes(code)) found[name] = control.mapTo.slice();
        }
      }
    }
    return {
      fire: found.fire || DEFAULT_ACTIONS.fire.slice(),
      use: found.use || DEFAULT_ACTIONS.use.slice(),
      run: found.run || DEFAULT_ACTIONS.run.slice(),
      strafe: found.strafe || DEFAULT_ACTIONS.strafe.slice()
    };
  }

  function directionFromVector(dx, dy, radius, deadZoneRatio = 0.18) {
    const distance = Math.hypot(dx, dy);
    if (!radius || distance < radius * deadZoneRatio) return null;
    let degrees = Math.atan2(-dy, dx) * 180 / Math.PI;
    if (degrees < 0) degrees += 360;
    const index = Math.round(degrees / 45) % 8;
    return ['right', 'up-right', 'up', 'up-left', 'left', 'down-left', 'down', 'down-right'][index];
  }

  function keyTransition(previous, next) {
    const prev = new Set(previous || []);
    const nxt = new Set(next || []);
    return {
      release: [...prev].filter((code) => !nxt.has(code)),
      press: [...nxt].filter((code) => !prev.has(code))
    };
  }

  return { DEFAULT_MOVEMENT, DEFAULT_ACTIONS, getLayers, extractMovementMap, extractActionMap, directionFromVector, keyTransition };
});
