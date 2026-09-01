const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../assets/js/core.js');

const games = [
  { id: 'doom', title: 'DOOM', year: 1993, genre: 'FPS', developer: 'id Software', archiveId: 'msdos_DOOM_1993' },
  { id: 'pop', title: 'Prince of Persia', year: 1990, genre: 'Plateforme', developer: 'Broderbund', archiveId: 'msdos_Prince_of_Persia_1990' }
];

test('normalizeText removes accents and case', () => {
  assert.equal(core.normalizeText('Légendes DOS'), 'legendes dos');
});

test('filterGames combines search, genre and year', () => {
  assert.deepEqual(core.filterGames(games, { query: 'id', genre: 'FPS', year: '1993' }).map(g => g.id), ['doom']);
});

test('archive helpers create embed and image URLs', () => {
  assert.equal(core.buildArchiveEmbedUrl(games[0]), 'https://archive.org/embed/msdos_DOOM_1993');
  assert.equal(core.buildArchiveImageUrl(games[0]), 'https://archive.org/services/img/msdos_DOOM_1993');
});

test('filterGames searches collection and description metadata', () => {
  const enriched = [{ ...games[0], description: 'FPS révolutionnaire', collections: ['Légendes DOS'] }];
  assert.equal(core.filterGames(enriched, { query: 'legendes' }).length, 1);
  assert.equal(core.filterGames(enriched, { query: 'revolutionnaire' }).length, 1);
});

test('uniqueSorted removes duplicates and sorts values', () => {
  assert.deepEqual(core.uniqueSorted(['FPS', 'Arcade', 'FPS']), ['Arcade', 'FPS']);
});

test('selectVisibleGames keeps favorites view filtered after state changes', () => {
  const visible = core.selectVisibleGames(games, { query: '', genre: 'all', year: 'all' }, 'favorites', new Set(['pop']));
  assert.deepEqual(visible.map(game => game.id), ['pop']);
});

test('filterGames search matches a game year', () => {
  assert.deepEqual(core.filterGames(games, { query: '1993' }).map(game => game.id), ['doom']);
});
