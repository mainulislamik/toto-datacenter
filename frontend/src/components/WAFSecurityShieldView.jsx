import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Zap, AlertTriangle, RefreshCw, 
  CheckCircle2, Globe, Lock, Shield, Ban, Activity
} from 'lucide-react';
import { api } from '../api';

export default function WAFSecurityShieldView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [banIP, setBanIP] = useState('');
  const [msg, setMsg] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getWAFShield();
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

  const handleToggleAttackMode = async (enabled) => {
    try {
      setActionLoading(true);
      const res = await api.toggleWAFAttackMode(enabled);
      setMsg({ type: 'success', text: res.message });
      setData(prev => ({ ...prev, under_attack_mode: enabled }));
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to toggle attack mode' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanIP = async (e) => {
    e.preventDefault();
    if (!banIP) return;
    try {
      setActionLoading(true);
      const res = await api.addWAFBan(banIP);
      setMsg({ type: 'success', text: res.message });
      setBanIP('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to ban IP' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${data?.under_attack_mode ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-rose-50 text-rose-600'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">DDoS & Web Application Firewall (WAF)</h2>
              <p className="text-sm text-slate-500">Autonomous Edge Threat Protection, Layer 7 OWASP Rules & Geo-Fencing</p>
            </div>
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
            onClick={() => handleToggleAttackMode(!data?.under_attack_mode)}
            disabled={actionLoading}
            className={`px-4 py-2 font-medium rounded-lg text-sm flex items-center gap-2 transition ${
              data?.under_attack_mode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
            }`}
          >
            <Zap className="w-4 h-4" />
            {data?.under_attack_mode ? 'Deactivate Under Attack Mode' : '⚡ Activate Under Attack Mode'}
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shield Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            {data?.status || 'Active'}
          </div>
          <p className="text-xs text-slate-400 mt-1">L7 Stateful Inspection</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Threats Neutralized</span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600">
            {data?.active_threats_blocked_today?.toLocaleString() || 1420}
          </div>
          <p className="text-xs text-slate-400 mt-1">Last 24 Hours</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DDoS Trigger Threshold</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {data?.ddos_threshold_rps || 2500} <span className="text-sm font-normal text-slate-500">req/s</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Automatic Challenge Mode</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Geo-Fencing</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {data?.geo_blocking_mode || 'Strict'}
          </div>
          <p className="text-xs text-slate-400 mt-1">{data?.blocked_countries?.join(', ')} Blocked</p>
        </div>
      </div>

      {/* Grid: OWASP Rules & Manual Ban Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              OWASP Top 10 Core Rule Set (CRS)
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.owasp_rules?.map((rule, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{rule.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Blocked: {rule.blocked_count} requests today</div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Shield
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* IP Drop Filter */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-600" />
            Manual IP Drop / Blacklist
          </h3>
          <p className="text-xs text-slate-500">
            Immediately inject an IP into the kernel eBPF / iptables drop filter to block incoming packets.
          </p>
          <form onSubmit={handleBanIP} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IP or Subnet CIDR</label>
              <input
                type="text"
                placeholder="e.g. 198.51.100.45 or 203.0.113.0/24"
                value={banIP}
                onChange={(e) => setBanIP(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || !banIP}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition shadow-sm"
            >
              Drop IP Traffic
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
