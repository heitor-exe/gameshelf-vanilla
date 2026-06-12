import { Router } from 'express';
import { igdbRequest, buildCoverUrl } from '../lib/igdb.js';

const router = Router();

// Cache em memória para gêneros (muda raramente)
let _genresCache = null;
let _genresCacheTime = 0;
const GENRES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// ---------------------------------------------------------------
// Helper: converte um jogo bruto da IGDB para o formato da UI
// ---------------------------------------------------------------
function normalizeGame(game) {
  const imageId = game.cover?.image_id || null;
  const genreNames = (game.genres || []).map((g) => (typeof g === 'string' ? g : g.name)).filter(Boolean);

  // IGDB rating é de 0-100; converter para 0-5 estrelas (arredondado)
  const ratingRaw = game.rating ? Math.round(game.rating / 20) : 0;

  // first_release_date é Unix timestamp (segundos)
  const year = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null;

  return {
    id: game.id,
    title: game.name,
    cover_url: buildCoverUrl(imageId, 'cover_big'),
    cover_url_small: buildCoverUrl(imageId, 'cover_small'),
    year,
    genres: genreNames,
    rating: ratingRaw,
    summary: game.summary || '',
  };
}

// ---------------------------------------------------------------
// POST /api/igdb/search
// Body: { query: string, genreId: number|null, offset: number, limit: number }
// ---------------------------------------------------------------
router.post('/search', async (req, res) => {
  try {
    const { query = '', genreId = null, offset = 0, limit = 20 } = req.body;

    let apicalypseQuery;

    if (query.trim()) {
      // Busca textual — usa o operador `search` da IGDB
      const genreFilter = genreId ? ` & genres = (${genreId})` : '';
      apicalypseQuery = `
        search "${query.replace(/"/g, '')}";
        fields name, cover.image_id, genres.name, first_release_date, rating, summary;
        where version_parent = null${genreFilter};
        limit ${limit};
        offset ${offset};
      `;
    } else if (genreId) {
      // Sem texto mas com filtro de gênero — busca jogos bem avaliados do gênero
      apicalypseQuery = `
        fields name, cover.image_id, genres.name, first_release_date, rating, summary;
        where genres = (${genreId}) & rating > 70 & cover != null & version_parent = null;
        sort rating desc;
        limit ${limit};
        offset ${offset};
      `;
    } else {
      // Nenhum critério — retorna lista vazia (popular é endpoint separado)
      return res.json({ results: [], hasMore: false });
    }

    const games = await igdbRequest('games', apicalypseQuery);
    const normalized = games.map(normalizeGame);

    return res.json({
      results: normalized,
      hasMore: normalized.length === limit,
    });
  } catch (error) {
    console.error('[IGDB] /search error:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar jogos na IGDB' });
  }
});

// ---------------------------------------------------------------
// GET /api/igdb/genres
// Retorna lista de gêneros (cacheada por 24h)
// ---------------------------------------------------------------
router.get('/genres', async (req, res) => {
  try {
    const now = Date.now();

    if (_genresCache && now - _genresCacheTime < GENRES_CACHE_TTL) {
      return res.json(_genresCache);
    }

    const genres = await igdbRequest(
      'genres',
      'fields id, name; limit 50; sort name asc;'
    );

    _genresCache = genres;
    _genresCacheTime = now;

    return res.json(genres);
  } catch (error) {
    console.error('[IGDB] /genres error:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar gêneros na IGDB' });
  }
});

// ---------------------------------------------------------------
// GET /api/igdb/games/popular
// Jogos bem avaliados para exibir quando a busca está vazia
// ---------------------------------------------------------------
router.get('/games/popular', async (req, res) => {
  try {
    const games = await igdbRequest(
      'games',
      `
        fields name, cover.image_id, genres.name, first_release_date, rating, summary;
        where rating > 85 & cover != null & version_parent = null & genres != null;
        sort rating desc;
        limit 20;
      `
    );

    return res.json(games.map(normalizeGame));
  } catch (error) {
    console.error('[IGDB] /games/popular error:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar jogos populares na IGDB' });
  }
});

export default router;
