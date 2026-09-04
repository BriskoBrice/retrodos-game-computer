(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetroDOSFPSProfile = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const KEY = Object.freeze({
    UP: 265, DOWN: 264, LEFT: 263, RIGHT: 262,
    CTRL: 341, SHIFT: 340, ALT: 342, SPACE: 32,
    ESC: 256, ENTER: 257, TAB: 258,
  });

  const key = (row, column, symbol, mapTo) => ({ row, column, symbol, type: 'Key', mapTo: [...mapTo] });

  function createFpsLayers() {
    const controls = [
      key(0, 1, '1', [49]), key(0, 2, '2', [50]), key(0, 3, '3', [51]),
      key(0, 4, '4', [52]), key(0, 5, '5', [53]), key(0, 6, '6', [54]), key(0, 7, '7', [55]),
      key(1, 8, 'ESC', [KEY.ESC]), key(1, 9, 'ENTER', [KEY.ENTER]),

      key(3, 1, '', [KEY.UP, KEY.LEFT]), key(3, 2, '', [KEY.UP]), key(3, 3, '', [KEY.UP, KEY.RIGHT]),
      key(4, 1, '', [KEY.LEFT]), { row: 4, column: 2, symbol: '', type: 'NippleActivator' }, key(4, 3, '', [KEY.RIGHT]),
      key(5, 1, '', [KEY.DOWN, KEY.LEFT]), key(5, 2, '', [KEY.DOWN]), key(5, 3, '', [KEY.DOWN, KEY.RIGHT]),

      key(3, 8, 'FIRE', [KEY.CTRL]), key(3, 9, 'STRAFE', [KEY.ALT]),
      key(4, 8, 'USE', [KEY.SPACE]), key(4, 9, 'RUN', [KEY.SHIFT]),
      key(5, 8, 'MAP', [KEY.TAB]),
    ];

    return {
      version: 2,
      layers: [{ grid: 'square', title: 'RetroDOS FPS', controls }],
    };
  }

  function getJsDosConf(config) {
    if (!config || typeof config !== 'object') return null;
    if (!config.jsdosConf || typeof config.jsdosConf !== 'object') config.jsdosConf = {};
    return config.jsdosConf;
  }

  function applyFpsProfile(config) {
    const jsdosConf = getJsDosConf(config);
    if (!jsdosConf) throw new Error('Bundle js-dos invalide');
    jsdosConf.version = jsdosConf.version || '8';
    delete jsdosConf.layers;
    jsdosConf.layersConfig = createFpsLayers();
    return config;
  }

  function hasFpsProfile(config) {
    const jsdosConf = config && config.jsdosConf ? config.jsdosConf : config;
    const layers = jsdosConf?.layersConfig?.layers;
    return Array.isArray(layers) && layers.length === 1 && layers[0]?.title === 'RetroDOS FPS' &&
      layers[0].controls?.some((control) => control.type === 'NippleActivator') &&
      layers[0].controls?.some((control) => control.symbol === 'FIRE' && control.mapTo?.[0] === KEY.CTRL);
  }

  return { KEY, createFpsLayers, applyFpsProfile, hasFpsProfile };
});
