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

The interface may use DOS-inspired paths such as:

```text
C:\GAMES>        Library
C:\COLLECTIONS>  Collections
C:\FAVORITES>    Favorites
C:\HISTORY>      Recently played
C:\DISCOVER>     Discover
C:\RANDOM.EXE>   Random game
```

These are visual and navigational references only — the experience remains mouse, touch and keyboard friendly.

## Planned features

- Responsive mobile / tablet / desktop interface
- Retro CRT themes with modern readability
- Dynamic game catalog
- Search by title, genre, year, developer and publisher
- Collections and curated selections
- Favorites with `localStorage`
- Recently played history
- Integrated game player
- Fullscreen arcade mode
- Alternative phosphor themes (green / amber / blue)
- Game detail pages
- Optional media sections for manuals, magazines and archival material

## Content architecture

The long-term goal is to keep game metadata separate from the interface so the catalog can grow without turning the frontend into an unmaintainable file.

Example:

```js
{
  title: "Prince of Persia",
  year: 1990,
  genre: "Platform",
  developer: "Brøderbund / Jordan Mechner",
  collection: ["DOS Legends"],
  archiveId: "msdos_Prince_of_Persia_1990"
}
```

## Internet Archive and game files

RetroDOS Game Computer does **not** include commercial game files in this repository.

When a game is playable through an Internet Archive item, the frontend may load the external player through an iframe. Availability, rights and access conditions remain those of the original content and hosting service.

Internet Archive is not affiliated with or responsible for this project.

## Project status

🚧 **Early development / visual redesign in progress.**

The first prototype proved the browser-embed concept. The current focus is the new **RetroDOS Game Computer / RD-8088** visual system and a cleaner catalog architecture before publishing the first proper web build.

## Inspirations

RetroDOS Game Computer is inspired by classic MS-DOS PCs, CRT terminals, retro game launchers, digital preservation projects and large DOS catalog initiatives such as eXoDOS.

The project has its own frontend, identity and architecture and does not redistribute the eXoDOS collection.

---

## Français

**RetroDOS Game Computer** est une bibliothèque web rétro dédiée aux jeux MS-DOS. Le projet prend la forme d'un ordinateur fictif, le **RD-8088**, avec une identité inspirée des vieux PC beige, des écrans CRT et de DOS, tout en conservant une ergonomie moderne.

L'objectif est de construire progressivement une grande bibliothèque navigable et documentée, avec lancement des jeux directement dans la page lorsque des embeds Internet Archive sont disponibles.

---

## License

The source code of RetroDOS Game Computer is released under the [MIT License](LICENSE).
