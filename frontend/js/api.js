/* =========================================================
   ConnectHub — api.js
   Tiny fetch wrapper shared by every page. Handles attaching
   the JWT, building FormData vs JSON bodies, and surfacing
   server error messages in one consistent shape.
   ========================================================= */

const API_BASE = 'http://localhost:5000/api';
const UPLOADS_BASE = 'http://localhost:5000';

const Storage = {
  TOKEN_KEY: 'ch_token',
  USER_KEY: 'ch_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },
  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },
  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },
};

/**
 * Core request helper.
 * @param {string} endpoint - e.g. '/posts/feed'
 * @param {object} options
 * @param {string} options.method
 * @param {object|FormData|null} options.body
 * @param {boolean} options.isFormData - skip JSON.stringify / Content-Type when true
 */
async function apiRequest(endpoint, { method = 'GET', body = null, isFormData = false } = {}) {
  const headers = {};
  const token = Storage.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const config = { method, headers };
  if (body) config.body = isFormData ? body : JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, config);
  } catch (networkError) {
    throw new Error('Could not reach the server. Is the backend running on port 5000?');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error((data && data.message) || `Request failed (${response.status})`);
  }

  return data;
}

// Resolves a relative "/uploads/xxx.jpg" path coming from the API into a full URL.
// Falls back to null so callers can render an initials avatar instead.
function resolveImage(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${UPLOADS_BASE}${path}`;
}

// Redirects to login if there is no token. Call at the top of every protected page.
function requireAuth() {
  if (!Storage.getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  Storage.clear();
  window.location.href = 'login.html';
}
