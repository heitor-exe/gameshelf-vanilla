import { createNavbar } from '../components/navbar.js';
import { openModal } from '../components/modal.js';
import { getShelfGames, addGameToShelf, removeGameFromShelf } from '../lib/shelf-store.js';

const TABS = [
  { id: "playing", label: "PLAYING" },
  { id: "completed", label: "COMPLETED" },
  { id: "dropped", label: "DROPPED" },
  { id: "wishlist", label: "WISHLIST" }
];

function generateStars(rating) {
  if (!rating) return "";
  let stars = "";
  for(let i=0; i<5; i++) {
    stars += i < rating ? "★" : "☆";
  }
  return `<div class="review-stars">${stars}</div>`;
}

function createShelfGameCard(game, onEdit, onDelete) {
  const card = document.createElement("article");
  card.className = "shelf-game-card";
  card.style.cursor = "pointer";
  
  card.innerHTML = `
    <div class="shelf-cover-wrapper">
      <img src="${game.cover_url}" alt="${game.title || game.game_title}" class="cover-art">
      ${game.rating > 0 ? `
      <div class="shelf-rating-overlay">
        ${generateStars(game.rating)}
      </div>
      ` : ''}
    </div>
    <div class="game-info">
      <h3 class="shelf-game-title">${game.title || game.game_title}</h3>
      ${game.review_snippet ? `<p class="shelf-review-snippet">${game.review_snippet}</p>` : ''}
    </div>
  `;

  card.addEventListener("click", () => {
    openModal(game, onEdit, onDelete);
  });
  
  return card;
}

export function renderShelf(container) {
  container.innerHTML = "";
  
  const navbar = createNavbar();
  container.appendChild(navbar);

  const pageContainer = document.createElement("div");
  pageContainer.className = "page-container";
  pageContainer.style.flexDirection = "column";

  const header = document.createElement("header");
  header.className = "shelf-header";
  header.innerHTML = `
    <h1 class="shelf-hero-title">My Shelf</h1>
    <p class="shelf-hero-subtitle">CURATING YOUR DIGITAL LEGACY</p>
  `;
  pageContainer.appendChild(header);

  const statsEl = document.createElement("div");
  statsEl.className = "shelf-stats";

  function updateStats() {
    const games = getShelfGames();
    const totalGames = games.length;
    const topGenre = "RPG";
    const completedCount = games.filter(g => g.status === 'completed').length;
    statsEl.innerHTML = `
      <div class="stat-box">
        <span class="stat-value">${totalGames}</span>
        <span class="stat-label">TOTAL GAMES</span>
      </div>
      <div class="stat-box">
        <span class="stat-value" style="color: var(--color-primary)">${topGenre}</span>
        <span class="stat-label">TOP GENRE</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">${completedCount}</span>
        <span class="stat-label">COMPLETED '25</span>
      </div>
    `;
  }

  pageContainer.appendChild(statsEl);

  const tabsContainer = document.createElement("div");
  tabsContainer.className = "shelf-tabs";

  let currentTab = "playing";

  const gamesGrid = document.createElement("div");
  gamesGrid.className = "shelf-games-grid";

  function renderGrid(filterStatus) {
    gamesGrid.innerHTML = "";
    const filteredGames = getShelfGames().filter(g => g.status === filterStatus);
    filteredGames.forEach(game => {
      gamesGrid.appendChild(createShelfGameCard(
        game,
        (updatedData) => {
          addGameToShelf(updatedData);
          updateStats();
          renderGrid(currentTab);
        },
        (gameId) => {
          removeGameFromShelf(gameId);
          updateStats();
          renderGrid(currentTab);
        }
      ));
    });
  }

  TABS.forEach(tab => {
    const btn = document.createElement("button");
    btn.className = `shelf-tab ${tab.id === currentTab ? 'active' : ''}`;
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.shelf-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentTab = tab.id;
      renderGrid(currentTab);
    });
    tabsContainer.appendChild(btn);
  });

  pageContainer.appendChild(tabsContainer);
  pageContainer.appendChild(gamesGrid);

  updateStats();
  renderGrid(currentTab);

  const fab = document.createElement("a");
  fab.className = "floating-add-btn";
  fab.href = "/search";
  fab.textContent = "+";
  
  container.appendChild(pageContainer);
  container.appendChild(fab);
}
