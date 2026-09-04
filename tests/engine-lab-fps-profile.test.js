const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const profile = require('../experiments/engine-lab/fps-profile.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('FPS profile owns one native layer with an 8-direction joystick', () => {
  const layers = profile.createFpsLayers();
  assert.equal(layers.version, 2);
  assert.equal(layers.layers.length, 1);
  const controls = layers.layers[0].controls;
  assert.equal(controls.filter(c => c.type === 'NippleActivator').length, 1);
  const byCell = new Map(controls.map(c => [`${c.row}:${c.column}`, c]));
  assert.deepEqual(byCell.get('3:2').mapTo, [265]);
  assert.deepEqual(byCell.get('5:2').mapTo, [264]);
  assert.deepEqual(byCell.get('4:1').mapTo, [263]);
  assert.deepEqual(byCell.get('4:3').mapTo, [262]);
  assert.deepEqual(byCell.get('3:1').mapTo, [265, 263]);
  assert.deepEqual(byCell.get('3:3').mapTo, [265, 262]);
  assert.deepEqual(byCell.get('5:1').mapTo, [264, 263]);
  assert.deepEqual(byCell.get('5:3').mapTo, [264, 262]);
});

test('FPS profile exposes actions and weapons directly with no pointer-fire or hidden layer switch', () => {
  const controls = profile.createFpsLayers().layers[0].controls;
  const types = new Set(controls.map(c => c.type));
  assert.equal(types.has('PointerButton'), false);
  assert.equal(types.has('Switch'), false);
  const bySymbol = new Map(controls.map(c => [c.symbol, c]));
  assert.deepEqual(bySymbol.get('FIRE').mapTo, [341]);
  assert.deepEqual(bySymbol.get('USE').mapTo, [32]);
  assert.deepEqual(bySymbol.get('RUN').mapTo, [340]);
  assert.deepEqual(bySymbol.get('STRAFE').mapTo, [342]);
  for (let n = 1; n <= 7; n++) assert.deepEqual(bySymbol.get(String(n)).mapTo, [48 + n]);
});

test('applyFpsProfile replaces bundle mobile controls instead of merging them', () => {
  const config = { dosboxConf: '[autoexec]', jsdosConf: { version: '8', layers: [{ title: 'old' }], layersConfig: { version: 2, layers: [{ title: 'old2', controls: [] }] }, keep: true } };
  const result = profile.applyFpsProfile(config);
  assert.equal(result, config);
  assert.equal(result.jsdosConf.keep, true);
  assert.equal('layers' in result.jsdosConf, false);
  assert.equal(result.jsdosConf.layersConfig.layers[0].title, 'RetroDOS FPS');
  assert.equal(profile.hasFpsProfile(result), true);
});

test('engine lab rewrites the downloaded bundle before booting js-dos', () => {
  const html = read('experiments/engine-lab/index.html');
  const app = read('experiments/engine-lab/app.js');
  assert.match(html, /emulators\/emulators\.js/);
  assert.match(html, /fps-profile\.js[\s\S]*app\.js/);
  assert.match(app, /bundleConfig/);
  assert.match(app, /bundleUpdateConfig/);
  assert.match(app, /applyFpsProfile/);
  assert.match(app, /hasFpsProfile/);
  assert.doesNotMatch(html + app, /native-input\.js|RetroDOSNativeInput/);
});
