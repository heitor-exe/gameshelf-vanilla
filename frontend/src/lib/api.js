// ---------------------------------------------------------------
// GameShelf - Client-Side API Helper with Express Session Support
// ---------------------------------------------------------------

const BASE_URL = 'http://localhost:3001/api';

/**
 * Custom fetch wrapper that automatically handles credentials (session cookies)
 * and content headers.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // CRITICAL: credentials 'include' forces the browser to send/receive cookies
    // between frontend (localhost:5173) and backend (localhost:3001)
    credentials: 'include',
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Algo deu errado.');
  }

  return data;
}

// ---------------------------------------------------------------
// Authentication Endpoints
// ---------------------------------------------------------------

export const authAPI = {
  /**
   * Registers a new user.
   * @param {Object} userData { username, email, password }
   */
  register(userData) {
    return request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  },

  /**
   * Logs in a user.
   * @param {Object} credentials { email, password }
   */
  login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  },

  /**
   * Logs out the current user.
   */
  logout() {
    return request('/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Fetches the current user profile based on the active session.
   */
  getMe() {
    return request('/auth/me', {
      method: 'GET',
    });
  },
};
