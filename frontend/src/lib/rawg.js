// ---------------------------------------------------------------
// rawg.js — Cliente IGDB para o Frontend
// ---------------------------------------------------------------
// Todos os requests são feitos ao backend Express (proxy),
// que por sua vez chama a IGDB com as credenciais Twitch.
// O IGDB não suporta CORS, portanto o backend é obrigatório.
// ---------------------------------------------------------------

const BASE_URL = import.meta.env.PROD ? '/api/igdb' : 'http://localhost:3001/api/igdb';

// Cache local de gêneros (raramente muda)
let _genresCache = null;

/**
 * Busca jogos na IGDB via proxy do backend.
 *
 * @param {string} query - Termo de busca (pode ser vazio se genreId definido)
 * @param {Object} options
 * @param {number|null} options.genreId - ID do gênero para filtrar (opcional)
 * @param {number} options.offset - Offset para paginação (padrão: 0)
 * @param {number} options.limit - Limite de resultados (padrão: 20)
 * @returns {Promise<{ results: Array, hasMore: boolean }>}
 */
export async function searchGames(query = '', { genreId = null, offset = 0, limit = 20 } = {}) {
  const response = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, genreId, offset, limit }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar jogos: ${response.status}`);
  }

  return response.json();
}

/**
 * Busca jogos populares da IGDB via proxy do backend.
 * Usado para preencher a grade quando a busca está vazia.
 *
 * @returns {Promise<Array>}
 */
export async function fetchPopularGames() {
  const response = await fetch(`${BASE_URL}/games/popular`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar jogos populares: ${response.status}`);
  }

  return response.json();
}

/**
 * Busca lista de gêneros da IGDB (cacheada em memória no frontend).
 *
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export async function fetchGenres() {
  if (_genresCache) return _genresCache;

  const response = await fetch(`${BASE_URL}/genres`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar gêneros: ${response.status}`);
  }

  _genresCache = await response.json();
  return _genresCache;
}
