import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Terminal, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  HardDrive, 
  Cpu, 
  Activity,
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export default function VMListView({ onOpenConsole, user }) {
  const [vms, setVms] = useState([]);
  const [isos, setIsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: 'ubuntu-server-prod',
    vmid: 100,
    cores: 2,
    memory: 2048,
    disk_gb: 20,
    iso: '',
    storage: 'local-lvm',
    node: 'pve',
  });
  const [createError, setCreateError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchVMs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVMs();
      setVms(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch VM fleet');
    } finally {
      setLoading(false);
    }
  };

  const fetchISOs = async () => {
    try {
      const data = await api.getISOs();
      setIsos(data);
      if (data.length > 0 && !formData.iso) {
        setFormData((prev) => ({ ...prev, iso: data[0].volid }));
      }
    } catch (err) {
      console.warn('Could not load ISOs:', err);
    }
  };

  useEffect(() => {
    fetchVMs();
    fetchISOs();
    const interval = setInterval(fetchVMs, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (vmid, action) => {
    setActionLoading((prev) => ({ ...prev, [vmid]: action }));
    try {
      await api.vmAction(vmid, action);
      await fetchVMs();
    } catch (err) {
      alert(`Action '${action}' failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [vmid]: null }));
    }
  };

  const handleDelete = async (vmid) => {
    if (!window.confirm(`Are you sure you want to permanently delete VM #${vmid}?`)) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [vmid]: 'delete' }));
    try {
      await api.deleteVM(vmid);
      await fetchVMs();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [vmid]: null }));
    }
  };

  const handleCreateVM = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      await api.createVM({
        ...formData,
        vmid: parseInt(formData.vmid, 10),
        cores: parseInt(formData.cores, 10),
        memory: parseInt(formData.memory, 10),
        disk_gb: parseInt(formData.disk_gb, 10),
      });
      setShowCreateModal(false);
      await fetchVMs();
    } catch (err) {
      setCreateError(err.message || 'Failed to create VM');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Virtual Machines Fleet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            KVM Hardware Virtualized Guests • Backed by Second SSD Thin Pool (local-lvm)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchVMs}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              // auto-increment suggested vmid
              const maxId = vms.reduce((max, v) => Math.max(max, v.vmid || 0), 99);
              setFormData((prev) => ({ ...prev, vmid: maxId + 1 }));
              setShowCreateModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New VM</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-lg text-rose-900 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchVMs} className="underline font-bold text-xs">Retry</button>
        </div>
      )}

      {/* VM List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && vms.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-sky-600 mb-3" />
            <p className="text-sm font-semibold">Querying Proxmox VE Cluster...</p>
          </div>
        ) : vms.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Virtual Machines Deployed Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Get started by provisioning your first cloud VM instance with custom CPU, RAM, and Disk storage.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy First VM</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">VM Identifier</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">vCPU Cores</th>
                  <th className="px-6 py-3.5">RAM</th>
                  <th className="px-6 py-3.5">Storage</th>
                  <th className="px-6 py-3.5">Node</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {vms.map((vm) => {
                  const isRunning = vm.status === 'running';
                  const isPending = actionLoading[vm.vmid];

                  return (
                    <tr key={vm.vmid} className="hover:bg-slate-50/70 transition">
                      {/* Name & ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isRunning ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            #{vm.vmid}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{vm.name || `VM ${vm.vmid}`}</div>
                            <div className="text-xs text-slate-400 font-mono">QEMU / KVM Hardware Guest</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isRunning 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isRunning ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                          }`}></span>
                          {isRunning ? 'RUNNING' : 'STOPPED'}
                        </span>
                      </td>

                      {/* vCPU */}
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {vm.cpus || vm.maxcpu || '—'} Cores
                        {isRunning && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            Load: {((vm.cpu || 0) * 100).toFixed(1)}%
                          </div>
                        )}
                      </td>

                      {/* Memory */}
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {formatBytes(vm.maxmem || vm.memory * 1024 * 1024)}
                        {isRunning && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            Used: {formatBytes(vm.mem)}
                          </div>
                        )}
                      </td>

                      {/* Disk */}
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {formatBytes(vm.maxdisk || vm.disk)}
                        <div className="text-[10px] text-slate-400 font-normal">local-lvm (SSD)</div>
                      </td>

                      {/* Node */}
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">
                        {vm.node || 'pve'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {isRunning ? (
                            <>
                              {/* Open Console */}
                              <button
                                onClick={() => onOpenConsole(vm.vmid, vm.name)}
                                className="p-1.5 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
                                title="Open Live Web VNC Console"
                              >
                                <Terminal className="w-4 h-4" />
                              </button>

                              {/* Reboot */}
                              <button
                                onClick={() => handleAction(vm.vmid, 'reboot')}
                                disabled={!!isPending}
                                className="p-1.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition disabled:opacity-50"
                                title="Reboot Guest OS"
                              >
                                <RotateCw className={`w-4 h-4 ${isPending === 'reboot' ? 'animate-spin' : ''}`} />
                              </button>

                              {/* Stop */}
                              <button
                                onClick={() => handleAction(vm.vmid, 'stop')}
                                disabled={!!isPending}
                                className="p-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition disabled:opacity-50"
                                title="Stop VM"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Start */}
                              <button
                                onClick={() => handleAction(vm.vmid, 'start')}
                                disabled={!!isPending}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-sm"
                                title="Power On VM"
                              >
                                <Play className={`w-3.5 h-3.5 ${isPending === 'start' ? 'animate-spin' : ''}`} />
                                <span>Start</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(vm.vmid)}
                                disabled={!!isPending}
                                className="p-1.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition disabled:opacity-50"
                                title="Destroy VM"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create VM Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Provision Virtual Machine</h3>
                  <p className="text-xs text-slate-500">Configure Hardware Compute & Boot Media</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="m-6 mb-0 bg-rose-50 border-l-4 border-rose-600 p-3.5 rounded text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVM} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">VM ID</label>
                  <input
                    type="number"
                    required
                    value={formData.vmid}
                    onChange={(e) => setFormData({ ...formData, vmid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instance Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">vCPU Cores</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    required
                    value={formData.cores}
                    onChange={(e) => setFormData({ ...formData, cores: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RAM (MB)</label>
                  <input
                    type="number"
                    min="512"
                    step="512"
                    required
                    value={formData.memory}
                    onChange={(e) => setFormData({ ...formData, memory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SSD Disk (GB)</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    required
                    value={formData.disk_gb}
                    onChange={(e) => setFormData({ ...formData, disk_gb: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Boot ISO Image</label>
                <select
                  value={formData.iso}
                  onChange={(e) => setFormData({ ...formData, iso: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-sky-600"
                >
                  <option value="">No Boot Media (PXE / Existing)</option>
                  {isos.map((iso) => (
                    <option key={iso.volid} value={iso.volid}>
                      {iso.volid.replace('local:iso/', '')} ({formatBytes(iso.size)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  ISOs stored in Proxmox local storage on Second SSD
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-bold">Target Storage:</span> <code className="text-sky-700 font-bold">local-lvm (Thin-Pool)</code> • 135.84 GB Available on Second SSD.
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {createLoading ? 'Deploying KVM Instance...' : 'Deploy Virtual Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
