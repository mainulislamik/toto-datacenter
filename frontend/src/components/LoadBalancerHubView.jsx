import React, { useState, useEffect } from 'react';
import { 
  GitFork, Plus, CheckCircle2, AlertTriangle, RefreshCw, 
  Server, Shield, Activity, ArrowRight, Zap, Play
} from 'lucide-react';
import { api } from '../api';

export default function LoadBalancerHubView() {
  const [lbs, setLbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: 'prod-ingress-lb',
    type: 'Layer 7 (HTTP/HTTPS)',
    algorithm: 'Round Robin',
    frontend_port: 443
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchLbs = async () => {
    try {
      setLoading(true);
      const res = await api.getLoadBalancers();
      setLbs(res.load_balancers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLbs();
  }, []);

  const handleCreateLB = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.createLoadBalancer(formData);
      setMsg({ type: 'success', text: res.message });
      setLbs(prev => [res.load_balancer, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to create load balancer' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Layer 4 / Layer 7 Load Balancers</h2>
            <p className="text-sm text-slate-500">Traffic Distribution, SSL Offloading, Health Probing & High-Throughput Ingress</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchLbs}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Load Balancer
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

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {lbs.map((lb) => (
            <div key={lb.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{lb.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">Port {lb.frontend_port}</span>
                      <span>•</span>
                      <span>{lb.type}</span>
                      <span>•</span>
                      <span className="text-indigo-600 font-medium">{lb.algorithm}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                    {lb.status}
                  </span>
                </div>
              </div>

              {/* Backend Member Pool */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Backend Pool Members</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lb.backends?.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                      <div className="flex items-center gap-2.5">
                        <Server className="w-4 h-4 text-slate-500" />
                        <div>
                          <span className="font-semibold text-slate-800">{b.name}</span>
                          <span className="text-xs font-mono text-slate-500 ml-2">({b.ip})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Weight: {b.weight}%</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Create New Load Balancer</h3>
            <form onSubmit={handleCreateLB} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Load Balancer Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Layer 7 (HTTP/HTTPS)">Layer 7 (HTTP/HTTPS with SSL Offloading)</option>
                  <option value="Layer 4 (TCP Passthrough)">Layer 4 (TCP High-Speed Passthrough)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Balancing Algorithm</label>
                <select
                  value={formData.algorithm}
                  onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Round Robin">Round Robin</option>
                  <option value="Least Connections">Least Connections</option>
                  <option value="IP Hash">IP Hash (Session Affinity)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Frontend Listening Port</label>
                <input
                  type="number"
                  required
                  value={formData.frontend_port}
                  onChange={(e) => setFormData({ ...formData, frontend_port: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition"
                >
                  {actionLoading ? 'Creating...' : 'Deploy Load Balancer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
