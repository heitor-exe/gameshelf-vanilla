import { createNavbar } from '../components/navbar.js';
import { openModal } from '../components/modal.js';
import { getShelfGames, addGameToShelf, removeGameFromShelf } from '../lib/shelf-store.js';
import '../styles/pages/shelf.css';

/**
 * Página da Shelf (Prateleira)
 * Responsável por listar os jogos salvos pelo usuário, permitindo filtrar por categorias
 * (Playing, Completed, etc.) e visualizar estatísticas rápidas.
 */

// Configura as abas/categorias disponíveis na página da Shelf.
const TABS = [
  { id: 'playing', label: 'PLAYING' },
  { id: 'completed', label: 'COMPLETED' },
  { id: 'dropped', label: 'DROPPED' },
  { id: 'wishlist', label: 'WISHLIST' },
];

/**
 * Gera o HTML de estrelas baseado em uma nota numérica.
 * @param {number} rating - Nota de 0 a 5.
 * @returns {string} HTML contendo as estrelas preenchidas e vazias.
 */
function generateStars(rating) {
  // Se a nota não for fornecida, retorna uma string vazia.
  if (!rating) return '';

  // Gera o HTML de estrelas com base na nota fornecida.
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < rating ? '★' : '☆';
  }
  // Retorna o HTML gerado com as estrelas.
  return `<div class="review-stars">${stars}</div>`;
}

/**
 * Cria o elemento visual de um card de jogo para a prateleira.
 * @param {Object} game - Objeto do jogo.
 * @param {Function} onEdit - Callback executado ao editar o jogo.
 * @param {Function} onDelete - Callback executado ao remover o jogo.
 * @returns {HTMLElement} O elemento article do card.
 */
function createShelfGameCard(game, onEdit, onDelete) {
  // Cria o elemento article e define suas classes e estilo.
  const card = document.createElement('article');
  card.className = 'shelf-game-card';
  card.style.cursor = 'pointer';

  // Define o conteúdo HTML do card com base nos dados do jogo.
  card.innerHTML = `
    <div class="shelf-cover-wrapper">
      <img src="${game.cover_url}" alt="${game.title || game.game_title}" class="cover-art">
      ${game.rating > 0 ? `<div class="shelf-rating-overlay">${generateStars(game.rating)}</div>` : ''}
    </div>
    <div class="game-info">
      <h3 class="shelf-game-title">${game.title || game.game_title}</h3>
      ${game.review_snippet ? `<p class="shelf-review-snippet">${game.review_snippet}</p>` : ''}
    </div>
  `;

  // Adiciona o evento de clique para abrir o modal ao clicar no card.
  card.addEventListener('click', () => {
    openModal(game, onEdit, onDelete);
  });

  return card;
}

/**
 * Função principal que constrói e renderiza toda a interface da página Shelf.
 * @param {HTMLElement} container - O elemento pai onde a página será montada.
 */
export function renderShelf(container) {
  // Limpa o conteúdo do container antes de renderizar a página Shelf.
  container.innerHTML = '';

  // Cria e adiciona o navbar ao container.
  const navbar = createNavbar();
  container.appendChild(navbar);

  // Cria e adiciona o container principal da página ao container.
  const pageContainer = document.createElement('div');
  pageContainer.className = 'page-container';
  pageContainer.style.flexDirection = 'column';

  // Cria e adiciona o header ao container principal.
  const header = document.createElement('header');
  header.className = 'shelf-header';
  header.innerHTML = `
    <h1 class="shelf-hero-title">My Shelf</h1>
    <p class="shelf-hero-subtitle">CURATING YOUR DIGITAL LEGACY</p>
  `;
  pageContainer.appendChild(header);

  // Cria e adiciona o elemento de estatísticas ao container principal.
  const statsEl = document.createElement('div');
  statsEl.className = 'shelf-stats';

  // Função que atualiza as estatísticas exibidas na página Shelf.
  function updateStats() {
    // Obtém a lista de jogos e calcula as estatísticas.
    const games = getShelfGames();
    const totalGames = games.length;
    const topGenre = 'RPG';

    // Calcula o número de jogos concluídos.
    const completedCount = games.filter((g) => g.status === 'completed').length;

    // Atualiza o conteúdo do elemento de estatísticas com os valores calculados.
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

  // Adiciona o elemento de estatísticas ao container principal.
  pageContainer.appendChild(statsEl);

  // Cria e adiciona o elemento de abas ao container principal.
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'shelf-tabs';

  // Define a aba atual.
  let currentTab = 'playing';

  // Cria e adiciona o grid de jogos ao container principal.
  const gamesGrid = document.createElement('div');
  gamesGrid.className = 'shelf-games-grid';

  /**
   * Filtra os jogos conforme a aba ativa e renderiza os cards no grid.
   * @param {string} filterStatus - O ID da categoria (ex: 'playing').
   */
  function renderGrid(filterStatus) {
    gamesGrid.innerHTML = '';

    // Obtém a lista de jogos filtrados e renderiza cada um no grid.
    const filteredGames = getShelfGames().filter((g) => g.status === filterStatus);

    // Adiciona cada card do jogo filtrado ao grid.
    filteredGames.forEach((game) => {
      // Cria o card do jogo e adiciona ao grid.
      gamesGrid.appendChild(
        // Cria o card do jogo com as funções de callback para atualização e remoção.
        createShelfGameCard(
          game,
          // Função de callback para atualizar o jogo no armazenamento.
          (updatedData) => {
            addGameToShelf(updatedData);
            updateStats();
            renderGrid(currentTab);
          },
          // Função de callback para remover o jogo do armazenamento.
          (gameId) => {
            removeGameFromShelf(gameId);
            updateStats();
            renderGrid(currentTab);
          },
        ),
      );
    });
  }

  // Criação dinâmica dos botões das abas
  TABS.forEach((tab) => {
    // Cria o botão da aba.
    const btn = document.createElement('button');

    // Define o estilo e o texto do botão com base no estado atual.
    btn.className = `shelf-tab ${tab.id === currentTab ? 'active' : ''}`;

    // Define o texto do botão.
    btn.textContent = tab.label;

    // Adiciona o botão ao container das abas.
    btn.addEventListener('click', () => {
      // Gerencia o estado visual das abas
      // Remove a classe 'active' de todos os botões e adiciona à aba clicada.
      tabsContainer.querySelectorAll('.shelf-tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');

      // Atualiza a aba atual e renderiza o grid com os jogos filtrados.
      currentTab = tab.id;
      renderGrid(currentTab);
    });
    // Adiciona o botão ao container das abas.
    tabsContainer.appendChild(btn);
  });

  // Adiciona o container das abas e o grid de jogos ao container principal.
  pageContainer.appendChild(tabsContainer);
  pageContainer.appendChild(gamesGrid);

  // Inicializa a página Shelf, atualiza as estatísticas e renderiza o grid com os jogos filtrados.
  updateStats();
  renderGrid(currentTab);

  // Adiciona o botão FAB (Floating Action Button) ao container principal.
  // O botão é um link que redireciona para a página de busca.
  const fab = document.createElement('a');
  fab.className = 'floating-add-btn';
  fab.href = '/search';
  fab.textContent = '+';

  // Adiciona o botão FAB ao container principal.
  container.appendChild(pageContainer);
  container.appendChild(fab);
}
