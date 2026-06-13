// ---------------------------------------------------------------
// GameShelf - Helper de API no Cliente com Suporte a Sessão Express
// ---------------------------------------------------------------

const BASE_URL = 'http://localhost:3001/api';

/**
 * Wrapper personalizado do fetch que lida automaticamente com credenciais (cookies de sessão)
 * e cabeçalhos de conteúdo.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // CRÍTICO: credentials 'include' força o navegador a enviar/receber cookies
    // entre frontend (localhost:5173) e backend (localhost:3001)
    credentials: 'include',
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Se recebermos um 401 (Não Autorizado) e não for uma rota de autenticação,
    // o token/sessão expirou. Redirecionamos para o login limpando o estado.
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      window.currentUser = null;
      window.location.href = '/login';
    }
    
    throw new Error(data.error || 'Algo deu errado.');
  }

  return data;
}

// ---------------------------------------------------------------
// Endpoints de Autenticação
// ---------------------------------------------------------------

export const authAPI = {
  /**
   * Registra um novo usuário.
   * @param {Object} userData { username, email, password }
   */
  register(userData) {
    return request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  },

  /**
   * Faz o login de um usuário.
   * @param {Object} credentials { email, password }
   */
  login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  },

  /**
   * Faz o logout do usuário atual.
   */
  logout() {
    return request('/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Busca o perfil do usuário atual com base na sessão ativa.
   */
  getMe() {
    return request('/auth/me', {
      method: 'GET',
    });
  },
};

// ---------------------------------------------------------------
// Endpoints da Prateleira (Shelf)
// ---------------------------------------------------------------

export const shelfAPI = {
  /**
   * Busca a prateleira e o perfil do usuário.
   * @param {string} username
   */
  getShelf(username) {
    return request(`/shelf/${username}`, {
      method: 'GET',
    });
  },

  /**
   * Adiciona um novo jogo à prateleira.
   * @param {Object} gameData { rawg_game_id, game_title, game_cover_url, game_genres, status, rating, review }
   */
  addGame(gameData) {
    return request('/shelf', {
      method: 'POST',
      body: gameData,
    });
  },

  /**
   * Atualiza um jogo existente na prateleira.
   * @param {string} entryId
   * @param {Object} updates { status, rating, review }
   */
  updateGame(entryId, updates) {
    return request(`/shelf/${entryId}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  /**
   * Remove um jogo da prateleira.
   * @param {string} entryId
   */
  deleteGame(entryId) {
    return request(`/shelf/${entryId}`, {
      method: 'DELETE',
    });
  },
};

// ---------------------------------------------------------------
// Endpoints do Feed
// ---------------------------------------------------------------

export const feedAPI = {
  /**
   * Busca o feed global de atividades recentes nas prateleiras.
   */
  getGlobalFeed() {
    return request('/feed', {
      method: 'GET',
    });
  },

  /**
   * Busca notícias em alta (trending) através do proxy do backend.
   */
  getTrendingNews() {
    return request('/feed/trending', {
      method: 'GET',
    });
  },
};

// ---------------------------------------------------------------
// Endpoints de Perfil
// ---------------------------------------------------------------

export const profileAPI = {
  /**
   * Busca o perfil de um usuário específico e suas estatísticas da prateleira.
   * @param {string} username
   */
  getProfile(username) {
    return request(`/profile/${username}`, {
      method: 'GET',
    });
  },
};
