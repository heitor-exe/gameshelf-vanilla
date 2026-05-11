const STORAGE_KEY = 'gameshelf_vanilla_games';

let _games = [];

function loadGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _games = JSON.parse(raw);
      return;
    }
  } catch {}
  _games = [
{
      id: 2,
      title: "Cyberpunk 2077",
      cover_url: "https://images.unsplash.com/photo-1614294148960-9aa740632a87?q=80&w=1000",
      developer: "CD Projekt Red",
      status: "completed",
      rating: 4,
      review_snippet: "Incredible world building and atmosphere. Night City feels alive.",
      review_date: "2023-10-05T10:00:00Z"
    },
    {
      id: 3,
      title: "Hollow Knight",
      cover_url: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1000",
      developer: "Team Cherry",
      status: "completed",
      rating: 5,
      review_snippet: "The best metroidvania ever made. Perfect combat and exploration.",
      review_date: "2023-09-01T10:00:00Z"
    },
    {
      id: 4,
      title: "Starfield",
      cover_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000",
      developer: "Bethesda",
      status: "dropped",
      rating: 2,
      review_snippet: "Too many loading screens. Felt disconnected from the universe.",
      review_date: "2023-07-15T10:00:00Z"
    },
    {
      id: 5,
      title: "Silksong",
      cover_url: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=1000",
      developer: "Team Cherry",
      status: "wishlist",
      rating: 0,
      review_snippet: "",
      review_date: ""
    },
    {
      id: 6,
      title: "Hades II",
      cover_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1000",
      developer: "Supergiant Games",
      status: "playing",
      rating: 4,
      review_snippet: "Extremely addictive gameplay loop. Melinoë is a great protagonist.",
      review_date: "2023-08-12T10:00:00Z"
    }
  ];
  saveToStorage();
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_games));
  } catch {}
}

loadGames();

export function getShelfGames() {
  return [..._games];
}

export function addGameToShelf(game) {
  const exists = _games.find(g => g.id === game.id);
  if (exists) {
    Object.assign(exists, game);
  } else {
    _games.push({ ...game });
  }
  saveToStorage();
}

export function getGameByShelfId(id) {
  return _games.find(g => g.id === id);
}

export function removeGameFromShelf(id) {
  const index = _games.findIndex(g => g.id === id);
  if (index !== -1) {
    _games.splice(index, 1);
    saveToStorage();
    return true;
  }
  return false;
}
