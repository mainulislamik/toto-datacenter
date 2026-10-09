import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Layers, 
  Rocket, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  HardDrive, 
  Activity, 
  Lock, 
  Server, 
  RefreshCw,
  Sparkles,
  Zap,
  Globe,
  Database,
  Code
} from 'lucide-react';
import { api } from '../api';

export default function MarketplaceView({ onDeployed }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deployModal, setDeployModal] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(null);

  const [form, setForm] = useState({
    hostname: '',
    cores: 2,
    memory: 2048,
    disk_gb: 15,
    password: 'TotoAdmin2026!'
  });

  const fetchApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMarketplaceApps();
      setApps(data);
    } catch (err) {
      setError(err.message || 'Failed to load marketplace templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleOpenDeploy = (app) => {
    setDeployModal(app);
    setForm({
      hostname: `${app.id}-instance`,
      cores: app.default_cores,
      memory: app.default_ram_mb,
      disk_gb: app.default_disk_gb,
      password: 'TotoAdmin2026!'
    });
    setDeploySuccess(null);
  };

  const handleDeploySubmit = async (e) => {
    e.preventDefault();
    setDeploying(true);
    setError(null);
    try {
      const res = await api.deployMarketplaceApp({
        app_id: deployModal.id,
        hostname: form.hostname,
        cores: Number(form.cores),
        memory: Number(form.memory),
        disk_gb: Number(form.disk_gb),
        password: form.password
      });
      setDeploySuccess(res);
      setTimeout(() => {
        setDeployModal(null);
        if (onDeployed) onDeployed();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const getAppIcon = (iconName) => {
    switch (iconName) {
      case 'container': return <Layers className="w-6 h-6 text-sky-600" />;
      case 'globe': return <Globe className="w-6 h-6 text-emerald-600" />;
      case 'database': return <Database className="w-6 h-6 text-indigo-600" />;
      case 'zap': return <Zap className="w-6 h-6 text-amber-600" />;
      case 'code': return <Code className="w-6 h-6 text-purple-600" />;
      default: return <Server className="w-6 h-6 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">1-Click App Marketplace</h1>
              <p className="text-xs text-slate-500 mt-0.5">Deploy production stacks in 5 seconds on high-speed LXC micro-containers</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchApps}
          className="inline-flex items-center space-x-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stacks</span>
        </button>
      </div>

      {error && !deployModal && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of App Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <div 
            key={app.id} 
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                  {getAppIcon(app.icon)}
                </div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
                  {app.badge}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900">{app.name}</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{app.category}</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">{app.description}</p>

              {/* Resource specifications */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">vCPU</span>
                  <span className="text-xs font-black text-slate-800">{app.default_cores} Core</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">RAM</span>
                  <span className="text-xs font-black text-slate-800">{app.default_ram_mb} MB</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">SSD</span>
                  <span className="text-xs font-black text-slate-800">{app.default_disk_gb} GB</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenDeploy(app)}
              className="mt-6 w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>1-Click Deploy</span>
            </button>
          </div>
        ))}
      </div>

      {/* Deploy Modal */}
      {deployModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Deploy {deployModal.name}</h3>
                  <p className="text-xs text-slate-500">Fast Container Provisioning</p>
                </div>
              </div>
              <button 
                onClick={() => setDeployModal(null)} 
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {deploySuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">Successfully Deployed!</h4>
                <p className="text-xs text-slate-500">Instance ID #{deploySuccess.vmid} is booting up in the background.</p>
              </div>
            ) : (
              <form onSubmit={handleDeploySubmit} className="mt-4 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hostname / Container Name</label>
                  <input
                    type="text"
                    required
                    value={form.hostname}
                    onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cores</label>
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={form.cores}
                      onChange={(e) => setForm({ ...form, cores: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">RAM (MB)</label>
                    <input
                      type="number"
                      min="256"
                      max="32768"
                      value={form.memory}
                      onChange={(e) => setForm({ ...form, memory: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SSD (GB)</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={form.disk_gb}
                      onChange={(e) => setForm({ ...form, disk_gb: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Root Password</label>
                  <input
                    type="text"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setDeployModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deploying}
                    className="inline-flex items-center space-x-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                  >
                    <Rocket className={`w-3.5 h-3.5 ${deploying ? 'animate-spin' : ''}`} />
                    <span>{deploying ? 'Provisioning Micro-Container...' : 'Launch Stack'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
