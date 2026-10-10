import React, { useState, useEffect } from 'react';
import {
  X, Cpu, HardDrive, MemoryStick, Play, Square, RotateCw, AlertTriangle,
  Settings, Activity, Camera, ArrowRightLeft, Disc, Save, RefreshCw, CheckCircle2,
  Terminal, Power, ShieldAlert, Layers
} from 'lucide-react';
import { api } from '../api';

export default function VMDetailsModal({ vm, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('hardware');
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState(null);
  const [isos, setIsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Form states for Hardware
  const [cores, setCores] = useState(2);
  const [memory, setMemory] = useState(2048);
  const [selectedIso, setSelectedIso] = useState('');
  const [bootOrder, setBootOrder] = useState('order=scsi0;ide2;net0');
  const [onBoot, setOnBoot] = useState(0);

  // Form state for Disk Resize
  const [resizeGB, setResizeGB] = useState(10);
  const [resizing, setResizing] = useState(false);

  const vmid = vm.vmid;
  const node = vm.node || 'pve';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, statRes, isoRes] = await Promise.all([
        api.getVMConfig ? api.getVMConfig(vmid, node) : Promise.resolve({}),
        api.getVMDetails ? api.getVMDetails(vmid, node) : Promise.resolve(vm),
        api.getISOs ? api.getISOs(node) : Promise.resolve([])
      ]);

      setConfig(cfgRes);
      setStatus(statRes);
      setIsos(isoRes);

      if (cfgRes) {
        setCores(cfgRes.cores || vm.cpus || 2);
        setMemory(cfgRes.memory || Math.round((vm.maxmem || 2147483648) / (1024 * 1024)));
        setBootOrder(cfgRes.boot || 'order=scsi0;ide2;net0');
        setOnBoot(cfgRes.onboot || 0);

        if (cfgRes.ide2) {
          const isoPart = cfgRes.ide2.split(',')[0];
          setSelectedIso(isoPart === 'none' ? '' : isoPart);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load VM configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vmid]);

  const handleSaveHardware = async () => {
    setActionLoading('save_hardware');
    setError(null);
    setSaveSuccess(false);
    try {
      await api.updateVMConfig(vmid, {
        cores: Number(cores),
        memory: Number(memory),
        iso_volid: selectedIso || 'none',
        boot: bootOrder,
        onboot: Number(onBoot)
      }, node);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onRefresh) onRefresh();
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update hardware config');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResizeDisk = async () => {
    if (!resizeGB || resizeGB <= 0) return;
    setResizing(true);
    setError(null);
    try {
      await api.resizeVMDisk(vmid, 'scsi0', `+${resizeGB}G`, node);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onRefresh) onRefresh();
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to expand disk storage');
    } finally {
      setResizing(false);
    }
  };

  const handlePowerAction = async (action) => {
    setActionLoading(action);
    setError(null);
    try {
      if (api.vmAction) {
        await api.vmAction(vmid, action, node);
      } else {
        await api[`${action}VM`](vmid, node);
      }
      setTimeout(async () => {
        await loadData();
        if (onRefresh) onRefresh();
      }, 1500);
    } catch (err) {
      setError(err.message || `Failed to execute ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const isRunning = (status?.status || vm.status) === 'running';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
              isRunning ? 'bg-emerald-600' : 'bg-slate-600'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-slate-900">{vm.name || `VM #${vmid}`}</h3>
                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                  ID: #{vmid}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  isRunning ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isRunning ? '● RUNNING' : '○ STOPPED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Node: <span className="font-bold text-slate-700">{node}</span> • Architecture: x86_64 KVM • SCSI Controller: VirtIO-SCSI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Power Toolbar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {!isRunning ? (
              <button
                onClick={() => handlePowerAction('start')}
                disabled={actionLoading === 'start'}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{actionLoading === 'start' ? 'Starting...' : 'Start VM'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => handlePowerAction('shutdown')}
                  disabled={actionLoading === 'shutdown'}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                  title="ACPI Graceful OS Shutdown"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{actionLoading === 'shutdown' ? 'Shutting down...' : 'ACPI Shutdown'}</span>
                </button>

                <button
                  onClick={() => handlePowerAction('stop')}
                  disabled={actionLoading === 'stop'}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                  title="Immediate Force Stop"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{actionLoading === 'stop' ? 'Stopping...' : 'Force Stop'}</span>
                </button>

                <button
                  onClick={() => handlePowerAction('reboot')}
                  disabled={actionLoading === 'reboot'}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${actionLoading === 'reboot' ? 'animate-spin' : ''}`} />
                  <span>Reboot</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
              title="Refresh Specs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex space-x-6 bg-white">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'hardware'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Hardware & Compute</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'storage'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Disks & ISO Media</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'telemetry'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Telemetry</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs font-semibold text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Configuration updated and synced to Proxmox hypervisor successfully!</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'hardware' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CPU Cores */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4 text-sky-600" />
                      <span>vCPU Virtual Cores</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                      {cores} Cores
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={cores}
                    onChange={(e) => setCores(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                    <span>1 vCPU</span>
                    <span>2 vCPU</span>
                    <span>4 vCPU</span>
                    <span>8 vCPU</span>
                  </div>
                </div>

                {/* RAM Memory */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                      <MemoryStick className="w-4 h-4 text-indigo-600" />
                      <span>Dedicated RAM (MB)</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {memory >= 1024 ? `${(memory / 1024).toFixed(1)} GB` : `${memory} MB`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="512"
                      min="512"
                      max="16384"
                      value={memory}
                      onChange={(e) => setMemory(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex space-x-1.5 mt-2">
                    {[1024, 2048, 4096, 8192].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMemory(m)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          memory === m
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m / 1024} GB
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Boot Options & Behavior */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Hypervisor Boot Policies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Boot Device Order</label>
                    <select
                      value={bootOrder}
                      onChange={(e) => setBootOrder(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="order=scsi0;ide2;net0">SCSI Disk ➔ CD-ROM ➔ Network PXE</option>
                      <option value="order=ide2;scsi0;net0">CD-ROM (ISO) ➔ SCSI Disk ➔ Network</option>
                      <option value="order=scsi0">SCSI Disk Only (Fast Direct Boot)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">Start on Datacenter Boot</label>
                    <select
                      value={onBoot}
                      onChange={(e) => setOnBoot(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value={1}>Enabled (Auto-start with Host)</option>
                      <option value={0}>Disabled (Manual Start Only)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveHardware}
                  disabled={actionLoading === 'save_hardware'}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{actionLoading === 'save_hardware' ? 'Applying...' : 'Apply Hardware Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-5">
              {/* CD-ROM ISO Attachment */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Disc className="w-4 h-4 text-amber-600" />
                    <span>Optical CD-ROM / Boot ISO Vault</span>
                  </label>
                  {selectedIso && (
                    <button
                      type="button"
                      onClick={() => setSelectedIso('')}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Eject Media
                    </button>
                  )}
                </div>

                <select
                  value={selectedIso}
                  onChange={(e) => setSelectedIso(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">[ Empty Drive / No ISO Attached ]</option>
                  {isos.map((iso) => (
                    <option key={iso.volid} value={iso.volid}>
                      💿 {iso.volid} ({((iso.size || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB - {iso.storage_pool || 'Vault'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Select an OS installation image from either the <b>extra-ssd</b> (100 GB) or <b>local</b> storage vault.
                </p>
              </div>

              {/* Disk Expansion */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span>Live Disk Expansion (SCSI Disk 0)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Current: {((vm.maxdisk || 21474836480) / (1024 * 1024 * 1024)).toFixed(1)} GB
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={resizeGB}
                    onChange={(e) => setResizeGB(Number(e.target.value))}
                    className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-600">GB Additional Space</span>

                  <div className="flex space-x-1.5">
                    {[5, 10, 20, 50].map((gb) => (
                      <button
                        key={gb}
                        type="button"
                        onClick={() => setResizeGB(gb)}
                        className="text-[10px] font-bold px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        +{gb}GB
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleResizeDisk}
                    disabled={resizing}
                    className="ml-auto inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>{resizing ? 'Expanding...' : 'Expand Disk Now'}</span>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveHardware}
                  disabled={actionLoading === 'save_hardware'}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{actionLoading === 'save_hardware' ? 'Applying...' : 'Save Media Settings'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block">CPU Utilization</span>
                  <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                    {((status?.cpu || vm.cpu || 0) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block">Memory Allocated</span>
                  <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                    {(((status?.mem || vm.mem || 0) / (1024 * 1024))).toFixed(0)} MB
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block">Disk Read/Write</span>
                  <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                    {(((status?.diskread || vm.diskread || 0) / (1024 * 1024))).toFixed(1)} MB
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block">Network TX/RX</span>
                  <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                    {(((status?.netin || vm.netin || 0) / (1024 * 1024))).toFixed(1)} MB
                  </span>
                </div>
              </div>

              {/* Raw Config Dump for Power Users */}
              {config && (
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-2">QEMU Hypervisor Flags</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(config).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5 border-b border-slate-800/60">
                        <span className="text-sky-400 font-semibold">{k}:</span>
                        <span className="text-slate-300 truncate max-w-[200px]" title={String(v)}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-semibold">
            TOTO CLOUD Enterprise QEMU Engine • ID #{vmid}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
