import { createNavbar } from '../components/navbar.js';
import { getShelfGames } from '../lib/shelf-store.js';
import { openModal, openViewAllModal } from '../components/modal.js';
import { profileAPI } from '../lib/api.js';
import '../styles/pages/profile.css';
import '../styles/pages/creative-popup.css';

// Transforma uma nota numérica (ex: 3) em uma string de estrelinhas visuais (ex: ★★★☆☆)
function generateStars(rating) {
  if (!rating) return '';
  let stars = '';
  // Um loop padrão de 1 a 5 para gerar as 5 estrelas
  for (let i = 0; i < 5; i++) {
    // Se 'i' for menor que a nota, adiciona uma estrela preenchida, senão uma vazia
    stars += i < rating ? '★' : '☆';
  }
  return stars;
}

// Formata uma data no formato padrão do banco de dados para um texto legível (ex: "May 2026")
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { month: 'short', year: 'numeric' };
  // Usamos en-US para manter o estilo internacional (ex: May 2026), mas poderia ser pt-BR
  return date.toLocaleDateString('en-US', options);
}

// Calcula quanto tempo passou desde uma determinada data e retorna um texto amigável (ex: "5m ago", "2d ago")
function timeAgo(date) {
  if (!date) return 'Just now';
  const now = new Date();
  const diff = now - date; // A diferença é calculada em milissegundos
  const minutes = Math.floor(diff / 60000); // Converte milissegundos para minutos

  // Retorna os textos de acordo com a grandeza do tempo
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Cria um Pop-up (modal) dinâmico focado nos detalhes do jogo e da avaliação ("Review")
function openCreativePopup(game) {
  const overlay = document.createElement('div');
  overlay.className = 'creative-popup-overlay';
  
  // Como as chaves podem vir com nomes diferentes dependendo da API, usamos 'OR' (||) como fallback
  const title = game.title || game.game_title || 'Unknown Title';
  const developer = Array.isArray(game.game_genres) ? game.game_genres.slice(0, 2).join(', ') : 'Unknown Studio';
  const cover = game.cover_url || game.game_cover_url || '';
  const rating = Number(game.rating) || 0;
  
  // Utiliza a função 'repeat' do javascript para multiplicar o caractere da estrela preenchida e vazia
  const stars = rating > 0 ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}` : 'No rating yet';
  const review = game.review || game.review_snippet || 'No thoughts recorded for this game yet. Still exploring!';
  const timePlayed = game.created_at ? timeAgo(new Date(game.created_at)) : 'Recently added';

  // Monta a estrutura HTML interna do Pop-up usando Template Literals
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

// Função utilitária que gera os "Cards" (cartões) dos jogos da seção "Currently Playing"
function createGameCard(game) {
  const card = document.createElement('article');
  card.className = 'current-game-card';

  const title = game.title || game.game_title || 'Unknown Title';
  // Pega apenas os 2 primeiros gêneros de jogo, pra não poluir visualmente o card
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

  // Quando alguém clicar neste cartão, ele exibe o Pop-up criado na função anterior
  card.addEventListener('click', () => {
    openCreativePopup(game);
  });

  return card;
}

// Função utilitária que gera os "Cards" para a seção "Recently Reviewed" no Feed
function createReviewCard(review, index, game) {
  const card = document.createElement('article');
  
  card.className = `review-card`;

  card.innerHTML = `
    <div class="review-header">
      <div class="review-title-group">
        <h3 class="review-game-title">${review.game_title}</h3>
        <span class="review-stars">${generateStars(review.starRating)}</span>
      </div>
      <div class="review-meta">
        <span class="review-timestamp">REVIEW • ${review.timeAgo}</span>
      </div>
    </div>
    <div class="review-cover-col">
      <img src="${review.cover_url}" alt="${review.game_title}" class="review-cover">
    </div>
    <div class="review-content-col">
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

// Função para renderizar o modal customizado de edição de perfil
function openEditProfileModal(profile, onSave) {
  // Cria um container (overlay) para o modal escurecendo o fundo
  const overlay = document.createElement('div');
  overlay.className = 'creative-popup-overlay';
  
  overlay.innerHTML = `
    <div class="creative-popup-card" style="max-width: 450px;">
      <div class="creative-popup-content">
        <div class="creative-popup-header" style="text-align: center; border-bottom: none; padding-bottom: 0;">
          <h2 class="creative-popup-title" style="margin: 0 auto;">Edit Profile</h2>
        </div>
        <div class="creative-popup-body" style="display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1rem;">
          
          <div class="edit-avatar-wrapper" style="display: flex; justify-content: center; margin-bottom: 0.5rem;">
            <div class="edit-avatar-container" style="position: relative; width: 100px; height: 100px; border-radius: var(--radius-md); overflow: hidden; border: 3px solid var(--color-primary); cursor: pointer;" 
                 onmouseover="this.querySelector('.avatar-overlay').style.opacity=1" 
                 onmouseout="this.querySelector('.avatar-overlay').style.opacity=0"
                 onclick="this.querySelector('#edit-avatar').click()">
              <img id="avatar-preview" src="${profile.avatar}" style="width: 100%; height: 100%; object-fit: cover; background-color: var(--color-surface-container);" />
              <div class="avatar-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <input type="file" id="edit-avatar" accept="image/*" style="display: none;" />
            </div>
          </div>

          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label for="edit-username" style="font-size: 0.85rem; font-weight: 700; color: var(--color-outline);">USERNAME</label>
            <input type="text" id="edit-username" style="width: 100%; background: var(--color-surface); border: 1px solid var(--color-outline-variant); border-radius: var(--radius-sm); color: var(--color-on-surface); padding: 0.75rem; font-family: var(--font-family);" value="${profile.username}" />
          </div>
          
          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <label for="edit-bio" style="font-size: 0.85rem; font-weight: 700; color: var(--color-outline);">BIO</label>
            <textarea id="edit-bio" rows="4" style="width: 100%; background: var(--color-surface); border: 1px solid var(--color-outline-variant); border-radius: var(--radius-sm); color: var(--color-on-surface); padding: 0.75rem; font-family: var(--font-family); resize: vertical;">${profile.bio === 'No bio provided.' ? '' : profile.bio}</textarea>
          </div>
        </div>
        <div class="creative-popup-footer" style="display: flex; justify-content: flex-end; gap: 1rem;">
          <button class="btn-ghost edit-popup-cancel">CANCEL</button>
          <button class="btn-primary edit-popup-save">SAVE</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const closeBtn = overlay.querySelector('.edit-popup-cancel');
  const saveBtn = overlay.querySelector('.edit-popup-save');
  const usernameInput = overlay.querySelector('#edit-username');
  const avatarInput = overlay.querySelector('#edit-avatar');
  const avatarPreview = overlay.querySelector('#avatar-preview');
  const textarea = overlay.querySelector('#edit-bio');
  
  // Quando o usuário seleciona um novo arquivo de imagem
  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // FileReader é uma API nativa do navegador para ler o conteúdo de arquivos
      const reader = new FileReader();
      // Assim que terminar de ler, substitui o atributo 'src' da pré-visualização 
      // com os dados em base64 da nova imagem selecionada
      reader.onload = (ev) => {
        avatarPreview.src = ev.target.result;
      };
      // Inicia a leitura do arquivo e transforma num Data URL (base64)
      reader.readAsDataURL(file);
    }
  });

  // Fecha o modal e remove listeners de teclado e clique
  const closePopup = () => {
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onEsc);
  };

  const onEsc = (e) => { if (e.key === 'Escape') closePopup(); };

  closeBtn.addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
  document.addEventListener('keydown', onEsc);

  saveBtn.addEventListener('click', async () => {
    // Coleta as novas informações digitadas
    const newUsername = usernameInput.value.trim();
    const newBio = textarea.value.trim();
    const file = avatarInput.files[0]; // Captura o arquivo de imagem, se existir

    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';

    // Função interna que faz a chamada para a API passando os dados
    const performUpdate = async (base64) => {
      try {
        const updatedProfile = await profileAPI.updateProfile({ 
          username: newUsername,
          avatar_base64: base64, // Envia a string gigante em base64 pro backend
          bio: newBio 
        });

        // Atualiza a variável global que diz quem está logado, 
        // para que a Navbar (barra do topo) atualize a fotinha automaticamente!
        if (window.currentUser) {
          window.currentUser.username = updatedProfile.username;
          window.currentUser.avatar_url = updatedProfile.avatar_url;
        }
        
        // Se o nome de usuário mudou, atualiza a URL silenciosamente usando o history API
        if (profile.username !== updatedProfile.username) {
          window.history.pushState({}, '', `/profile/${updatedProfile.username}`);
        }

        closePopup();
        // Chama a função onSave para re-renderizar a página de perfil com os dados fresquinhos
        if (onSave) onSave(updatedProfile.username);
      } catch (err) {
        console.error(err);
        alert(err.message || 'Failed to update profile');
        saveBtn.disabled = false;
        saveBtn.textContent = 'SAVE';
      }
    };

    // Se o usuário selecionou uma nova imagem, precisamos ler ela antes de salvar
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => performUpdate(e.target.result); // e.target.result contém o base64
      reader.onerror = () => {
        alert('Failed to read image file');
        saveBtn.disabled = false;
        saveBtn.textContent = 'SAVE';
      };
      reader.readAsDataURL(file);
    } else {
      // Se não houver arquivo, apenas passa null (mantém o avatar antigo no backend)
      performUpdate(null);
    }
  });
}

let _renderCount = 0;

// Função principal para renderizar a página inteira de Perfil
export async function renderProfile(container, username = window.currentUser?.username) {
  _renderCount++;
  // Limpa o conteúdo do container principal antes de desenhar a nova página
  container.innerHTML = '';

  // Cria e adiciona a barra de navegação superior dinamicamente
  const navbar = createNavbar();
  container.appendChild(navbar);

  const pageContainer = document.createElement('div');
  pageContainer.className = 'page-container profile-page';
  
  // Estado de Carregamento (Loading Spinner)
  // Como as informações do perfil vêm do banco de dados, mostramos um ícone de "carregando"
  // enquanto esperamos a resposta da API
  const loadingText = document.createElement("div");
  loadingText.className = "auth-spinner"; // Reaproveitando o spinner
  loadingText.style.margin = "4rem auto";
  
  const loadingWrapper = document.createElement("div");
  loadingWrapper.style.width = "100%";
  loadingWrapper.style.textAlign = "center";
  loadingWrapper.appendChild(loadingText);
  
  pageContainer.appendChild(loadingWrapper);
  container.appendChild(pageContainer);

  // Se nenhum usuário for especificado (ex: usuário deslogado tentando acessar /profile)
  if (!username) {
    loadingWrapper.innerHTML = "<p style='color: var(--color-on-surface-variant); padding: 2rem;'>User not found or not logged in.</p>";
    return;
  }

  try {
    // Faz a chamada HTTP para buscar as informações do usuário, estatísticas e últimos jogos
    const data = await profileAPI.getProfile(username);
    
    // Sucesso! Removemos o spinner da tela para exibir o conteúdo
    pageContainer.removeChild(loadingWrapper);

    // Separamos os dados retornados para organizar a view
    const profileData = data.profile;
    const statsData = data.stats;
    const recentPlaying = data.recentPlaying || [];
    const recentReviews = data.recentReviews || [];

    // Objeto consolidado do perfil. 
    // Detalhe: se o usuário não tem uma foto (avatar_url), geramos um avatar legal com a API do Dicebear usando o nome dele como base (seed)
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

    // Criamos as duas colunas principais do novo layout Grid
    const sidebar = document.createElement('aside');
    sidebar.className = 'profile-sidebar';

    const feed = document.createElement('main');
    feed.className = 'profile-feed';

    // Sessão do Cabeçalho (Foto de Perfil, Nome, Bio e Botão de Editar)
    const header = document.createElement('header');
    header.className = 'profile-header';
    
    // Checa se quem está visualizando a página é o próprio dono do perfil.
    // Se for, ele tem permissão de ver o botão "EDIT PROFILE"
    const isOwnProfile = profile.username === window.currentUser?.username;
    
    header.innerHTML = `
      <div class="profile-avatar-col">
        <img src="${profile.avatar}" alt="${profile.username}" class="profile-avatar">
      </div>
      <div class="profile-info-col" style="width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
          <h1 class="profile-username">${profile.username}</h1>
          ${isOwnProfile ? `<button class="btn-ghost edit-profile-btn" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; border: 1px solid var(--color-outline-variant);">EDIT PROFILE</button>` : ''}
        </div>
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
    sidebar.appendChild(header);

    // Verifica se o dono do perfil é o próprio usuário logado
    if (isOwnProfile) {
      const editBtn = header.querySelector('.edit-profile-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          // Abre o modal e passa uma função de callback (onSave) que vai recarregar a página
          openEditProfileModal(profile, (updatedUsername) => {
            renderProfile(container, updatedUsername || username);
          });
        });
      }
    }

    // Currently Playing Section
    if (recentPlaying.length > 0) {
      const playingSection = document.createElement('section');
      playingSection.className = 'profile-section playing-section';
      playingSection.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">Currently Playing</h2>
          <button class="btn-ghost view-all-btn">VIEW ALL</button>
        </div>
        <div class="playing-stack"></div>
      `;
      sidebar.appendChild(playingSection);

      const scrollRow = playingSection.querySelector('.playing-stack');
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
      feed.appendChild(reviewsSection);
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
    sidebar.appendChild(footer);

    // Adiciona a sidebar e o feed ao contêiner da página
    pageContainer.appendChild(sidebar);
    pageContainer.appendChild(feed);

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
