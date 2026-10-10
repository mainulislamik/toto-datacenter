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

export function uploadISOStream(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const encodedName = encodeURIComponent(file.name || 'os-image.iso');
    xhr.open('POST', `${API_BASE}/storage/upload-stream?filename=${encodedName}`);
    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('X-Filename', file.name || 'os-image.iso');

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
    xhr.send(file);
  });
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
  getDatacenterOverview: () => request('/datacenter/overview'),
  getOverview: () => request('/datacenter/overview'),
  getMetrics: (timeframe = 'hour') => request(`/datacenter/metrics?timeframe=${timeframe}`),

  // Cluster & Scale-Out
  getClusterNodes: () => request('/cluster/nodes'),
  getClusterStatus: () => request('/cluster/status'),
  getClusterJoinInfo: () => request('/cluster/join-info'),

  // Virtual Machines (KVM)
  getVMs: (node = 'pve') => request(`/vms?node=${node}`),
  getVMDetails: (vmid, node = 'pve') => request(`/vms/${vmid}?node=${node}`),
  getVMConfig: (vmid, node = 'pve') => request(`/vms/${vmid}/config?node=${node}`),
  updateVMConfig: (vmid, config, node = 'pve') => request(`/vms/${vmid}/config?node=${node}`, { method: 'PUT', body: config }),
  createVM: (data) =>
    request('/vms', {
      method: 'POST',
      body: data,
    }),
  startVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/start?node=${node}`, { method: 'POST' }),
  stopVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/stop?node=${node}`, { method: 'POST' }),
  shutdownVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/shutdown?node=${node}`, { method: 'POST' }),
  resetVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/reset?node=${node}`, { method: 'POST' }),
  suspendVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/suspend?node=${node}`, { method: 'POST' }),
  resumeVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/resume?node=${node}`, { method: 'POST' }),
  rebootVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}/reboot?node=${node}`, { method: 'POST' }),
  resizeVMDisk: (vmid, disk, size, node = 'pve') =>
    request(`/vms/${vmid}/resize?node=${node}`, { method: 'POST', body: { disk, size } }),
  getVMVNC: (vmid, node = 'pve') => request(`/vms/${vmid}/vnc?node=${node}`),
  deleteVM: (vmid, node = 'pve') =>
    request(`/vms/${vmid}?node=${node}`, { method: 'DELETE' }),
  vmAction: (vmid, action, node = 'pve') =>
    request(`/vms/${vmid}/${action}?node=${node}`, { method: 'POST' }),
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
  deleteISO: (volid) => request(`/storage/iso/${encodeURIComponent(volid)}`, { method: 'DELETE' }),
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
  uploadISOFile: (fileOrData, onProgress) => {
    if (fileOrData instanceof File) {
      return uploadISOStream(fileOrData, onProgress);
    }
    if (onProgress) {
      return uploadISOFileWithProgress(fileOrData, onProgress);
    }
    return request('/storage/upload', {
      method: 'POST',
      body: fileOrData,
    });
  },
  uploadISOStream,
  uploadISOFileWithProgress,
  addNFSStorage: (data) =>
    request('/storage/nfs', {
      method: 'POST',
      body: data,
    }),

  // Users & Multi-Tenancy (Super Admin)
  getUsers: () => request('/auth/users'),
  getAuthMe: () => request('/auth/me'),

  // Firewall & Security Hub
  getFirewallRules: () => request('/firewall/rules'),
  addFirewallRule: (rule) => request('/firewall/rules', { method: 'POST', body: rule }),
  deleteFirewallRule: (pos) => request(`/firewall/rules/${pos}`, { method: 'DELETE' }),
  applyFirewallProfile: (profile) => request('/firewall/apply-profile', { method: 'POST', body: { profile } }),

  // Backup & Disaster Recovery
  getBackups: (node = 'pve') => request(`/backups/list?node=${node}`),
  createBackupNow: (data) => request('/backups/create-now', { method: 'POST', body: data }),
  restoreBackup: (data) => request('/backups/restore', { method: 'POST', body: data }),

  // Billing & Usage Metering
  getBillingUsage: () => request('/billing/usage'),

  // AI Cloud Ops
  executeAIOps: (prompt) => request('/ai/execute-ops', { method: 'POST', body: { prompt } }),

  // Terminal & Web Shell
  execTerminalCommand: (command) => request('/terminal/exec', { method: 'POST', body: { command } }),

  // High Availability
  getHAStatus: () => request('/ha/status'),
  getHAResources: () => request('/ha/resources'),
  addHAResource: (data) => request('/ha/resources', { method: 'POST', body: data }),

  // SDN & VPC
  getNetworkInterfaces: (node = 'pve') => request(`/network/interfaces?node=${node}`),
  getSDNVnets: (node = 'pve') => request(`/network/sdn/vnets?node=${node}`),

  // Notifications & Alerts
  getNotificationSettings: () => request('/settings/notifications'),
  updateNotificationSettings: (data) => request('/settings/notifications', { method: 'POST', body: data }),
  testNotificationAlert: () => request('/settings/notifications/test', { method: 'POST' }),

  // Global Command Search
  searchGlobal: (q) => request(`/search/global?q=${encodeURIComponent(q)}`),

  // Docker Engine Orchestrator
  getDockerContainers: () => request('/docker/containers'),
  dockerContainerAction: (cid, action) => request(`/docker/containers/${cid}/action`, { method: 'POST', body: { action } }),
  getDockerLogs: (cid, tail = 100) => request(`/docker/containers/${cid}/logs?tail=${tail}`),
  getDockerImages: () => request('/docker/images'),
  pullDockerImage: (image) => request('/docker/images/pull', { method: 'POST', body: { image } }),
  deployDockerCompose: (data) => request('/docker/compose/deploy', { method: 'POST', body: data }),

  // Reverse Proxy & SSL Gateway
  getProxyRoutes: () => request('/proxy/routes'),
  createProxyRoute: (data) => request('/proxy/routes', { method: 'POST', body: data }),
  deleteProxyRoute: (routeId) => request(`/proxy/routes/${routeId}`, { method: 'DELETE' }),
  issueSSLCertificate: (domain) => request('/proxy/ssl/issue', { method: 'POST', body: { domain } }),

  // Cloud File Manager
  browseFiles: (path = '/mnt/extra-vault') => request(`/files/browse?path=${encodeURIComponent(path)}`),
  readFileData: (path) => request(`/files/read?path=${encodeURIComponent(path)}`),
  saveFileData: (path, content) => request('/files/write', { method: 'POST', body: { path, content } }),
  createFileOrDir: (path, is_dir = false) => request('/files/create', { method: 'POST', body: { path, is_dir } }),
  deleteFileOrDir: (path) => request(`/files/delete?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),

  // Real-time Metrics & Process Manager
  getRealtimeMetrics: () => request('/metrics/realtime'),
  killProcess: (pid) => request(`/metrics/processes/${pid}/kill`, { method: 'POST' }),

  // Kubernetes & K3s Engine
  getK8sCluster: () => request('/k8s/cluster'),
  applyK8sManifest: (manifest) => request('/k8s/manifest', { method: 'POST', body: { manifest } }),

  // SSH Keyring Vault
  getSSHKeys: () => request('/ssh/keys'),
  createSSHKey: (data) => request('/ssh/keys', { method: 'POST', body: data }),
  deleteSSHKey: (keyId) => request(`/ssh/keys/${keyId}`, { method: 'DELETE' }),
  injectSSHKey: (data) => request('/ssh/inject', { method: 'POST', body: data }),

  // S3 Object Storage Buckets
  getS3Buckets: () => request('/buckets'),
  createS3Bucket: (data) => request('/buckets', { method: 'POST', body: data }),
  deleteS3Bucket: (name) => request(`/buckets/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // Autoscaling & Self-Healing Policies
  getAutoscalingPolicies: () => request('/autoscaler/policies'),
  createAutoscalingPolicy: (data) => request('/autoscaler/policies', { method: 'POST', body: data }),
  toggleAutoscalingPolicy: (id) => request(`/autoscaler/policies/${id}/toggle`, { method: 'POST' }),

  // Security & Vulnerability Audit
  getSecurityAudit: () => request('/security/audit'),
  triggerSecurityScan: () => request('/security/scan-now', { method: 'POST' }),

  // DNS Zones & Anycast Routing
  getDNSZones: () => request('/dns/zones'),
  createDNSRecord: (data) => request('/dns/records', { method: 'POST', body: data }),

  // Terraform & Cloud-Init IaC Hub
  getIaCTemplates: () => request('/iac/templates'),
  generateTerraformHCL: (data) => request('/iac/terraform/generate', { method: 'POST', body: data }),

  // Disaster Recovery & Storage Replication
  getReplicationJobs: () => request('/replication/jobs'),
  triggerReplicationSync: (jobId) => request('/replication/sync-now', { method: 'POST', body: { job_id: jobId } }),

  // GPU & PCIe Hardware Passthrough
  getHardwareGPUs: () => request('/hardware/gpus'),
  assignGPUToVM: (data) => request('/hardware/gpus/assign', { method: 'POST', body: data }),

  // Datacenter Audit Logs & Event Ledger
  getAuditLogs: () => request('/audit/logs'),

  // WAF & DDoS Security Shield
  getWAFShield: () => request('/waf/shield'),
  toggleWAFAttackMode: (enabled) => request('/waf/attack-mode', { method: 'POST', body: { enabled } }),
  addWAFBan: (ip) => request('/waf/bans', { method: 'POST', body: { ip } }),

  // Layer 4 / Layer 7 Load Balancers
  getLoadBalancers: () => request('/load-balancers'),
  createLoadBalancer: (data) => request('/load-balancers', { method: 'POST', body: data }),

  // Global Cron & Task Orchestrator
  getCronTasks: () => request('/cron/tasks'),
  createCronTask: (data) => request('/cron/tasks', { method: 'POST', body: data }),
  runCronTaskNow: (taskId) => request(`/cron/tasks/${taskId}/run`, { method: 'POST' }),

  // Multi-Cloud Edge CDN & Cache
  getEdgeCDNStatus: () => request('/cdn/status'),
  purgeEdgeCDNCache: (type = 'everything') => request('/cdn/purge', { method: 'POST', body: { type } }),

  // Multi-Region Datacenter Mesh
  getDatacenterMesh: () => request('/datacenter/mesh'),

  // VPS Custom Domain System & VHost Engine
  getVPSDomains: () => request('/vps-domains'),
  attachVPSDomain: (data) => request('/vps-domains', { method: 'POST', body: data }),
  detachVPSDomain: (domainId) => request(`/vps-domains/${domainId}`, { method: 'DELETE' }),

  // Datacenter Architecture & How Datacenters Work
  getDatacenterArchitecture: () => request('/datacenter/architecture'),

  // BGP Peering & ASN Anycast
  getBGPPeering: () => request('/network/bgp'),

  // IPMI & Hardware Sensors
  getIPMIStatus: () => request('/hardware/ipmi'),

  // Reverse DNS (rDNS / PTR)
  getRDNSRecords: () => request('/dns/rdns'),
};

export default api;
