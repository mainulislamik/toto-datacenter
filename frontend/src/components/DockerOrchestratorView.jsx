import React, { useState, useEffect } from 'react';
import { 
  Layers, Play, Square, RotateCcw, Trash2, Plus, 
  Terminal, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, 
  Cpu, FileText, ArrowUpRight, Search, Download
} from 'lucide-react';
import { api } from '../api';

export default function DockerOrchestratorView() {
  const [containers, setContainers] = useState([]);
  const [images, setImages] = useState([]);
  const [activeTab, setActiveTab] = useState('containers'); // containers, compose, images
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState(null);
  
  // Logs Modal
  const [logsModal, setLogsModal] = useState({ isOpen: false, name: '', logs: '', loading: false });

  // Compose Deploy
  const [stackName, setStackName] = useState('');
  const [composeYaml, setComposeYaml] = useState(`version: '3.8'
services:
  web-app:
    image: nginx:alpine
    ports:
      - "8080:80"
    restart: always
`);
  const [deployingCompose, setDeployingCompose] = useState(false);

  // Pull Image
  const [pullImageName, setPullImageName] = useState('');
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, iRes] = await Promise.all([
        api.getDockerContainers().catch(() => ({ containers: [] })),
        api.getDockerImages().catch(() => ({ images: [] }))
      ]);
      setContainers(cRes.containers || []);
      setImages(iRes.images || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (cid, action) => {
    setActionLoading(`${cid}-${action}`);
    try {
      const res = await api.dockerContainerAction(cid, action);
      setMsg({ type: 'success', text: `Container action '${action}' completed successfully.` });
      await loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenLogs = async (cid, name) => {
    setLogsModal({ isOpen: true, name, logs: 'Loading container logs...', loading: true });
    try {
      const res = await api.getDockerLogs(cid, 200);
      setLogsModal({ isOpen: true, name, logs: res.logs || 'No logs output available.', loading: false });
    } catch (err) {
      setLogsModal({ isOpen: true, name, logs: `Failed to load logs: ${err.message}`, loading: false });
    }
  };

  const handleDeployCompose = async (e) => {
    e.preventDefault();
    if (!stackName || !composeYaml) return;
    setDeployingCompose(true);
    setMsg(null);
    try {
      const res = await api.deployDockerCompose({ name: stackName, compose_yaml: composeYaml });
      setMsg({ type: 'success', text: `Stack '${stackName}' deployed successfully!\n${res.output || ''}` });
      setStackName('');
      await loadData();
      setActiveTab('containers');
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Deploy failed.' });
    } finally {
      setDeployingCompose(false);
    }
  };

  const handlePullImage = async (e) => {
    e.preventDefault();
    if (!pullImageName) return;
    setPulling(true);
    try {
      const res = await api.pullDockerImage(pullImageName);
      setMsg({ type: 'success', text: `Pulled image ${pullImageName} successfully.` });
      setPullImageName('');
      await loadData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to pull image.' });
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Docker Engine & Compose Stacks</h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              Native Moby Hub
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Zero-latency container orchestration, compose stack compiler, and microservice lifecycle management.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('containers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'containers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Containers ({containers.length})
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'compose' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Compose Stacks
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'images' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Images ({images.length})
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>
          <div className="flex items-center space-x-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span className="whitespace-pre-wrap">{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="font-black hover:opacity-75">✕</button>
        </div>
      )}

      {/* Containers List Tab */}
      {activeTab === 'containers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Active Container Instances</h3>
            <span className="text-xs font-bold text-slate-600">{containers.length} Total</span>
          </div>
          {containers.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No Docker containers running</p>
              <p className="text-xs text-slate-500 mt-1">Deploy a compose stack or run a container from the marketplace.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Name / Container ID</th>
                    <th className="px-6 py-3">Image</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Port Bindings</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {containers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{c.id.substring(0, 12)}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700">{c.image}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${c.state === 'running' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          ● {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{c.ports || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenLogs(c.id, c.name)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] transition"
                            title="View Logs"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                          </button>
                          {c.state === 'running' ? (
                            <button
                              onClick={() => handleAction(c.id, 'stop')}
                              disabled={actionLoading === `${c.id}-stop`}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-[11px] transition"
                            >
                              Stop
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(c.id, 'start')}
                              disabled={actionLoading === `${c.id}-start`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-[11px] transition"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(c.id, 'restart')}
                            disabled={actionLoading === `${c.id}-restart`}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] transition"
                          >
                            Restart
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Deploy Docker Compose Stack</h3>
            <p className="text-xs text-slate-600 mt-0.5">Automated persistent stack stored on 100GB Extra-Vault (/mnt/extra-vault/docker-stacks/).</p>
          </div>

          <form onSubmit={handleDeployCompose} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Stack Project Name</label>
              <input
                type="text"
                value={stackName}
                onChange={(e) => setStackName(e.target.value)}
                placeholder="e.g. nextjs-postgres-cluster"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">docker-compose.yml Definition</label>
              <textarea
                value={composeYaml}
                onChange={(e) => setComposeYaml(e.target.value)}
                rows={10}
                className="w-full font-mono text-xs p-4 rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 focus:outline-hidden"
                required
              />
            </div>
            <button
              type="submit"
              disabled={deployingCompose}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-2"
            >
              {deployingCompose ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{deployingCompose ? 'Compiling & Deploying...' : 'Deploy Stack Now'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <form onSubmit={handlePullImage} className="flex gap-2">
              <input
                type="text"
                value={pullImageName}
                onChange={(e) => setPullImageName(e.target.value)}
                placeholder="Pull image (e.g. redis:alpine, node:20, postgres:16)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:border-sky-500"
                required
              />
              <button
                type="submit"
                disabled={pulling}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition flex items-center space-x-2"
              >
                {pulling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{pulling ? 'Pulling...' : 'Pull Image'}</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 font-black text-sm text-slate-900">
              Cached Image Registry ({images.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Repository</th>
                    <th className="px-6 py-3">Tag</th>
                    <th className="px-6 py-3">Image ID</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {images.map((img) => (
                    <tr key={img.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{img.repository}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-600">{img.tag}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">{img.id.substring(0, 12)}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-700">{img.size}</td>
                      <td className="px-6 py-3.5 text-slate-500">{img.created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white">Live Logs: {logsModal.name}</span>
              </div>
              <button
                onClick={() => setLogsModal({ isOpen: false, name: '', logs: '', loading: false })}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-emerald-400 bg-black/80 whitespace-pre-wrap">
              {logsModal.logs}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
