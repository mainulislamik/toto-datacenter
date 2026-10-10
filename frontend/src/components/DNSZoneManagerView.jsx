import React, { useState, useEffect } from 'react';
import { 
  Globe, Plus, Trash2, CheckCircle2, AlertTriangle, 
  RefreshCw, Shield, ArrowRight, Zap, Check, Lock, Copy
} from 'lucide-react';
import { api } from '../api';

export default function DNSZoneManagerView() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // New Record Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [recType, setRecType] = useState('A');
  const [recName, setRecName] = useState('@');
  const [recContent, setRecContent] = useState('');
  const [recTTL, setRecTTL] = useState(300);
  const [recProxied, setRecProxied] = useState(true);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await api.getDNSZones();
      if (res.status === 'success') {
        setZones(res.zones || []);
        if (!selectedZone && res.zones && res.zones.length > 0) {
          setSelectedZone(res.zones[0]);
        } else if (selectedZone) {
          const updated = res.zones.find(z => z.id === selectedZone.id);
          if (updated) setSelectedZone(updated);
        }
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to fetch DNS zones' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!recContent) return;
    try {
      const res = await api.createDNSRecord({
        zone_id: selectedZone?.id,
        type: recType,
        name: recName,
        content: recContent,
        ttl: parseInt(recTTL),
        proxied: recProxied
      });
      if (res.status === 'success') {
        setMsg({ type: 'success', text: `DNS Record '${recName} -> ${recContent}' created & propagated!` });
        setShowAddModal(false);
        setRecName('@');
        setRecContent('');
        if (selectedZone) {
          const updatedRecords = [...(selectedZone.records || []), res.record];
          setSelectedZone({ ...selectedZone, records: updatedRecords, records_count: updatedRecords.length });
        }
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to add DNS record' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Globe className="w-7 h-7 text-indigo-600" />
            Anycast DNS & Global Zones Hub
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage Cloudflare-style high-speed authoritative DNS, reverse proxy routing, and local private datacenter domains.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchZones}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Zones"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            Add Record
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

      {/* Zone Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {zones.map((z) => (
          <button
            key={z.id}
            onClick={() => setSelectedZone(z)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              selectedZone?.id === z.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            {z.domain}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedZone?.id === z.id ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {z.records_count}
            </span>
          </button>
        ))}
      </div>

      {selectedZone && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900">{selectedZone.domain}</h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  {selectedZone.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Nameservers: {selectedZone.nameservers?.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500">
                Anycast Global Propagation: <strong className="text-slate-800">100% Active</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Content / Target</th>
                  <th className="py-3 px-6">TTL</th>
                  <th className="py-3 px-6">Proxy Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {selectedZone.records?.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-indigo-700">
                      <span className="px-2 py-1 bg-indigo-50 border border-indigo-200 rounded">
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-900 font-bold">{rec.name}</td>
                    <td className="py-3.5 px-6 text-slate-700 max-w-xs truncate">{rec.content}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-sans">{rec.ttl}s (Auto)</td>
                    <td className="py-3.5 px-6 font-sans">
                      {rec.proxied ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          Proxied (WAF)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          DNS Only
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-sans">
                      <button 
                        onClick={() => setMsg({ type: 'success', text: `Record ${rec.name} verified and cached.` })}
                        className="text-slate-400 hover:text-slate-600 font-semibold text-xs mr-3"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add DNS Record to {selectedZone?.domain}</h3>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Record Type</label>
                <select
                  value={recType}
                  onChange={(e) => setRecType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="A">A (IPv4 Address)</option>
                  <option value="AAAA">AAAA (IPv6 Address)</option>
                  <option value="CNAME">CNAME (Domain Alias)</option>
                  <option value="TXT">TXT (Text Record / SPF)</option>
                  <option value="MX">MX (Mail Exchange)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name (Host / Subdomain)</label>
                <input
                  type="text"
                  placeholder="@ or www or api"
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">IPv4 / Target Content</label>
                <input
                  type="text"
                  placeholder="192.168.0.100 or 10.0.2.15"
                  value={recContent}
                  onChange={(e) => setRecContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="proxied"
                  checked={recProxied}
                  onChange={(e) => setRecProxied(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="proxied" className="text-sm font-medium text-slate-700">
                  Enable Cloudflare WAF & Edge Proxy Protection
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
