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

Use **EmulatorJS with its `dosbox_pure` core** as the browser runtime for the first lab.

This replaces the earlier plan to build directly on the webЯcade DOS application layer. webЯcade remains a useful reference, but EmulatorJS is the better fit for this experiment because it already exposes the DOSBox Pure core and a documented customizable virtual gamepad. That lets RetroDOS validate the Android control experience without first rebuilding a large emulator wrapper.

Runtime rules:

- use EmulatorJS stable CDN assets rather than nightly/pre-release assets
- run the `dosbox_pure` core with threads enabled
- serve the lab with COOP/COEP headers required by `SharedArrayBuffer`
- keep the game package on a same-origin RetroDOS URL through a server rewrite so threaded cross-origin isolation does not depend on third-party CORS behavior
- use EmulatorJS public/documented configuration only; do not depend on undocumented internal APIs
- keep EmulatorJS/DOSBox Pure attribution and licensing separate from RetroDOS-authored MIT code

## Architecture

The lab has four isolated pieces.

### 1. Runtime adapter

A thin RetroDOS configuration layer around EmulatorJS/DOSBox Pure.

Responsibilities:

- configure the `dosbox_pure` core
- enable threaded execution
- load one approved shareware package through a same-origin URL
- inject a tiny `AUTORUN.BAT` into the DOS filesystem so the installed shareware package launches `DOOMWEB.BAT`
- expose visible loading, ready, started and failure states using documented EmulatorJS callbacks
- keep all runtime-specific globals/configuration out of the production RetroDOS catalog

The main library must not depend directly on EmulatorJS during this lab.

### 2. Virtual controller

The first control path uses EmulatorJS's documented `EJS_VirtualGamepadSettings`, feeding controller inputs into DOSBox Pure rather than attempting to inject keyboard events into a cross-origin iframe.

The FPS lab needs:

- movement D-pad/zone
- primary action / fire
- secondary/use action
- start/menu controls where practical
- no separate RetroDOS HTML keyboard layered above the emulator during this first proof

DOSBox Pure automatic gamepad mapping is allowed to translate the virtual controller into the game's keyboard/mouse controls. If DOOM needs a small explicit mapping adjustment, it belongs in the lab profile rather than the production catalog.

### 3. Touch UI

The active game remains the visual priority.

Portrait:

- 4:3 game viewport at the top
- EmulatorJS virtual controls positioned below/around the play area where possible
- RetroDOS header and compact status only
- no js-dos-style foreign gray control overlay

Landscape:

- game viewport receives most of the screen
- translucent controls remain reachable at the sides/lower edges
- controls should avoid covering the central HUD more than necessary
- no browser-orientation trick is required for basic play

The visual language follows RetroDOS: near-black, phosphor green, restrained amber, subtle borders and no decorative computer shell around the active game.

### 4. Game descriptor

Even though the first lab contains only DOOM, runtime settings live in data.

```js
{
  id: "doom-shareware",
  title: "DOOM",
  engine: "dosbox-pure",
  packageUrl: "/games/doom-shareware.zip",
  upstreamPackage: "https://image.dosgamesarchive.com/games/doom-box.zip",
  executable: "DOOMWEB.BAT",
  touchProfile: "fps",
  language: "en",
  rights: "shareware"
}
```

The configured upstream package is the installed DOSBox-ready shareware distribution identified by DOS Games Archive. The browser requests only the same-origin `/games/doom-shareware.zip` route; deployment configuration rewrites that route to the upstream package.

This descriptor is the seed of the future catalog/runtime resolver but is not connected to the production catalog during this lab.

## Content source rule

The repository must not commit commercial game data and does not commit the DOOM ZIP.

The first lab references the externally hosted **installed shareware** package. The source remains configurable so it can be replaced without changing the player UI. Internet Archive remains a future metadata/source/fallback option, but this direct-runtime lab must not use an Archive iframe.

## Error handling

The lab must visibly distinguish:

- browser lacks required cross-origin isolation / `SharedArrayBuffer`
- package download failure
- EmulatorJS/DOSBox Pure initialization failure
- game boot failure

No false `Touch Ready` status is shown unless all manual success checks pass.

## Testing

Automated checks cover:

- descriptor validation
- stable EmulatorJS configuration
- threaded DOSBox Pure configuration
- required COOP/COEP deployment headers
- same-origin package route and external rewrite
- virtual gamepad structural mapping
- portrait/landscape structural hooks
- absence of Internet Archive iframe usage in the direct-runtime lab
- absence of mutable Vercel probe aliases

Manual acceptance on Android is required for:

1. page opens
2. game package downloads
3. game boots without manual DOS commands
4. menu can be entered
5. player can move forward/back and turn
6. FIRE works while moving
7. portrait controls remain reachable
8. landscape controls remain reachable
9. no js-dos/native gray control overlay remains visible

## Integration gate

The engine lab does not modify the main catalog or mark any title Touch Ready.

Only after the manual acceptance list passes should this runtime path be integrated into RetroDOS and DOOM receive a `Touch Ready` state. The Internet Archive player remains a separate fallback path for non-certified titles.

## Deliberate non-goals

To keep this from becoming another multi-week beta, the first pass does not implement:

- automatic import of DOSBox Pure mappings for thousands of games
- ScummVM
- save synchronization
- multiple game profiles
- a custom controller editor
- Windows 3.1 / Windows 95
- production catalog integration

Those come only after the one-game runtime is proven.