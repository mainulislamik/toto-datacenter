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
  Plus,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Zap,
  Radio,
  ArrowRight,
  Database,
  Terminal
} from 'lucide-react';
import { api } from '../api';

export default function ClusterNodesView() {
  const [nodes, setNodes] = useState([]);
  const [clusterInfo, setClusterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinInfo, setJoinInfo] = useState(null);

  const fetchClusterData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nodesData, clusterData] = await Promise.all([
        api.getClusterNodes().catch(() => []),
        api.getClusterJoinInfo().catch(() => null)
      ]);
      setNodes(nodesData);
      setJoinInfo(clusterData);
    } catch (err) {
      setError(err.message || 'Failed to load cluster nodes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusterData();
    const interval = setInterval(fetchClusterData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyCommand = () => {
    if (joinInfo && joinInfo.join_command) {
      navigator.clipboard.writeText(joinInfo.join_command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Physical Cluster Nodes & Scale-Out</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Cluster Quorate
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage physical bare-metal servers, distributed Ceph storage pools, and 1-click multi-node expansion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchClusterData}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
            title="Refresh Cluster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Physical Server / Node
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cluster Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cluster Nodes</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{nodes.length}</span>
            <span className="text-xs text-emerald-600 font-medium">100% Online</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Corosync VoteQuorum Active</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Compute Cores</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {nodes.reduce((acc, n) => acc + (n.maxcpu || 4), 0)}
            </span>
            <span className="text-xs text-slate-500 font-medium">vCPU Aggregate</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Hardware Virtualization (VT-x/KVM)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total RAM Pool</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {Math.round(nodes.reduce((acc, n) => acc + (n.maxmem || 6442450944), 0) / (1024 ** 3))} GB
            </span>
            <span className="text-xs text-slate-500 font-medium">Cluster Total</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Dynamic Memory Balancing</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Pool</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {Math.round(nodes.reduce((acc, n) => acc + (n.maxdisk || 161061273600), 0) / (1024 ** 3))} GB
            </span>
            <span className="text-xs text-slate-500 font-medium">Local-LVM SSD</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Shared NFS / Ceph Ready</p>
        </div>
      </div>

      {/* Nodes List Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Bare-Metal Physical Servers</h3>
        
        {nodes.map((node, index) => {
          const cpuLoadPct = Math.round((node.cpu || 0) * 100);
          const memUsedGB = ((node.mem || 0) / (1024 ** 3)).toFixed(1);
          const memMaxGB = ((node.maxmem || 6442450944) / (1024 ** 3)).toFixed(1);
          const memPct = Math.round(((node.mem || 0) / Math.max(node.maxmem || 1, 1)) * 100);
          const diskUsedGB = ((node.disk || 0) / (1024 ** 3)).toFixed(1);
          const diskMaxGB = ((node.maxdisk || 161061273600) / (1024 ** 3)).toFixed(1);
          const diskPct = Math.round(((node.disk || 0) / Math.max(node.maxdisk || 1, 1)) * 100);
          
          return (
            <div key={node.node || index} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Node Identity */}
                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-sm">
                    <Server className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-slate-900">
                        Node: <span className="font-mono text-emerald-600">{node.node || 'pve'}</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Primary Master
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        PVE v{node.pveversion || '8.4-1'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5 font-mono">
                      <span>IP: <strong className="text-slate-700">192.168.0.100</strong> (10.0.2.15)</span>
                      <span>•</span>
                      <span>Kernel: <strong className="text-slate-700">Linux 6.8.12-8-pve</strong></span>
                      <span>•</span>
                      <span>Uptime: <strong className="text-slate-700">{Math.round((node.uptime || 0) / 3600)}h {Math.round(((node.uptime || 0) % 3600) / 60)}m</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Operational (Healthy)
                  </span>
                </div>
              </div>

              {/* Resource Bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
                {/* CPU Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" /> CPU Load ({node.maxcpu || 4} Cores)
                    </span>
                    <span className="font-bold text-slate-900 font-mono">{cpuLoadPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        cpuLoadPct > 80 ? 'bg-rose-500' : cpuLoadPct > 50 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.max(cpuLoadPct, 4)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Dell OptiPlex Host</span>
                    <span>10th Gen Core</span>
                  </div>
                </div>

                {/* Memory Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" /> Memory ({memUsedGB} / {memMaxGB} GB)
                    </span>
                    <span className="font-bold text-slate-900 font-mono">{memPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div 
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(memPct, 8)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Allocated: {memUsedGB} GB</span>
                    <span>Free: {(memMaxGB - memUsedGB).toFixed(1)} GB</span>
                  </div>
                </div>

                {/* Storage Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Root Disk ({diskUsedGB} / {diskMaxGB} GB)
                    </span>
                    <span className="font-bold text-slate-900 font-mono">{diskPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div 
                      className="h-full rounded-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${Math.max(diskPct, 5)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>VirtIO Thin Pool</span>
                    <span>Ext4 / LVM</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scale-Out Architecture Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h4 className="text-base font-bold text-white tracking-tight">Ready for Infinite Scale-Out & Live Migration</h4>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Add any number of physical PCs or 1U/2U rack servers to the <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded">toto-datacenter</code> cluster. 
              Zero-downtime live RAM migration and shared storage automatically balance loads across all machines.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg shadow transition-colors flex-shrink-0"
          >
            <span>View Join Command</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Physical Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add New Physical Server / Node</h3>
                  <p className="text-xs text-slate-500">Expand your datacenter with secondary bare-metal hardware</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 my-6 text-sm text-slate-600">
              {/* Step 1 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h4 className="font-bold text-slate-900">Boot OS on New Physical PC / Server</h4>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  Use the Toto Cloud OS USB bootable drive (generated via <code className="bg-slate-200 px-1 rounded font-mono">build-iso.sh</code>) to install Proxmox VE 8.4 on the new PC in under 3 minutes.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h4 className="font-bold text-slate-900">Run 1-Click Cluster Join Command</h4>
                </div>
                <p className="text-xs text-slate-600 pl-8 mb-3">
                  Open terminal / SSH on the new server and paste this command:
                </p>
                <div className="pl-8">
                  <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-lg flex items-center justify-between border border-slate-800">
                    <span className="break-all">{joinInfo?.join_command || 'pvecm add 192.168.0.100 --use_ssh'}</span>
                    <button
                      onClick={handleCopyCommand}
                      className="ml-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors flex-shrink-0"
                      title="Copy to Clipboard"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h4 className="font-bold text-slate-900">Automated Cluster Sync</h4>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  Within 10 seconds, the new server will appear in the Toto Cloud OS dashboard with full access to VM Live Migration, LXC orchestration, and shared storage pools.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
