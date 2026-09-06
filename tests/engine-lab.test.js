const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('experiments/engine-lab/index.html');
const app=read('experiments/engine-lab/app.js');
const loader=read('experiments/engine-lab/source-loader.js');

test('engine lab boots an external installed ZIP instead of inheriting a js-dos bundle profile',()=>{
  assert.match(html,/fflate@0\.8\.2/);
  assert.match(html,/v8\.js-dos\.com\/latest\/js-dos\.js/);
  assert.match(app,/\/games\/doom-shareware\.zip/);
  assert.match(app,/loadInstalledZip/);
  assert.match(app,/initFs:game\.initFs/);
  assert.match(app,/dosboxConf:source\.buildDosboxConf/);
  assert.doesNotMatch(html+app,/bundles\/doom\.jsdos|bundleUpdateConfig|bundleConfig/);
});

test('gameplay input is one RetroDOS FPS profile executed by native js-dos layers',()=>{
  assert.match(html,/fps-profile\.js[\s\S]*source-loader\.js[\s\S]*app\.js/);
  assert.match(app,/createFpsLayers/);
  assert.match(app,/jsdosConf:\{version:'8',layersConfig:layers\}/);
  assert.doesNotMatch(html+app,/sendKeyEvent|MIN_HOLD_MS|data-hold=|data-tap=|id="joystick"/);
});

test('DOOM mouse input is disabled in the source layer so tapping the screen cannot fire',()=>{
  assert.match(loader,/use_mouse:'0'/);
  assert.match(loader,/use_joystick:'0'/);
  assert.match(loader,/patchDoomConfig/);
});

test('js-dos native touch overlay remains interactive',()=>{
  assert.match(html,/\.dos-host \.emulator-mouse-overlay\{display:block!important;visibility:visible!important;pointer-events:auto!important\}/);
});

test('mobile shell keeps portrait, fullscreen, save and mute utilities',()=>{
  for(const id of ['portraitModeBtn','gameModeBtn','gameModeBtnMirror','saveBtn','muteBtn','profileBadge'])assert.match(html,new RegExp(`id="${id}"`));
});
