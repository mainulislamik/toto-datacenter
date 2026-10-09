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

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorMsg = errJson.detail;
    } catch (e) {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export function uploadISOFileWithProgress(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/storage/upload`);
    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent, event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          resolve({ status: 'success' });
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || 'Upload failed'));
        } catch (e) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network connection error during upload'));
    xhr.send(formData);
  });
}

export const api = {
  // Authentication
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  // Datacenter Overview & Metrics
  getDatacenterOverview: () => request('/overview'),
  getOverview: () => request('/overview'),

  // Cluster & Scale-Out
  getClusterNodes: () => request('/cluster/nodes'),
  getClusterStatus: () => request('/cluster/status'),
  getClusterJoinInfo: () => request('/cluster/join-info'),

  // Virtual Machines (KVM)
  getVMs: (node = 'pve') => request(`/vms?node=${node}`),
  getVMDetails: (vmid, node = 'pve') => request(`/vms/${vmid}?node=${node}`),
  createVM: (data) =>
    request('/vms', {
      method: 'POST',
      body: data,
    }),
  startVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/start?node=${node}`, { method: 'POST' }),
  stopVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/stop?node=${node}`, { method: 'POST' }),
  rebootVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/reboot?node=${node}`, { method: 'POST' }),
  deleteVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}?node=${node}`, { method: 'DELETE' }),
  migrateVM: (vmid, targetNode, online = true, sourceNode = 'pve') =>
    request(`/vms/${vmid}/migrate`, {
      method: 'POST',
      body: { target_node: targetNode, source_node: sourceNode, online },
    }),

  // LXC Containers
  getLXCs: (node = 'pve') => request(`/lxc?node=${node}`),
  createLXC: (data) =>
    request('/lxc', {
      method: 'POST',
      body: data,
    }),
  startLXC: (vmid, node = 'pve') =>
    request(`/lxc/${vmid}/start?node=${node}`, { method: 'POST' }),
  stopLXC: (vmid, node = 'pve') =>
    request(`/lxc/${vmid}/stop?node=${node}`, { method: 'POST' }),
  rebootLXC: (vmid, node = 'pve') =>
    request(`/lxc/${vmid}/reboot?node=${node}`, { method: 'POST' }),
  deleteLXC: (vmid, node = 'pve') =>
    request(`/lxc/${vmid}?node=${node}`, { method: 'DELETE' }),
  migrateLXC: (vmid, targetNode, sourceNode = 'pve') =>
    request(`/lxc/${vmid}/migrate`, {
      method: 'POST',
      body: { target_node: targetNode, source_node: sourceNode },
    }),

  // Marketplace
  getMarketplaceApps: () => request('/marketplace/apps'),
  deployMarketplaceApp: (data) =>
    request('/marketplace/deploy', {
      method: 'POST',
      body: data,
    }),

  // Snapshots
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
  uploadISOFile: (formData, onProgress) => {
    if (onProgress) {
      return uploadISOFileWithProgress(formData, onProgress);
    }
    return request('/storage/upload', {
      method: 'POST',
      body: formData,
    });
  },
  uploadISOFileWithProgress,
  addNFSStorage: (data) =>
    request('/storage/nfs', {
      method: 'POST',
      body: data,
    }),

  // Users & Multi-Tenancy (Super Admin)
  getUsers: () => request('/auth/users'),
  getAuthMe: () => request('/auth/me'),
};
