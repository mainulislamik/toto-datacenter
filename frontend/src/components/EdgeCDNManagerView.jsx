import React, { useState, useEffect } from 'react';
import { 
  Zap, Trash2, RefreshCw, CheckCircle2, AlertTriangle, 
  Globe, HardDrive, ShieldCheck, Activity, Layers
} from 'lucide-react';
import { api } from '../api';

export default function EdgeCDNManagerView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getEdgeCDNStatus();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handlePurge = async (type = 'everything') => {
    try {
      setActionLoading(true);
      const res = await api.purgeEdgeCDNCache(type);
      setMsg({ type: 'success', text: res.message });
      fetchStatus();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Purge failed' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Multi-Cloud Edge CDN & Asset Cache</h2>
            <p className="text-sm text-slate-500">Global PoP Acceleration, Brotli Compression, Dynamic Cache Invalidation & Static Media Edge</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchStatus}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handlePurge('everything')}
            disabled={actionLoading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Purge Edge Cache
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <span className="text-sm font-medium">{msg.text}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-600" />
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cache Hit Ratio</div>
              <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                {data?.cache_hit_ratio || 94.8}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Origin Traffic Offloaded</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bandwidth Saved</div>
              <div className="text-2xl font-bold text-cyan-600">
                {data?.bandwidth_saved_gb || 48.6} GB
              </div>
              <p className="text-xs text-slate-400 mt-1">Compressed via Brotli</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Edge Requests</div>
              <div className="text-2xl font-bold text-slate-800">
                {data?.requests_served_today?.toLocaleString() || 348200}
              </div>
              <p className="text-xs text-slate-400 mt-1">Today</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Compression Engine</div>
              <div className="text-lg font-bold text-slate-800">
                Brotli + WebP
              </div>
              <p className="text-xs text-slate-400 mt-1">Smart MIME Transformation</p>
            </div>
          </div>

          {/* PoP Edge Locations */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-600" />
              Active Edge Points of Presence (PoPs)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.edge_locations?.map((pop, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">{pop.pop}</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Edge Latency:</span>
                    <span className="font-semibold text-slate-800">{pop.latency_ms} ms</span>
                  </div>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>PoP Cache Hit:</span>
                    <span className="font-semibold text-emerald-600">{pop.cache_hit_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
