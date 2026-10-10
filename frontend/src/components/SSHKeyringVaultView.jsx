import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Trash2, CheckCircle2, AlertTriangle, 
  RefreshCw, Copy, Check, Server, Shield, Lock, Send
} from 'lucide-react';
import { api } from '../api';

export default function SSHKeyringVaultView() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newPublicKey, setNewPublicKey] = useState('');
  const [adding, setAdding] = useState(false);
  const [injectModalKey, setInjectModalKey] = useState(null);
  const [targetVmid, setTargetVmid] = useState('101');
  const [injecting, setInjecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await api.getSSHKeys();
      if (res.status === 'success') {
        setKeys(res.keys || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    if (!newKeyName || !newPublicKey) return;
    setAdding(true);
    try {
      await api.createSSHKey({ name: newKeyName, public_key: newPublicKey });
      setShowAddModal(false);
      setNewKeyName('');
      setNewPublicKey('');
      setStatusMsg({ type: 'success', text: 'SSH Public Key saved to vault!' });
      fetchKeys();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to add SSH key' });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!confirm('Are you sure you want to remove this SSH key from the vault?')) return;
    try {
      await api.deleteSSHKey(keyId);
      setStatusMsg({ type: 'success', text: 'SSH key deleted successfully.' });
      fetchKeys();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to delete SSH key' });
    }
  };

  const handleInjectKey = async (e) => {
    e.preventDefault();
    if (!injectModalKey) return;
    setInjecting(true);
    try {
      const res = await api.injectSSHKey({ vmid: targetVmid, key_id: injectModalKey.id });
      setInjectModalKey(null);
      setStatusMsg({ type: 'success', text: res.message || 'Key injected into VM/LXC successfully!' });
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to inject SSH key' });
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner">
            <Key className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise SSH Keyring Vault</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Encrypted Vault
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Centralized authorized SSH credentials manager with 1-click zero-touch injection into KVM and LXC guests
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchKeys}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition font-medium text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Public Key</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm border ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div className="flex items-center space-x-3">
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Keys List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Stored SSH Public Keys ({keys.length})</span>
          </h3>
        </div>
        <div className="divide-y divide-slate-800/60">
          {keys.map((key) => (
            <div key={key.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-1">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-semibold text-base">{key.name}</h4>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-amber-400 font-mono border border-slate-700">
                      {key.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1 flex items-center space-x-2">
                    <span>Fingerprint: {key.fingerprint}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-1 max-w-xl truncate">
                    {key.public_key}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(key.public_key, key.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                >
                  {copiedId === key.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === key.id ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setInjectModalKey(key)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/30 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>1-Click Inject</span>
                </button>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Key */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <span>Add SSH Public Key</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddKey} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Key Label / Name</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., MacBook-Pro-Key or CI-CD-Deployer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Public Key String (id_ed25519.pub / id_rsa.pub)</label>
                <textarea
                  required
                  rows={4}
                  value={newPublicKey}
                  onChange={(e) => setNewPublicKey(e.target.value)}
                  placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition"
                >
                  {adding ? 'Saving...' : 'Save Public Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inject Key to VM/LXC */}
      {injectModalKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Send className="w-5 h-5 text-indigo-400" />
                <span>Inject Key into Guest</span>
              </h3>
              <button onClick={() => setInjectModalKey(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleInjectKey} className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                This will automatically inject <strong className="text-amber-400">{injectModalKey.name}</strong> into the guest's <code className="text-slate-200">~/.ssh/authorized_keys</code> via Proxmox Cloud-Init / QEMU Guest Agent.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Target VM / LXC ID</label>
                <input
                  type="number"
                  required
                  value={targetVmid}
                  onChange={(e) => setTargetVmid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInjectModalKey(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={injecting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition"
                >
                  {injecting ? 'Injecting Key...' : 'Inject Key Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
