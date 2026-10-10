import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, ShieldCheck, Activity, RefreshCw, AlertTriangle, 
  CheckCircle2, HardDrive, Clock, ArrowRight, Zap, Play
} from 'lucide-react';
import { api } from '../api';

export default function DisasterRecoveryView() {
  const [drData, setDrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [msg, setMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getReplicationJobs();
      if (res.status === 'success') {
        setDrData(res);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to fetch DR replication jobs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncNow = async (jobId) => {
    setSyncingId(jobId);
    try {
      const res = await api.triggerReplicationSync(jobId);
      if (res.status === 'success') {
        setMsg({ type: 'success', text: res.message });
        fetchData();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Replication sync failed' });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-7 h-7 text-indigo-600" />
            Disaster Recovery & ZFS Replication Sync
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time block-level replication between PVE NVMe storage and Secondary 100GB Extra-SSD Vault.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => handleSyncNow('all-sync')}
            disabled={syncingId !== null}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all shadow-indigo-100 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Sync All Replicas Now
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-sm ${
          msg.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">✕</button>
        </div>
      )}

      {/* RPO / RTO SLA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Recovery Point Objective (RPO)</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{drData?.rpo_current || '15 mins'}</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">✓ Max 15-minute data delta window</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Recovery Time Objective (RTO)</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{drData?.rto_estimated || '< 45s'}</div>
          <p className="text-xs text-emerald-600 font-medium mt-1">⚡ Instant Secondary SSD Failover</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Disaster Recovery Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{drData?.status || 'Operational'}</div>
          <p className="text-xs text-slate-500 font-medium mt-1">Multi-tier snapshot sync active</p>
        </div>
      </div>

      {/* Replication Jobs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Active ZFS Block Replication Pipelines</h3>
          <span className="text-xs font-semibold text-slate-500">Target: /mnt/extra-vault</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Pipeline ID</th>
                <th className="py-3 px-6">Source VM / Host</th>
                <th className="py-3 px-6">Target Vault Storage</th>
                <th className="py-3 px-6">Schedule</th>
                <th className="py-3 px-6">Last Delta Sync</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Manual Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drData?.jobs?.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-indigo-600">{job.id}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {typeof job.source_vmid === 'number' ? `VM #${job.source_vmid}` : job.source_vmid}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-600">{job.target_storage}</td>
                  <td className="py-4 px-6 text-xs text-slate-500 font-mono">{job.schedule}</td>
                  <td className="py-4 px-6 text-xs text-slate-700">
                    <div>{job.last_sync}</div>
                    <div className="text-[10px] text-slate-400">{job.transferred_bytes_human} ({job.last_duration})</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {job.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleSyncNow(job.id)}
                      disabled={syncingId === job.id}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all shadow-xs disabled:opacity-50"
                    >
                      {syncingId === job.id ? 'Syncing...' : 'Sync Now'}
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
