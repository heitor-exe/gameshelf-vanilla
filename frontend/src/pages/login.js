import { authAPI } from '../lib/api.js';
import '../styles/pages/auth.css';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-logo">GAMESHELF</h1>
          <h2 class="auth-title">Bem-vindo de volta!</h2>
          <p class="auth-subtitle">Insira suas credenciais para acessar sua estante</p>
        </div>

        <div id="auth-error-container"></div>

        <form class="auth-form" id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">E-mail</label>
            <div class="form-input-wrapper">
              <input 
                class="form-input" 
                type="email" 
                id="login-email" 
                placeholder="seuemail@exemplo.com" 
                required 
                autocomplete="email"
              />
              <span class="form-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Senha</label>
            <div class="form-input-wrapper">
              <input 
                class="form-input" 
                type="password" 
                id="login-password" 
                placeholder="Sua senha secreta" 
                required 
                autocomplete="current-password"
              />
              <span class="form-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
            </div>
          </div>

          <button class="auth-submit-btn" type="submit" id="login-submit">
            <span>Entrar</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </form>

        <div class="auth-redirect">
          <span>Não tem uma conta?</span>
          <a href="/register" class="auth-redirect-link">Cadastre-se</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const submitBtn = container.querySelector('#login-submit');
  const errorContainer = container.querySelector('#auth-error-container');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorContainer.innerHTML = '';
    
    // Disable button and show loading text
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Entrando...</span><div class="auth-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>';

    const email = container.querySelector('#login-email').value;
    const password = container.querySelector('#login-password').value;

    try {
      const data = await authAPI.login({ email, password });
      window.currentUser = data.user;
      
      // Navigate to Home page using HTML5 History API and dispatch popstate
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      
      // Render beautiful red glassmorphic error message
      errorContainer.innerHTML = `
        <div class="auth-error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" x2="12" y1="8" y2="12"></line>
            <line x1="12" x2="12.01" y1="16" y2="16"></line>
          </svg>
          <span>${error.message || 'E-mail ou senha incorretos.'}</span>
        </div>
      `;
    }
  });
}
