import React, { useState, useEffect } from 'react';
import { 
  Boxes, Server, Play, Plus, RefreshCw, CheckCircle2, 
  AlertTriangle, Terminal, Code, Cpu, Layers, ExternalLink, 
  ArrowRight, ShieldCheck, Box
} from 'lucide-react';
import { api } from '../api';

export default function KubernetesClusterView() {
  const [clusterData, setClusterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manifestYaml, setManifestYaml] = useState(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-edge-proxy
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx-edge
  template:
    metadata:
      labels:
        app: nginx-edge
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80`);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [activeTab, setActiveTab] = useState('pods');

  const fetchCluster = async () => {
    setLoading(true);
    try {
      const res = await api.getK8sCluster();
      if (res.status === 'success') {
        setClusterData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCluster();
  }, []);

  const handleApplyManifest = async (e) => {
    e.preventDefault();
    if (!manifestYaml.trim()) return;
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await api.applyK8sManifest(manifestYaml);
      setApplyResult({ type: 'success', message: res.output || 'Manifest applied successfully!' });
      fetchCluster();
    } catch (e) {
      setApplyResult({ type: 'error', message: e.message || 'Failed to apply manifest' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
            <Boxes className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">K3s & Kubernetes Micro-Cluster</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Active Orchestrator
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Lightweight enterprise Kubernetes runtime on bare-metal and KVM nodes with native YAML manifest compiler
            </p>
          </div>
        </div>
        <button
          onClick={fetchCluster}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition font-medium text-sm shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh Cluster</span>
        </button>
      </div>

      {/* Cluster Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Control Plane Nodes</p>
            <p className="text-2xl font-bold text-white mt-1">{clusterData?.total_nodes || 1}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Server className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Pods</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{clusterData?.total_pods || 4}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kubernetes Engine</p>
            <p className="text-sm font-semibold text-slate-200 mt-2">{clusterData?.version || 'v1.30.2+k3s1'}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Core Ingress</p>
            <p className="text-sm font-semibold text-indigo-400 mt-2">Traefik Ingress v3.1</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('pods')}
          className={`pb-3 text-sm font-medium transition relative flex items-center space-x-2 ${
            activeTab === 'pods' ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Active Pods & Workloads</span>
        </button>
        <button
          onClick={() => setActiveTab('nodes')}
          className={`pb-3 text-sm font-medium transition relative flex items-center space-x-2 ${
            activeTab === 'nodes' ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Cluster Node Hierarchy</span>
        </button>
        <button
          onClick={() => setActiveTab('apply')}
          className={`pb-3 text-sm font-medium transition relative flex items-center space-x-2 ${
            activeTab === 'apply' ? 'text-indigo-400 border-b-2 border-indigo-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Apply YAML Manifest</span>
        </button>
      </div>

      {/* Tab: Pods */}
      {activeTab === 'pods' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <span>Deployed Micro-Pods & Services</span>
            </h3>
            <span className="text-xs text-slate-400">All Namespaces</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {clusterData?.pods?.map((pod, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 transition">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium text-sm">{pod.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono border border-slate-700">
                        ns: {pod.namespace}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-3">
                      <span>IP: <code className="text-indigo-300 font-mono">{pod.ip}</code></span>
                      <span>Node: <code className="text-slate-300 font-mono">{pod.node}</code></span>
                      <span>Restarts: {pod.restarts}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {pod.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Nodes */}
      {activeTab === 'nodes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Kubernetes Worker & Master Nodes</span>
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusterData?.nodes?.map((node, idx) => (
              <div key={idx} className="bg-slate-950/50 border border-slate-800 p-5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Server className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-white font-semibold text-sm">{node.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{node.internal_ip}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {node.status}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Engine Version:</span>
                    <span className="text-slate-200 font-mono">{node.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OS Base:</span>
                    <span className="text-slate-200">{node.os_image}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Roles:</span>
                    <span className="text-indigo-400 font-mono">control-plane, master</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Apply YAML */}
      {activeTab === 'apply' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Declarative YAML Manifest Compiler</h3>
              <p className="text-xs text-slate-400 mt-0.5">Apply standard Kubernetes Deployments, Services, ConfigMaps, and Ingresses</p>
            </div>
          </div>

          <form onSubmit={handleApplyManifest} className="space-y-4">
            <textarea
              value={manifestYaml}
              onChange={(e) => setManifestYaml(e.target.value)}
              rows={14}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-indigo-500"
              placeholder="Paste Kubernetes YAML manifest here..."
            />

            {applyResult && (
              <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm border ${
                applyResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}>
                {applyResult.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                <pre className="font-mono text-xs overflow-x-auto">{applyResult.message}</pre>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={applying}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition shadow-md disabled:opacity-50"
              >
                {applying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{applying ? 'Applying Manifest...' : 'Apply Manifest (kubectl apply)'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
