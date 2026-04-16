import { renderHome } from './pages/home.js';
import { renderSearch } from './pages/search.js';

const app = document.getElementById('app');

// Simple client-side routing
function route() {
  const path = window.location.pathname;
  if (path === '/search') {
    renderSearch(app);
  } else {
    // Default to home
    renderHome(app);
  }
}

// Initial route
route();

// To support the custom navbar routing from Vanilla JS:
window.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.href && link.href.startsWith(window.location.origin)) {
    e.preventDefault();
    window.history.pushState(null, '', link.href);
    route();
  }
});

// Update on back/forward buttons
window.addEventListener('popstate', route);
