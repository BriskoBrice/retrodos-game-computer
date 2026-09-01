# RetroDOS V3 Hybrid Experience Design

## Goal

Turn RetroDOS Game Computer from a themed prototype into a polished MS-DOS library with a strong fictional-machine identity. V3 must feel immersive on the home/boot surfaces and deliberately modern on the library and player surfaces.

## Product identity

- Public name: **RetroDOS Game Computer**
- Interface short name: **RetroDOS**
- Fictional machine: **RD-8088**
- Principle: **retro in soul, modern in usability**

The RD-8088 is a branding object, not the page layout. V3 removes the hand-built CSS computer from V2. The machine appears through a high-quality, front-facing visual asset in the hero and can later be replaced by a final bespoke render without changing the interface.

## Visual direction

### Hybrid mode

The approved direction is a hybrid:

- home / boot / branding: immersive, nostalgic, cinematic
- library / collections / search: clean, restrained, product-like
- player: immersive but functional, with the game remaining the visual priority

### Palette

Primary theme:

- near-black background
- restrained phosphor green
- warm beige inspired by vintage PC plastics
- amber for secondary actions and system detail
- cool gray-green for body copy

An amber phosphor theme is included as an alternate skin using the same component system.

### Typography

- monospace for wordmark, DOS paths, metadata, labels and compact controls
- readable system/sans stack for descriptions and longer copy
- no external font dependency is required for the prototype

### Effects

- subtle scanlines only
- mild phosphor glow on interactive highlights
- no permanent glitch effects
- no exaggerated CRT distortion on normal content

## Responsive information architecture

### Desktop

A compact left rail provides persistent navigation and machine status. The main content column contains hero, search, featured games, collections and the library.

### Mobile

The left rail becomes a compact top bar plus drawer. The library uses a poster-first two-column grid instead of large vertical cards. Search and genre chips stay easy to reach without dominating the screen.

## Home

The hero contains:

- strong RetroDOS headline and short proposition
- primary action to browse games
- secondary random-game action
- front-facing RD-8088 concept visual
- small system/status details rather than a large statistics table

The hero visual must never be constructed from decorative CSS divs pretending to be a computer.

## Library

The library emphasizes artwork and quick scanning:

- search by title, genre, year, developer, publisher and collection
- genre chips and year filter
- featured / recently played rails
- compact curated collections
- poster-first cards
- favorite action
- Play and Details actions

On mobile, cards remain compact enough for two columns wherever practical.

## Player

The player is a dedicated view.

Desktop:

- 4:3 CRT-framed game area
- compact metadata/info side panel
- action deck below the game

Mobile portrait:

- title and metadata
- large 4:3 player area
- landscape recommendation
- compact action deck
- collapsible touch-command panel

Mobile landscape:

- game area receives most of the viewport
- action deck remains reachable but visually secondary
- optional fullscreen + orientation request through an explicit user action

The iframe source remains `https://archive.org/embed/<archiveId>`.

## Touch controls and keyboard constraints

Internet Archive game embeds are cross-origin iframes. V3 must not pretend that RetroDOS has guaranteed keyboard injection into the emulator.

The V3 touch deck therefore provides:

- Focus game action
- Fullscreen / game mode action
- collapsible command panel
- common key reference: Esc, Enter, Space, Ctrl, Alt, Shift, arrows
- a beta key-attempt path that focuses the iframe and may send a postMessage, clearly labeled as best-effort and potentially ignored by the Archive player
- per-game command metadata can be added later to the catalog

A future direct Emularity/js-dos integration can replace this compatibility layer if true touch-key injection becomes a priority.

## Boot experience

A short boot sequence is retained but reduced to under roughly one second on repeat visits. It shows RD-8088 system lines and a blinking prompt, then yields immediately to the interface.

## Themes

V3 includes:

- Green phosphor (default)
- Amber phosphor

Theme changes affect accents only; layout and readability remain stable.

## Data and persistence

Existing catalog objects and helper functions remain compatible. Favorites and recent history continue in localStorage and should preserve the existing V2 keys when possible.

## Accessibility and usability

- all icon-only buttons receive labels
- visible keyboard focus states
- controls have at least comfortable mobile tap targets
- `prefers-reduced-motion` disables nonessential boot/flicker transitions
- body text does not use glowing effects
- all critical actions remain usable without relying on hover

## Testing

Node tests cover:

- catalog integrity
- archive embed URL creation
- filtering/search behavior
- V3 structural hooks in HTML
- touch-command controls and theme hooks
- absence of the V2 `.computer` / `.hero-computer` fake-PC implementation

Manual device review remains required for visual quality, mobile layout and Internet Archive iframe behavior.
