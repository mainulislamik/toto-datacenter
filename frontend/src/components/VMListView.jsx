import React, { useState, useEffect } from 'react';
import {
  Server, Play, Square, RotateCw, Trash2, Plus, Terminal,
  RefreshCw, Cpu, HardDrive, MemoryStick, Activity, Search,
  Settings, Camera, ArrowRightLeft, Power, Disc, AlertTriangle,
  ChevronDown, Layers, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { api } from '../api';
import SnapshotModal from './SnapshotModal';
import MigrateModal from './MigrateModal';
import VNCConsoleModal from './VNCConsoleModal';
import VMDetailsModal from './VMDetailsModal';

export default function VMListView({ onSelectVM }) {
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [consoleVM, setConsoleVM] = useState(null);
  const [snapshotVM, setSnapshotVM] = useState(null);
  const [migrateVM, setMigrateVM] = useState(null);
  const [detailsVM, setDetailsVM] = useState(null);

  // ISOs & Storage for Deploy Modal
  const [isos, setIsos] = useState([]);
  const [storagePools, setStoragePools] = useState([]);

  // Create Form State
  const [form, setForm] = useState({
    name: '',
    cores: 2,
    memory: 2048,
    disk_gb: 20,
    storage: 'local-lvm',
    iso: '',
    ostype: 'l26',
    start_on_create: true
  });
  const [creating, setCreating] = useState(false);

  const fetchVMs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVMs('pve');
      setVms(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch KVM virtual machines');
    } finally {
      setLoading(false);
    }
  };

  const loadMediaAndStorage = async () => {
    try {
      const [isoRes, storRes] = await Promise.all([
        api.getISOs ? api.getISOs('pve') : Promise.resolve([]),
        api.getStorage ? api.getStorage('pve') : Promise.resolve([])
      ]);
      setIsos(isoRes || []);
      setStoragePools(storRes || []);
    } catch (e) {
      console.warn('Could not preload storage pools or ISOs', e);
    }
  };

  useEffect(() => {
    fetchVMs();
    loadMediaAndStorage();
    const interval = setInterval(fetchVMs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (vmid, action) => {
    setActionLoading(`${vmid}_${action}`);
    setError(null);
    try {
      if (api.vmAction) {
        await api.vmAction(vmid, action, 'pve');
      } else if (api[`${action}VM`]) {
        await api[`${action}VM`](vmid, 'pve');
      }
      setTimeout(fetchVMs, 1500);
    } catch (err) {
      setError(err.message || `Action ${action} failed on VM #${vmid}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (vmid, name) => {
    if (!window.confirm(`Are you sure you want to permanently purge VM #${vmid} (${name || 'Unnamed'}) and destroy all attached virtual disks?`)) {
      return;
    }
    setActionLoading(`${vmid}_delete`);
    try {
      await api.deleteVM(vmid, 'pve');
      fetchVMs();
    } catch (err) {
      setError(err.message || `Failed to delete VM #${vmid}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.createVM({
        name: form.name || `toto-vm-${Math.floor(Math.random() * 1000)}`,
        cores: Number(form.cores),
        memory_mb: Number(form.memory),
        disk_gb: Number(form.disk_gb),
        storage: form.storage,
        iso_volid: form.iso || null,
        ostype: form.ostype,
        start_on_create: form.start_on_create
      });

      setCreateModal(false);
      setForm({
        name: '',
        cores: 2,
        memory: 2048,
        disk_gb: 20,
        storage: 'local-lvm',
        iso: '',
        ostype: 'l26',
        start_on_create: true
      });
      setTimeout(fetchVMs, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create virtual machine');
    } finally {
      setCreating(false);
    }
  };

  const filteredVMs = vms.filter((vm) => {
    const q = search.toLowerCase();
    return (
      (vm.name && vm.name.toLowerCase().includes(q)) ||
      String(vm.vmid).includes(q) ||
      (vm.status && vm.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black shadow-md shadow-sky-100">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">KVM Compute Virtual Machines</h2>
            <p className="text-xs text-slate-500 font-medium">
              Enterprise QEMU/KVM Hypervisor • High-Performance Virtual Hardware
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48 sm:w-64"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchVMs}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs font-bold"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          {/* Deploy Button */}
          <button
            onClick={() => {
              loadMediaAndStorage();
              setCreateModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-200 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy KVM VM</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-xs font-semibold text-rose-700">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="font-bold underline text-rose-800">Dismiss</button>
        </div>
      )}

      {/* VM List Table & Cards */}
      {filteredVMs.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">No Virtual Machines Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Get started by launching a new enterprise KVM guest instance backed by Proxmox VE 8.4.
          </p>
          <button
            onClick={() => {
              loadMediaAndStorage();
              setCreateModal(true);
            }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-200 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy KVM Virtual Machine</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">VM Name & ID</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">vCPU Cores</th>
                  <th className="px-4 py-3.5">Memory (RAM)</th>
                  <th className="px-4 py-3.5">Disk Size</th>
                  <th className="px-4 py-3.5">Node</th>
                  <th className="px-5 py-3.5 text-right">Quick Power & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredVMs.map((vm) => {
                  const isRunning = vm.status === 'running';
                  const memMB = Math.round((vm.maxmem || vm.mem || 0) / (1024 * 1024));
                  const diskGB = ((vm.maxdisk || 0) / (1024 * 1024 * 1024)).toFixed(1);

                  return (
                    <tr key={vm.vmid} className="hover:bg-slate-50/80 transition group">
                      
                      {/* Name & ID */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                            isRunning ? 'bg-emerald-600' : 'bg-slate-600'
                          }`}>
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <button
                              onClick={() => setDetailsVM(vm)}
                              className="font-black text-slate-900 hover:text-sky-600 text-xs text-left block"
                            >
                              {vm.name || `VM #${vm.vmid}`}
                            </button>
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: #{vm.vmid}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                          isRunning ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <span>{isRunning ? 'RUNNING' : 'STOPPED'}</span>
                        </span>
                      </td>

                      {/* vCPU */}
                      <td className="px-4 py-4 font-mono font-bold text-slate-700">
                        {vm.cpus || 2} vCPU
                      </td>

                      {/* Memory */}
                      <td className="px-4 py-4 font-mono font-bold text-slate-700">
                        {memMB >= 1024 ? `${(memMB / 1024).toFixed(1)} GB` : `${memMB} MB`}
                      </td>

                      {/* Disk */}
                      <td className="px-4 py-4 font-mono font-bold text-slate-700">
                        {diskGB > 0 ? `${diskGB} GB` : '20.0 GB'}
                      </td>

                      {/* Node */}
                      <td className="px-4 py-4">
                        <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {vm.node || 'pve'}
                        </span>
                      </td>

                      {/* Action Bar */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          
                          {/* Power: Start / Stop */}
                          {!isRunning ? (
                            <button
                              onClick={() => handleAction(vm.vmid, 'start')}
                              disabled={actionLoading === `${vm.vmid}_start`}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                              title="Start VM"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAction(vm.vmid, 'shutdown')}
                                disabled={actionLoading === `${vm.vmid}_shutdown`}
                                className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition disabled:opacity-50"
                                title="Graceful ACPI Shutdown"
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleAction(vm.vmid, 'stop')}
                                disabled={actionLoading === `${vm.vmid}_stop`}
                                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50"
                                title="Force Stop / Reset"
                              >
                                <Square className="w-3.5 h-3.5 fill-current" />
                              </button>

                              <button
                                onClick={() => handleAction(vm.vmid, 'reboot')}
                                disabled={actionLoading === `${vm.vmid}_reboot`}
                                className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition disabled:opacity-50"
                                title="Reboot VM"
                              >
                                <RotateCw className={`w-3.5 h-3.5 ${actionLoading === `${vm.vmid}_reboot` ? 'animate-spin' : ''}`} />
                              </button>
                            </>
                          )}

                          {/* Console Web Shell */}
                          <button
                            onClick={() => setConsoleVM(vm)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-black text-sky-400 shadow-sm transition"
                            title="Live noVNC Web Console"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>

                          {/* Inspect & Hardware Settings */}
                          <button
                            onClick={() => setDetailsVM(vm)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Hardware Specs & Disks"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>

                          {/* Snapshots */}
                          <button
                            onClick={() => setSnapshotVM(vm)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Snapshots & Disaster Recovery"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>

                          {/* Live RAM Migration */}
                          <button
                            onClick={() => setMigrateVM(vm)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Live Cluster RAM Migration"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(vm.vmid, vm.name)}
                            disabled={actionLoading === `${vm.vmid}_delete`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                            title="Purge VM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deploy VM Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Deploy New KVM Virtual Machine</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Proxmox VE 8.4 • VirtIO SCSI Architecture</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* VM Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Instance Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. production-ubuntu-app"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* vCPU & Memory */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">vCPU Cores</label>
                  <select
                    value={form.cores}
                    onChange={(e) => setForm({ ...form, cores: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={1}>1 Core (Standard)</option>
                    <option value={2}>2 Cores (Recommended)</option>
                    <option value={4}>4 Cores (High Performance)</option>
                    <option value={8}>8 Cores (Enterprise Workload)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">RAM Memory</label>
                  <select
                    value={form.memory}
                    onChange={(e) => setForm({ ...form, memory: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={1024}>1024 MB (1.0 GB)</option>
                    <option value={2048}>2048 MB (2.0 GB)</option>
                    <option value={4096}>4096 MB (4.0 GB)</option>
                    <option value={8192}>8192 MB (8.0 GB)</option>
                  </select>
                </div>
              </div>

              {/* Disk Size & Storage Pool */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Virtual SSD Disk (GB)</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={form.disk_gb}
                    onChange={(e) => setForm({ ...form, disk_gb: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Storage Pool</label>
                  <select
                    value={form.storage}
                    onChange={(e) => setForm({ ...form, storage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="local-lvm">local-lvm (135 GB LVM-Thin SSD)</option>
                    <option value="extra-ssd">extra-ssd (100 GB Dedicated SSD)</option>
                    <option value="local">local (Directory Storage)</option>
                  </select>
                </div>
              </div>

              {/* Boot ISO Vault */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Optical Boot ISO Media</label>
                <select
                  value={form.iso}
                  onChange={(e) => setForm({ ...form, iso: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">[ Blank / No ISO Attached ]</option>
                  {isos.map((iso) => (
                    <option key={iso.volid} value={iso.volid}>
                      💿 {iso.volid} ({((iso.size || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB - {iso.storage_pool || 'Vault'})
                    </option>
                  ))}
                </select>
              </div>

              {/* OS Type Profile */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">OS Kernel Profile</label>
                  <select
                    value={form.ostype}
                    onChange={(e) => setForm({ ...form, ostype: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="l26">Linux 6.x / 5.x / 2.6 Kernel</option>
                    <option value="win11">Microsoft Windows 11 / Server 2022</option>
                    <option value="win10">Microsoft Windows 10 / Server 2019</option>
                    <option value="other">Other / Custom Appliance</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.start_on_create}
                      onChange={(e) => setForm({ ...form, start_on_create: e.target.checked })}
                      className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Start immediately after creation</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-200 transition disabled:opacity-50"
                >
                  {creating ? 'Deploying VM...' : 'Confirm & Deploy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VM Details & Hardware Inspector Modal */}
      {detailsVM && (
        <VMDetailsModal
          vm={detailsVM}
          onClose={() => setDetailsVM(null)}
          onRefresh={fetchVMs}
        />
      )}

      {/* Console Modal */}
      {consoleVM && (
        <VNCConsoleModal
          vmid={consoleVM.vmid}
          vmName={consoleVM.name}
          onClose={() => setConsoleVM(null)}
        />
      )}

      {/* Snapshot Modal */}
      {snapshotVM && (
        <SnapshotModal
          vmid={snapshotVM.vmid}
          name={snapshotVM.name}
          isLXC={false}
          onClose={() => setSnapshotVM(null)}
        />
      )}

      {/* Migrate Modal */}
      {migrateVM && (
        <MigrateModal
          item={migrateVM}
          isLXC={false}
          onClose={() => setMigrateVM(null)}
          onSuccess={fetchVMs}
        />
      )}

    </div>
  );
}
