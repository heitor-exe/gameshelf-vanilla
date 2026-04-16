import { createNavbar } from '../components/navbar.js';
import { openModal } from '../components/modal.js';

const MOCK_GAMES = [
  { id: 1, title: "Cyberpunk: Neon Nights", cover_url: "https://picsum.photos/seed/game1/300/400", year: 2026, genres: ["RPG", "Action"], rating: 4.5 },
  { id: 2, title: "Velocity Overdrive 4", cover_url: "https://picsum.photos/seed/game2/300/400", year: 2025, genres: ["Racing", "Action"], rating: 4.8 },
  { id: 3, title: "Pixel Woods", cover_url: "https://picsum.photos/seed/game3/300/400", year: 2024, genres: ["Platformer", "Indie"], rating: 4.2 },
  { id: 4, title: "Elden Magic", cover_url: "/assets/elden_magic.png", year: 2026, genres: ["RPG", "Fantasy"], rating: 4.9 },
  { id: 5, title: "Galactic Empire Builder", cover_url: "https://picsum.photos/seed/game5/300/400", year: 2023, genres: ["Strategy", "Simulation"], rating: 4.0 },
  { id: 6, title: "Shadow Ninja", cover_url: "https://picsum.photos/seed/game6/300/400", year: 2025, genres: ["Action", "Stealth"], rating: 4.6 },
  { id: 7, title: "Stardew Valley 2", cover_url: "https://picsum.photos/seed/game7/300/400", year: 2027, genres: ["RPG", "Indie"], rating: 4.9 },
  { id: 8, title: "Mech Commander", cover_url: "https://picsum.photos/seed/game8/300/400", year: 2024, genres: ["Strategy", "Action"], rating: 4.1 },
  { id: 9, title: "Crimson Dragon", cover_url: "https://picsum.photos/seed/game9/300/400", year: 2026, genres: ["RPG", "Action"], rating: 4.4 },
  { id: 10, title: "Infinite Puzzle", cover_url: "https://picsum.photos/seed/game10/300/400", year: 2022, genres: ["Puzzle", "Indie"], rating: 4.7 }
];

export function renderSearch(container) {
  container.innerHTML = "";
  
  // Add Navbar
  const navbar = createNavbar();
  container.appendChild(navbar);

  const pageContainer = document.createElement("div");
  pageContainer.className = "page-container search-container";

  // Search Header
  const searchHeader = document.createElement("div");
  searchHeader.className = "search-header";

  const searchWrapper = document.createElement("div");
  searchWrapper.className = "search-input-wrapper";
  
  // Parse incoming URL params
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const input = document.createElement("input");
  input.type = "text";
  input.className = "search-hero-input";
  input.placeholder = "Search your digital library...";
  input.value = initialQuery; // Pre-fill queries made from navbar
  
  const hint = document.createElement("span");
  hint.className = "shortcut-hint";
  hint.textContent = "PRESS / TO FOCUS";

  searchWrapper.appendChild(input);
  searchWrapper.appendChild(hint);

  // Filters
  const filtersContainer = document.createElement("div");
  filtersContainer.className = "filter-pills";
  const genres = ["ALL GAMES", "RPG", "ACTION", "INDIE", "STRATEGY"];
  
  let activeFilter = "ALL GAMES";
  
  genres.forEach(genre => {
    const pill = document.createElement("button");
    pill.className = `filter-pill ${genre === activeFilter ? 'active' : ''}`;
    pill.textContent = genre;
    pill.addEventListener('click', () => {
      activeFilter = genre;
      // Update styling
      Array.from(filtersContainer.children).forEach(c => c.classList.remove('active'));
      pill.classList.add('active');
      renderGrid();
    });
    filtersContainer.appendChild(pill);
  });

  searchHeader.appendChild(searchWrapper);
  searchHeader.appendChild(filtersContainer);
  pageContainer.appendChild(searchHeader);

  // Grid
  const gridContainer = document.createElement("div");
  gridContainer.className = "games-grid";
  pageContainer.appendChild(gridContainer);
  container.appendChild(pageContainer);

  const renderGrid = () => {
    gridContainer.innerHTML = "";
    const term = input.value.toLowerCase();
    
    // Filter logic
    const filtered = MOCK_GAMES.filter(game => {
      const matchTitle = game.title.toLowerCase().includes(term);
      const matchGenre = activeFilter === "ALL GAMES" || game.genres.map(g => g.toUpperCase()).includes(activeFilter);
      return matchTitle && matchGenre;
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML = `<p style="color: var(--color-on-surface-variant); text-align: center; grid-column: 1/-1;">No games found matching your search.</p>`;
      return;
    }

    filtered.forEach(game => {
      const card = document.createElement("article");
      card.className = "game-card";
      card.innerHTML = `
        <div class="cover-art-wrapper">
          <img src="${game.cover_url}" alt="${game.title}" class="cover-art">
        </div>
        <div class="game-info">
          <span class="game-info-title">${game.title}</span>
          <span class="game-info-meta">${game.year} • ${game.genres.join(', ')}</span>
        </div>
      `;
      // Open Modal event
      card.addEventListener('click', () => {
        openModal(game);
      });
      gridContainer.appendChild(card);
    });
  };

  // Immediate filtering when typing
  input.addEventListener('input', () => {
    renderGrid();
  });

  // Global Keydown Hotkey for slash
  const handleKeydown = (e) => {
    if (e.key === '/' && document.activeElement !== input && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      input.focus();
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // Clean up global event on unmount
  pageContainer.addEventListener('DOMNodeRemovedFromDocument', () => {
      document.removeEventListener('keydown', handleKeydown);
  });

  // Initial render (and auto-focus if we hit this page organically or via navbar)
  setTimeout(() => {
    renderGrid();
    if (window.location.pathname === '/search') {
       input.focus();
       // If there's an initial query (from navbar), move cursor to end
       if (initialQuery) {
         input.setSelectionRange(initialQuery.length, initialQuery.length);
       }
    }
  }, 0);
}
