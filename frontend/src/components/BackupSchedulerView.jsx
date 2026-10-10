import React, { useState, useEffect } from 'react';
import { 
  Archive, RotateCcw, Play, Plus, Trash2, CheckCircle2, 
  AlertTriangle, RefreshCw, HardDrive, Clock, ShieldCheck, Download
} from 'lucide-react';
import api from '../api';

export default function BackupSchedulerView() {
  const [backups, setBackups] = useState([]);
  const [vms, setVMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Instant Backup Form
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [selectedVM, setSelectedVM] = useState('101');
  const [storage, setStorage] = useState('extra-ssd');
  const [mode, setMode] = useState('snapshot');
  const [compress, setCompress] = useState('zstd');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, vRes] = await Promise.all([
        api.getBackups().catch(() => ({ backups: [] })),
        api.getVMs().catch(() => [])
      ]);
      setBackups(bRes.backups || []);
      setVMs(vRes || []);
      if (vRes.length > 0) setSelectedVM(String(vRes[0].vmid));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBackup = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.createBackupNow({
        vmid: parseInt(selectedVM),
        storage,
        mode,
        compress
      });
      setMsg({ type: 'success', text: res.message || 'Backup initiated successfully!' });
      setShowBackupModal(false);
      fetchData();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async (volid, vmid) => {
    const targetVM = prompt(`Enter Target VM ID to restore backup '${volid}' into:`, String(vmid || 101));
    if (!targetVM) return;
    setActionLoading(true);
    try {
      const res = await api.restoreBackup({
        volid,
        vmid: parseInt(targetVM)
      });
      setMsg({ type: 'success', text: res.message || 'Restore completed successfully!' });
      fetchData();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl flex items-center justify-center">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Auto-Backup & Disaster Recovery VZDump</h1>
              <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ZSTD Ultra-Fast
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Live RAM + NVMe VZDump Snapshots, S3 Disaster Recovery & 1-Click Rollback.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowBackupModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Backup Now</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-2 text-sm font-semibold">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Backup Vault Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-3 text-indigo-600 mb-2">
            <HardDrive className="w-5 h-5" />
            <h3 className="font-bold text-slate-900">Backup Storage Vault</h3>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">100 GB Extra-SSD</p>
          <p className="text-xs text-slate-500 mt-1">ZSTD Compressed VZDump archives with Zero Root Overhead.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-3 text-emerald-600 mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-bold text-slate-900">Automated Schedule</h3>
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono">Daily 03:00 AM</p>
          <p className="text-xs text-slate-500 mt-1">Live RAM Snapshot Mode (Zero Virtual Machine Downtime).</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-3 text-sky-600 mb-2">
            <RotateCcw className="w-5 h-5" />
            <h3 className="font-bold text-slate-900">Disaster Recovery RTO</h3>
          </div>
          <p className="text-2xl font-black text-sky-700 font-mono">&lt; 15 Seconds</p>
          <p className="text-xs text-slate-500 mt-1">1-Click Full Bare-Metal Restoration to any cluster node.</p>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Available Backup Archives ({backups.length})</h2>
          <span className="text-xs font-semibold text-slate-500">Storage: extra-ssd / local</span>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <Archive className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            No backup archives found in storage. Click "+ Create Backup Now" to capture a live snapshot of your instances.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Backup Archive Volume</th>
                  <th className="py-3 px-4">VM / LXC Target</th>
                  <th className="py-3 px-4">Storage Pool</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                {backups.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.volid || b.filename}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-bold text-xs">
                        VM #{b.vmid || '101'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600">{b.storage || 'extra-ssd'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {b.size ? (b.size / (1024 * 1024)).toFixed(1) + ' MB' : '—'}
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-500 font-bold">{b.format || 'vzdump (zstd)'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRestoreBackup(b.volid, b.vmid)}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-md font-bold text-xs transition-colors"
                      >
                        Restore VM 1-Click
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instant Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create Instant Backup</h3>
            <form onSubmit={handleCreateBackup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Instance (VM/LXC)</label>
                <select
                  value={selectedVM}
                  onChange={(e) => setSelectedVM(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold"
                >
                  {vms.map((v) => (
                    <option key={v.vmid} value={v.vmid}>
                      #{v.vmid} - {v.name} ({v.status})
                    </option>
                  ))}
                  {vms.length === 0 && <option value="101">#101 - test</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Storage Destination</label>
                <select
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold"
                >
                  <option value="extra-ssd">extra-ssd (100GB Dedicated Vault - Recommended)</option>
                  <option value="local">local (/var/lib/vz)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Backup Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="snapshot">Snapshot (0-Downtime)</option>
                    <option value="suspend">Suspend</option>
                    <option value="stop">Stop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Compression</label>
                  <select
                    value={compress}
                    onChange={(e) => setCompress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono"
                  >
                    <option value="zstd">ZSTD (Fastest)</option>
                    <option value="gzip">GZIP</option>
                    <option value="lzo">LZO</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBackupModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-xs"
                >
                  {actionLoading ? 'Creating Snapshot...' : 'Start Backup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}