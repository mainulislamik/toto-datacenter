// Central API client for Toto Datacenter Control Panel (Enterprise Multi-Node v2.5)

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

  // Cluster & Multi-Node Orchestration
  getClusterNodes: () => request('/cluster/nodes'),
  getClusterStatus: () => request('/cluster/status'),
  getClusterJoinInfo: () => request('/cluster/join-info'),
  migrateVM: (vmid, targetNode, online = true, sourceNode = 'pve') =>
    request(`/vms/${vmid}/migrate`, {
      method: 'POST',
      body: { target_node: targetNode, source_node: sourceNode, online },
    }),
  migrateLXC: (vmid, targetNode, sourceNode = 'pve') =>
    request(`/lxc/${vmid}/migrate`, {
      method: 'POST',
      body: { target_node: targetNode, source_node: sourceNode, online: true },
    }),

  // Virtual Machines (KVM)
  getVMs: (node = 'pve') => request(`/vms?node=${node}`),
  createVM: (data) =>
    request('/vms', {
      method: 'POST',
      body: data,
    }),
  vmAction: (vmid, action, node = 'pve') =>
    request(`/vms/${vmid}/action?action=${action}&node=${node}`, {
      method: 'POST',
    }),
  deleteVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}?node=${node}`, {
      method: 'DELETE',
    }),

  // LXC Micro-Containers Hub
  getLXCs: (node = 'pve') => request(`/lxc?node=${node}`),
  createLXC: (data) =>
    request('/lxc', {
      method: 'POST',
      body: data,
    }),
  lxcAction: (vmid, action, node = 'pve') =>
    request(`/lxc/${vmid}/action?action=${action}&node=${node}`, {
      method: 'POST',
    }),
  deleteLXC: (vmid, node = 'pve') =>
    request(`/lxc/${vmid}?node=${node}`, {
      method: 'DELETE',
    }),

  // App Marketplace
  getMarketplaceApps: () => request('/marketplace/apps'),
  deployMarketplaceApp: (data) =>
    request('/marketplace/launch', {
      method: 'POST',
      body: data,
    }),

  // Live Snapshots Engine
  getSnapshots: (vmid, isLXC = false, node = 'pve') =>
    request(`/vms/${vmid}/snapshots?is_lxc=${isLXC ? 'true' : 'false'}&node=${node}`),
  createSnapshot: (vmid, data, isLXC = false, node = 'pve') =>
    request(`/vms/${vmid}/snapshots?is_lxc=${isLXC ? 'true' : 'false'}&node=${node}`, {
      method: 'POST',
      body: data,
    }),
  rollbackSnapshot: (vmid, snapname, isLXC = false, node = 'pve') =>
    request(`/vms/${vmid}/snapshots/${encodeURIComponent(snapname)}/rollback?is_lxc=${isLXC ? 'true' : 'false'}&node=${node}`, {
      method: 'POST',
    }),
  deleteSnapshot: (vmid, snapname, isLXC = false, node = 'pve') =>
    request(`/vms/${vmid}/snapshots/${encodeURIComponent(snapname)}?is_lxc=${isLXC ? 'true' : 'false'}&node=${node}`, {
      method: 'DELETE',
    }),

  // Storage & ISO Vault
  getStoragePools: (node = 'pve') => request(`/storage/pools?node=${node}`),
  getISOs: (node = 'pve', storage = 'local') => request(`/storage/isos?node=${node}&storage=${storage}`),
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
  addNFSStorage: (data) =>
    request('/storage/nfs', {
      method: 'POST',
      body: data,
    }),

  // Users & Multi-Tenancy (Super Admin)
  getUsers: () => request('/auth/users'),
  getAuthMe: () => request('/auth/me'),
};
