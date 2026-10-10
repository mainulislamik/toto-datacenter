import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, Plus, Trash2, CheckCircle2, 
  AlertTriangle, RefreshCw, Lock, Globe, Database, Cpu
} from 'lucide-react';
import api from '../api';

export default function FirewallView() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // New Rule Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    action: 'ACCEPT',
    type: 'in',
    proto: 'tcp',
    dport: '8080',
    source: '',
    comment: 'Custom Service Port'
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.getFirewallRules();
      setRules(res.rules || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleAddRule = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.addFirewallRule(newRule);
      setMsg({ type: 'success', text: `Firewall rule for port ${newRule.dport || 'all'} added successfully!` });
      setShowAddModal(false);
      fetchRules();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRule = async (pos) => {
    if (!window.confirm(`Delete firewall rule #${pos}?`)) return;
    try {
      await api.deleteFirewallRule(pos);
      setMsg({ type: 'success', text: `Rule #${pos} deleted.` });
      fetchRules();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  const handleApplyProfile = async (profile) => {
    setActionLoading(true);
    try {
      const res = await api.applyFirewallProfile(profile);
      setMsg({ type: 'success', text: res.message });
      fetchRules();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-sky-50 border border-sky-200 text-sky-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">SDN & Cloud Firewall Hub</h1>
              <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Active Guard
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Software-Defined Networking, Inbound/Outbound Port Filtering & Threat Lockdown.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={fetchRules}
            disabled={loading}
            className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Security Rule</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-2 text-sm font-semibold">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* 1-Click Security Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 text-sky-600 mb-2">
              <Globe className="w-5 h-5" />
              <h3 className="font-bold text-slate-900">Standard Web Profile</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Allows HTTP (80), HTTPS (443), and Management SSH (22). Ideal for public websites & SaaS apps.
            </p>
          </div>
          <button
            disabled={actionLoading}
            onClick={() => handleApplyProfile('web_server')}
            className="w-full py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold rounded-lg transition-colors"
          >
            Apply Web Profile
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 text-emerald-600 mb-2">
              <Database className="w-5 h-5" />
              <h3 className="font-bold text-slate-900">Private Database Vault</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Isolates PostgreSQL (5432) and MySQL (3306) to internal 10.x.x.x VPC subnet. Drops public traffic.
            </p>
          </div>
          <button
            disabled={actionLoading}
            onClick={() => handleApplyProfile('database')}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-colors"
          >
            Apply DB Isolation
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 text-rose-600 mb-2">
              <Lock className="w-5 h-5" />
              <h3 className="font-bold text-slate-900">Hardened Zero-Trust</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Custom SSH (2222), HTTPS (443) only. Drops all other ports and unsolicited ICMP ping floods.
            </p>
          </div>
          <button
            disabled={actionLoading}
            onClick={() => handleApplyProfile('hardened')}
            className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors"
          >
            Apply Hardened Profile
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Inbound & Outbound Rules ({rules.length})</h2>
          <span className="text-xs font-semibold text-slate-500">Proxmox Cluster & VM Firewalls</span>
        </div>

        {rules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            No custom rules active. Traffic is managed by default node policies. Click "+ Add Security Rule" or choose a 1-Click Profile above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4"># Pos</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Port / Range</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Comment</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                {rules.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{r.pos ?? i}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        r.action === 'ACCEPT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.action || 'ACCEPT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-500">{r.type || 'in'}</td>
                    <td className="py-3 px-4 uppercase font-bold text-slate-900">{r.proto || 'ALL'}</td>
                    <td className="py-3 px-4 font-mono text-sky-700 font-bold">{r.dport || 'ALL'}</td>
                    <td className="py-3 px-4 font-mono">{r.source || '0.0.0.0/0 (Any)'}</td>
                    <td className="py-3 px-4 text-slate-500">{r.comment || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteRule(r.pos ?? i)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Firewall Rule</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action</label>
                <select
                  value={newRule.action}
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold"
                >
                  <option value="ACCEPT">ACCEPT (Allow Traffic)</option>
                  <option value="DROP">DROP (Silently Discard)</option>
                  <option value="REJECT">REJECT (Send Connection Refused)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direction</label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="in">IN (Inbound)</option>
                    <option value="out">OUT (Outbound)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Protocol</label>
                  <select
                    value={newRule.proto}
                    onChange={(e) => setNewRule({ ...newRule, proto: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="icmp">ICMP (Ping)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination Port (e.g. 80, 443, 22-80)</label>
                <input
                  type="text"
                  value={newRule.dport}
                  onChange={(e) => setNewRule({ ...newRule, dport: e.target.value })}
                  placeholder="8080"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Source IP Filter (Optional CIDR)</label>
                <input
                  type="text"
                  value={newRule.source}
                  onChange={(e) => setNewRule({ ...newRule, source: e.target.value })}
                  placeholder="e.g. 192.168.1.0/24 or leave empty for all"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Comment / Rule Description</label>
                <input
                  type="text"
                  value={newRule.comment}
                  onChange={(e) => setNewRule({ ...newRule, comment: e.target.value })}
                  placeholder="Allow Custom App Service"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold shadow-xs"
                >
                  {actionLoading ? 'Saving...' : 'Add Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}