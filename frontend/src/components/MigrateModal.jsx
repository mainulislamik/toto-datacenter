import React, { useState, useEffect } from 'react';
import { Server, ArrowRight, Zap, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function MigrateModal({ item, isLXC = false, onClose, onSuccess }) {
  const [nodes, setNodes] = useState([]);
  const [targetNode, setTargetNode] = useState('');
  const [liveRAM, setLiveRAM] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        const clusterNodes = await api.getClusterNodes();
        const availableNodes = clusterNodes.filter(n => n.node !== (item.node || 'pve'));
        setNodes(availableNodes);
        if (availableNodes.length > 0) {
          setTargetNode(availableNodes[0].node);
        }
      } catch (err) {
        // Fallback
        setNodes([]);
      }
    };
    loadNodes();
  }, [item]);

  const handleMigrate = async () => {
    if (!targetNode) {
      setError('Please select a target physical node');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isLXC) {
        await api.migrateLXC(item.vmid, targetNode, item.node || 'pve');
      } else {
        await api.migrateVM(item.vmid, targetNode, liveRAM, item.node || 'pve');
      }
      setSuccessMsg(`Migration of ${item.name} (ID: ${item.vmid}) to node '${targetNode}' initiated!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Live migration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Zero-Downtime Live Migration</h3>
              <p className="text-xs text-slate-500">
                Move {isLXC ? 'Container' : 'Virtual Machine'} {item.name} (#{item.vmid}) to another physical server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="my-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="my-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-4 my-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 text-slate-700 rounded-lg font-mono text-xs font-bold">
                SRC: {item.node || 'pve'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{item.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">VMID: {item.vmid} • Status: {item.status}</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg font-mono text-xs font-bold">
              DEST: {targetNode || 'Select Target'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Destination Physical Node
            </label>
            {nodes.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                ⚠️ Only 1 physical node (<code className="font-bold">pve</code>) is currently active in the cluster. 
                Use <strong>Add Physical Server / Node</strong> to join secondary PCs for live cross-node migration.
              </div>
            ) : (
              <select
                value={targetNode}
                onChange={(e) => setTargetNode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              >
                {nodes.map((n) => (
                  <option key={n.node} value={n.node}>
                    Node: {n.node} ({n.ip || 'Cluster Member'}) - Status: {n.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!isLXC && (
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={liveRAM}
                onChange={(e) => setLiveRAM(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900">Live RAM Memory Sync (Zero-Downtime)</span>
                <p className="text-[11px] text-slate-500">
                  Migrates running RAM pages over high-speed cluster network without disconnecting users or shutting down.
                </p>
              </div>
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMigrate}
            disabled={loading || nodes.length === 0}
            className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-sm transition-colors ${
              loading || nodes.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'
            }`}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>Start Live Migration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
