(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RetroDOSCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeText(value) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function filterGames(games, filters = {}) {
    const query = normalizeText(filters.query || '');
    return games.filter((game) => {
      const haystack = normalizeText([
        game.title,
        game.genre,
        game.year,
        game.developer,
        game.publisher,
        game.description,
        ...(game.collections || [])
      ].join(' '));
      const queryMatch = !query || haystack.includes(query);
      const genreMatch = !filters.genre || filters.genre === 'all' || game.genre === filters.genre;
      const yearMatch = !filters.year || filters.year === 'all' || String(game.year) === String(filters.year);
      return queryMatch && genreMatch && yearMatch;
    });
  }

  function selectVisibleGames(games, filters = {}, view = 'all', favoriteIds = new Set()) {
    const filtered = filterGames(games, filters);
    if (view !== 'favorites') return filtered;
    return filtered.filter((game) => favoriteIds.has(game.id));
  }

  function buildArchiveEmbedUrl(game) {
    return game?.archiveId ? `https://archive.org/embed/${encodeURIComponent(game.archiveId)}` : '';
  }

  function buildArchiveImageUrl(game) {
    return game?.image || (game?.archiveId ? `https://archive.org/services/img/${encodeURIComponent(game.archiveId)}` : '');
  }

  function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }));
  }

  return { normalizeText, filterGames, selectVisibleGames, buildArchiveEmbedUrl, buildArchiveImageUrl, uniqueSorted };
});
