const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('experiments/engine-lab/index.html');
const app = read('experiments/engine-lab/app.js');

test('engine lab keeps the proven js-dos runtime and DOOM bundle', () => {
  assert.match(html, /v8\.js-dos\.com\/latest\/js-dos\.js/);
  assert.match(app, /v8\.js-dos\.com\/bundles\/doom\.jsdos/);
  assert.match(app, /player\s*=\s*Dos\(/);
  assert.doesNotMatch(html + app, /archive\.org\/embed/i);
});

test('gameplay input belongs to native js-dos layers', () => {
  assert.match(html, /native-input\.js[\s\S]*app\.js/);
  assert.match(app, /ci\.config\(\)/);
  assert.match(app, /hasNativeMobileControls/);
  assert.doesNotMatch(html + app, /input-adapter\.js|sendKeyEvent|MIN_HOLD_MS|data-hold=|data-tap=|id="joystick"/);
});

test('shared CSS no longer blocks the js-dos touch overlay', () => {
  assert.match(html, /\.lab \.dos-host \.emulator-mouse-overlay\{display:block!important;visibility:visible!important;pointer-events:auto!important\}/);
});

test('mobile UI keeps boot unclipped and preserves fullscreen utilities', () => {
  assert.match(html, /position:fixed;inset:68px 0 0/);
  assert.match(html, /id="portraitModeBtn"/);
  assert.match(html, /id="gameModeBtn"/);
  assert.match(html, /id="saveBtn"/);
  assert.match(html, /id="muteBtn"/);
});

test('native control skin changes visuals only', () => {
  assert.match(html, /\.dos-host \.emulator-button\{/);
  assert.match(html, /\.dos-host \.front\{/);
  assert.doesNotMatch(html, /\.dos-host \.emulator-button[^}]*pointer-events/);
});
