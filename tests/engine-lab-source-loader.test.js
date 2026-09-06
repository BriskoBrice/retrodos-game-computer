const test=require('node:test');
const assert=require('node:assert/strict');
const source=require('../experiments/engine-lab/source-loader.js');

test('source loader finds the DOSBox configured DOOM launcher regardless of case',()=>{
  assert.equal(source.findExecutable(['DOOM/doom.exe','DOOM/DoomWeb.Bat'],'DOOMWEB.BAT'),'DOOM/DoomWeb.Bat');
});

test('DOOM config patch disables mouse and preserves existing settings',()=>{
  const out=source.patchDoomConfig('sfx_volume 8\r\nuse_mouse 1\r\nkey_up 173\r\n');
  assert.match(out,/sfx_volume 8/);
  assert.match(out,/use_mouse\s+0/i);
  assert.match(out,/use_joystick\s+0/i);
  assert.match(out,/key_up\s+173/i);
  assert.match(out,/key_fire\s+157/i);
});

test('DOSBox config mounts the in-memory files and launches the configured package',()=>{
  const conf=source.buildDosboxConf('DOOM/DOOMWEB.BAT');
  assert.match(conf,/mount c \.\n/i);
  assert.match(conf,/cd DOOM/i);
  assert.match(conf,/DOOMWEB\.BAT/i);
});
