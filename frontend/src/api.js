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
  const userStr = localStorage.getItem('toto_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('toto_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('toto_user');
  }
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    setAuthToken(null);
    setCurrentUser(null);
    window.location.reload();
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  // Datacenter Overview & Health
  getOverview: () => request('/datacenter/overview'),
  getDatacenterOverview: () => request('/datacenter/overview'),
  getHealth: () => request('/health'),

  // Virtual Machines (KVM)
  getVMs: () => request('/vms'),
  createVM: (data) =>
    request('/vms', {
      method: 'POST',
      body: data,
    }),
  vmAction: (vmid, action) =>
    request(`/vms/${vmid}/action?action=${action}`, {
      method: 'POST',
    }),
  deleteVM: (vmid) =>
    request(`/vms/${vmid}`, {
      method: 'DELETE',
    }),
  getVMConsole: (vmid) => request(`/vms/${vmid}/console`),

  // LXC Micro-Containers Hub
  getLXCs: () => request('/lxc'),
  getLXCTemplates: () => request('/lxc/templates'),
  createLXC: (data) =>
    request('/lxc', {
      method: 'POST',
      body: data,
    }),
  lxcAction: (vmid, action) =>
    request(`/lxc/${vmid}/action?action=${action}`, {
      method: 'POST',
    }),
  deleteLXC: (vmid) =>
    request(`/lxc/${vmid}`, {
      method: 'DELETE',
    }),

  // App Marketplace
  getMarketplaceApps: () => request('/marketplace/apps'),
  deployMarketplaceApp: (data) =>
    request('/marketplace/deploy', {
      method: 'POST',
      body: data,
    }),

  // Live Snapshots Engine
  getSnapshots: (vmid, isLXC = false) =>
    request(`/snapshots/${vmid}?is_lxc=${isLXC ? 'true' : 'false'}`),
  createSnapshot: (vmid, data) =>
    request(`/snapshots/${vmid}`, {
      method: 'POST',
      body: data,
    }),
  rollbackSnapshot: (vmid, snapname, isLXC = false) =>
    request(`/snapshots/${vmid}/rollback?snapname=${encodeURIComponent(snapname)}&is_lxc=${isLXC ? 'true' : 'false'}`, {
      method: 'POST',
    }),
  deleteSnapshot: (vmid, snapname, isLXC = false) =>
    request(`/snapshots/${vmid}/${encodeURIComponent(snapname)}?is_lxc=${isLXC ? 'true' : 'false'}`, {
      method: 'DELETE',
    }),

  // Storage & ISO Vault
  getISOs: () => request('/storage/isos'),
  analyzeISOName: (filename) =>
    request('/storage/analyze-name', {
      method: 'POST',
      body: { filename },
    }),
  uploadISOFromURL: (url, filename) =>
    request('/storage/upload-url', {
      method: 'POST',
      body: { url, filename },
    }),
  uploadISOUtil: (url, filename) =>
    request('/storage/upload-url', {
      method: 'POST',
      body: { url, filename },
    }),
  uploadISOFile: (formData) =>
    request('/storage/upload', {
      method: 'POST',
      body: formData,
    }),

  // Users & Multi-Tenancy (Super Admin)
  getUsers: () => request('/users'),
  createUser: (data) =>
    request('/users', {
      method: 'POST',
      body: data,
    }),
  deleteUser: (userId) =>
    request(`/users/${userId}`, {
      method: 'DELETE',
    }),

  // GitOps & Telemetry
  getGitStatus: () => request('/git/status'),
  getTelemetryRRD: () => request('/telemetry/rrd'),
};
