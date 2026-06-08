import { authAPI } from '../lib/api.js';
import '../styles/pages/auth.css';

export function renderRegister(container) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-logo">GAMESHELF</h1>
          <h2 class="auth-title">Criar nova conta</h2>
          <p class="auth-subtitle">Junte-se à maior estante de jogos do mundo</p>
        </div>

        <div id="auth-error-container"></div>

        <form class="auth-form" id="register-form">
          <div class="form-group">
            <label class="form-label" for="reg-username">Username</label>
            <div class="form-input-wrapper">
              <input 
                class="form-input" 
                type="text" 
                id="reg-username" 
                placeholder="ex: JogadorUm" 
                required 
                minlength="3"
                autocomplete="username"
              />
              <span class="form-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">E-mail</label>
            <div class="form-input-wrapper">
              <input 
                class="form-input" 
                type="email" 
                id="reg-email" 
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
            <label class="form-label" for="reg-password">Senha</label>
            <div class="form-input-wrapper">
              <input 
                class="form-input" 
                type="password" 
                id="reg-password" 
                placeholder="Mínimo 6 caracteres" 
                required 
                minlength="6"
                autocomplete="new-password"
              />
              <span class="form-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
            </div>
          </div>

          <button class="auth-submit-btn" type="submit" id="register-submit">
            <span>Cadastrar</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </form>

        <div class="auth-redirect">
          <span>Já tem uma conta?</span>
          <a href="/login" class="auth-redirect-link">Faça login</a>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#register-form');
  const submitBtn = container.querySelector('#register-submit');
  const errorContainer = container.querySelector('#auth-error-container');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorContainer.innerHTML = '';
    
    // Disable button and show loading spinner
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Criando conta...</span><div class="auth-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>';

    const username = container.querySelector('#reg-username').value;
    const email = container.querySelector('#reg-email').value;
    const password = container.querySelector('#reg-password').value;

    try {
      // 1. Register user
      await authAPI.register({ username, email, password });
      
      // 2. Automatically log the user in on success for high premium UX
      try {
        const data = await authAPI.login({ email, password });
        window.currentUser = data.user;
      } catch (loginError) {
        // If auto-login fails, redirect to login page instead
        window.history.pushState(null, '', '/login');
        window.dispatchEvent(new Event('popstate'));
        return;
      }
      
      // 3. Redirect to Home on successful auto-login
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    } catch (error) {
      console.error('Erro ao registrar:', error);
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
          <span>${error.message || 'Erro ao criar conta. Tente novamente.'}</span>
        </div>
      `;
    }
  });
}
