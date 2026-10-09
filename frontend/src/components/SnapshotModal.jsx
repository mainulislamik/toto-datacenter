import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  RotateCcw, 
  Trash2, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Layers,
  X
} from 'lucide-react';
import { api } from '../api';

export default function SnapshotModal({ vmid, name, isLXC = false, onClose }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [form, setForm] = useState({
    snapname: `snap_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    description: 'Pre-deployment backup snapshot',
    vmstate: true
  });

  const fetchSnapshots = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSnapshots(vmid, isLXC);
      setSnapshots(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch snapshots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [vmid, isLXC]);

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    setActionLoading('creating');
    setError(null);
    setSuccess(null);
    try {
      await api.createSnapshot(vmid, {
        snapname: form.snapname,
        description: form.description,
        vmstate: form.vmstate,
        is_lxc: isLXC
      });
      setSuccess(`Snapshot "${form.snapname}" created successfully!`);
      setTimeout(() => {
        fetchSnapshots();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create snapshot');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRollback = async (snapname) => {
    if (!window.confirm(`Roll back instance state to snapshot "${snapname}"? Current unsaved data will be reverted.`)) return;
    setActionLoading(`rollback_${snapname}`);
    setError(null);
    try {
      await api.rollbackSnapshot(vmid, snapname, isLXC);
      setSuccess(`Rolled back to "${snapname}" successfully!`);
      setTimeout(() => {
        fetchSnapshots();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Rollback failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (snapname) => {
    if (!window.confirm(`Permanently delete snapshot "${snapname}"?`)) return;
    setActionLoading(`delete_${snapname}`);
    setError(null);
    try {
      await api.deleteSnapshot(vmid, snapname, isLXC);
      fetchSnapshots();
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Snapshots for {name || `#${vmid}`} ({isLXC ? 'LXC' : 'KVM VM'})
              </h3>
              <p className="text-xs text-slate-500">Live RAM & Disk State Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-700 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Snapshot Form */}
        <form onSubmit={handleCreateSnapshot} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>Take New Snapshot</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Snapshot Name (e.g. before-upgrade)"
              value={form.snapname}
              onChange={(e) => setForm({ ...form, snapname: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white"
            />
          </div>

          {!isLXC && (
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.vmstate}
                onChange={(e) => setForm({ ...form, vmstate: e.target.checked })}
                className="rounded text-sky-600"
              />
              <span>Include RAM State (Instant Live Freeze & Instant Restore)</span>
            </label>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={actionLoading === 'creating'}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow transition"
            >
              <Camera className={`w-3.5 h-3.5 ${actionLoading === 'creating' ? 'animate-spin' : ''}`} />
              <span>{actionLoading === 'creating' ? 'Capturing State...' : 'Take Snapshot'}</span>
            </button>
          </div>
        </form>

        {/* Existing Snapshots List */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saved State Points</div>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading Snapshots...</div>
          ) : snapshots.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No snapshots taken yet. Capture a state point above.
            </div>
          ) : (
            snapshots.filter(s => s.name !== 'current').map((s) => (
              <div 
                key={s.name}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs text-slate-900">{s.name}</span>
                    {s.vmstate ? (
                      <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                        RAM + DISK
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        DISK ONLY
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.description || 'No description provided'}</p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleRollback(s.name)}
                    disabled={actionLoading === `rollback_${s.name}`}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rollback</span>
                  </button>
                  <button
                    onClick={() => handleDelete(s.name)}
                    disabled={actionLoading === `delete_${s.name}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
