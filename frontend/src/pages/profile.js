import { createNavbar } from '../components/navbar.js';
import { getShelfGames } from '../lib/shelf-store.js';
import { openModal, openViewAllModal } from '../components/modal.js';
import { profileAPI } from '../lib/api.js';
import '../styles/pages/profile.css';
import '../styles/pages/creative-popup.css';

function generateStars(rating) {
  if (!rating) return '';
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < rating ? '★' : '☆';
  }
  return stars;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function timeAgo(date) {
  if (!date) return 'Just now';
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

function openCreativePopup(game) {
  const overlay = document.createElement('div');
  overlay.className = 'creative-popup-overlay';
  
  const title = game.title || game.game_title || 'Unknown Title';
  const developer = Array.isArray(game.game_genres) ? game.game_genres.slice(0, 2).join(', ') : 'Unknown Studio';
  const cover = game.cover_url || game.game_cover_url || '';
  const rating = Number(game.rating) || 0;
  const stars = rating > 0 ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}` : 'No rating yet';
  const review = game.review || game.review_snippet || 'No thoughts recorded for this game yet. Still exploring!';
  const timePlayed = game.created_at ? timeAgo(new Date(game.created_at)) : 'Recently added';

  overlay.innerHTML = `
    <div class="creative-popup-card">
      <div class="creative-popup-cover">
        <img src="${cover}" alt="${title}">
      </div>
      <div class="creative-popup-content">
        <div class="creative-popup-header">
          <span class="creative-popup-dev">${developer}</span>
          <h2 class="creative-popup-title">${title}</h2>
          <div class="creative-popup-stars">${stars}</div>
        </div>
        <div class="creative-popup-body">
          <div class="creative-popup-meta-item">
            <span class="creative-popup-meta-label">Time Playing</span>
            <span class="creative-popup-meta-value">${timePlayed}</span>
          </div>
          <div class="creative-popup-review">"${review}"</div>
        </div>
        <div class="creative-popup-footer">
          <button class="creative-popup-close">CLOSE</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const closeBtn = overlay.querySelector('.creative-popup-close');
  
  const closePopup = () => {
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onEsc);
  };

  const onEsc = (e) => { if (e.key === 'Escape') closePopup(); };

  closeBtn.addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
  document.addEventListener('keydown', onEsc);
}

function createGameCard(game) {
  const card = document.createElement('article');
  card.className = 'current-game-card';

  const title = game.title || game.game_title || 'Unknown Title';
  const developer = Array.isArray(game.game_genres) ? game.game_genres.slice(0, 2).join(', ') : '';

  card.innerHTML = `
    <div class="current-cover-wrapper">
      <img src="${game.cover_url || game.game_cover_url}" alt="${title}" class="current-cover">
    </div>
    <div class="current-game-info">
      <h3 class="current-game-title">${title}</h3>
      <span class="current-game-dev">${developer}</span>
    </div>
  `;

  card.addEventListener('click', () => {
    openCreativePopup(game);
  });

  return card;
}

function createReviewCard(review, index, game) {
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
      <!-- Só mostraremos botão se o jogo estiver carregado para o modal -->
      ${game ? `<button class="btn-ghost">READ FULL REVIEW</button>` : ''}
    </div>
  `;

  if (game) {
    const readMoreBtn = card.querySelector('.btn-ghost');
    readMoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(game, null, { readOnly: true });
    });
  }

  return card;
}

let _renderCount = 0;

export async function renderProfile(container, username = window.currentUser?.username) {
  _renderCount++;
  container.innerHTML = '';

  const navbar = createNavbar();
  container.appendChild(navbar);

  const pageContainer = document.createElement('div');
  pageContainer.className = 'page-container profile-page';
  
  const loadingText = document.createElement("div");
  loadingText.className = "auth-spinner"; // Reaproveitando o spinner
  loadingText.style.margin = "4rem auto";
  
  const loadingWrapper = document.createElement("div");
  loadingWrapper.style.width = "100%";
  loadingWrapper.style.textAlign = "center";
  loadingWrapper.appendChild(loadingText);
  
  pageContainer.appendChild(loadingWrapper);
  container.appendChild(pageContainer);

  if (!username) {
    loadingWrapper.innerHTML = "<p style='color: var(--color-on-surface-variant); padding: 2rem;'>User not found or not logged in.</p>";
    return;
  }

  try {
    const data = await profileAPI.getProfile(username);
    pageContainer.removeChild(loadingWrapper);

    const profileData = data.profile;
    const statsData = data.stats;
    const recentPlaying = data.recentPlaying || [];
    const recentReviews = data.recentReviews || [];

    const profile = {
      username: profileData.username,
      avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.username}`,
      bio: profileData.bio || 'No bio provided.',
      memberSince: profileData.created_at,
      stats: {
        total: statsData.totalEntries || 0,
        completed: statsData.countPerStatus?.completed || 0,
        wishlist: statsData.countPerStatus?.wishlist || 0,
      },
    };

    const reviews = recentReviews.map((game) => ({
      game_title: game.game_title,
      cover_url: game.game_cover_url,
      starRating: game.rating,
      reviewText: game.review,
      timeAgo: game.created_at ? timeAgo(new Date(game.created_at)) : 'Recently',
    }));

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
    if (recentPlaying.length > 0) {
      const playingSection = document.createElement('section');
      playingSection.className = 'profile-section playing-section';
      playingSection.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">Currently Playing</h2>
          <button class="btn-ghost view-all-btn">VIEW ALL</button>
        </div>
        <div class="playing-scroll-row"></div>
      `;
      pageContainer.appendChild(playingSection);

      const scrollRow = playingSection.querySelector('.playing-scroll-row');
      recentPlaying.forEach((game) => {
        scrollRow.appendChild(createGameCard(game));
      });

      // O botão abre o modal com todos os jogos
      const viewAllBtn = playingSection.querySelector('.view-all-btn');
      viewAllBtn.addEventListener('click', () => {
        // Se for o próprio perfil, podemos mostrar todos usando o store local
        if (profile.username === window.currentUser?.username) {
          openViewAllModal(getShelfGames());
        } else {
          // TODO: Para outros usuários, precisaríamos buscar a shelf inteira deles.
          alert("We only load full shelf for the logged-in user at the moment.");
        }
      });
    }

    // Recently Reviewed Section
    if (reviews.length > 0) {
      const reviewsSection = document.createElement('section');
      reviewsSection.className = 'profile-section reviews-section';
      const reviewsSectionHeader = document.createElement('div');
      reviewsSectionHeader.className = 'section-header';
      reviewsSectionHeader.innerHTML = `<h2 class="section-title">Recently Reviewed</h2>`;
      reviewsSection.appendChild(reviewsSectionHeader);

      const reviewsList = document.createElement('div');
      reviewsList.className = 'reviews-list';
      reviews.forEach((review, i) => {
        // Passamos null para game, pois não estamos mapeando para a store do modal 
        // (precisaríamos padronizar a chamada de openModal para games de outros usuários)
        reviewsList.appendChild(createReviewCard(review, i, null));
      });
      reviewsSection.appendChild(reviewsList);
      pageContainer.appendChild(reviewsSection);
    }

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

    // Copy button interaction
    const copyBtn = footer.querySelector('.share-copy-btn');
    if (copyBtn) {
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

  } catch (error) {
    if (pageContainer.contains(loadingWrapper)) {
      pageContainer.removeChild(loadingWrapper);
    }
    const errorText = document.createElement("p");
    errorText.textContent = "Error loading profile.";
    errorText.style.color = "var(--color-error)";
    errorText.style.padding = "2rem";
    errorText.style.textAlign = "center";
    pageContainer.appendChild(errorText);
  }
}

export function initProfileAutoRefresh(container) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'gameshelf_vanilla_games') {
      renderProfile(container);
    }
  });
  _renderCount = 1;
}
