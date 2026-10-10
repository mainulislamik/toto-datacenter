import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Plus, CheckCircle2, AlertTriangle, 
  RefreshCw, Cpu, Zap, Activity, Clock, ShieldCheck, Play
} from 'lucide-react';
import { api } from '../api';

export default function AutoScalerPolicyView() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [targetVmid, setTargetVmid] = useState('101');
  const [metric, setMetric] = useState('CPU Usage');
  const [threshold, setThreshold] = useState(80);
  const [action, setAction] = useState('Scale Up Replicas (+1)');
  const [adding, setAdding] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.getAutoscalingPolicies();
      if (res.status === 'success') {
        setPolicies(res.policies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    if (!newPolicyName) return;
    setAdding(true);
    try {
      await api.createAutoscalingPolicy({
        name: newPolicyName,
        target_vmid: targetVmid,
        metric,
        threshold: parseInt(threshold),
        action,
      });
      setShowAddModal(false);
      setNewPolicyName('');
      setStatusMsg({ type: 'success', text: 'Autoscaling policy created and armed!' });
      fetchPolicies();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to create policy' });
    } finally {
      setAdding(false);
    }
  };

  const handleTogglePolicy = async (policyId) => {
    try {
      await api.toggleAutoscalingPolicy(policyId);
      fetchPolicies();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">Dynamic Auto-Scaler & Policy Engine</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Live Watchdog
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Autonomous self-healing, horizontal clone elasticity, and reactive resource scale-out
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPolicies}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition font-medium text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Auto-Scale Policy</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm border ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div className="flex items-center space-x-3">
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Policies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((p) => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400">Target: VM #{p.target_vmid}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePolicy(p.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                    p.enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  {p.enabled ? '● ARMED / ACTIVE' : '○ PAUSED'}
                </button>
              </div>

              <div className="mt-6 space-y-3 bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Trigger Condition:</span>
                  <span className="text-amber-400 font-mono font-medium">When {p.metric} &gt; {p.threshold}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Scale Action:</span>
                  <span className="text-emerald-300 font-medium">{p.action}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Replica Boundaries:</span>
                  <span className="text-slate-200 font-mono">Min: {p.min_replicas} / Max: {p.max_replicas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cooldown Window:</span>
                  <span className="text-slate-200 font-mono">{p.cooldown_seconds}s</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Policy */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Create Auto-Scale Policy</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddPolicy} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Policy Name</label>
                <input
                  type="text"
                  required
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  placeholder="e.g. Spike Load Burst Guard"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Target VM ID</label>
                  <input
                    type="number"
                    required
                    value={targetVmid}
                    onChange={(e) => setTargetVmid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Threshold (%)</label>
                  <input
                    type="number"
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Trigger Metric</label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="CPU Usage">CPU Usage</option>
                  <option value="RAM Allocation">RAM Allocation</option>
                  <option value="Network Bandwidth">Network Bandwidth</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition"
                >
                  {adding ? 'Arming...' : 'Arm Auto-Scale Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
