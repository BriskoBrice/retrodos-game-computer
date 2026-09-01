# RetroDOS Fast Hybrid Beta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a useful RetroDOS beta quickly: large searchable MS-DOS catalog, instant Internet Archive playback, and progressively certified touch engines without blocking catalog growth.

**Architecture:** RetroDOS separates catalog, source and engine. Internet Archive remains the default external source/fallback. A game may later opt into a direct touch-capable engine (DOSBox Pure, ScummVM, source port) while keeping the same catalog record and UI.

**Tech Stack:** HTML/CSS/vanilla JavaScript, Internet Archive Advanced Search + embed, experimental WebAssembly DOS engines, localStorage.

**Spec:** Current RetroDOS V3 design plus the hybrid architecture agreed on 2026-09-01.

## Global Constraints

- Keep `main` untouched until user validation; all beta work stays on `dev`.
- No commercial game binaries committed to this repository.
- Internet Archive identifiers/URLs are catalog/source references, not bundled game data.
- Mobile/tablet is first-class; desktop remains supported.
- Catalog growth must not require hand-writing one frontend integration per game.
- Prefer generic input profiles and automatic mappings; per-game overrides are exceptions.
- Always retain Archive Mode when an Archive identifier is available.

---

### Task 1: Fast catalog proof

**Files:**
- Create: `experiments/catalog-beta/index.html`

**Interfaces:**
- Consumes: Internet Archive Advanced Search endpoint and Archive embed URLs.
- Produces: a searchable catalog that merges curated entries with up to 100 Archive results at runtime.

- [x] Add a curated seed list including DOOM, Prince of Persia and Indiana Jones and the Fate of Atlantis.
- [x] Query `collection:softwarelibrary_msdos_games` for 100 entries.
- [x] Deduplicate imported entries by Archive identifier.
- [x] Show Archive/Touch/Catalog badges.
- [x] Launch Archive items inside RetroDOS rather than redirecting away.
- [x] Fall back to the curated local catalog when Archive search is unavailable.

### Task 2: Catalog model extraction

**Files:**
- Planned: `assets/js/catalog-runtime.js`
- Planned test: `tests/catalog-runtime.test.js`

**Interfaces:**
- Consumes: Archive metadata docs.
- Produces: normalized RetroDOS game records with `source`, `play`, `touch`, `languages`, and rights metadata.

- [ ] Write failing tests for normalization, deduplication and source selection.
- [ ] Extract beta inline functions into reusable catalog code.
- [ ] Preserve curated metadata when an imported Archive record matches it.
- [ ] Add pagination/import commands so 100 -> 500 -> 1000 is a data operation, not a UI rewrite.

### Task 3: Engine certification lab

**Files:**
- Planned: `experiments/engine-lab/`

**Interfaces:**
- Consumes: one external game package/source and a generic control profile.
- Produces: `touch-ready` certification data that the main catalog can use.

- [ ] Validate DOSBox Pure/WebAssembly with one FPS using a virtual RetroPad instead of raw DOS key injection.
- [ ] Validate one platform game with the same generic gamepad abstraction.
- [ ] Validate Indiana Jones and the Fate of Atlantis with ScummVM/touchpad semantics.
- [ ] Keep Archive fallback for all three during engine experiments.

### Task 4: First public beta catalog

**Files:**
- Modify: main application catalog/UI only after Tasks 2-3 are proven.

**Interfaces:**
- Consumes: normalized catalog plus engine certifications.
- Produces: first user-facing RetroDOS beta.

- [ ] Start with roughly 100 recognizable DOS titles rather than waiting for full-database perfection.
- [ ] Prefer French releases/metadata where reliably available while keeping the UI/catalog language-neutral.
- [ ] Expose simple statuses: Archive Ready, Touch Ready, Touch Basic, Source Needed.
- [ ] Keep one primary `Jouer` action; engine/source selection remains an implementation detail.
