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
        ${isEditMode ? `<button class="ams-delete-btn">REMOVE FROM SHELF</button>` : ''}
        <button class="ams-save-btn">${isEditMode ? 'UPDATE' : 'SAVE TO SHELF'}</button>
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
      if (confirm(`Tem certeza que deseja remover "${game.title}" da sua shelf?`)) {
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
