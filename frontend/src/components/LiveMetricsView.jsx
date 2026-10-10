import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, HardDrive, RefreshCw, AlertTriangle, 
  Trash2, ShieldCheck, Zap, ArrowUpRight, CheckCircle2, Clock
} from 'lucide-react';
import { api } from '../api';

export default function LiveMetricsView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await api.getRealtimeMetrics();
      setMetrics(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKillProcess = async (pid) => {
    if (!confirm(`Are you sure you want to kill PID #${pid}?`)) return;
    try {
      await api.killProcess(pid);
      setMsg({ type: 'success', text: `Terminated Process PID #${pid}` });
      await loadMetrics();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to terminate process.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Real-Time Observability & Processes</h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              Live 5s Poller
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Real-time CPU telemetry, memory allocation breakdown, active task runner, and process inspector.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>
          <div className="flex items-center space-x-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="font-black hover:opacity-75">✕</button>
        </div>
      )}

      {/* Raw Health Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs">
              <Clock className="w-4 h-4" />
              <span>Host Uptime & Load Avg</span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {metrics.uptime_raw || 'Loading...'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>Memory Utilization (MB)</span>
            </div>
            <pre className="font-mono text-[11px] font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto">
              {metrics.memory_raw || 'Loading...'}
            </pre>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs">
              <HardDrive className="w-4 h-4" />
              <span>Storage Pools & Extra-SSD Vault</span>
            </div>
            <pre className="font-mono text-[11px] font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto">
              {metrics.storage_raw || 'Loading...'}
            </pre>
          </div>
        </div>
      )}

      {/* Top Processes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Top CPU & Memory Consumers</h3>
          <span className="text-xs font-bold text-slate-500">Live Process Tree</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">PID</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">CPU %</th>
                <th className="px-6 py-3">RAM %</th>
                <th className="px-6 py-3">Command</th>
                <th className="px-6 py-3 text-right">Kill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(metrics?.top_processes || []).map((p) => (
                <tr key={p.pid} className="hover:bg-slate-50/75 transition">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{p.pid}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-600">{p.user}</td>
                  <td className="px-6 py-3.5">
                    <span className={`font-mono font-bold ${p.cpu > 50 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {p.cpu}%
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{p.mem}%</td>
                  <td className="px-6 py-3.5 font-mono text-slate-600 truncate max-w-xs">{p.command}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => handleKillProcess(p.pid)}
                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                      title="Kill Process"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
