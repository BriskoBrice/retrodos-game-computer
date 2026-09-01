# RetroDOS Game Computer

> **The RD-8088 — MS-DOS in your browser.**

RetroDOS Game Computer is a retro-inspired web frontend for discovering and playing classic MS-DOS games directly in the browser.

The project is designed as a fictional vintage computer — the **RD-8088** — combining the atmosphere of beige PCs, CRT displays and DOS terminals with the usability of a modern game library.

## Vision

RetroDOS Game Computer is not meant to be a simple list of links. The goal is to create a polished, immersive DOS library that feels like using a lost computer from the 1990s:

- CRT / phosphor-inspired visual identity
- searchable and filterable DOS game library
- game pages with metadata, artwork and descriptions
- in-page game launching through Internet Archive embeds when available
- favorites and recently played games stored locally
- curated collections such as **DOS Legends**, **FPS 90s**, **Point & Click**, **Shareware Classics** and more
- future support for manuals, magazine scans and other preservation-oriented media

## The RD-8088

The **RD-8088** is the fictional machine at the heart of the interface.

```text
RETRODOS GAME COMPUTER
RD-8088

MEMORY TEST........ 640K OK
GAME LIBRARY....... ONLINE
ARCHIVE LINK....... ONLINE

C:\> _
```

The interface uses DOS-inspired paths such as:

```text
C:\GAMES>        Library
C:\COLLECTIONS>  Collections
C:\FAVORITES>    Favorites
C:\HISTORY>      Recently played
C:\DISCOVER>     Discover
C:\RANDOM.EXE>   Random game
```

These are visual and navigational references only — the experience remains mouse, touch and keyboard friendly.

## Current V2 build

The active development branch is **`dev`**. It now contains the first complete RD-8088 interface rebuild:

- responsive mobile / tablet / desktop layout
- CSS-drawn beige RD-8088 computer hero
- short boot sequence with reduced-motion support
- 20-game curated catalog stored separately from the UI
- search by title, genre, year, developer, publisher and collection
- genre and year filters
- persistent favorites and recently played history
- curated collection cards
- `RANDOM.EXE` discovery action
- game detail view with related titles
- lazy Internet Archive iframe loading only after pressing **Play**
- browser fullscreen with an arcade-layout fallback
- keyboard shortcuts (`/`, `F`, `Escape`)
- automated Node tests for catalog and core behavior

## Run locally

No production build step is required.

```bash
git checkout dev
python -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

Run the automated checks with:

```bash
npm test
```

## Planned features

- Larger curated catalog (50–100 high-quality entries first)
- Alternative phosphor themes (amber / blue)
- Richer game detail metadata and control notes
- Manuals, magazines and archival media where appropriate
- Advanced filters and discovery tools
- Catalog import and validation tooling only after the data model is stable

## Content architecture

Game metadata is intentionally separated from the interface so the catalog can grow without turning the frontend into an unmaintainable file.

Example:

```js
{
  title: "Prince of Persia",
  year: 1990,
  genre: "Platform",
  developer: "Jordan Mechner",
  publisher: "Broderbund",
  collections: ["DOS Legends"],
  archiveId: "msdos_Prince_of_Persia_1990"
}
```

## Internet Archive and game files

RetroDOS Game Computer does **not** include commercial game files in this repository.

When a game is playable through an Internet Archive item, the frontend may load the external player through an iframe. Availability, rights and access conditions remain those of the original content and hosting service.

Internet Archive is not affiliated with or responsible for this project.

## Project status

🚧 **Active development — RD-8088 V2 is available on `dev`.**

`main` remains the stable project/documentation branch until the V2 interface has been visually reviewed and approved.

## Inspirations

RetroDOS Game Computer is inspired by classic MS-DOS PCs, CRT terminals, retro game launchers, digital preservation projects and large DOS catalog initiatives such as eXoDOS.

The project has its own frontend, identity and architecture and does not redistribute the eXoDOS collection.

---

## Français

**RetroDOS Game Computer** est une bibliothèque web rétro dédiée aux jeux MS-DOS. Le projet prend la forme d'un ordinateur fictif, le **RD-8088**, avec une identité inspirée des vieux PC beige, des écrans CRT et de DOS, tout en conservant une ergonomie moderne.

La nouvelle interface V2 est développée sur la branche **`dev`**. Elle intègre déjà la recherche, les filtres, les favoris, l'historique, les collections, les fiches jeux et le lecteur Internet Archive directement dans la page.

---

## License

The source code of RetroDOS Game Computer is released under the [MIT License](LICENSE).
