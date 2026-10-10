import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Activity, Users, MapPin, Search, 
  Terminal, Shield, Globe, Clock, CheckCircle2, Crosshair
} from 'lucide-react';
import { api } from '../api';

const ZeroTrustBastionView = () => {
  const [data, setData] = useState({ active_sessions: [], gateway_status: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getZeroTrustSessions();
      setData(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Zero-Trust VPN & IAM Bastion
        </h2>
        <p className="text-slate-400 mt-1">Identity-aware access proxy and jump-host session recorder.</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" /> Active Bastion Sessions
          </h3>
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {data.gateway_status}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">User Identity</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3">Auth Method</th>
                <th className="px-4 py-3">Target Resource</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 rounded-tr-lg">Action Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.active_sessions?.map((s, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Users className="w-3 h-3 text-indigo-400" />
                      </div>
                      {s.user}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{s.ip}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">
                      {s.auth_method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-blue-400">{s.resource}</td>
                  <td className="px-4 py-3 font-mono text-xs flex items-center gap-1.5 text-amber-300">
                    <Clock className="w-3 h-3" /> {s.duration}
                  </td>
                  <td className="px-4 py-3 text-slate-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    {s.actions}
                  </td>
                </tr>
              ))}
              {data.active_sessions?.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500">No active IAM sessions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ZeroTrustBastionView;