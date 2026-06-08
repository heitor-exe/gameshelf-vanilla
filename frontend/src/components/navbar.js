import { authAPI } from '../lib/api.js';
import '../styles/components/navbar.css';

export function createNavbar() {
  const navContainer = document.createElement('nav');
  navContainer.className = 'navbar';

  const currentPath = window.location.pathname;
  const user = window.currentUser;
  
  // Use user's avatar_url or a dynamic dicebear avatar with user's username as seed
  const avatarUrl = user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Salem'}`;

  navContainer.innerHTML = `
    <a href="/" class="navbar-brand">GAMESHELF</a>
    <div class="navbar-links">
      <a href="/" class="nav-link ${currentPath === '/' ? 'active' : ''}">Home</a>
      <a href="/search" class="nav-link ${currentPath === '/search' ? 'active' : ''}">Search</a>
      <a href="/shelf" class="nav-link ${currentPath === '/shelf' ? 'active' : ''}">My Shelf</a>
      <a href="/profile" class="nav-link ${currentPath === '/profile' ? 'active' : ''}">Profile</a>
    </div>
    <div class="navbar-actions">
      <a href="/search" class="btn-icon" aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </a>
      <button class="btn-icon" aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </button>
      <button class="btn-icon btn-logout" id="nav-logout-btn" aria-label="Logout" title="Sair da conta" style="margin-left: 0.25rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
      <img src="${avatarUrl}" alt="${user?.username || 'User Avatar'}" class="avatar" style="margin-left: 0.25rem;">
    </div>
  `;

  const logoutBtn = navContainer.querySelector('#nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await authAPI.logout();
        window.currentUser = null;
        
        // Redirect to login using PopState
        window.history.pushState(null, '', '/login');
        window.dispatchEvent(new Event('popstate'));
      } catch (error) {
        console.error('Erro ao sair da conta:', error);
      }
    });
  }

  return navContainer;
}
