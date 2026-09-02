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
