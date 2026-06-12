// ---------------------------------------------------------------
// IGDB API Client — Backend Module
// ---------------------------------------------------------------
// A IGDB usa Twitch OAuth2 (Client Credentials) para autenticação.
// O access_token é cacheado em memória e renovado automaticamente
// antes de expirar. Todas as requests são POST com corpo Apicalypse.
// ---------------------------------------------------------------

const IGDB_BASE = 'https://api.igdb.com/v4';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IMAGES_BASE = 'https://images.igdb.com/igdb/image/upload';

// Cache do token em memória (evita uma chamada ao Twitch por request)
let _tokenCache = {
  accessToken: null,
  expiresAt: 0,
};

/**
 * Obtém um access token válido da Twitch.
 * Usa o cache se o token ainda for válido; renova se estiver expirado.
 *
 * @returns {Promise<string>} access_token
 */
export async function getAccessToken() {
  const now = Date.now();

  // Renova se faltar menos de 5 minutos para expirar
  if (_tokenCache.accessToken && now < _tokenCache.expiresAt - 5 * 60 * 1000) {
    return _tokenCache.accessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('TWITCH_CLIENT_ID e TWITCH_CLIENT_SECRET devem estar definidos no .env');
  }

  const url = `${TWITCH_TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;

  const response = await fetch(url, { method: 'POST' });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Falha ao obter token Twitch: ${error}`);
  }

  const data = await response.json();

  _tokenCache = {
    accessToken: data.access_token,
    // expires_in é em segundos
    expiresAt: now + data.expires_in * 1000,
  };

  console.log('[IGDB] Token Twitch obtido com sucesso. Expira em:', new Date(_tokenCache.expiresAt).toISOString());

  return _tokenCache.accessToken;
}

/**
 * Executa uma query Apicalypse na IGDB.
 *
 * @param {string} endpoint - Endpoint da IGDB (ex: 'games', 'genres')
 * @param {string} apicalypseQuery - Body da query no formato Apicalypse
 * @returns {Promise<Array>} Array de resultados
 */
export async function igdbRequest(endpoint, apicalypseQuery) {
  const token = await getAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  const response = await fetch(`${IGDB_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
    },
    body: apicalypseQuery,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`IGDB ${endpoint} error ${response.status}: ${error}`);
  }

  return response.json();
}

/**
 * Constrói a URL de imagem da IGDB com o tamanho desejado.
 *
 * Tamanhos disponíveis (comuns):
 *   cover_small  — 90×128
 *   cover_big    — 264×374
 *   720p         — 1280×720
 *   1080p        — 1920×1080
 *
 * @param {string|null} imageId - O image_id retornado pelo campo cover da IGDB
 * @param {string} size - Identificador do tamanho (padrão: 'cover_big')
 * @returns {string|null} URL completa da imagem
 */
export function buildCoverUrl(imageId, size = 'cover_big') {
  if (!imageId) return null;
  return `${IMAGES_BASE}/t_${size}/${imageId}.jpg`;
}
