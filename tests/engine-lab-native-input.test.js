const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const nativeInput = require('../experiments/engine-lab/native-input.js');

test('detects native v8 and legacy js-dos mobile layers', () => {
  assert.equal(nativeInput.hasNativeMobileControls({ jsdosConf: { layersConfig: { version: 2, layers: [{ controls: [{ type: 'NippleActivator' }] }] } } }), true);
  assert.equal(nativeInput.hasNativeMobileControls({ jsdosConf: { layers: [{ controls: [{ type: 'Key' }] }] } }), true);
  assert.equal(nativeInput.hasNativeMobileControls({ jsdosConf: {} }), false);
});

test('engine lab delegates gameplay input to js-dos', () => {
  const root = path.join(__dirname, '..');
  const app = fs.readFileSync(path.join(root, 'experiments/engine-lab/app.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'experiments/engine-lab/index.html'), 'utf8');
  assert.doesNotMatch(app, /sendKeyEvent|MIN_HOLD_MS|queueKey|wireJoystick|wireHoldButtons|wireTapButtons/);
  assert.doesNotMatch(html, /input-adapter\.js|data-hold=|data-tap=|id="joystick"/);
  assert.match(app, /hasNativeMobileControls/);
  assert.match(html, /emulator-mouse-overlay\{display:block!important;visibility:visible!important;pointer-events:auto!important\}/);
});
