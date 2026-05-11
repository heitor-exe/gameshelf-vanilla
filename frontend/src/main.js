import { renderHome } from "./pages/home.js";
import { renderSearch } from "./pages/search.js";
import { renderShelf } from "./pages/shelf.js";
import { renderProfile, initProfileAutoRefresh } from "./pages/profile.js";
import { addGameToShelf } from "./lib/shelf-store.js";

window.onSave = (data) => {
  addGameToShelf(data);
  console.log("Game saved to shelf:", data);
};

const app = document.getElementById("app");

// Simple client-side routing
function route() {
  const path = window.location.pathname;
  if (path === "/search") {
    renderSearch(app);
  } else if (path === "/shelf") {
    renderShelf(app);
  } else if (path === "/profile") {
    renderProfile(app);
    initProfileAutoRefresh(app);
  } else {
    // Default to home
    renderHome(app);
  }
}

// Initial route
route();

// To support the custom navbar routing from Vanilla JS:
window.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (link && link.href && link.href.startsWith(window.location.origin)) {
    e.preventDefault();
    const target = new URL(link.href);
    // Se o destino é exatamente a página atual (mesmo path e query string),
    // não faz nada — evita destruir e recriar a página desnecessariamente.
    if (
      target.pathname === window.location.pathname &&
      target.search === window.location.search
    ) {
      return;
    }
    window.history.pushState(null, "", link.href);
    route();
  }
});

// Update on back/forward buttons
window.addEventListener("popstate", route);
