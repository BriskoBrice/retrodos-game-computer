# RetroDOS Engine Lab Design

## Goal

Validate one mobile-first DOS runtime that RetroDOS can trust before integrating it into the main library.

The lab is deliberately small: one game, one runtime, one touch profile, no catalog integration. Success means the game launches in-browser and is genuinely playable on Android in both portrait and landscape.

## Scope

First validation title: **DOOM Shareware**.

The lab must prove:

- direct browser loading without an Internet Archive iframe
- DOSBox Pure-based execution in WebAssembly
- reliable touch/gamepad-style input
- movement and firing at minimum
- usable portrait layout
- usable landscape layout
- fullscreen behavior that does not destroy the controls
- clear loading / failure states

The lab does not need favorites, collections, search, game details, themes, manuals, cloud saves, or a large catalog.

## Recommended technical approach

Use the open-source webЯcade DOS application as the reference implementation for running a modified DOSBox Pure core in the browser, but keep the RetroDOS lab isolated from the existing V3 UI.

Why this route:

- webЯcade already runs DOSBox Pure in the browser
- its emulator wrapper exposes keyboard, mouse and controller paths instead of relying on a cross-origin iframe
- it already understands archive-based DOS content and autostart paths
- DOSBox Pure provides the long-term path toward automatic gamepad mappings rather than per-game HTML key injection

The first lab may reuse or adapt Apache-2.0 webЯcade application-layer code where appropriate. DOSBox Pure itself remains under GPL-2.0-or-later, so bundled core/runtime files and attribution must remain clearly separated from RetroDOS MIT-authored code. No license change to the whole RetroDOS repository is assumed by this lab.

## Architecture

The lab has four isolated pieces.

### 1. Runtime adapter

A thin RetroDOS wrapper around the DOSBox Pure web runtime.

Responsibilities:

- initialize the WebAssembly runtime
- load one approved shareware package
- mount/extract content
- configure an autostart executable or command
- expose runtime-ready / game-running / error events
- expose a small input interface to the UI

The rest of RetroDOS must not depend on webЯcade internals directly.

### 2. Virtual controller

RetroDOS touch controls behave like a normalized game controller, not like a collection of DOM buttons manually dispatching keyboard events.

Normalized controls for the FPS lab:

- movement axis / D-pad
- primary action
- secondary/use action
- run modifier
- strafe modifier
- Start / Enter
- Back / Escape
- optional weapon strip 1–7 only if required for the first DOOM test

Where possible, the adapter feeds controller state into the same controller path used by the DOSBox Pure/webЯcade runtime. Keyboard injection is fallback-only for menu navigation or missing mappings.

### 3. Touch UI

Portrait:

- 4:3 game viewport at the top
- compact joystick on the lower left
- FIRE / USE / RUN on the lower right
- small secondary row for menu / optional weapons
- no js-dos-style floating gray controls

Landscape:

- 4:3 game viewport centered and as large as possible
- translucent joystick in the left margin / lower-left edge
- translucent actions in the right margin / lower-right edge
- controls never cover the central HUD more than necessary
- no browser-orientation trick is required for the game to remain usable

The visual language follows RetroDOS: near-black, phosphor green, restrained amber, no decorative computer shell around the active game.

### 4. Game descriptor

Even though the first lab contains only DOOM, runtime settings live in data rather than hard-coded throughout the UI.

Example shape:

```js
{
  id: "doom-shareware",
  title: "DOOM",
  engine: "dosbox-pure",
  packageUrl: "...",
  autoStartPath: "...",
  controllerMode: "gamepad",
  touchProfile: "fps",
  language: "en",
  rights: "shareware"
}
```

This is the seed of the future catalog/runtime resolver but is not connected to the production catalog during this lab.

## Content source rule

The repository must not commit commercial game data.

For the first lab, use a redistributable/shareware DOOM package or another source whose redistribution terms are suitable for testing. Internet Archive may remain a source of metadata or externally hosted files later, but the lab must not depend on an Archive iframe.

## Error handling

The lab must visibly distinguish:

- package download failure
- WebAssembly/runtime initialization failure
- game boot failure
- unsupported input path

No false `Touch Ready` status is shown unless all success checks pass.

## Testing

Automated checks should cover:

- descriptor validation
- runtime adapter state transitions
- normalized controller state generation
- portrait/landscape structural hooks
- absence of Internet Archive iframe usage in the direct-runtime lab
- absence of accidental links to mutable Vercel probe aliases

Manual acceptance on Android is required for:

1. page opens
2. game package downloads
3. game boots
4. menu can be entered
5. player can move forward/back and turn
6. FIRE works while moving
7. portrait controls remain reachable
8. landscape controls remain reachable
9. no foreign/native control overlay remains visible

## Integration gate

The engine lab does not modify the main catalog or mark any title Touch Ready.

Only after the manual acceptance list passes should the runtime adapter be integrated into RetroDOS and DOOM receive a `Touch Ready` state. The Internet Archive player remains a separate fallback path for non-certified titles.

## Deliberate non-goals

To keep this from becoming another multi-week beta, the first pass does not implement:

- automatic import of DOSBox Pure mappings for thousands of games
- ScummVM
- save synchronization
- multiple game profiles
- gamepad configuration UI
- Windows 3.1 / Windows 95
- production catalog integration

Those come only after the one-game runtime is proven.