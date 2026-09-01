(function () {
  'use strict';

  const core = window.RetroDOSCore;
  const games = window.RETRODOS_GAMES || [];
  const collections = window.RETRODOS_COLLECTIONS || [];
  if (!core) throw new Error('RetroDOSCore is required');

  const STORAGE = {
    favorites: 'retrodos:favorites:v2',
    recent: 'retrodos:recent:v2',
    boot: 'retrodos:boot:v2'
  };

  const state = {
    query: '',
    genre: 'all',
    year: 'all',
    favorites: new Set(readJSON(STORAGE.favorites, [])),
    recent: readJSON(STORAGE.recent, []),
    currentGameId: null,
    view: 'all',
    filtered: games.slice()
  };

  const els = {
    body: document.body,
    libraryView: document.querySelector('#libraryView'),
    playerView: document.querySelector('#playerView'),
    search: document.querySelector('#searchInput'),
    genreFilters: document.querySelector('#genreFilters'),
    yearFilter: document.querySelector('#yearFilter'),
    recentRail: document.querySelector('#recentRail'),
    recentCount: document.querySelector('#recentCount'),
    collectionGrid: document.querySelector('#collectionGrid'),
    gameList: document.querySelector('#gameList'),
    resultCount: document.querySelector('#resultCount'),
    gameCountStat: document.querySelector('#gameCountStat'),
    genreCountStat: document.querySelector('#genreCountStat'),
    homeButton: document.querySelector('#homeButton'),
    helpButton: document.querySelector('#helpButton'),
    helpDialog: document.querySelector('#helpDialog'),
    menuButton: document.querySelector('#menuButton'),
    menuCloseButton: document.querySelector('#menuCloseButton'),
    systemMenu: document.querySelector('#systemMenu'),
    backButton: document.querySelector('#backButton'),
    fullscreenButton: document.querySelector('#fullscreenButton'),
    playerFavoriteButton: document.querySelector('#playerFavoriteButton'),
    playerTitle: document.querySelector('#playerTitle'),
    playerMeta: document.querySelector('#playerMeta'),
    playerDescription: document.querySelector('#playerDescription'),
    playerDeveloper: document.querySelector('#playerDeveloper'),
    playerPublisher: document.querySelector('#playerPublisher'),
    aboutTitle: document.querySelector('#aboutTitle'),
    gameFrame: document.querySelector('#gameFrame'),
    playerMonitor: document.querySelector('#playerMonitor'),
    playerPoster: document.querySelector('#playerPoster'),
    playerPosterImage: document.querySelector('#playerPosterImage'),
    posterTitle: document.querySelector('#posterTitle'),
    posterPlayButton: document.querySelector('#posterPlayButton'),
    playerLoader: document.querySelector('#playerLoader'),
    monitorArchiveId: document.querySelector('#monitorArchiveId'),
    relatedRail: document.querySelector('#relatedRail')
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function gameById(id) {
    return games.find((game) => game.id === id) || null;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fallbackText(title) {
    return title.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  }

  function attachImageFallbacks(scope) {
    scope.querySelectorAll('img[data-fallback]').forEach((img) => {
      img.addEventListener('error', () => {
        img.hidden = true;
        const fallback = img.parentElement?.querySelector('.image-fallback');
        if (fallback) fallback.hidden = false;
      }, { once: true });
    });
  }

  function renderStats() {
    els.gameCountStat.textContent = String(games.length);
    els.genreCountStat.textContent = String(new Set(games.map((game) => game.genre)).size);
  }

  function renderFilters() {
    const genres = core.uniqueSorted(games.map((game) => game.genre));
    els.genreFilters.innerHTML = [
      `<button class="filter-chip" type="button" data-genre="all" aria-pressed="true">Tous</button>`,
      ...genres.map((genre) => `<button class="filter-chip" type="button" data-genre="${escapeHtml(genre)}" aria-pressed="false">${escapeHtml(genre)}</button>`)
    ].join('');

    const years = [...new Set(games.map((game) => game.year))].sort((a, b) => b - a);
    els.yearFilter.innerHTML = `<option value="all">Toutes les années</option>${years.map((year) => `<option value="${year}">${year}</option>`).join('')}`;
  }

  function miniCard(game, action = 'details') {
    const image = core.buildArchiveImageUrl(game);
    return `
      <article class="mini-card">
        <button type="button" data-action="${action}" data-id="${escapeHtml(game.id)}" aria-label="Ouvrir ${escapeHtml(game.title)}">
          <div class="mini-art">
            <div class="image-fallback" hidden>${escapeHtml(fallbackText(game.title))}</div>
            <img src="${escapeHtml(image)}" alt="Aperçu de ${escapeHtml(game.title)}" data-fallback>
          </div>
          <div class="mini-copy">
            <strong>${escapeHtml(game.title)}</strong>
            <span>${game.year} · ${escapeHtml(game.genre)}</span>
          </div>
        </button>
      </article>`;
  }

  function renderRecent() {
    const recentGames = state.recent.map(gameById).filter(Boolean).slice(0, 8);
    els.recentCount.textContent = `${recentGames.length} ${recentGames.length > 1 ? 'jeux' : 'jeu'}`;
    if (!recentGames.length) {
      els.recentRail.innerHTML = `<div class="empty-rail"><code>C:\\HISTORY&gt;</code><span>Aucun jeu lancé pour le moment. Choisis un classique dans la bibliothèque.</span></div>`;
      return;
    }
    els.recentRail.innerHTML = recentGames.map((game) => miniCard(game, 'play')).join('');
    attachImageFallbacks(els.recentRail);
  }

  function renderCollections() {
    els.collectionGrid.innerHTML = collections.map((collection) => {
      const count = games.filter((game) => game.collections.includes(collection.title)).length;
      const icon = collection.id === 'fps-90s' ? 'F9' : collection.id === 'point-click' ? 'P&C' : 'DOS';
      return `
        <article class="collection-card" data-accent="${escapeHtml(collection.accent)}">
          <div class="collection-icon">${escapeHtml(icon)}</div>
          <span class="section-prompt">${escapeHtml(collection.prompt)}</span>
          <h3>${escapeHtml(collection.title)}</h3>
          <p>${escapeHtml(collection.subtitle)}</p>
          <footer><span>${count} JEUX</span><span>OUVRIR ↗</span></footer>
          <button type="button" data-action="collection" data-collection="${escapeHtml(collection.title)}" aria-label="Ouvrir la collection ${escapeHtml(collection.title)}"></button>
        </article>`;
    }).join('');
  }

  function gameCard(game) {
    const favorite = state.favorites.has(game.id);
    const image = core.buildArchiveImageUrl(game);
    return `
      <article class="game-card" data-game-id="${escapeHtml(game.id)}">
        <div class="game-art">
          <div class="image-fallback" hidden>${escapeHtml(fallbackText(game.title))}</div>
          <img src="${escapeHtml(image)}" alt="Aperçu de ${escapeHtml(game.title)}" data-fallback>
        </div>
        <div class="game-copy">
          <div class="game-kicker"><span class="genre">${escapeHtml(game.genre)}</span><span>•</span><span>${game.year}</span><span>•</span><span>${escapeHtml(game.developer)}</span></div>
          <h3>${escapeHtml(game.title)}</h3>
          <p>${escapeHtml(game.description)}</p>
        </div>
        <div class="game-actions">
          <button class="favorite-button" type="button" data-action="favorite" data-id="${escapeHtml(game.id)}" aria-label="${favorite ? 'Retirer' : 'Ajouter'} ${escapeHtml(game.title)} ${favorite ? 'des' : 'aux'} favoris" aria-pressed="${favorite}">${favorite ? '★' : '☆'}</button>
          <button class="primary-button" type="button" data-action="play" data-id="${escapeHtml(game.id)}">▶ Jouer</button>
          <button class="secondary-button" type="button" data-action="details" data-id="${escapeHtml(game.id)}">Fiche</button>
        </div>
      </article>`;
  }

  function renderLibrary() {
    const list = state.filtered;
    els.resultCount.textContent = `${list.length} résultat${list.length > 1 ? 's' : ''}`;
    if (!list.length) {
      els.gameList.innerHTML = `<div class="no-results"><strong>NO MATCH FOUND</strong>Essaie un autre titre, genre ou une autre année.</div>`;
      return;
    }
    els.gameList.innerHTML = list.map(gameCard).join('');
    attachImageFallbacks(els.gameList);
  }

  function applyFilters() {
    state.filtered = core.selectVisibleGames(
      games,
      { query: state.query, genre: state.genre, year: state.year },
      state.view,
      state.favorites
    );
    renderLibrary();
  }

  function toggleFavorite(id) {
    if (!gameById(id)) return;
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    writeJSON(STORAGE.favorites, [...state.favorites]);
    applyFilters();
    if (state.currentGameId === id) updatePlayerFavorite();
  }

  function markRecent(id) {
    state.recent = [id, ...state.recent.filter((gameId) => gameId !== id)].slice(0, 8);
    writeJSON(STORAGE.recent, state.recent);
    renderRecent();
  }

  function updatePlayerFavorite() {
    const game = gameById(state.currentGameId);
    if (!game) return;
    const favorite = state.favorites.has(game.id);
    els.playerFavoriteButton.textContent = favorite ? '★' : '☆';
    els.playerFavoriteButton.setAttribute('aria-pressed', String(favorite));
    els.playerFavoriteButton.setAttribute('aria-label', favorite ? 'Retirer des favoris' : 'Ajouter aux favoris');
  }

  function renderRelated(game) {
    const related = games
      .filter((candidate) => candidate.id !== game.id)
      .map((candidate) => ({
        candidate,
        score: Number(candidate.genre === game.genre) * 3 + candidate.collections.filter((name) => game.collections.includes(name)).length
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.candidate.year - a.candidate.year)
      .slice(0, 3)
      .map((item) => item.candidate);
    els.relatedRail.innerHTML = related.map((item) => miniCard(item, 'details')).join('');
    attachImageFallbacks(els.relatedRail);
  }

  function resetPlayerFrame() {
    els.gameFrame.removeAttribute('src');
    els.gameFrame.hidden = true;
    els.playerLoader.hidden = true;
    els.playerPoster.hidden = false;
  }

  function openGame(id, { play = false } = {}) {
    const game = gameById(id);
    if (!game) return;
    state.currentGameId = id;
    resetPlayerFrame();
    els.playerTitle.textContent = game.title;
    els.playerMeta.textContent = `${game.year} · ${game.genre} · ${game.collections[0] || 'DOS'}`;
    els.playerDescription.textContent = game.description;
    els.playerDeveloper.textContent = game.developer || '—';
    els.playerPublisher.textContent = game.publisher || '—';
    els.aboutTitle.textContent = `À propos de ${game.title}`;
    els.monitorArchiveId.textContent = game.archiveId || 'NO_ARCHIVE_ID';
    els.posterTitle.textContent = game.title;
    els.playerPosterImage.src = core.buildArchiveImageUrl(game);
    els.playerPosterImage.alt = `Aperçu de ${game.title}`;
    els.playerPosterImage.onerror = () => { els.playerPosterImage.style.display = 'none'; };
    updatePlayerFavorite();
    renderRelated(game);
    els.libraryView.hidden = true;
    els.playerView.hidden = false;
    document.title = `${game.title} — RetroDOS Game Computer`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (play) launchCurrentGame();
  }

  function closeGame() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    els.playerView.classList.remove('is-arcade');
    resetPlayerFrame();
    state.currentGameId = null;
    els.playerView.hidden = true;
    els.libraryView.hidden = false;
    document.title = 'RetroDOS Game Computer — RD-8088';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function launchCurrentGame() {
    const game = gameById(state.currentGameId);
    if (!game || !game.archiveId) return;
    markRecent(game.id);
    els.playerPoster.hidden = true;
    els.playerLoader.hidden = false;
    els.gameFrame.hidden = false;
    els.gameFrame.src = core.buildArchiveEmbedUrl(game);
  }

  function togglePlayerFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    if (els.playerMonitor.requestFullscreen) {
      els.playerMonitor.requestFullscreen().catch(() => els.playerView.classList.toggle('is-arcade'));
    } else {
      els.playerView.classList.toggle('is-arcade');
    }
  }

  function openMenu() {
    els.systemMenu.classList.add('is-open');
    els.systemMenu.setAttribute('aria-hidden', 'false');
    els.menuButton.setAttribute('aria-expanded', 'true');
    els.systemMenu.inert = false;
  }

  function closeMenu() {
    els.systemMenu.classList.remove('is-open');
    els.systemMenu.setAttribute('aria-hidden', 'true');
    els.menuButton.setAttribute('aria-expanded', 'false');
    els.systemMenu.inert = true;
  }

  function scrollToSection(id) {
    closeGame();
    requestAnimationFrame(() => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function navigate(action) {
    closeMenu();
    if (action === 'library') {
      state.view = 'all';
      applyFilters();
      return scrollToSection('#librarySection');
    }
    if (action === 'collections') return scrollToSection('#collectionsSection');
    if (action === 'history') return scrollToSection('#recentSection');
    if (action === 'favorites') {
      closeGame();
      state.query = '';
      state.genre = 'all';
      state.year = 'all';
      state.view = 'favorites';
      els.search.value = '';
      els.yearFilter.value = 'all';
      applyFilters();
      els.genreFilters.querySelectorAll('[data-genre]').forEach((button) => button.setAttribute('aria-pressed', button.dataset.genre === 'all' ? 'true' : 'false'));
      return requestAnimationFrame(() => document.querySelector('#librarySection')?.scrollIntoView({ behavior: 'smooth' }));
    }
    if (action === 'random') {
      const pool = state.filtered.length ? state.filtered : games;
      const game = pool[Math.floor(Math.random() * pool.length)];
      if (game) openGame(game.id);
    }
  }

  function boot() {
    let alreadyBooted = false;
    try { alreadyBooted = sessionStorage.getItem(STORAGE.boot) === '1'; } catch {}
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = alreadyBooted || reduceMotion ? 30 : 1050;
    setTimeout(() => {
      els.body.classList.remove('is-booting');
      try { sessionStorage.setItem(STORAGE.boot, '1'); } catch {}
    }, delay);
  }

  els.search.addEventListener('input', (event) => {
    state.query = event.target.value;
    state.view = 'all';
    applyFilters();
  });

  els.yearFilter.addEventListener('change', (event) => {
    state.year = event.target.value;
    state.view = 'all';
    applyFilters();
  });

  els.genreFilters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-genre]');
    if (!button) return;
    state.genre = button.dataset.genre;
    state.view = 'all';
    els.genreFilters.querySelectorAll('[data-genre]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    applyFilters();
  });

  document.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action], [data-nav]');
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    const nav = actionTarget.dataset.nav;
    const id = actionTarget.dataset.id;
    if (nav) return navigate(nav);
    if (action === 'favorite') return toggleFavorite(id);
    if (action === 'play') return openGame(id, { play: true });
    if (action === 'details') return openGame(id);
    if (action === 'collection') {
      state.query = actionTarget.dataset.collection || '';
      state.view = 'all';
      els.search.value = state.query;
      applyFilters();
      document.querySelector('#librarySection')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  els.homeButton.addEventListener('click', () => navigate('library'));
  els.helpButton.addEventListener('click', () => els.helpDialog.showModal?.());
  els.menuButton.addEventListener('click', openMenu);
  els.menuCloseButton.addEventListener('click', closeMenu);
  els.systemMenu.addEventListener('click', (event) => { if (event.target === els.systemMenu) closeMenu(); });
  els.backButton.addEventListener('click', closeGame);
  els.posterPlayButton.addEventListener('click', launchCurrentGame);
  els.playerFavoriteButton.addEventListener('click', () => toggleFavorite(state.currentGameId));
  els.fullscreenButton.addEventListener('click', togglePlayerFullscreen);
  els.gameFrame.addEventListener('load', () => { if (els.gameFrame.getAttribute('src')) els.playerLoader.hidden = true; });

  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName;
    const editing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (event.key === 'Escape') {
      if (els.systemMenu.classList.contains('is-open')) return closeMenu();
      if (!els.playerView.hidden && !document.fullscreenElement) return closeGame();
    }
    if (editing) return;
    if (event.key === '/' && els.playerView.hidden) {
      event.preventDefault();
      els.search.focus();
    }
    if (event.key.toLowerCase() === 'f' && !els.playerView.hidden) {
      event.preventDefault();
      togglePlayerFullscreen();
    }
  });

  renderStats();
  renderFilters();
  renderRecent();
  renderCollections();
  renderLibrary();
  boot();
})();
