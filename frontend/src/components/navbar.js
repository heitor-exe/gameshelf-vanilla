export function createNavbar() {
  const navContainer = document.createElement('nav');
  navContainer.className = 'navbar';

  const currentPath = window.location.pathname;

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
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Salem" alt="User Avatar" class="avatar">
    </div>
  `;

  return navContainer;
}
