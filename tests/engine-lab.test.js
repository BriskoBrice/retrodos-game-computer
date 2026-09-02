const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('experiments/engine-lab/index.html');
const app = read('experiments/engine-lab/app.js');

test('engine lab returns to the proven js-dos runtime', () => {
  assert.match(html, /v8\.js-dos\.com\/latest\/js-dos\.js/);
  assert.match(app, /v8\.js-dos\.com\/bundles\/doom\.jsdos/);
  assert.match(app, /player\s*=\s*Dos\(/);
  assert.doesNotMatch(html + app, /archive\.org\/embed/i);
});

test('DOOM touch keys use the proven mobile key codes', () => {
  assert.match(app, /UP:\s*265/);
  assert.match(app, /DOWN:\s*264/);
  assert.match(app, /LEFT:\s*263/);
  assert.match(app, /RIGHT:\s*262/);
  assert.match(html, /data-hold="341"/);
  assert.match(html, /data-hold="32"/);
  assert.match(html, /data-hold="340"/);
  assert.match(html, /data-hold="342"/);
});

test('key release is serialized and held at least 90ms', () => {
  assert.match(app, /MIN_HOLD_MS\s*=\s*90/);
  assert.match(app, /keyChains\s*=\s*new Map/);
  assert.match(app, /ci\.sendKeyEvent\(code, true\)/);
  assert.match(app, /await wait\(MIN_HOLD_MS - heldFor\)/);
  assert.match(app, /ci\.sendKeyEvent\(code, false\)/);
});

test('mobile UI keeps boot unclipped and exposes portrait + landscape controls', () => {
  assert.match(html, /position:fixed;inset:68px 0 0/);
  assert.match(html, /id="joystick"/);
  assert.match(html, /id="portraitModeBtn"/);
  assert.match(html, /id="gameModeBtn"/);
  assert.match(html, /data-tap="49"/);
  assert.match(html, /data-tap="55"/);
});
