const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('engine lab uses threaded stable EmulatorJS DOSBox Pure', () => {
  const config = read('experiments/engine-lab/config.js');
  assert.match(config, /dosbox_pure/);
  assert.match(config, /cdn\.emulatorjs\.org\/stable\/data\//);
  assert.match(config, /threads:\s*true/);
  assert.match(config, /\/games\/doom-shareware\.zip/);
  assert.match(config, /DOOMWEB\.BAT/);
});

test('engine lab defines a virtual gamepad and autorun', () => {
  const config = read('experiments/engine-lab/config.js');
  const autorun = read('experiments/engine-lab/autorun.bat');
  assert.match(config, /virtualGamepad/);
  assert.match(config, /type:\s*['"](?:zone|dpad)['"]/);
  assert.match(config, /input_value/);
  assert.match(autorun, /DOOMWEB\.BAT/i);
});

test('deployment enables SharedArrayBuffer and same-origin Doom proxy', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const headerDump = JSON.stringify(vercel.headers);
  const rewriteDump = JSON.stringify(vercel.rewrites);
  assert.match(headerDump, /Cross-Origin-Opener-Policy/);
  assert.match(headerDump, /same-origin/);
  assert.match(headerDump, /Cross-Origin-Embedder-Policy/);
  assert.match(headerDump, /require-corp/);
  assert.match(rewriteDump, /doom-shareware\.zip/);
  assert.match(rewriteDump, /image\.dosgamesarchive\.com\/games\/doom-box\.zip/);
});

test('lab page loads EmulatorJS directly and has mobile hooks', () => {
  const html = read('experiments/engine-lab/index.html');
  const app = read('experiments/engine-lab/app.js');
  const css = read('experiments/engine-lab/styles.css');
  assert.match(html, /id="game"/);
  assert.match(html, /id="runtime-status"/);
  assert.match(html, /config\.js/);
  assert.match(html, /app\.js/);
  assert.match(app, /EJS_player/);
  assert.match(app, /EJS_VirtualGamepadSettings/);
  assert.match(app, /loader\.js/);
  assert.match(app, /crossOriginIsolated/);
  assert.doesNotMatch(html + app, /archive\.org\/embed/i);
  assert.doesNotMatch(html + app, /retrodos-touch-lab\.vercel\.app/i);
  assert.match(css, /@media\s*\(orientation:\s*landscape\)/);
});
