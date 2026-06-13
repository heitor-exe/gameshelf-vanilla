import '../styles/components/modal.css';

let overlay = null;

export function openModal(game, onSave, optionsOrOnDelete) {
  if (overlay) document.body.removeChild(overlay);

  const isEditMode = typeof optionsOrOnDelete === 'function';
  const options = (!isEditMode && typeof optionsOrOnDelete === 'object') ? optionsOrOnDelete : {};
  const isReadOnly = options.readOnly === true;
  const onDelete = isEditMode ? optionsOrOnDelete : undefined;

  const genresHTML = game.genres ? game.genres.map((g) => `<span class="ams-genre-pill">${g}</span>`).join('') : '';
  const currentStatus = game.status || 'playing';
  const currentRating = game.rating || 0;
  const reviewText = game.review || game.review_snippet || '';

  const statusLabels = { playing: 'Playing', completed: 'Completed', dropped: 'Dropped', wishlist: 'Wishlist' };

  const statusPillsHTML = isReadOnly
    ? `<span class="ams-pill ams-pill-active ams-pill-readonly" data-value="${currentStatus}">${statusLabels[currentStatus] || currentStatus}</span>`
    : Object.entries(statusLabels)
        .map(([val, label]) =>
          `<button class="ams-pill${val === currentStatus ? ' ams-pill-active' : ''}" data-value="${val}">${label}</button>`
        )
        .join('');

  const starsHTML = isReadOnly
    ? `<div class="ams-stars-readonly">${'★'.repeat(currentRating)}${'☆'.repeat(5 - currentRating)}</div>`
    : `<div class="ams-stars" data-rating="${currentRating}">${[1, 2, 3, 4, 5]
        .map((i) => {
          const filled = i <= currentRating;
          return `<button class="ams-star${filled ? ' is-filled' : ''}" data-value="${i}" aria-label="${i} star${i > 1 ? 's' : ''}">${filled ? '&#9733;' : '&#9734;'}</button>`;
        })
        .join('')}</div>`;

  const reviewHTML = isReadOnly
    ? `<div class="ams-section">
        <label class="ams-section-label">REVIEW</label>
        <div class="ams-review-display">${reviewText || 'No review written for this game.'}</div>
      </div>`
    : `<div class="ams-section">
        <label class="ams-section-label">REVIEW (OPTIONAL)</label>
        <textarea class="ams-textarea" placeholder="Write your review..." rows="4">${reviewText}</textarea>
      </div>`;

  const footerHTML = isReadOnly
    ? `<div class="ams-footer"><button class="ams-close-btn">CLOSE</button></div>`
    : `<div class="ams-footer">
        ${isEditMode ? `<button class="ams-delete-btn">REMOVE FROM SHELF</button>` : ''}
        <button class="ams-save-btn">${isEditMode ? 'UPDATE' : 'SAVE TO SHELF'}</button>
      </div>`;

  overlay = document.createElement('div');
  overlay.className = 'ams-overlay';
  overlay.innerHTML = `
    <div class="ams-card">
      <div class="ams-header">
        <img class="ams-cover" src="${game.cover || game.cover_url || game.background_image || ''}" alt="${game.title}" onerror="this.style.display='none'" />
        <div class="ams-gradient"></div>
        <div class="ams-genres">${genresHTML}</div>
        <button class="ams-close" aria-label="Close">&times;</button>
        <h1 class="ams-title">${game.title}</h1>
      </div>

      <div class="ams-body">
        <div class="ams-section">
          <label class="ams-section-label">COLLECTION STATUS</label>
          <div class="ams-status-row" data-status="${currentStatus}">
            ${statusPillsHTML}
          </div>
        </div>

        <div class="ams-section">
          <label class="ams-section-label">YOUR RATING</label>
          ${starsHTML}
        </div>

        ${reviewHTML}
      </div>

      ${footerHTML}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Close button (header)
  overlay.querySelector('.ams-close').addEventListener('click', closeModal);

  // Overlay backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Escape key
  const onKeyDown = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  overlay._onKeyDown = onKeyDown;
  document.addEventListener('keydown', onKeyDown);

  if (isReadOnly) {
    overlay.querySelector('.ams-close-btn').addEventListener('click', closeModal);
    return;
  }

  // Set active status pill
  const statusRow = overlay.querySelector('.ams-status-row');
  const initialPill = statusRow.querySelector(`[data-value="${currentStatus}"]`);
  if (initialPill) initialPill.classList.add('ams-pill-active');

  // Status pill clicks
  statusRow.addEventListener('click', (e) => {
    if (!e.target.classList.contains('ams-pill')) return;
    statusRow.querySelectorAll('.ams-pill').forEach((p) => p.classList.remove('ams-pill-active'));
    e.target.classList.add('ams-pill-active');
  });

  // Star clicks
  const starsContainer = overlay.querySelector('.ams-stars');
  starsContainer.addEventListener('click', (e) => {
    if (!e.target.classList.contains('ams-star')) return;
    const rating = parseInt(e.target.dataset.value);
    starsContainer.dataset.rating = rating;
    starsContainer.querySelectorAll('.ams-star').forEach((s, idx) => {
      if (idx < rating) {
        s.innerHTML = '&#9733;';
        s.classList.add('is-filled');
      } else {
        s.innerHTML = '&#9734;';
        s.classList.remove('is-filled');
      }
    });
  });

  // Save button
  overlay.querySelector('.ams-save-btn').addEventListener('click', () => {
    const statusPill = statusRow.querySelector('.ams-pill-active');
      const data = {
        id: game.id,
        title: game.title,
        cover_url: game.cover || game.cover_url || game.background_image || '',
        genres: game.genres || [],
        status: statusPill ? statusPill.dataset.value : 'playing',
        rating: parseInt(starsContainer.dataset.rating) || 0,
        review_snippet: overlay.querySelector('.ams-textarea').value.trim(),
        review_date: new Date().toISOString(),
      };
    console.log('[modal] saved:', data);
    closeModal();
    if (typeof onSave === 'function') {
      onSave(data);
    }
  });

  // Delete button
  if (isEditMode) {
    overlay.querySelector('.ams-delete-btn').addEventListener('click', () => {
      if (confirm(`Are you sure you want to remove "${game.title}" from your shelf?`)) {
        console.log('[modal] deleted:', game.id);
        closeModal();
        if (typeof onDelete === 'function') {
          onDelete(game.id);
        }
      }
    });
  }
}

export function closeModal() {
  if (!overlay) return;
  document.removeEventListener('keydown', overlay._onKeyDown);
  overlay.remove();
  overlay = null;
  document.body.style.overflow = '';
}

// Define quantos jogos serão exibidos por página dentro de cada categoria do modal.
const VIEW_ALL_PAGE_SIZE = 2;

// Centraliza os metadados de cada categoria da shelf para reutilizar
// o mesmo modal com títulos, descrições e mensagens vazias coerentes.
const VIEW_ALL_STATUS_META = {
  playing: {
    label: 'Currently Playing',
    helper: 'Games you are actively playing right now.',
    emptyTitle: 'Nothing in your playing queue yet',
    emptyCopy: 'Add a game to your shelf and mark it as playing to see it here.',
  },
  completed: {
    label: 'Completed',
    helper: 'Finished games with your latest thoughts attached.',
    emptyTitle: 'No completed games yet',
    emptyCopy: 'Once you finish a game and update its status, it will appear here.',
  },
  dropped: {
    label: 'Dropped',
    helper: 'Games you decided to put down for now.',
    emptyTitle: 'No dropped games',
    emptyCopy: 'If a game is not working for you, mark it as dropped and it will show up here.',
  },
  wishlist: {
    label: 'Wishlist',
    helper: 'Games you want to play next.',
    emptyTitle: 'Your wishlist is empty',
    emptyCopy: 'Save upcoming games to your wishlist and browse them here.',
  },
};

// Normaliza os jogos vindos da shelf para um formato único no modal,
// evitando tratar diferenças de nome de propriedade durante a renderização.
function normalizeViewAllGame(game) {
  return {
    id: game.id,
    title: game.title || game.game_title || 'Unknown Title',
    developer: game.developer || 'Unknown studio',
    status: game.status || 'playing',
    rating: Number(game.rating) || 0,
    review: (game.review_snippet || game.review || '').trim(),
    cover: game.cover_url || game.cover || game.background_image || '',
  };
}

// Busca o conteúdo textual da categoria selecionada.
function getStatusMeta(status) {
  return VIEW_ALL_STATUS_META[status] || VIEW_ALL_STATUS_META.playing;
}

// Texto padrão usado quando o modal está exibindo todos os jogos sem filtro ativo.
function getAllGamesMeta() {
  return {
    label: 'All Games',
    helper: 'Browse every game in your shelf, then use the categories to narrow the list whenever you want.',
    emptyTitle: 'Your shelf is empty',
    emptyCopy: 'Add games to your shelf to see them listed here and organize them by category.',
  };
}

// Limita o tamanho do review para manter os cards equilibrados visualmente.
function truncateReview(text, maxLength = 160) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

// Converte a nota numérica salva na shelf em estrelas visuais.
function renderRatingStars(rating) {
  if (!rating) return '';
  return `${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}`;
}

// Abre o modal de visualização completa da shelf.
// Ele aceita todos os jogos e permite escolher internamente a categoria ativa.
export function openViewAllModal(games = [], optionsOrOnClose = {}) {
  let viewAllOverlay = document.createElement('div');
  viewAllOverlay.className = 'ams-overlay view-all-overlay';

  // Mantém compatibilidade com a assinatura antiga, que podia receber apenas onClose.
  const options = typeof optionsOrOnClose === 'function' ? { onClose: optionsOrOnClose } : optionsOrOnClose || {};

  // Os dados são normalizados uma vez para simplificar os filtros e a montagem dos cards.
  const normalizedGames = games.map(normalizeViewAllGame);
  let activeStatus = options.initialStatus && VIEW_ALL_STATUS_META[options.initialStatus] ? options.initialStatus : null;
  let currentPage = 1;

  viewAllOverlay.innerHTML = `
    <div class="ams-card view-all-modal">
      <div class="view-all-header">
        <div class="view-all-heading-group">
          <span class="view-all-kicker">Shelf Overview</span>
          <h2 class="view-all-title">Browse your games by shelf category</h2>
          <p class="view-all-subtitle">
            Start with what you are currently playing, then switch categories to revisit your completed, dropped, and wishlist entries.
          </p>
        </div>
        <button class="ams-close" aria-label="Close">&times;</button>
      </div>

      <div class="view-all-filters" role="tablist" aria-label="Shelf categories"></div>

      <div class="view-all-body">
        <div class="view-all-content"></div>
      </div>
    </div>
  `;

  document.body.appendChild(viewAllOverlay);
  document.body.style.overflow = 'hidden';

  // Referências aos nós que serão atualizados dinamicamente sempre que o usuário
  // trocar de categoria dentro do popup.
  const filtersContainer = viewAllOverlay.querySelector('.view-all-filters');
  const contentContainer = viewAllOverlay.querySelector('.view-all-content');

  // Renderiza os botões das categorias mostrando também a quantidade de jogos em cada uma.
  function buildFilters() {
    filtersContainer.innerHTML = Object.entries(VIEW_ALL_STATUS_META)
      .map(([status, meta]) => {
        const count = normalizedGames.filter((game) => game.status === status).length;
        const isActive = status === activeStatus;
        return `
          <button
            class="view-all-filter-btn${isActive ? ' is-active' : ''}"
            type="button"
            role="tab"
            aria-selected="${isActive}"
            data-status="${status}"
          >
            <span class="view-all-filter-label">${meta.label}</span>
            <span class="view-all-filter-count">${count}</span>
          </button>
        `;
      })
      .join('');
  }

  // Monta o card individual com capa, status, nota e review curto do usuário.
  function buildCard(game) {
    const review = truncateReview(game.review);
    return `
      <article class="view-all-game-card">
        <div class="view-all-cover-wrapper">
          <img
            src="${game.cover}"
            alt="${game.title}"
            class="view-all-cover"
            onerror="this.style.display='none'"
          />
        </div>

        <div class="view-all-card-body">
          <div class="view-all-card-top">
            <span class="view-all-status-pill">${getStatusMeta(game.status).label}</span>
            ${game.rating ? `<span class="view-all-rating">${renderRatingStars(game.rating)}</span>` : ''}
          </div>

          <div class="view-all-card-copy">
            <h3 class="view-all-game-title">${game.title}</h3>
            <span class="view-all-game-dev">${game.developer}</span>
          </div>
        </div>

        <div class="view-all-review-block">
          <span class="view-all-review-label">Your review</span>
          <p class="view-all-review">
            ${review || 'You have not added a review snippet for this game yet.'}
          </p>
        </div>
      </article>
    `;
  }

  // Atualiza o resumo e a grade de jogos considerando o filtro ativo.
  // Quando não existe categoria selecionada, o modal exibe todos os jogos da shelf.
  function renderActiveCategory() {
    const meta = activeStatus ? getStatusMeta(activeStatus) : getAllGamesMeta();
    const filteredGames = activeStatus ? normalizedGames.filter((game) => game.status === activeStatus) : normalizedGames;
    const totalPages = Math.max(1, Math.ceil(filteredGames.length / VIEW_ALL_PAGE_SIZE));

    // Garante que a página atual continue válida ao trocar de categoria
    // ou quando a quantidade de itens diminuir.
    currentPage = Math.min(currentPage, totalPages);

    const startIndex = (currentPage - 1) * VIEW_ALL_PAGE_SIZE;
    const paginatedGames = filteredGames.slice(startIndex, startIndex + VIEW_ALL_PAGE_SIZE);

    if (!filteredGames.length) {
      contentContainer.innerHTML = `
        <div class="view-all-empty">
          <h3 class="view-all-empty-title">${meta.emptyTitle}</h3>
          <p class="view-all-empty-copy">${meta.emptyCopy}</p>
        </div>
      `;
      return;
    }

    const paginationDots = Array.from({ length: totalPages }, (_, index) => {
      const page = index + 1;
      const isActive = page === currentPage;
      return `
        <button
          class="view-all-page-dot${isActive ? ' is-active' : ''}"
          type="button"
          data-page-number="${page}"
          aria-label="Go to page ${page}"
          aria-current="${isActive ? 'page' : 'false'}"
        ></button>
      `;
    }).join('');

    const paginationControls =
      totalPages > 1
        ? `
          <div class="view-all-pagination" aria-label="Pagination controls">
            <button
              class="view-all-page-btn"
              type="button"
              data-page-action="prev"
              aria-label="Previous page"
              ${currentPage === 1 ? 'disabled' : ''}
            >
              <span aria-hidden="true">&#8592;</span>
            </button>
            <div class="view-all-page-dots" aria-label="Page indicators">
              ${paginationDots}
            </div>
            <button
              class="view-all-page-btn"
              type="button"
              data-page-action="next"
              aria-label="Next page"
              ${currentPage === totalPages ? 'disabled' : ''}
            >
              <span aria-hidden="true">&#8594;</span>
            </button>
          </div>
        `
        : '';

    contentContainer.innerHTML = `
      <div class="view-all-grid">
        ${paginatedGames.map(buildCard).join('')}
      </div>
      ${paginationControls}
    `;
  }

  // Render inicial do modal já focando na categoria escolhida ao abrir.
  buildFilters();
  renderActiveCategory();

  // Aplica o filtro da categoria clicada. Se o usuário clicar novamente na categoria ativa,
  // o modal volta a exibir todos os jogos.
  filtersContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.view-all-filter-btn');
    if (!button) return;

    activeStatus = activeStatus === button.dataset.status ? null : button.dataset.status;
    currentPage = 1;
    buildFilters();
    renderActiveCategory();
  });

  // A paginação limita a lista a dois jogos por vez para manter a altura do modal estável.
  contentContainer.addEventListener('click', (event) => {
    const pageButton = event.target.closest('.view-all-page-btn');
    const pageDot = event.target.closest('.view-all-page-dot');

    // Atualiza a página atual com base no botão clicado ou no dot selecionado.
    if (pageButton && !pageButton.disabled) {
      // action: 'prev' ou 'next'
      const action = pageButton.dataset.pageAction;

      if (action === 'prev' && currentPage > 1) {
        currentPage -= 1;
      }

      if (action === 'next') {
        currentPage += 1;
      }

      renderActiveCategory();
      return;
    }

    if (pageDot) {
      currentPage = Number(pageDot.dataset.pageNumber) || 1;
      renderActiveCategory();
    }
  });

  // Fecha o modal e restaura o scroll do documento.
  function close() {
    if (!viewAllOverlay) return;
    // Remove o listener de teclado e o overlay do DOM.
    document.removeEventListener('keydown', onKeyDown);

    // Remove o overlay do DOM e restaura o scroll do documento.
    viewAllOverlay.remove();
    viewAllOverlay = null;

    // Restaura o scroll do documento.
    document.body.style.overflow = '';

    // Chama a função onClose, se fornecida.
    if (typeof options.onClose === 'function') options.onClose();
  }

  // Adiciona o listener de clique ao botão de fechar e ao overlay para fechamento.
  viewAllOverlay.querySelector('.ams-close').addEventListener('click', close);
  viewAllOverlay.addEventListener('click', (e) => {
    if (e.target === viewAllOverlay) close();
  });

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close();
  };
  viewAllOverlay._onKeyDown = onKeyDown;
  document.addEventListener('keydown', onKeyDown);
}
