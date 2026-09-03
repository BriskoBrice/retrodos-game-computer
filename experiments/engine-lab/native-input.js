(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetroDOSNativeInput = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normalizeLayers(config) {
    const jsdosConf = config && config.jsdosConf ? config.jsdosConf : (config || {});
    const source = jsdosConf.layersConfig !== undefined ? jsdosConf.layersConfig : jsdosConf.layers;
    if (!source) return [];
    if (Array.isArray(source)) return source;
    if (Array.isArray(source.layers)) return source.layers;
    if (typeof source === 'object') return Object.values(source).filter((value) => value && typeof value === 'object');
    return [];
  }

  function hasNativeMobileControls(config) {
    return normalizeLayers(config).some((layer) => Array.isArray(layer.controls) && layer.controls.length > 0);
  }

  return { normalizeLayers, hasNativeMobileControls };
});
