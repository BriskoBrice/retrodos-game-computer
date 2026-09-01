# RetroDOS Game Computer Roadmap

This roadmap is intentionally simple. The project should grow in clear stages instead of trying to import thousands of games before the experience is ready.

## Phase 1 — RD-8088 identity

- Finalize the RetroDOS Game Computer visual language
- Define the RD-8088 boot / home experience
- Build responsive mobile, tablet and desktop layouts
- Establish CRT green as the primary theme
- Keep amber and blue phosphor variants ready for later

## Phase 2 — Clean web prototype

- Rebuild the current prototype around the new visual identity
- Keep the app framework-free where practical
- Separate catalog data from interface code
- Search and filtering
- Favorites
- Recently played
- Game detail view
- Integrated Internet Archive iframe player
- Fullscreen mode

## Phase 3 — Curated catalog

Target a first high-quality catalog of roughly 50–100 games before attempting mass ingestion.

Metadata should gradually include:

- title
- year
- genre
- developer
- publisher
- description
- collections
- artwork / screenshots
- Internet Archive identifier when available
- control notes

Initial collections may include:

- DOS Legends
- FPS 90s
- Point & Click
- Shareware Classics
- Apogee / 3D Realms
- id Software
- Sierra
- LucasArts
- French DOS games
- Hidden gems

## Phase 4 — Discovery and archival media

- Advanced filters
- Random game / `RANDOM.EXE`
- Related games
- Manuals
- Magazine scans
- Advertisements
- Historical notes
- Preservation-oriented links and metadata

## Phase 5 — Large catalog tooling

Only after the interface and data model are stable:

- catalog import tools
- duplicate detection
- metadata validation
- broken embed detection
- image fallback pipeline
- larger DOS catalog ingestion

## Guiding principle

> eXoDOS inspires catalog depth. Internet Archive can provide playable web items. RetroDOS Game Computer provides the experience.

No commercial game files should be committed to this repository.
