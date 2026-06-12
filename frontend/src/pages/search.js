/**
 * search.js — Página de Busca do GameShelf
 *
 * Responsabilidades:
 *  - Renderizar o campo de busca com filtro por gênero (dinâmico via IGDB)
 *  - Exibir jogos populares ao abrir a página sem query
 *  - Busca assíncrona com debounce de 350ms ao digitar
 *  - Filtro por gênero via pills carregados da IGDB
 *  - Paginação "Load More" para resultados extras
 *  - Abrir modal "Add to Shelf" ao clicar num jogo
 */

import { createNavbar } from '../components/navbar.js';
import { openModal } from '../components/modal.js';
import { searchGames, fetchPopularGames, fetchGenres } from '../lib/rawg.js';
import '../styles/pages/search.css';

// ---------------------------------------------------------------------------
// Estado interno da página
// ---------------------------------------------------------------------------
const PAGE_LIMIT = 20;

let _activeGenreId = null;    // ID numérico do gênero selecionado (ou null)
let _activeGenreName = null;  // Nome do gênero (para o filtro "ALL GAMES")
let _currentOffset = 0;       // Offset de paginação atual
let _currentQuery = '';       // Última query de busca
let _hasMore = false;         // Se há mais resultados para carregar
let _isLoading = false;       // Bloqueia requisições simultâneas

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Cria um card de jogo para a grade de busca.
 * Ao clicar, abre o modal "Add to Shelf".
 *
 * @param {Object} game - Jogo normalizado pelo backend
 * @param {Function} onSave - Callback para salvar na shelf
 */
function createGameCard(game, onSave) {
  const card = document.createElement('article');
  card.className = 'game-card';

  const coverSrc = game.cover_url || '';

  card.innerHTML = `
    <div class="cover-art-wrapper">
      ${coverSrc
        ? `<img src="${coverSrc}" alt="${game.title}" class="cover-art" loading="lazy">`
        : `<div class="cover-art-placeholder"><span>🎮</span></div>`
      }
    </div>
    <div class="game-info">
      <span class="game-info-title">${game.title}</span>
      <span class="game-info-meta">${game.year ? game.year + ' • ' : ''}${(game.genres || []).slice(0, 2).join(', ')}</span>
    </div>
  `;

  card.addEventListener('click', () => {
    openModal(game, onSave);
  });

  return card;
}

/**
 * Mostra o spinner de loading dentro do grid.
 */
function showGridLoading(gridContainer, replace = true) {
  if (replace) gridContainer.innerHTML = '';
  const loader = document.createElement('div');
  loader.className = 'search-grid-loader';
  loader.innerHTML = `
    <div class="search-spinner"></div>
    <p class="search-loading-text">Carregando jogos...</p>
  `;
  gridContainer.appendChild(loader);
}

/**
 * Mostra uma mensagem de estado vazio ou erro.
 */
function showGridMessage(gridContainer, message, isError = false) {
  gridContainer.innerHTML = `
    <div class="search-empty-state ${isError ? 'search-empty-error' : ''}">
      <span class="search-empty-icon">${isError ? '⚠️' : '🎮'}</span>
      <p>${message}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Ponto de entrada da página
// ---------------------------------------------------------------------------
export async function renderSearch(container) {
  container.innerHTML = '';

  const navbar = createNavbar();
  container.appendChild(navbar);

  // Wrapper principal
  const pageContainer = document.createElement('div');
  pageContainer.className = 'page-container search-container';

  // --- Header: input + filtros ---
  const searchHeader = document.createElement('div');
  searchHeader.className = 'search-header';

  // Wrapper do input (para posicionar o hint absoluto)
  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'search-input-wrapper';

  // Lê query inicial da URL (?q=)
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  _currentQuery = initialQuery;

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'search-hero-input';
  input.className = 'search-hero-input';
  input.placeholder = 'Search games...';
  input.value = initialQuery;

  const hint = document.createElement('span');
  hint.className = 'shortcut-hint';
  hint.textContent = 'PRESS / TO FOCUS';

  searchWrapper.appendChild(input);
  searchWrapper.appendChild(hint);

  // Filtros de gênero — serão preenchidos assincronamente
  const filtersContainer = document.createElement('div');
  filtersContainer.className = 'filter-pills';
  filtersContainer.innerHTML = `<span class="filter-pills-loading">Carregando gêneros...</span>`;

  searchHeader.appendChild(searchWrapper);
  searchHeader.appendChild(filtersContainer);
  pageContainer.appendChild(searchHeader);

  // Grade de jogos
  const gridContainer = document.createElement('div');
  gridContainer.className = 'games-grid';
  pageContainer.appendChild(gridContainer);

  // Botão "Load More" (renderizado abaixo da grade)
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.className = 'search-load-more-btn';
  loadMoreBtn.textContent = 'LOAD MORE';
  loadMoreBtn.style.display = 'none';
  pageContainer.appendChild(loadMoreBtn);

  container.appendChild(pageContainer);

  // ---------------------------------------------------------------------------
  // Funções internas de render
  // ---------------------------------------------------------------------------

  /**
   * Executa a busca e popula o grid.
   * Se append=true, adiciona os resultados ao grid existente.
   */
  async function doSearch(query, genreId, offset = 0, append = false) {
    if (_isLoading) return;
    _isLoading = true;

    if (!append) {
      showGridLoading(gridContainer);
      loadMoreBtn.style.display = 'none';
    } else {
      // Loading sutil no botão durante append
      loadMoreBtn.textContent = 'Carregando...';
      loadMoreBtn.disabled = true;
    }

    try {
      let data;

      if (!query.trim() && !genreId) {
        // Sem critério → jogos populares
        const popular = await fetchPopularGames();
        data = { results: popular, hasMore: false };
      } else {
        data = await searchGames(query, { genreId, offset, limit: PAGE_LIMIT });
      }

      if (!append) {
        gridContainer.innerHTML = '';
      }

      const { results, hasMore } = data;
      _hasMore = hasMore;

      if (results.length === 0 && !append) {
        showGridMessage(gridContainer, 'Nenhum jogo encontrado. Tente outro termo ou gênero.');
        loadMoreBtn.style.display = 'none';
        return;
      }

      results.forEach((game) => {
        const card = createGameCard(game, window.onSave);
        gridContainer.appendChild(card);
      });

      loadMoreBtn.style.display = hasMore ? 'block' : 'none';
      loadMoreBtn.textContent = 'LOAD MORE';
      loadMoreBtn.disabled = false;

    } catch (error) {
      console.error('[search] Erro na busca:', error);
      if (!append) {
        showGridMessage(gridContainer, 'Não foi possível conectar à API. Tente novamente.', true);
      }
      loadMoreBtn.style.display = 'none';
    } finally {
      _isLoading = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Carregar gêneros e construir pills
  // ---------------------------------------------------------------------------
  async function initGenres() {
    try {
      const genres = await fetchGenres();
      filtersContainer.innerHTML = '';

      // Pill "ALL GAMES"
      const allPill = document.createElement('button');
      allPill.className = 'filter-pill active';
      allPill.textContent = 'ALL GAMES';
      allPill.dataset.genreId = '';
      filtersContainer.appendChild(allPill);

      // Pills de gêneros reais
      // Usamos apenas gêneros com nomes comuns para não poluir a UI
      const DESIRED_GENRES = ['Action', 'Role-playing (RPG)', 'Adventure', 'Shooter', 'Strategy', 'Puzzle', 'Indie', 'Sport', 'Racing', 'Platform'];
      const filtered = genres.filter((g) => DESIRED_GENRES.includes(g.name)).slice(0, 8);

      filtered.forEach((genre) => {
        const pill = document.createElement('button');
        pill.className = 'filter-pill';
        pill.textContent = genre.name.toUpperCase().replace('ROLE-PLAYING (RPG)', 'RPG');
        pill.dataset.genreId = genre.id;
        filtersContainer.appendChild(pill);
      });

      // Delegação de evento nos pills
      filtersContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;

        filtersContainer.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        _activeGenreId = pill.dataset.genreId ? Number(pill.dataset.genreId) : null;
        _currentOffset = 0;
        doSearch(_currentQuery, _activeGenreId, 0, false);
      });

    } catch (error) {
      console.error('[search] Erro ao carregar gêneros:', error);
      filtersContainer.innerHTML = `<span style="color: var(--color-on-surface-variant); font-size: 0.85rem;">Não foi possível carregar os gêneros.</span>`;
    }
  }

  // ---------------------------------------------------------------------------
  // Debounce do input
  // ---------------------------------------------------------------------------
  let debounceTimer = null;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      _currentQuery = input.value.trim();
      _currentOffset = 0;
      doSearch(_currentQuery, _activeGenreId, 0, false);
    }, 350);
  });

  // ---------------------------------------------------------------------------
  // Load More
  // ---------------------------------------------------------------------------
  loadMoreBtn.addEventListener('click', () => {
    if (_isLoading || !_hasMore) return;
    _currentOffset += PAGE_LIMIT;
    doSearch(_currentQuery, _activeGenreId, _currentOffset, true);
  });

  // ---------------------------------------------------------------------------
  // Atalho de teclado "/" para focar o input
  // ---------------------------------------------------------------------------
  const handleKeydown = (e) => {
    if (!document.body.contains(input)) {
      document.removeEventListener('keydown', handleKeydown);
      return;
    }
    if (
      e.key === '/' &&
      document.activeElement !== input &&
      document.activeElement.tagName !== 'INPUT' &&
      document.activeElement.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault();
      input.focus();
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------
  // Inicia gêneros e busca inicial em paralelo
  await Promise.all([
    initGenres(),
    doSearch(initialQuery, null, 0, false),
  ]);

  // Foco no input
  setTimeout(() => {
    if (window.location.pathname === '/search') {
      input.focus();
      if (initialQuery) {
        input.setSelectionRange(initialQuery.length, initialQuery.length);
      }
    }
  }, 0);
}
