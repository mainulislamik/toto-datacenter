// Central API client for Toto Datacenter Control Panel

const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('toto_auth_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('toto_auth_token', token);
  } else {
    localStorage.removeItem('toto_auth_token');
  }
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('toto_auth_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('toto_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('toto_auth_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired
    setAuthToken(null);
    setCurrentUser(null);
    window.dispatchEvent(new CustomEvent('toto:auth-expired'));
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  getMe: () => request('/auth/me'),
  getDatacenterOverview: () => request('/datacenter/overview'),
  getVMs: () => request('/vms'),
  createVM: (vmData) => request('/vms/create', {
    method: 'POST',
    body: JSON.stringify(vmData),
  }),
  vmAction: (vmid, action, node = 'pve') => request(`/vms/${vmid}/action?action=${action}&node=${node}`, {
    method: 'POST',
  }),
  getVMConsole: (vmid, node = 'pve') => request(`/vms/${vmid}/console?node=${node}`),
  deleteVM: (vmid, node = 'pve') => request(`/vms/${vmid}?node=${node}`, {
    method: 'DELETE',
  }),
  getISOs: () => request('/storage/isos'),
  uploadISOFromURL: (url, filename) => request('/storage/upload-url', {
    method: 'POST',
    body: JSON.stringify({ url, filename }),
  }),
  getUsers: () => request('/users'),
  createUser: (userData) => request('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  updateUser: (userId, userData) => request(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  deleteUser: (userId) => request(`/users/${userId}`, {
    method: 'DELETE',
  }),
  getGitStatus: () => request('/system/git-status'),
};
