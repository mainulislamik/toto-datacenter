// Central API client for Toto Datacenter Control Panel (Enterprise v2.0)

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
  const u = localStorage.getItem('toto_current_user');
  try {
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('toto_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('toto_current_user');
  }
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    setAuthToken(null);
    setCurrentUser(null);
    window.dispatchEvent(new CustomEvent('toto:auth-expired'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMe: () => request('/auth/me'),

  // Datacenter & Telemetry
  getOverview: () => request('/datacenter/overview'),
  getDatacenterOverview: () => request('/datacenter/overview'),
  getRRDTelemetry: (timeframe = 'hour') => request(`/telemetry/rrd?timeframe=${timeframe}`),

  // Virtual Machines (KVM)
  getVMs: () => request('/vms'),
  createVM: (payload) => request('/vms/create', { method: 'POST', body: JSON.stringify(payload) }),
  vmAction: (vmid, action) => request(`/vms/${vmid}/action?action=${action}`, { method: 'POST' }),
  deleteVM: (vmid) => request(`/vms/${vmid}`, { method: 'DELETE' }),
  getVMConsole: (vmid) => request(`/vms/${vmid}/console`),

  // LXC Micro-Containers
  getLXCs: () => request('/lxc'),
  getLXCTemplates: () => request('/lxc/templates'),
  createLXC: (payload) => request('/lxc/create', { method: 'POST', body: JSON.stringify(payload) }),
  lxcAction: (vmid, action) => request(`/lxc/${vmid}/action?action=${action}`, { method: 'POST' }),
  deleteLXC: (vmid) => request(`/lxc/${vmid}`, { method: 'DELETE' }),

  // Live Snapshots
  getSnapshots: (vmid, is_lxc = false) => request(`/snapshots/${vmid}?is_lxc=${is_lxc}`),
  createSnapshot: (vmid, payload) => request(`/snapshots/${vmid}`, { method: 'POST', body: JSON.stringify(payload) }),
  rollbackSnapshot: (vmid, snapname, is_lxc = false) => request(`/snapshots/${vmid}/rollback/${snapname}?is_lxc=${is_lxc}`, { method: 'POST' }),
  deleteSnapshot: (vmid, snapname, is_lxc = false) => request(`/snapshots/${vmid}/${snapname}?is_lxc=${is_lxc}`, { method: 'DELETE' }),

  // App Marketplace
  getMarketplaceApps: () => request('/marketplace/apps'),
  deployMarketplaceApp: (payload) => request('/marketplace/deploy', { method: 'POST', body: JSON.stringify(payload) }),

  // Storage & ISO
  getISOs: () => request('/storage/isos'),
  uploadISOFromURL: (url, filename) => request('/storage/upload-url', { method: 'POST', body: JSON.stringify({ url, filename }) }),
  uploadISOUtil: (payload) => request('/storage/upload-url', { method: 'POST', body: JSON.stringify(payload) }),

  // Multi-Tenancy & Users
  getUsers: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (userId) => request(`/users/${userId}`, { method: 'DELETE' }),

  // Git-Ops & Bare-metal
  getGitStatus: () => request('/system/git-status'),
};
