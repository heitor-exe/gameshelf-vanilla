import { createNavbar } from '../components/navbar.js';
import { feedAPI } from '../lib/api.js';
import { getShelfGames } from '../lib/shelf-store.js';
import '../styles/pages/home.css';

const TRENDING_TOPICS = [
  { hashtag: "#IndieShowcase", title: "Best Hidden Gems of 2026", count: "12K posts" },
  { hashtag: "#Speedrun", title: "Velocity Overdrive Any% WR", count: "8.5K posts" },
  { hashtag: "#BossFight", title: "Defeating the Crimson Dragon", count: "5K posts" }
];

function timeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
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

function generateStars(rating) {
  if (!rating) return "";
  let stars = "";
  for(let i=0; i<5; i++) {
    stars += i < rating ? "★" : "☆";
  }
  return `<div class="review-stars">${stars}</div>`;
}

function createFeedCard(item) {
  const card = document.createElement("article");
  
  // Se tem texto de review, nós consideramos "reviewed", senão é um "added" ou "playing"
  const type = item.review && item.review.trim() !== '' ? 'reviewed' : 'added';
  card.className = `card feed-card layout-${type}`;
  
  const username = item.profiles?.username || 'Unknown';
  const avatar = item.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  
  let actionText = 'added to their shelf';
  if (type === 'reviewed') {
    actionText = 'wrote a review for';
  } else if (item.status === 'playing') {
    actionText = 'started playing';
  } else if (item.status === 'completed') {
    actionText = 'completed';
  } else if (item.status === 'dropped') {
    actionText = 'dropped';
  }
  
  const genresText = Array.isArray(item.game_genres) ? item.game_genres.slice(0, 3).join(' • ') : '';

  const headerHtml = `
    <div class="feed-header">
      <img src="${avatar}" alt="${username}" class="avatar">
      <div class="feed-user-info">
        <span class="feed-username">${username}</span>
        <span class="feed-action">${actionText}</span>
      </div>
      <span class="feed-timestamp">${timeAgo(item.created_at)}</span>
    </div>
  `;

  const coverHtml = `<img src="${item.game_cover_url || ''}" alt="${item.game_title}" class="cover-art">`;
  
  const bodyHtml = `
    <div class="feed-body">
      ${genresText ? `<span class="game-genres">${genresText}</span>` : ''}
      <h3 class="game-title">${item.game_title}</h3>
      ${item.rating ? generateStars(item.rating) : ''}
      ${type === 'reviewed' ? `<p class="review-text">${item.review}</p>` : ''}
    </div>
  `;

  if (type === 'reviewed') {
    card.innerHTML = `
      ${headerHtml}
      ${coverHtml}
      ${bodyHtml}
    `;
  } else {
    card.innerHTML = `
      ${coverHtml}
      <div class="feed-content-wrapper">
        ${headerHtml}
        ${bodyHtml}
      </div>
    `;
  }

  return card;
}

export async function renderHome(container) {
  container.innerHTML = "";
  
  // Add Navbar
  const navbar = createNavbar();
  container.appendChild(navbar);

  // Main layout container
  const pageContainer = document.createElement("div");
  pageContainer.className = "page-container";

  // Left column: Feed
  const mainColumn = document.createElement("main");
  mainColumn.className = "main-column";
  
  const feedTitle = document.createElement("h2");
  feedTitle.className = "section-title";
  feedTitle.textContent = "Recent Activity";
  mainColumn.appendChild(feedTitle);

  // Carrega o feed da API do backend
  const loadingText = document.createElement("div");
  loadingText.className = "auth-spinner"; // Reaproveitando o spinner
  loadingText.style.margin = "2rem auto";
  
  const loadingWrapper = document.createElement("div");
  loadingWrapper.style.textAlign = "center";
  loadingWrapper.style.padding = "2rem";
  loadingWrapper.appendChild(loadingText);
  mainColumn.appendChild(loadingWrapper);

  // Right column: Sidebar (Trending & Stats)
  const sidebarColumn = document.createElement("aside");
  sidebarColumn.className = "sidebar-column";

  // Trending Widget
  const trendingWidget = document.createElement("div");
  trendingWidget.className = "card widget";
  trendingWidget.innerHTML = `
    <h2 class="section-title">Trending Now</h2>
    <div class="trending-list">
      ${TRENDING_TOPICS.map(topic => `
        <div class="trending-item">
          <span class="trending-hashtag">${topic.hashtag}</span>
          <span class="trending-title">${topic.title}</span>
          <span class="trending-count">${topic.count}</span>
        </div>
      `).join('')}
    </div>
  `;
  sidebarColumn.appendChild(trendingWidget);

  // Atualiza as estatísticas com os dados locais do usuário ativo
  const allGames = getShelfGames();
  const totalOwned = allGames.length;
  const inProgress = allGames.filter(g => g.status === 'playing').length;

  // Stats Widget
  const statsWidget = document.createElement("div");
  statsWidget.className = "card widget";
  statsWidget.innerHTML = `
    <h2 class="section-title">Your Shelf</h2>
    <div class="stats-grid">
      <div class="stat-box">
        <span class="stat-value">${totalOwned}</span>
        <span class="stat-label">Games Owned</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">${inProgress}</span>
        <span class="stat-label">In Progress</span>
      </div>
    </div>
  `;
  sidebarColumn.appendChild(statsWidget);

  pageContainer.appendChild(mainColumn);
  pageContainer.appendChild(sidebarColumn);
  
  // MONTA A PÁGINA ANTES DO AWAIT
  container.appendChild(pageContainer);

  try {
    const feedData = await feedAPI.getGlobalFeed();
    mainColumn.removeChild(loadingWrapper);
    
    if (!feedData || feedData.length === 0) {
      const emptyText = document.createElement("p");
      emptyText.textContent = "No recent activity found.";
      emptyText.style.color = "var(--color-on-surface-variant)";
      emptyText.style.textAlign = "center";
      emptyText.style.padding = "2rem";
      mainColumn.appendChild(emptyText);
    } else {
      feedData.forEach(item => {
        mainColumn.appendChild(createFeedCard(item));
      });
    }
  } catch (error) {
    if (mainColumn.contains(loadingWrapper)) {
      mainColumn.removeChild(loadingWrapper);
    }
    const errorText = document.createElement("p");
    errorText.textContent = "Error loading feed. Please try again later.";
    errorText.style.color = "var(--color-error)";
    errorText.style.textAlign = "center";
    errorText.style.padding = "2rem";
    mainColumn.appendChild(errorText);
  }
}
