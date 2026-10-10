import React, { useState, useEffect } from 'react';
import { 
  Globe, Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw, 
  ExternalLink, Server, ShieldCheck, Lock, Code, Copy, Check,
  Zap, ArrowRight, Radio, Search
} from 'lucide-react';
import { api } from '../api';

export default function DomainSystemHubView() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedVHost, setSelectedVHost] = useState(null);

  // Form State for attaching new domain
  const [newDomain, setNewDomain] = useState('');
  const [targetVmid, setTargetVmid] = useState(101);
  const [targetType, setTargetType] = useState('KVM VM');
  const [internalPort, setInternalPort] = useState(80);
  const [forceSSL, setForceSSL] = useState(true);
  const [enableHTTP3, setEnableHTTP3] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getVPSDomains();
      if (res && res.domains) {
        setDomains(res.domains);
      }
    } catch (err) {
      console.error("Failed to fetch VPS domains:", err);
      setError("Failed to load VPS domain mappings.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttachDomain = async (e) => {
    e.preventDefault();
    if (!newDomain) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.attachVPSDomain({
        domain: newDomain,
        target_vmid: targetVmid,
        target_type: targetType,
        internal_port: parseInt(internalPort),
        force_ssl: forceSSL,
        http3_quic: enableHTTP3
      });
      setSuccessMsg(res.message || `Domain ${newDomain} attached successfully!`);
      setNewDomain('');
      fetchDomains();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.message || "Failed to attach custom domain.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetach = async (domainId, domainName) => {
    if (!window.confirm(`Are you sure you want to detach domain "${domainName}"?`)) return;
    try {
      await api.detachVPSDomain(domainId);
      setSuccessMsg(`Domain ${domainName} detached and vHost removed.`);
      fetchDomains();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError("Failed to detach domain.");
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-500/20 backdrop-blur-md rounded-xl border border-blue-400/30">
              <Globe className="w-6 h-6 text-blue-300" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">VPS Custom Domain & Virtual Host Engine</h1>
          </div>
          <p className="text-blue-100 text-sm max-w-2xl">
            Attach production domains to any KVM Virtual Machine or LXC Container. Automatically generates reverse proxy vHosts, provisions Let's Encrypt TLS certificates, and monitors DNS propagation.
          </p>
        </div>
        <button
          onClick={fetchDomains}
          className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-sm transition-all border border-white/10 backdrop-blur-sm self-stretch md:self-auto justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Domains</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center space-x-2 font-medium">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Domains</span>
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{domains.length}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Routed via Edge Gateway</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">SSL Certificates</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{domains.length} Active</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Let's Encrypt / ZeroSSL</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">HTTP/3 QUIC Protocol</span>
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">Enabled</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Zero-RTT UDP Handshake</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Datacenter Anycast IP</span>
            <Radio className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-lg font-black text-slate-900 truncate">192.168.0.100</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Edge Ingress Proxy Node</div>
        </div>
      </div>

      {/* Main Content Split: List & Attach Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attached Domains Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Configured VPS Domain Mappings</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              {domains.length} Domains Attached
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Domain Name</th>
                  <th className="px-5 py-3">Target Workload</th>
                  <th className="px-5 py-3">Internal Routing</th>
                  <th className="px-5 py-3">SSL & Protocols</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {domains.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{d.domain}</span>
                        <a 
                          href={`http://${d.domain}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{d.dns_status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-bold">
                        <Server className="w-3.5 h-3.5 text-blue-600" />
                        <span>VM #{d.target_vmid}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">{d.target_name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block">
                        {d.internal_ip}:{d.internal_port}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{d.ssl_status}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        Expires: {d.ssl_expires}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleDetach(d.id, d.domain)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Detach Domain"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Attach New Domain Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">Attach Custom Domain</h2>
          </div>

          <form onSubmit={handleAttachDomain} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Domain Name
              </label>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. app.stockwhisk.com"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <p className="text-xs text-slate-500 mt-1">
                Point your domain's <code className="bg-slate-100 px-1 rounded">A</code> record to <span className="font-bold text-slate-800">192.168.0.100</span>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target VM / Workload
              </label>
              <select
                value={targetVmid}
                onChange={(e) => setTargetVmid(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium bg-white"
              >
                <option value={101}>VM #101 (ubuntu-production-01)</option>
                <option value={102}>VM #102 (debian-app-server)</option>
                <option value={103}>VM #103 (k3s-master-01)</option>
                <option value={201}>LXC #201 (whatsapp-crm-app)</option>
                <option value={202}>LXC #202 (postgres-db-cluster)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Internal App Port
              </label>
              <input
                type="number"
                value={internalPort}
                onChange={(e) => setInternalPort(e.target.value)}
                placeholder="3000"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <p className="text-xs text-slate-500 mt-1">
                Port inside the VM (e.g. 3000 for Node/React, 8000 for Django/FastAPI).
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceSSL}
                  onChange={(e) => setForceSSL(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Auto-Issue Free Let's Encrypt SSL & Force HTTPS</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableHTTP3}
                  onChange={(e) => setEnableHTTP3(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Enable HTTP/3 (QUIC) Acceleration</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newDomain}
              className="w-full mt-3 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Configuring vHost & SSL...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Map Domain & Issue SSL</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
