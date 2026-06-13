import { createNavbar } from '../components/navbar.js';
import { feedAPI } from '../lib/api.js';
import { getShelfGames } from '../lib/shelf-store.js';
import '../styles/pages/home.css';

// Não estamos mais usando dados mockados para tópicos em alta, estamos usando dados reais da API
function timeAgo(dateString) {
  // Verifica se há uma data válida
  if (!dateString) return 'Just now';

  // Cria um objeto Date a partir da data string
  const date = new Date(dateString);

  // Cria um objeto Date com a data atual
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);

  // Verifica o tempo atrás
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  // Calcula as horas
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  // Calcula os dias
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  // Calcula os meses
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function generateStars(rating) {
  // Verifica se a avaliação é válida
  if (!rating) return "";

  // Cria uma string de estrelas
  let stars = "";

  // Adiciona estrelas baseadas na avaliação
  for (let i = 0; i < 5; i++) {
    stars += i < rating ? "★" : "☆";
  }

  // Retorna a string de estrelas dentro de uma div
  return `<div class="review-stars">${stars}</div>`;
}

function createFeedCard(item) {
  const card = document.createElement("article");

  // Se tem texto de review, nós consideramos "reviewed", senão é um "added" ou "playing"
  const type = item.review && item.review.trim() !== '' ? 'reviewed' : 'added';

  // Define a classe do card baseado no tipo
  card.className = `card feed-card layout-${type}`;

  // Define o nome e o avatar do usuário
  const username = item.profiles?.username || 'Unknown';
  const avatar = item.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  // Define o texto da ação baseada no tipo
  let actionText = 'added to their shelf';

  // Verifica o tipo de ação
  if (type === 'reviewed') {
    actionText = 'wrote a review for';
  } else if (item.status === 'playing') {
    actionText = 'started playing';
  } else if (item.status === 'completed') {
    actionText = 'completed';
  } else if (item.status === 'dropped') {
    actionText = 'dropped';
  }

  // Adiciona os gêneros do jogo ao texto da ação
  const genresText = Array.isArray(item.game_genres) ? item.game_genres.slice(0, 3).join(' • ') : '';

  // Cria o cabeçalho do card
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

  // Cria a capa do card
  const coverHtml = `<img src="${item.game_cover_url || ''}" alt="${item.game_title}" class="cover-art">`;

  // Cria o corpo do card
  const bodyHtml = `
    <div class="feed-body">
      ${genresText ? `<span class="game-genres">${genresText}</span>` : ''}
      <h3 class="game-title">${item.game_title}</h3>
      ${item.rating ? generateStars(item.rating) : ''}
      ${type === 'reviewed' ? `<p class="review-text">${item.review}</p>` : ''}
    </div>
  `;

  // Define o layout do card baseado no tipo
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

  // Adiciona Barra de Navegação
  const navbar = createNavbar();
  container.appendChild(navbar);

  // Container principal do layout
  const pageContainer = document.createElement("div");
  pageContainer.className = "page-container";

  // Coluna esquerda: Feed
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

  // Coluna direita: Barra Lateral (Trending e Estatísticas)
  const sidebarColumn = document.createElement("aside");
  sidebarColumn.className = "sidebar-column";

  // Widget de Trending
  const trendingWidget = document.createElement("div");
  trendingWidget.className = "card widget";
  trendingWidget.innerHTML = `
    <h2 class="section-title">Trending Now</h2>
    <div class="trending-list" id="trending-list-container">
      <div class="auth-spinner" style="margin: 2rem auto; width: 24px; height: 24px; border-width: 2px;"></div>
    </div>
  `;
  sidebarColumn.appendChild(trendingWidget);

  // Busca dados reais de trending do GameSpot via Proxy do Backend
  async function loadTrendingNews() {
    const container = trendingWidget.querySelector('#trending-list-container');
    try {
      const json = await feedAPI.getTrendingNews();

      // Extrai as primeiras 4 notícias do feed RSS
      const posts = json.items.slice(0, 4);

      container.innerHTML = posts.map(post => {
        // Usa a primeira categoria como tag/flair, ou "NEWS" como padrão
        const flair = post.categories && post.categories.length > 0
          ? post.categories[0].toUpperCase()
          : 'NEWS';

        // Formata a data para uma string curta localizada
        const dateObj = new Date(post.pubDate);
        const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        // Renderiza o item do feed
        return `
          <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="trending-item" style="text-decoration: none; display: flex; flex-direction: column; gap: 0.25rem;">
            <span class="trending-hashtag" style="color: var(--color-primary); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">${flair}</span>
            <span class="trending-title" style="color: var(--color-on-surface); font-weight: 500; font-size: 0.95rem; line-height: 1.3;">${post.title}</span>
            <span class="trending-count" style="color: var(--color-on-surface-variant); font-size: 0.8rem;">GameSpot • ${dateStr}</span>
          </a>
        `;
      }).join('');
    } catch (e) {
      console.error('Failed to load trending news', e);
      container.innerHTML = '<p style="color: var(--color-on-surface-variant); font-size: 0.85rem; padding: 1rem 0;">Failed to load trending news.</p>';
    }
  }

  loadTrendingNews();

  // Atualiza as estatísticas com os dados locais do usuário ativo
  const allGames = getShelfGames();
  const totalOwned = allGames.length;
  const inProgress = allGames.filter(g => g.status === 'playing').length;

  // Widget de Estatísticas
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

  // Adiciona o widget de estatísticas à barra lateral
  sidebarColumn.appendChild(statsWidget);

  // Adiciona as colunas ao container principal
  pageContainer.appendChild(mainColumn);

  // Adiciona a barra lateral ao container principal
  pageContainer.appendChild(sidebarColumn);

  // Monta a página antes do await
  container.appendChild(pageContainer);

  // Tenta carregar os dados do feed
  try {
    // Carrega os dados do feed
    const feedData = await feedAPI.getGlobalFeed();
    mainColumn.removeChild(loadingWrapper);

    // Verifica se o feed está vazio
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
    // Remove o loading
    if (mainColumn.contains(loadingWrapper)) {
      mainColumn.removeChild(loadingWrapper);
    }
    // Mostra mensagem de erro
    const errorText = document.createElement("p");
    errorText.textContent = "Error loading feed. Please try again later.";
    errorText.style.color = "var(--color-error)";
    errorText.style.textAlign = "center";
    errorText.style.padding = "2rem";
    mainColumn.appendChild(errorText);
  }
}
