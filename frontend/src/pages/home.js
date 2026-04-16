import { createNavbar } from '../components/navbar.js';

const MOCK_FEED = [
  {
    type: "reviewed",
    username: "Alex.Hunter",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    game_title: "Cyberpunk: Neon Nights",
    game_cover: "https://images.unsplash.com/photo-1614294148960-9aa740632a87?q=80&w=1000",
    game_genres: "RPG • Cyberpunk",
    rating: 4,
    review_text: "Incredible atmosphere and lighting. The side quests really flesh out the dystopian feel. Exploring the neon-lit alleyways is an absolute visual treat.",
    timestamp: "2 hours ago"
  },
  {
    type: "added",
    username: "SarahPlayz",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    game_title: "Pixel Woods",
    game_cover: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1000",
    game_genres: "Platformer • Indie",
    timestamp: "5 hours ago"
  },
  {
    type: "reviewed",
    username: "RetroGamer88",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Retro",
    game_title: "Velocity Overdrive 4",
    game_cover: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000",
    game_genres: "Racing • Arcade",
    rating: 5,
    review_text: "Best sense of speed in any arcade racer I've played this year. The synthwave soundtrack slaps insanely hard.",
    timestamp: "1 day ago"
  },
  {
    type: "added",
    username: "NoobMaster69",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Noob",
    game_title: "Elden Magic",
    game_cover: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=1000",
    game_genres: "RPG • Fantasy",
    timestamp: "2 days ago"
  }
];

const TRENDING_TOPICS = [
  { hashtag: "#IndieShowcase", title: "Best Hidden Gems of 2026", count: "12K posts" },
  { hashtag: "#Speedrun", title: "Velocity Overdrive Any% WR", count: "8.5K posts" },
  { hashtag: "#BossFight", title: "Defeating the Crimson Dragon", count: "5K posts" }
];

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
  card.className = `card feed-card layout-${item.type}`;
  
  const headerHtml = `
    <div class="feed-header">
      <img src="${item.avatar}" alt="${item.username}" class="avatar">
      <div class="feed-user-info">
        <span class="feed-username">${item.username}</span>
        <span class="feed-action">${item.type === 'reviewed' ? 'wrote a review for' : 'added to their shelf'}</span>
      </div>
      <span class="feed-timestamp">${item.timestamp}</span>
    </div>
  `;

  const coverHtml = `<img src="${item.game_cover}" alt="${item.game_title}" class="cover-art">`;
  
  const bodyHtml = `
    <div class="feed-body">
      <span class="game-genres">${item.game_genres}</span>
      <h3 class="game-title">${item.game_title}</h3>
      ${generateStars(item.rating)}
      ${item.review_text ? `<p class="review-text">${item.review_text}</p>` : ''}
    </div>
  `;

  if (item.type === 'reviewed') {
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

export function renderHome(container) {
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

  MOCK_FEED.forEach(item => {
    mainColumn.appendChild(createFeedCard(item));
  });

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

  // Stats Widget
  const statsWidget = document.createElement("div");
  statsWidget.className = "card widget";
  statsWidget.innerHTML = `
    <h2 class="section-title">Your Shelf</h2>
    <div class="stats-grid">
      <div class="stat-box">
        <span class="stat-value">128</span>
        <span class="stat-label">Games Owned</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">3</span>
        <span class="stat-label">In Progress</span>
      </div>
    </div>
  `;
  sidebarColumn.appendChild(statsWidget);

  pageContainer.appendChild(mainColumn);
  pageContainer.appendChild(sidebarColumn);
  
  container.appendChild(pageContainer);
}
