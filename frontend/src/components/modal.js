let overlay = null;

export function openModal(game, onSave, onDelete) {
  if (overlay) document.body.removeChild(overlay);

  const isEditMode = typeof onDelete === "function";

  const genresHTML = game.genres
    ? game.genres
        .map((g) => `<span class="ams-genre-pill">${g}</span>`)
        .join("")
    : "";

  overlay = document.createElement("div");
  overlay.className = "ams-overlay";
  overlay.innerHTML = `
    <div class="ams-card">
      <div class="ams-header">
        <img class="ams-cover" src="${game.cover || game.cover_url || game.background_image || ""}" alt="${game.title}" onerror="this.style.display='none'" />
        <div class="ams-gradient"></div>
        <div class="ams-genres">${genresHTML}</div>
        <button class="ams-close" aria-label="Close">&times;</button>
        <h1 class="ams-title">${game.title}</h1>
      </div>

      <div class="ams-body">
        <div class="ams-section">
          <label class="ams-section-label">COLLECTION STATUS</label>
          <div class="ams-status-row" data-status="${game.status || ""}">
            <button class="ams-pill" data-value="playing">Playing</button>
            <button class="ams-pill" data-value="completed">Completed</button>
            <button class="ams-pill" data-value="dropped">Dropped</button>
            <button class="ams-pill" data-value="wishlist">Wishlist</button>
          </div>
        </div>

        <div class="ams-section">
          <label class="ams-section-label">YOUR RATING</label>
          <div class="ams-stars" data-rating="${game.rating || 0}">
            ${[1, 2, 3, 4, 5]
              .map((i) => {
                const filled = i <= (game.rating || 0);
                return `<button class="ams-star${filled ? " is-filled" : ""}" data-value="${i}" aria-label="${i} star${i > 1 ? "s" : ""}">${filled ? "&#9733;" : "&#9734;"}</button>`;
              })
              .join("")}
          </div>
        </div>

        <div class="ams-section">
          <label class="ams-section-label">REVIEW (OPTIONAL)</label>
          <textarea class="ams-textarea" placeholder="Write your review..." rows="4">${game.review || game.review_snippet || ""}</textarea>
        </div>
      </div>

      <div class="ams-footer">
        ${isEditMode ? `<button class="ams-delete-btn">REMOVE FROM SHELF</button>` : ""}
        <button class="ams-save-btn">${isEditMode ? "UPDATE" : "SAVE TO SHELF"}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Set active status pill
  const statusRow = overlay.querySelector(".ams-status-row");
  const savedStatus = game.status || "playing";
  const initialPill = statusRow.querySelector(`[data-value="${savedStatus}"]`);
  if (initialPill) initialPill.classList.add("ams-pill-active");

  // Status pill clicks
  statusRow.addEventListener("click", (e) => {
    if (!e.target.classList.contains("ams-pill")) return;
    statusRow
      .querySelectorAll(".ams-pill")
      .forEach((p) => p.classList.remove("ams-pill-active"));
    e.target.classList.add("ams-pill-active");
  });

  // Star clicks
  const starsContainer = overlay.querySelector(".ams-stars");
  starsContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("ams-star")) return;
    const rating = parseInt(e.target.dataset.value);
    // Update the stored rating
    starsContainer.dataset.rating = rating;
    // Update each star's glyph and filled class
    starsContainer.querySelectorAll(".ams-star").forEach((s, idx) => {
      if (idx < rating) {
        s.innerHTML = "&#9733;";
        s.classList.add("is-filled");
      } else {
        s.innerHTML = "&#9734;";
        s.classList.remove("is-filled");
      }
    });
  });

  // Close button
  overlay.querySelector(".ams-close").addEventListener("click", closeModal);

  // Overlay backdrop click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // Save button
  overlay.querySelector(".ams-save-btn").addEventListener("click", () => {
    const statusPill = statusRow.querySelector(".ams-pill-active");
    const data = {
      id: game.id,
      title: game.title,
      cover_url: game.cover || game.cover_url || game.background_image || "",
      status: statusPill ? statusPill.dataset.value : "playing",
      rating: parseInt(starsContainer.dataset.rating) || 0,
      review_snippet: overlay.querySelector(".ams-textarea").value.trim(),
    };
    console.log("[modal] saved:", data);
    closeModal();
    if (typeof onSave === "function") {
      onSave(data);
    }
  });

  // Delete button
  if (isEditMode) {
    overlay.querySelector(".ams-delete-btn").addEventListener("click", () => {
      if (
        confirm(`Tem certeza que deseja remover "${game.title}" da sua shelf?`)
      ) {
        console.log("[modal] deleted:", game.id);
        closeModal();
        if (typeof onDelete === "function") {
          onDelete(game.id);
        }
      }
    });
  }

  // Escape key
  const onKeyDown = (e) => {
    if (e.key === "Escape") closeModal();
  };
  overlay._onKeyDown = onKeyDown;
  document.addEventListener("keydown", onKeyDown);
}

export function closeModal() {
  if (!overlay) return;
  document.removeEventListener("keydown", overlay._onKeyDown);
  overlay.remove();
  overlay = null;
  document.body.style.overflow = "";
}

// Centraliza os metadados de cada categoria da shelf para reutilizar
// o mesmo modal com títulos, descrições e mensagens vazias coerentes.
const VIEW_ALL_STATUS_META = {
  playing: {
    label: "Currently Playing",
    helper: "Games you are actively playing right now.",
    emptyTitle: "Nothing in your playing queue yet",
    emptyCopy:
      "Add a game to your shelf and mark it as playing to see it here.",
  },
  completed: {
    label: "Completed",
    helper: "Finished games with your latest thoughts attached.",
    emptyTitle: "No completed games yet",
    emptyCopy:
      "Once you finish a game and update its status, it will appear here.",
  },
  dropped: {
    label: "Dropped",
    helper: "Games you decided to put down for now.",
    emptyTitle: "No dropped games",
    emptyCopy:
      "If a game is not working for you, mark it as dropped and it will show up here.",
  },
  wishlist: {
    label: "Wishlist",
    helper: "Games you want to play next.",
    emptyTitle: "Your wishlist is empty",
    emptyCopy: "Save upcoming games to your wishlist and browse them here.",
  },
};

// Normaliza os jogos vindos da shelf para um formato único no modal,
// evitando tratar diferenças de nome de propriedade durante a renderização.
function normalizeViewAllGame(game) {
  return {
    id: game.id,
    title: game.title || game.game_title || "Unknown Title",
    developer: game.developer || "Unknown studio",
    status: game.status || "playing",
    rating: Number(game.rating) || 0,
    review: (game.review_snippet || game.review || "").trim(),
    cover: game.cover_url || game.cover || game.background_image || "",
  };
}

// Busca o conteúdo textual da categoria selecionada.
function getStatusMeta(status) {
  return VIEW_ALL_STATUS_META[status] || VIEW_ALL_STATUS_META.playing;
}

// Limita o tamanho do review para manter os cards equilibrados visualmente.
function truncateReview(text, maxLength = 160) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

// Converte a nota numérica salva na shelf em estrelas visuais.
function renderRatingStars(rating) {
  if (!rating) return "";
  return `${"★".repeat(rating)}${"☆".repeat(Math.max(0, 5 - rating))}`;
}

// Abre o modal de visualização completa da shelf.
// Ele aceita todos os jogos e permite escolher internamente a categoria ativa.
export function openViewAllModal(games = [], optionsOrOnClose = {}) {
  let viewAllOverlay = document.createElement("div");
  viewAllOverlay.className = "ams-overlay";

  // Mantém compatibilidade com a assinatura antiga, que podia receber apenas onClose.
  const options =
    typeof optionsOrOnClose === "function"
      ? { onClose: optionsOrOnClose }
      : optionsOrOnClose || {};

  // Os dados são normalizados uma vez para simplificar os filtros e a montagem dos cards.
  const normalizedGames = games.map(normalizeViewAllGame);
  let activeStatus =
    options.initialStatus && VIEW_ALL_STATUS_META[options.initialStatus]
      ? options.initialStatus
      : "playing";

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
        <div class="view-all-summary-card">
          <span class="view-all-summary-label">Selected category</span>
          <div class="view-all-summary-content">
            <div>
              <h3 class="view-all-summary-title"></h3>
              <p class="view-all-summary-copy"></p>
            </div>
            <span class="view-all-summary-count"></span>
          </div>
        </div>
        <div class="view-all-content"></div>
      </div>
    </div>
  `;

  document.body.appendChild(viewAllOverlay);
  document.body.style.overflow = "hidden";

  // Referências aos nós que serão atualizados dinamicamente sempre que o usuário
  // trocar de categoria dentro do popup.
  const filtersContainer = viewAllOverlay.querySelector(".view-all-filters");
  const summaryTitle = viewAllOverlay.querySelector(".view-all-summary-title");
  const summaryCopy = viewAllOverlay.querySelector(".view-all-summary-copy");
  const summaryCount = viewAllOverlay.querySelector(".view-all-summary-count");
  const contentContainer = viewAllOverlay.querySelector(".view-all-content");

  // Renderiza os botões das categorias mostrando também a quantidade de jogos em cada uma.
  function buildFilters() {
    filtersContainer.innerHTML = Object.entries(VIEW_ALL_STATUS_META)
      .map(([status, meta]) => {
        const count = normalizedGames.filter(
          (game) => game.status === status,
        ).length;
        const isActive = status === activeStatus;
        return `
          <button
            class="view-all-filter-btn${isActive ? " is-active" : ""}"
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
      .join("");
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
            ${game.rating ? `<span class="view-all-rating">${renderRatingStars(game.rating)}</span>` : ""}
          </div>

          <div class="view-all-card-copy">
            <h3 class="view-all-game-title">${game.title}</h3>
            <span class="view-all-game-dev">${game.developer}</span>
          </div>

          <div class="view-all-review-block">
            <span class="view-all-review-label">Your review</span>
            <p class="view-all-review">
              ${review || "You have not added a review snippet for this game yet."}
            </p>
          </div>
        </div>
      </article>
    `;
  }

  // Atualiza o resumo e a grade de jogos da categoria atualmente selecionada.
  function renderActiveCategory() {
    const meta = getStatusMeta(activeStatus);
    const filteredGames = normalizedGames.filter(
      (game) => game.status === activeStatus,
    );

    summaryTitle.textContent = meta.label;
    summaryCopy.textContent = meta.helper;
    summaryCount.textContent = `${filteredGames.length} game${filteredGames.length === 1 ? "" : "s"}`;

    if (!filteredGames.length) {
      contentContainer.innerHTML = `
        <div class="view-all-empty">
          <h3 class="view-all-empty-title">${meta.emptyTitle}</h3>
          <p class="view-all-empty-copy">${meta.emptyCopy}</p>
        </div>
      `;
      return;
    }

    contentContainer.innerHTML = `
      <div class="view-all-grid">
        ${filteredGames.map(buildCard).join("")}
      </div>
    `;
  }

  // Render inicial do modal já focando na categoria escolhida ao abrir.
  buildFilters();
  renderActiveCategory();

  // Troca de aba/categoria sem reabrir o modal.
  filtersContainer.addEventListener("click", (event) => {
    const button = event.target.closest(".view-all-filter-btn");
    if (!button) return;

    activeStatus = button.dataset.status;
    buildFilters();
    renderActiveCategory();
  });

  // Fecha o modal e restaura o scroll do documento.
  function close() {
    if (!viewAllOverlay) return;
    document.removeEventListener("keydown", onKeyDown);
    viewAllOverlay.remove();
    viewAllOverlay = null;
    document.body.style.overflow = "";
    if (typeof options.onClose === "function") options.onClose();
  }

  viewAllOverlay.querySelector(".ams-close").addEventListener("click", close);
  viewAllOverlay.addEventListener("click", (e) => {
    if (e.target === viewAllOverlay) close();
  });

  const onKeyDown = (e) => {
    if (e.key === "Escape") close();
  };
  viewAllOverlay._onKeyDown = onKeyDown;
  document.addEventListener("keydown", onKeyDown);
}
