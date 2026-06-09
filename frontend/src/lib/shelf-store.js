import { shelfAPI } from './api.js';

let _games = [];

/**
 * Normaliza o registro que vem do banco de dados (Supabase)
 * para o formato que a UI do Frontend já espera consumir.
 */
function normalizeDbEntry(dbEntry) {
  return {
    id: dbEntry.id, // Supabase UUID
    rawg_game_id: dbEntry.rawg_game_id,
    title: dbEntry.game_title,
    cover_url: dbEntry.game_cover_url,
    genres: dbEntry.game_genres || [],
    status: dbEntry.status,
    rating: dbEntry.rating,
    review_snippet: dbEntry.review,
    review_date: dbEntry.updated_at || dbEntry.created_at
  };
}

export async function loadGames(username) {
  if (!username) return;
  try {
    const data = await shelfAPI.getShelf(username);
    if (data && data.entries) {
      _games = data.entries.map(normalizeDbEntry);
    }
  } catch (error) {
    console.error('Failed to load shelf games:', error);
  }
}

export function getShelfGames() {
  return [..._games];
}

export async function addGameToShelf(game) {
  // A UI de busca (RAWG) retorna um ID numérico.
  // Já os jogos salvos no banco terão um ID do tipo UUID (string com hífens).
  const isNumericId = typeof game.id === 'number';

  if (isNumericId) {
    // É um jogo novo vindo da Busca -> Criar no Banco
    try {
      const result = await shelfAPI.addGame({
        rawg_game_id: game.id,
        game_title: game.title,
        game_cover_url: game.cover_url || game.cover || game.background_image || '',
        game_genres: game.genres || [],
        status: game.status || 'playing',
        rating: game.rating || 0,
        review: game.review_snippet || ''
      });
      _games.unshift(normalizeDbEntry(result));
    } catch (e) {
      console.error('Error adding game:', e);
    }
  } else {
    // É um jogo que já está na prateleira -> Atualizar no Banco
    try {
      const result = await shelfAPI.updateGame(game.id, {
        status: game.status,
        rating: game.rating,
        review: game.review_snippet
      });
      
      const index = _games.findIndex(g => g.id === game.id);
      if (index !== -1) {
        _games[index] = normalizeDbEntry(result);
      }
    } catch (e) {
      console.error('Error updating game:', e);
    }
  }
}

export function getGameByShelfId(id) {
  return _games.find(g => g.id === id);
}

export async function removeGameFromShelf(id) {
  try {
    await shelfAPI.deleteGame(id);
    const index = _games.findIndex(g => g.id === id);
    if (index !== -1) {
      _games.splice(index, 1);
    }
    return true;
  } catch (e) {
    console.error('Error deleting game:', e);
    return false;
  }
}
