import { createNavbar } from '../components/navbar.js';
import { getShelfGames } from '../lib/shelf-store.js';
import { openViewAllModal } from '../components/modal.js';

const MOCK_PROFILE = {
  username: 'user',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Salem',
  bio: 'RPG enthusiast. Soulslike survivor. Always chasing the next platinum.',
  memberSince: '2024-03-15',
  stats: {
    total: 128,
    completed: 42,
    wishlist: 15,
  },
};

const MOCK_CURRENTLY_PLAYING = [
  {
    game_title: 'Cyberpunk 2077',
    cover_url: 'https://images.unsplash.com/photo-1614294148960-9aa740632a87?q=80&w=400',
    developer: 'CD Projekt Red',
  },
  {
    game_title: 'Hades II',
    cover_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400',
    developer: 'Supergiant Games',
  },
  {
    game_title: "Dragon's Dogma 2",
    cover_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400',
    developer: 'Capcom',
  },
];

function generateStars(rating) {
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < rating ? '★' : '☆';
  }
  return stars;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function timeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);

  return `${months}mo ago`;
}

function createGameCard(game) {
  const card = document.createElement('article');
  card.className = 'current-game-card';

  const title = game.title || game.game_title || 'Unknown Title';
  const developer = game.developer || '';

  card.innerHTML = `
    <div class="current-cover-wrapper">
      <img src="${game.cover_url}" alt="${title}" class="current-cover">
    </div>
    <div class="current-game-info">
      <h3 class="current-game-title">${title}</h3>
      <span class="current-game-dev">${developer}</span>
    </div>
  `;

  return card;
}

function createReviewCard(review, index) {
  const card = document.createElement('article');
  const isOdd = index % 2 === 1;
  const altLayout = isOdd ? 'layout-cover-left' : 'layout-cover-right';

  card.className = `review-card ${altLayout}`;

  card.innerHTML = `
    <div class="review-cover-col">
      <img src="${review.cover_url}" alt="${review.game_title}" class="review-cover">
    </div>
    <div class="review-content-col">
      <div class="review-meta">
        <span class="review-stars">${generateStars(review.starRating)}</span>
        <span class="review-timestamp">REVIEW • ${review.timeAgo}</span>
      </div>
      <h3 class="review-game-title">${review.game_title}</h3>
      <p class="review-text">${review.reviewText}</p>
      <button class="btn-ghost">READ FULL REVIEW</button>
    </div>
  `;

  return card;
}

let _renderCount = 0;

export function renderProfile(container, username = 'Macedhe') {
  _renderCount++;
  container.innerHTML = '';

  const navbar = createNavbar();
  container.appendChild(navbar);

  const allGames = getShelfGames();
  const profile = {
    ...MOCK_PROFILE,
    stats: {
      total: allGames.length,
      completed: allGames.filter((g) => g.status === 'completed').length,
      wishlist: allGames.filter((g) => g.status === 'wishlist').length,
    },
  };
  const playing = allGames.filter((g) => g.status === 'playing');
  const reviews = allGames
    .filter((g) => g.rating > 0 && g.review_snippet)
    .sort((a, b) => new Date(b.review_date) - new Date(a.review_date))
    .map((game) => ({
      game_title: game.title || game.game_title,
      cover_url: game.cover_url,
      starRating: game.rating,
      reviewText: game.review_snippet,
      timeAgo: game.review_date ? timeAgo(new Date(game.review_date)) : 'Recently',
    }));

  const pageContainer = document.createElement('div');
  pageContainer.className = 'page-container profile-page';

  // Header Section
  const header = document.createElement('header');
  header.className = 'profile-header';
  header.innerHTML = `
    <div class="profile-avatar-col">
      <img src="${profile.avatar}" alt="${profile.username}" class="profile-avatar">
    </div>
    <div class="profile-info-col">
      <h1 class="profile-username">${profile.username}</h1>
      <p class="profile-bio">${profile.bio}</p>
      <div class="profile-meta-row">
        <span class="profile-member-label">MEMBER SINCE</span>
        <span class="profile-member-date">${formatDate(profile.memberSince)}</span>
      </div>
      <div class="profile-stats">
        <div class="profile-stat">
          <span class="profile-stat-value">${profile.stats.total}</span>
          <span class="profile-stat-label">TOTAL</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value">${profile.stats.completed}</span>
          <span class="profile-stat-label">COMPLETED</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value">${profile.stats.wishlist}</span>
          <span class="profile-stat-label">WISHLIST</span>
        </div>
      </div>
    </div>
  `;
  pageContainer.appendChild(header);

  // Currently Playing Section
  const playingSection = document.createElement('section');
  playingSection.className = 'profile-section playing-section';
  playingSection.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Currently Playing</h2>
      <button class="btn-ghost view-all-btn">VIEW ALL</button>
    </div>
    <div class="playing-scroll-row">
      ${playing
        .map((game) => {
          const card = createGameCard(game);
          return card.outerHTML;
        })
        .join('')}
    </div>
  `;
  pageContainer.appendChild(playingSection);

  // O botão abre o modal mostrando todos os jogos da shelf por padrão.
  // As categorias continuam disponíveis no popup e passam a atuar como filtros opcionais.
  const viewAllBtn = playingSection.querySelector('.view-all-btn');
  viewAllBtn.addEventListener('click', () => {
    openViewAllModal(allGames);
  });

  // Recently Reviewed Section
  const reviewsSection = document.createElement('section');
  reviewsSection.className = 'profile-section reviews-section';
  reviewsSection.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Recently Reviewed</h2>
    </div>
    <div class="reviews-list">
      ${reviews.map((review, i) => createReviewCard(review, i).outerHTML).join('')}
    </div>
  `;
  pageContainer.appendChild(reviewsSection);

  // Footer / Share Section
  const footer = document.createElement('footer');
  footer.className = 'profile-footer';
  footer.innerHTML = `
    <div class="share-card">
      <div class="share-text">
        <h3 class="share-title">Share this Shelf</h3>
        <p class="share-url">gameshelf.io/user/${profile.username}</p>
      </div>
      <button class="share-copy-btn" data-copy="gameshelf.io/user/${profile.username}">
        <svg class="copy-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span class="copy-text">COPY</span>
      </button>
    </div>
  `;
  pageContainer.appendChild(footer);

  container.appendChild(pageContainer);

  // Copy button interaction
  const copyBtn = footer.querySelector('.share-copy-btn');
  copyBtn.addEventListener('click', async () => {
    const url = copyBtn.dataset.copy;
    const copyText = copyBtn.querySelector('.copy-text');

    try {
      await navigator.clipboard.writeText(url);
      copyText.textContent = 'COPIED';
      copyBtn.classList.add('copied');

      setTimeout(() => {
        copyText.textContent = 'COPY';
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
}

export function initProfileAutoRefresh(container) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'gameshelf_vanilla_games') {
      renderProfile(container);
    }
  });
  _renderCount = 1;
}
