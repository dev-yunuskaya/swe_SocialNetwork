const TOKEN_KEY = 'social_network_token';
const USER_KEY = 'social_network_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function fetchMe() {
  const profile = await api('/api/me');
  setUser({ id: profile.id, username: profile.username });
  return profile;
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/login.html';
  }
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error || data.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

function logout() {
  clearToken();
  window.location.href = '/login.html';
}
