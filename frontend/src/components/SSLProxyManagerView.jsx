import React, { useState, useEffect } from 'react';
import { 
  Globe, ShieldCheck, Plus, Trash2, CheckCircle2, 
  AlertTriangle, RefreshCw, Lock, ExternalLink, ArrowRight, Zap
} from 'lucide-react';
import { api } from '../api';

export default function SSLProxyManagerView() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // New Route Form
  const [domain, setDomain] = useState('');
  const [target, setTarget] = useState('');
  const [ssl, setSsl] = useState(true);
  const [websocket, setWebsocket] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const res = await api.getProxyRoutes();
      setRoutes(res.routes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!domain || !target) return;
    setCreating(true);
    setMsg(null);
    try {
      const res = await api.createProxyRoute({ domain, target, ssl, websocket });
      setMsg({ type: 'success', text: `Proxy route for '${domain}' created successfully!` });
      setDomain('');
      setTarget('');
      await loadRoutes();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to create route.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (routeId) => {
    if (!confirm('Are you sure you want to delete this reverse proxy route?')) return;
    try {
      await api.deleteProxyRoute(routeId);
      setMsg({ type: 'success', text: 'Proxy route removed successfully.' });
      await loadRoutes();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to delete route.' });
    }
  };

  const handleIssueSSL = async (dom) => {
    try {
      const res = await api.issueSSLCertificate(dom);
      setMsg({ type: 'success', text: res.message || `SSL issued for ${dom}` });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'SSL provisioning failed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Globe className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Reverse Proxy & SSL Gateway</h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              Edge ACME Router
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Map custom public domains directly to private VM/LXC IP ports with 1-click Let's Encrypt SSL/TLS & WebSocket upgrade.
          </p>
        </div>

        <button
          onClick={loadRoutes}
          disabled={loading}
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

      {/* Add New Route Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center space-x-2">
          <Plus className="w-4 h-4 text-purple-600" />
          <span>Add Custom Domain Reverse Proxy Route</span>
        </h3>

        <form onSubmit={handleCreateRoute} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Domain Name (FQDN)</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. app.stockwhisk.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Forward (IP:Port)</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 10.0.2.15:8080 or 127.0.0.1:3000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:border-purple-500"
              required
            />
          </div>

          <div className="flex items-center space-x-4 py-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ssl}
                onChange={(e) => setSsl(e.target.checked)}
                className="w-4 h-4 rounded-sm text-purple-600 focus:ring-0"
              />
              <span className="text-xs font-bold text-slate-700">Auto SSL/TLS</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={websocket}
                onChange={(e) => setWebsocket(e.target.checked)}
                className="w-4 h-4 rounded-sm text-purple-600 focus:ring-0"
              />
              <span className="text-xs font-bold text-slate-700">WebSocket</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-2"
          >
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{creating ? 'Binding Route...' : 'Create Route'}</span>
          </button>
        </form>
      </div>

      {/* Routes List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Active Domain Bindings</h3>
          <span className="text-xs font-bold text-slate-600">{routes.length} Active</span>
        </div>

        {routes.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No proxy routes configured</p>
            <p className="text-xs text-slate-500 mt-1">Bind your custom domain above to route traffic to any VM or LXC container.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Public Domain</th>
                  <th className="px-6 py-3">Forward Upstream</th>
                  <th className="px-6 py-3">SSL / Security</th>
                  <th className="px-6 py-3">WebSocket</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {routes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5 text-purple-600" />
                        <span>{r.domain}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{r.id}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        {r.target}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.ssl ? (
                        <button
                          onClick={() => handleIssueSSL(r.domain)}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                          title="Click to re-issue certificate"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>Let's Encrypt Active</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">HTTP Only</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {r.websocket ? '✓ Enabled' : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                        title="Delete Route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
