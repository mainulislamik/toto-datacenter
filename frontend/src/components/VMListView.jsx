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
  CheckCircle2, 
  Lock,
  Camera,
  Server,
  Zap,
  ArrowRightLeft
} from 'lucide-react';
import { api } from '../api';

export default function VMListView({ onOpenConsole, onOpenSnapshots, onOpenMigrate, user }) {
  const [vms, setVms] = useState([]);
  const [isos, setIsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [createModal, setCreateModal] = useState(false);

  const [form, setForm] = useState({
    vmid: 100,
    name: 'cloud-server-01',
    cores: 2,
    memory: 2048,
    disk_gb: 20,
    iso: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vmData, isoData] = await Promise.all([
        api.getVMs(),
        api.getISOs().catch(() => [])
      ]);
      setVms(vmData);
      setIsos(isoData);

      // Suggest next free VMID
      const usedIds = vmData.map(v => v.vmid);
      let nextId = 100;
      while (usedIds.includes(nextId)) {
        nextId++;
      }
      setForm(prev => ({
        ...prev,
        vmid: nextId,
        iso: isoData.length > 0 ? isoData[0].volid : ''
      }));
    } catch (err) {
      setError(err.message || 'Failed to load Virtual Machines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (vmid, action) => {
    setActionLoading(`${vmid}_${action}`);
    setError(null);
    try {
      await api.vmAction(vmid, action);
      setTimeout(fetchData, 1500);
    } catch (err) {
      setError(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (vmid) => {
    if (!window.confirm(`Are you sure you want to permanently delete Virtual Machine #${vmid}? All disk data will be destroyed.`)) return;
    setActionLoading(`${vmid}_delete`);
    setError(null);
    try {
      await api.deleteVM(vmid);
      setTimeout(fetchData, 1500);
    } catch (err) {
      setError(`Deletion failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading('creating');
    setError(null);
    try {
      await api.createVM({
        vmid: Number(form.vmid),
        name: form.name,
        cores: Number(form.cores),
        memory: Number(form.memory),
        disk_gb: Number(form.disk_gb),
        iso: form.iso || null
      });
      setCreateModal(false);
      setTimeout(fetchData, 2000);
    } catch (err) {
      setError(`Creation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">KVM Virtual Machines</h1>
              <p className="text-xs text-slate-500 mt-0.5">Hardware-accelerated virtual servers isolated with dedicated vCPU and RAM</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setCreateModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy KVM VM</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* VM Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && vms.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-sky-500" />
            <p className="text-xs font-semibold">Querying Proxmox Hypervisor...</p>
          </div>
        ) : vms.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Server className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No Virtual Machines Found</p>
            <p className="text-xs text-slate-400 mt-1">Click "Deploy KVM VM" to spin up your first server.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">ID / Name</th>
                  <th className="px-6 py-3.5">Node</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">vCPU Cores</th>
                  <th className="px-6 py-3.5">Memory</th>
                  <th className="px-6 py-3.5">Disk</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {vms.map((vm) => {
                  const isRunning = vm.status === 'running';
                  const ramMB = vm.maxmem ? Math.round(vm.maxmem / 1024 / 1024) : '—';
                  const diskGB = vm.maxdisk ? Math.round(vm.maxdisk / 1024 / 1024 / 1024) : '—';

                  return (
                    <tr key={vm.vmid} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900">{vm.name || `VM-${vm.vmid}`}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">ID: #{vm.vmid}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-slate-600">
                        {vm.node || 'pve'}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isRunning ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {isRunning ? 'RUNNING' : 'STOPPED'}
                        </span>
                      </td>

                      <td className="px-6 py-4">{vm.cpus || 2} Core</td>
                      <td className="px-6 py-4">{ramMB} MB</td>
                      <td className="px-6 py-4">{diskGB} GB</td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isRunning ? (
                            <>
                              <button
                                onClick={() => onOpenConsole(vm.vmid, vm.name)}
                                title="Web VNC Console"
                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              >
                                <Terminal className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction(vm.vmid, 'reboot')}
                                title="Reboot Server"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction(vm.vmid, 'stop')}
                                title="Stop Server"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleAction(vm.vmid, 'start')}
                              title="Start Server"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {onOpenMigrate && (
                            <button
                              onClick={() => onOpenMigrate(vm, false)}
                              title="Live Cross-Node Migration"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}

                          {onOpenSnapshots && (
                            <button
                              onClick={() => onOpenSnapshots(vm.vmid, vm.name, false)}
                              title="Live Snapshots"
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(vm.vmid)}
                            title="Delete VM"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Deploy Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Deploy KVM Virtual Machine</h3>
                  <p className="text-xs text-slate-500">Hardware Isolated Instance</p>
                </div>
              </div>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">VM ID</label>
                  <input
                    type="number"
                    required
                    value={form.vmid}
                    onChange={(e) => setForm({ ...form, vmid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Server Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Boot ISO Image</label>
                <select
                  value={form.iso}
                  onChange={(e) => setForm({ ...form, iso: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white"
                >
                  <option value="">None (Empty Disk)</option>
                  {isos.map(iso => (
                    <option key={iso.volid} value={iso.volid}>{iso.volid.split('/').pop()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">vCPU Cores</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={form.cores}
                    onChange={(e) => setForm({ ...form, cores: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RAM (MB)</label>
                  <input
                    type="number"
                    min="512"
                    max="32768"
                    value={form.memory}
                    onChange={(e) => setForm({ ...form, memory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SSD (GB)</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={form.disk_gb}
                    onChange={(e) => setForm({ ...form, disk_gb: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'creating'}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>{actionLoading === 'creating' ? 'Deploying...' : 'Launch Server'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
