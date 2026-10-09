import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cpu, 
  Layers, 
  HardDrive, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { api } from '../api';

export default function OverviewView({ onNavigate, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDatacenterOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load datacenter overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '—';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {data?.datacenter_name || 'Toto Company Datacenter'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
              CLUSTER HEALTHY
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proxmox VE 8.4 Hypervisor Cluster • Bare-Metal KVM Engine • Storage: Second SSD (/dev/sda1)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
          
          <button
            onClick={() => onNavigate('vms')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy VM</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-lg text-rose-900 text-sm flex items-center justify-between">
          <span>Error loading datacenter metrics: {error}</span>
          <button onClick={fetchOverview} className="underline font-bold text-xs">Retry</button>
        </div>
      )}

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Nodes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Nodes</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">{data?.nodes_count || 1}</span>
            <span className="text-xs font-medium text-emerald-600 font-semibold">100% Online</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Node ID: pve (KVM Nested)</p>
        </div>

        {/* Metric 2: VMs Fleet */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Virtual Machines</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">{data?.vms_total || 0}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {data?.vms_running || 0} Running
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">KVM Hardware Virtualized</p>
        </div>

        {/* Metric 3: RAM Usage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memory Allocation</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {data ? `${data.memory.usage_pct}%` : '—'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {data ? `${formatBytes(data.memory.used_bytes)} / ${formatBytes(data.memory.total_bytes)}` : '—'}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(data?.memory.usage_pct || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 4: Storage Usage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SSD Storage Pool</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {data ? `${data.storage.usage_pct}%` : '—'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {data ? `${formatBytes(data.storage.used_bytes)} / ${formatBytes(data.storage.total_bytes)}` : '—'}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(data?.storage.usage_pct || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Live Cluster Nodes Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Hypervisor Node Status
            </h2>
            <p className="text-xs text-slate-500">Active Proxmox VE Hardware Compute Nodes</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
            Total vCPU Capacity: {data?.total_cores || 4} Cores
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {(data?.nodes || []).map((node) => (
            <div key={node.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Server className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-extrabold text-slate-900">{node.node}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ONLINE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Uptime: <span className="font-semibold text-slate-700">{formatUptime(node.uptime)}</span> • Proxmox VE 8.4-1 (Bookworm)
                  </p>
                  <p className="text-xs text-slate-500">
                    Host: <span className="font-mono text-slate-700">127.0.0.1:8006</span> • Hardware: Intel 10th Gen Core (Nested KVM)
                  </p>
                </div>
              </div>

              {/* Node Usage Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:w-1/2">
                {/* CPU */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>CPU LOAD</span>
                    <span>{(node.cpu * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${Math.min(node.cpu * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">{node.maxcpu} Cores Allocated</span>
                </div>

                {/* RAM */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>RAM</span>
                    <span>{((node.mem / node.maxmem) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min((node.mem / node.maxmem) * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">{formatBytes(node.mem)} / {formatBytes(node.maxmem)}</span>
                </div>

                {/* Storage */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>ROOT DISK</span>
                    <span>{((node.disk / node.maxdisk) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${Math.min((node.disk / node.maxdisk) * 100, 100)}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">{formatBytes(node.disk)} / {formatBytes(node.maxdisk)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fast Architectural Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate('vms')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold mb-3 border border-sky-200">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Virtual Machine Lifecycle</h3>
          <p className="text-xs text-slate-500 mt-1">
            Deploy VMs, connect to live Web VNC Console, configure ISO boot disks, and control power state.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('users')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-3 border border-indigo-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Multi-Tenant RBAC & Quotas</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create tenant accounts, assign maximum vCPU/RAM/Disk budgets, and isolate client workloads.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('gitops')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-sky-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3 border border-emerald-200">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">1-Click Bare-Metal ISO Builder</h3>
          <p className="text-xs text-slate-500 mt-1">
            Synchronized with Git repository to burn bootable ISO onto pendrive for automatic setup on any PC.
          </p>
        </div>
      </div>
    </div>
  );
}
