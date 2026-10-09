import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  HardDrive, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  Lock,
  Camera,
  Terminal,
  Zap
} from 'lucide-react';
import { api } from '../api';

export default function LXCHubView({ onOpenConsole, onOpenSnapshots }) {
  const [lxcs, setLxcs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [createModal, setCreateModal] = useState(false);

  const [form, setForm] = useState({
    vmid: 201,
    hostname: 'micro-service-01',
    cores: 1,
    memory: 512,
    disk_gb: 8,
    template: 'local:vztmpl/alpine-3.22-default_20250617_amd64.tar.xz',
    password: 'TotoLXC2026!'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lxcData, tmplData] = await Promise.all([
        api.getLXCs(),
        api.getLXCTemplates().catch(() => [])
      ]);
      setLxcs(lxcData);
      setTemplates(tmplData);

      // Suggest next available ID
      const usedIds = lxcData.map(l => l.vmid);
      let nextId = 200;
      while (usedIds.includes(nextId)) {
        nextId++;
      }
      setForm(prev => ({ ...prev, vmid: nextId }));
    } catch (err) {
      setError(err.message || 'Failed to load LXC containers');
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
      await api.lxcAction(vmid, action);
      setTimeout(fetchData, 1500);
    } catch (err) {
      setError(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (vmid) => {
    if (!window.confirm(`Are you sure you want to completely destroy LXC Container #${vmid}?`)) return;
    setActionLoading(`${vmid}_delete`);
    setError(null);
    try {
      await api.deleteLXC(vmid);
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
      await api.createLXC({
        vmid: Number(form.vmid),
        hostname: form.hostname,
        cores: Number(form.cores),
        memory: Number(form.memory),
        disk_gb: Number(form.disk_gb),
        template: form.template,
        password: form.password
      });
      setCreateModal(false);
      setTimeout(fetchData, 2000);
    } catch (err) {
      setError(`Failed to create LXC: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">LXC Micro-Containers</h1>
              <p className="text-xs text-slate-500 mt-0.5">Ultra-fast Linux micro-containers with direct hardware execution (&lt;30MB RAM footprint)</p>
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
            <span>Launch Container</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LXC Container Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && lxcs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-sky-500" />
            <p className="text-xs font-semibold">Querying Hypervisor LXC Subsystem...</p>
          </div>
        ) : lxcs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Layers className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">No Micro-Containers Running</p>
            <p className="text-xs text-slate-400 mt-1">Launch an Alpine or Debian micro-container in 1 second.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">ID / Hostname</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">CPU Cores</th>
                  <th className="px-6 py-3.5">Memory</th>
                  <th className="px-6 py-3.5">Disk</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {lxcs.map((lxc) => {
                  const isRunning = lxc.status === 'running';
                  const ramMB = lxc.maxmem ? Math.round(lxc.maxmem / 1024 / 1024) : '—';
                  const diskGB = lxc.maxdisk ? Math.round(lxc.maxdisk / 1024 / 1024 / 1024) : '—';

                  return (
                    <tr key={lxc.vmid} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900">{lxc.name || `CT-${lxc.vmid}`}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">ID: #{lxc.vmid}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isRunning ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {isRunning ? 'RUNNING' : 'STOPPED'}
                        </span>
                      </td>

                      <td className="px-6 py-4">{lxc.cpus || 1} Core</td>
                      <td className="px-6 py-4">{ramMB} MB</td>
                      <td className="px-6 py-4">{diskGB} GB</td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isRunning ? (
                            <>
                              <button
                                onClick={() => handleAction(lxc.vmid, 'reboot')}
                                title="Reboot Container"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction(lxc.vmid, 'stop')}
                                title="Stop Container"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleAction(lxc.vmid, 'start')}
                              title="Start Container"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {onOpenSnapshots && (
                            <button
                              onClick={() => onOpenSnapshots(lxc.vmid, lxc.name, true)}
                              title="Snapshots"
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(lxc.vmid)}
                            title="Destroy Container"
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

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Launch LXC Container</h3>
                  <p className="text-xs text-slate-500">1-Second Micro-Virtualization</p>
                </div>
              </div>
              <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Container ID</label>
                  <input
                    type="number"
                    required
                    value={form.vmid}
                    onChange={(e) => setForm({ ...form, vmid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hostname</label>
                  <input
                    type="text"
                    required
                    value={form.hostname}
                    onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Template</label>
                <select
                  value={form.template}
                  onChange={(e) => setForm({ ...form, template: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white"
                >
                  {templates.map(t => (
                    <option key={t.volid} value={t.volid}>{t.volid.split('/').pop()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cores</label>
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
                    min="128"
                    max="16384"
                    value={form.memory}
                    onChange={(e) => setForm({ ...form, memory: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SSD (GB)</label>
                  <input
                    type="number"
                    min="4"
                    max="100"
                    value={form.disk_gb}
                    onChange={(e) => setForm({ ...form, disk_gb: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Root Password</label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                />
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
                  <Zap className="w-3.5 h-3.5" />
                  <span>{actionLoading === 'creating' ? 'Creating...' : 'Launch Container'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
