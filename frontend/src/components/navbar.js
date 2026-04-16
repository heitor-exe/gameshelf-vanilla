export function createNavbar() {
  const navContainer = document.createElement('nav');
  navContainer.className = 'navbar';

  navContainer.innerHTML = `
    <a href="/" class="navbar-brand">GAMESHELF</a>
    <div class="navbar-links">
      <a href="/" class="nav-link active">Home</a>
      <a href="/shelf" class="nav-link">My Shelf</a>
      <a href="/profile" class="nav-link">Profile</a>
    </div>
    <div class="navbar-actions">
      <input type="text" class="search-input" placeholder="Search games...">
      <button class="btn-icon" aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </button>
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Macedhe" alt="User Avatar" class="avatar">
    </div>
  `;

  return navContainer;
}
