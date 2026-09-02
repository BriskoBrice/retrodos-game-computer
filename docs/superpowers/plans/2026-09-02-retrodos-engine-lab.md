# RetroDOS Engine Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one isolated Android-first DOOM Shareware lab using EmulatorJS + DOSBox Pure with a working virtual controller, without touching the production catalog.

**Architecture:** `experiments/engine-lab/` contains a self-contained player and data descriptor. EmulatorJS stable assets provide the threaded `dosbox_pure` runtime; Vercel headers enable `SharedArrayBuffer`; a same-origin rewrite proxies the installed shareware ZIP; `AUTORUN.BAT` starts `DOOMWEB.BAT`. Tests are structural Node tests plus manual Android acceptance.

**Tech Stack:** HTML/CSS/vanilla JavaScript, EmulatorJS stable CDN, DOSBox Pure WebAssembly, Vercel static headers/rewrites, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-02-retrodos-engine-lab-design.md`

## Global Constraints

- Work only on branch `engine-lab`.
- Do not modify the production RetroDOS catalog or mark DOOM Touch Ready.
- Do not commit game binaries or commercial game data.
- Use `https://cdn.emulatorjs.org/stable/data/` rather than nightly/pre-release EmulatorJS assets.
- DOSBox Pure runs threaded, requiring COOP `same-origin` and COEP `require-corp`.
- Browser game URL is same-origin `/games/doom-shareware.zip`; deployment rewrites it to the external installed shareware package.
- No Internet Archive iframe or js-dos runtime in this lab.

---

### Task 1: Lab descriptor and configuration contract

**Files:**
- Create: `experiments/engine-lab/config.js`
- Create: `experiments/engine-lab/autorun.bat`
- Create: `tests/engine-lab.test.js`

**Interfaces:**
- Produces: `window.RETRODOS_ENGINE_LAB` with `game`, `emulator`, and `virtualGamepad` fields.
- Produces: `/experiments/engine-lab/autorun.bat`, loaded into `/emulator/c/AUTORUN.BAT` by EmulatorJS.

- [ ] **Step 1: Write the failing contract test**

```js
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
```

- [ ] **Step 2: Run the test and confirm it fails because files do not exist**

Run: `node --test tests/engine-lab.test.js`
Expected: FAIL with `ENOENT` for `experiments/engine-lab/config.js`.

- [ ] **Step 3: Implement minimal descriptor/config**

`config.js` exports one browser global:

```js
window.RETRODOS_ENGINE_LAB = {
  game: {
    id: 'doom-shareware',
    title: 'DOOM Shareware',
    packageUrl: '/games/doom-shareware.zip',
    executable: 'DOOMWEB.BAT',
    rights: 'shareware'
  },
  emulator: {
    core: 'dosbox_pure',
    pathToData: 'https://cdn.emulatorjs.org/stable/data/',
    threads: true,
    externalFiles: {
      '/emulator/c/AUTORUN.BAT': '/experiments/engine-lab/autorun.bat'
    }
  },
  virtualGamepad: [
    { type: 'zone', location: 'left', left: '50%', top: '50%', joystickInput: true, inputValues: [19, 18, 17, 16] },
    { type: 'button', text: 'FIRE', id: 'fire', location: 'right', left: 40, top: 45, bold: true, input_value: 0 },
    { type: 'button', text: 'USE', id: 'use', location: 'right', left: 115, top: 95, bold: true, input_value: 1 },
    { type: 'button', text: 'START', id: 'start', location: 'center', left: 20, fontSize: 14, block: true, input_value: 3 }
  ]
};
```

`autorun.bat`:

```bat
@ECHO OFF
CALL DOOMWEB.BAT
```

- [ ] **Step 4: Run the contract tests**

Run: `node --test tests/engine-lab.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: define EmulatorJS engine lab contract`

---

### Task 2: Threaded deployment and same-origin game source

**Files:**
- Create or modify: `vercel.json`
- Extend: `tests/engine-lab.test.js`

**Interfaces:**
- Consumes browser path: `/games/doom-shareware.zip`.
- Produces required COOP/COEP response headers and external rewrite to `https://image.dosgamesarchive.com/games/doom-box.zip`.

- [ ] **Step 1: Add failing deployment tests**

```js
test('deployment enables SharedArrayBuffer and same-origin Doom proxy', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const headerDump = JSON.stringify(vercel.headers);
  const rewriteDump = JSON.stringify(vercel.rewrites);
  assert.match(headerDump, /Cross-Origin-Opener-Policy/);
  assert.match(headerDump, /same-origin/);
  assert.match(headerDump, /Cross-Origin-Embedder-Policy/);
  assert.match(headerDump, /require-corp/);
  assert.match(rewriteDump, /games\\\/doom-shareware\.zip/);
  assert.match(rewriteDump, /image\.dosgamesarchive\.com\/games\/doom-box\.zip/);
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `node --test tests/engine-lab.test.js`
Expected: FAIL because `vercel.json` is absent or lacks the required fields.

- [ ] **Step 3: Add minimal Vercel configuration**

```json
{
  "headers": [
    {
      "source": "/experiments/engine-lab/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/games/doom-shareware.zip",
      "destination": "https://image.dosgamesarchive.com/games/doom-box.zip"
    }
  ]
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/engine-lab.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add threaded engine lab deployment config`

---

### Task 3: Mobile-first EmulatorJS player

**Files:**
- Create: `experiments/engine-lab/index.html`
- Create: `experiments/engine-lab/styles.css`
- Create: `experiments/engine-lab/app.js`
- Extend: `tests/engine-lab.test.js`

**Interfaces:**
- Consumes: `window.RETRODOS_ENGINE_LAB` from `config.js`.
- Produces: EmulatorJS globals (`EJS_player`, `EJS_gameUrl`, `EJS_core`, `EJS_pathtodata`, `EJS_threads`, `EJS_externalFiles`, `EJS_VirtualGamepadSettings`) before loading stable `loader.js`.
- Produces: visible status element `#runtime-status` and game container `#game`.

- [ ] **Step 1: Add failing UI/runtime tests**

```js
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
  assert.doesNotMatch(html + app, /archive\.org\/embed/i);
  assert.doesNotMatch(html + app, /retrodos-touch-lab\.vercel\.app/i);
  assert.match(css, /@media\s*\(orientation:\s*landscape\)/);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/engine-lab.test.js`
Expected: FAIL because player files do not exist.

- [ ] **Step 3: Build the minimal player**

`app.js` must set documented globals before appending the stable loader:

```js
const cfg = window.RETRODOS_ENGINE_LAB;
const status = document.querySelector('#runtime-status');

if (!crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
  status.textContent = 'ERREUR // isolation navigateur requise';
  status.dataset.state = 'error';
  throw new Error('RetroDOS Engine Lab requires cross-origin isolation');
}

window.EJS_player = '#game';
window.EJS_gameName = cfg.game.title;
window.EJS_gameUrl = cfg.game.packageUrl;
window.EJS_core = cfg.emulator.core;
window.EJS_pathtodata = cfg.emulator.pathToData;
window.EJS_threads = cfg.emulator.threads;
window.EJS_externalFiles = cfg.emulator.externalFiles;
window.EJS_VirtualGamepadSettings = cfg.virtualGamepad;
window.EJS_language = 'fr-FR';
window.EJS_startOnLoaded = false;
window.EJS_startButtonName = 'CHARGER DOOM';
window.EJS_ready = () => { status.textContent = 'MOTEUR // PRÊT'; status.dataset.state = 'ready'; };
window.EJS_onGameStart = () => { status.textContent = 'DOOM // EN COURS'; status.dataset.state = 'running'; };

const loader = document.createElement('script');
loader.src = cfg.emulator.pathToData + 'loader.js';
loader.onerror = () => { status.textContent = 'ERREUR // moteur indisponible'; status.dataset.state = 'error'; };
document.body.appendChild(loader);
```

The HTML/CSS wraps the game in a clean RetroDOS surface with a compact RD-8088 header, 4:3 stage, status line, portrait stack, and landscape layout. Do not add a second custom controller over EmulatorJS; style/reposition the EmulatorJS virtual controller only after the first runtime test proves its DOM is stable.

- [ ] **Step 4: Run lab tests and existing repository tests**

Run: `node --test tests/engine-lab.test.js`
Expected: PASS.

Run: `npm test`
Expected: all existing and new Node tests PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add isolated DOOM DOSBox Pure engine lab`

---

### Task 4: Deployment verification before user testing

**Files:**
- No production files changed unless verification exposes a concrete bug.

**Interfaces:**
- Validates the deployed engine lab only; does not integrate it into the catalog.

- [ ] **Step 1: Verify repository state**

Confirm `engine-lab` contains the plan, config, autorun, player files, tests, and Vercel configuration.

- [ ] **Step 2: Verify all automated tests again**

Run: `npm test`
Expected: zero failures.

- [ ] **Step 3: Verify deployed HTTP requirements**

For the engine-lab URL, confirm response headers include:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Confirm `/games/doom-shareware.zip` returns a successful response and is same-origin from the browser's perspective.

- [ ] **Step 4: Browser smoke test**

Confirm the page reaches the EmulatorJS start surface and does not show an Archive iframe, js-dos overlay, or deployment-probe placeholder. If runtime initialization fails, stop and fix the exact failure before asking for Android testing.

- [ ] **Step 5: Hand off one Android acceptance test**

Only after Steps 1–4 pass, ask the user to test the single engine-lab URL and report movement, turning, FIRE, portrait, and landscape behavior. Do not call the title Touch Ready until those manual checks pass.
