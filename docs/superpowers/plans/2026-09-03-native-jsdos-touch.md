# Native js-dos Touch Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace RetroDOS Engine Lab's custom keyboard-emission touch layer with the mobile controls already provided by the DOOM js-dos bundle.

**Architecture:** js-dos owns all gameplay touch input. RetroDOS only boots the bundle, detects whether native layers exist, exposes save/sound/fullscreen utilities, and lightly skins the native js-dos controls. No `sendKeyEvent` proxy, hold queue, custom joystick state, or orientation-specific weapon buttons remain.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, js-dos v8 player, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-02-retrodos-engine-lab-design.md`

## Global Constraints

- Work only on branch `engine-lab`.
- Keep the DOOM bundle URL `https://v8.js-dos.com/bundles/doom.jsdos`.
- Do not modify the main RetroDOS catalogue.
- Gameplay input must be delegated to native js-dos bundle layers.
- Keep the RD-8088 boot/download progress experience.

---

### Task 1: Lock the native-input contract with a regression test

**Files:**
- Create: `tests/engine-lab-native-input.test.js`
- Create later in Task 2: `experiments/engine-lab/native-input.js`

**Interfaces:**
- Consumes: js-dos `ci.config()` shape.
- Produces: `hasNativeMobileControls(config): boolean`.

- [ ] **Step 1: Write the failing test**

```js
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/engine-lab-native-input.test.js`
Expected: FAIL because `native-input.js` does not exist and the old app still owns input.

---

### Task 2: Remove the custom input stack and use native bundle layers

**Files:**
- Create: `experiments/engine-lab/native-input.js`
- Modify: `experiments/engine-lab/app.js`
- Modify: `experiments/engine-lab/index.html`
- Delete: `experiments/engine-lab/input-adapter.js`
- Test: `tests/engine-lab-native-input.test.js`

**Interfaces:**
- Consumes: `ci.config()` returned after `ci-ready`.
- Produces: native js-dos mobile layer ownership of gameplay input.

- [ ] **Step 1: Implement `hasNativeMobileControls(config)`**

Accept both current `layersConfig.layers` and legacy `layers` shapes and return true when at least one layer contains controls.

- [ ] **Step 2: Replace `app.js` input logic**

Keep bundle download progress, js-dos boot, save, mute, fullscreen/orientation handling, and first-frame boot dismissal. Remove all custom key queues, custom joystick/button listeners, and raw keyboard emission. On `ci-ready`, inspect `ci.config()` and show `NATIVE ✓` when bundle layers are present.

- [ ] **Step 3: Simplify `index.html`**

Remove RetroDOS custom joystick/action/weapon markup and the `input-adapter.js` script. Keep a small non-gameplay utility bar for fullscreen/save/sound. Update copy from `90MS + BUNDLE MAP` to `JSDOS NATIVE LAYERS`.

- [ ] **Step 4: Add light RetroDOS skin for native controls**

Scope CSS under `.dos-host` and only change visual properties of js-dos control elements; do not change their pointer/touch behavior.

- [ ] **Step 5: Run focused test**

Run: `node --test tests/engine-lab-native-input.test.js`
Expected: PASS.

- [ ] **Step 6: Run full suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 7: Deploy the `engine-lab` preview and verify it returns HTTP 200**

Open the deployed Engine Lab and verify the page boots without JavaScript/build errors. Android gameplay remains the final device validation because browser touch behavior cannot be fully proven by Node tests.
