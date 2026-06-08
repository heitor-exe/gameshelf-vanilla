import { renderHome } from "./pages/home.js";
import { renderSearch } from "./pages/search.js";
import { renderShelf } from "./pages/shelf.js";
import { renderProfile, initProfileAutoRefresh } from "./pages/profile.js";
import { renderLogin } from "./pages/login.js";
import { renderRegister } from "./pages/register.js";
import { addGameToShelf } from "./lib/shelf-store.js";
import { authAPI } from "./lib/api.js";

// Global auth state: undefined = checking, null = guest, object = logged-in user
window.currentUser = undefined;

window.onSave = (data) => {
  addGameToShelf(data);
  console.log("Game saved to shelf:", data);
};

const app = document.getElementById("app");

// Simple client-side routing with Authentication Guards
async function route() {
  const path = window.location.pathname;

  // 1. Initial Authentication Check on load
  if (window.currentUser === undefined) {
    app.innerHTML = `
      <div class="auth-loading-overlay">
        <div class="auth-spinner"></div>
        <p style="font-family: var(--font-family); color: var(--color-on-surface-variant); font-size: 0.95rem; font-weight: 500; letter-spacing: 0.5px;">Carregando GameShelf...</p>
      </div>
    `;
    try {
      const user = await authAPI.getMe();
      window.currentUser = user;
    } catch (e) {
      window.currentUser = null;
    }
  }

  const user = window.currentUser;

  // 2. Routing logic based on auth state
  if (!user) {
    // Non-authenticated users can only see Login and Register
    if (path === "/register") {
      renderRegister(app);
    } else {
      // Any other path defaults to Login for security
      if (path !== "/login") {
        window.history.replaceState(null, "", "/login");
      }
      renderLogin(app);
    }
  } else {
    // Authenticated users
    if (path === "/login" || path === "/register") {
      // Redirect logged-in users away from auth pages to Home
      window.history.replaceState(null, "", "/");
      renderHome(app);
    } else if (path === "/search") {
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
}

// Initial route execution
route();

// Intercept local link clicks for dynamic SPA navigation
window.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (link && link.href && link.href.startsWith(window.location.origin)) {
    e.preventDefault();
    const target = new URL(link.href);
    
    // Prevent duplicate rendering if already on target page
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

// Update view when using browser Back/Forward buttons
window.addEventListener("popstate", route);
