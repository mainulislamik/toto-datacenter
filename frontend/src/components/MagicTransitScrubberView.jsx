import React, { useState, useEffect } from 'react';
import { ShieldAlert, Shield, Globe, Activity, CheckCircle2, AlertTriangle, RefreshCw, ActivityIcon } from 'lucide-react';
import { api } from '../api';

const MagicTransitScrubberView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getMagicTransit();
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
            Magic Transit & BGP Scrubbing
          </h2>
          <p className="text-slate-400 mt-1">DDoS protection shielding via GRE Tunnels and BGP flowspec.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Traffic Scrubbing Metrics</h3>
            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className="text-orange-500 font-bold flex items-center gap-2"><Activity className="w-4 h-4" /> {data.status}</span>
              </div>
              <div className="bg-slate-800 p-4 rounded flex justify-between items-center">
                <span className="text-slate-400">Clean Traffic In</span>
                <span className="text-emerald-400 font-bold">{data.metrics.clean_traffic_in}</span>
              </div>
              <div className="bg-orange-900/20 border border-orange-500/20 p-4 rounded flex justify-between items-center">
                <span className="text-orange-400">Attack Traffic Dropped</span>
                <span className="text-orange-500 font-bold">{data.metrics.attack_traffic_dropped}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cloudflare GRE Tunnels</h3>
            <div className="space-y-4">
              {data.gre_tunnels.map((tunnel, i) => (
                <div key={i} className="bg-slate-800 p-4 rounded flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-white">{tunnel.endpoint}</span>
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> {tunnel.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-mono">{tunnel.tunnel_ip}</span>
                    <span className="text-emerald-400">{tunnel.latency} latency</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MagicTransitScrubberView;
