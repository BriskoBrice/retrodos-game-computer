const test = require('node:test');
const assert = require('node:assert/strict');
const { games, collections } = require('../assets/js/catalog.js');

test('catalog contains at least 20 uniquely identified games', () => {
  assert.ok(games.length >= 20);
  assert.equal(new Set(games.map(game => game.id)).size, games.length);
});

test('every game has required player metadata', () => {
  for (const game of games) {
    assert.ok(game.title);
    assert.ok(Number.isInteger(game.year));
    assert.ok(game.genre);
    assert.ok(game.description);
    assert.ok(game.archiveId);
    assert.ok(Array.isArray(game.collections));
  }
});

test('curated collections include core launch groups', () => {
  const ids = new Set(collections.map(collection => collection.id));
  assert.ok(ids.has('dos-legends'));
  assert.ok(ids.has('fps-90s'));
  assert.ok(ids.has('point-click'));
});
