import React, { useState, useEffect } from 'react';
import { 
  Network, Globe, Server, RefreshCw, CheckCircle2, 
  Activity, ShieldCheck, Zap, ArrowRight, HardDrive
} from 'lucide-react';
import { api } from '../api';

export default function DatacenterTopologyView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTopology = async () => {
    try {
      setLoading(true);
      const res = await api.getDatacenterMesh();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Multi-Region Datacenter Topology & Mesh</h2>
            <p className="text-sm text-slate-500">Cross-Region WireGuard Mesh Network, Edge Node Interconnects & Disaster Sync</p>
          </div>
        </div>

        <button
          onClick={fetchTopology}
          className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-teal-300 font-bold mb-1">Architecture Overview</div>
              <div className="text-xl font-bold">{data?.cluster_mode || 'Hybrid Multi-Region Mesh'}</div>
              <div className="text-xs text-slate-300 mt-1">Encrypted via {data?.mesh_protocol}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-extrabold text-teal-400">{data?.total_datacenters || 3}</div>
                <div className="text-xs text-slate-300">Active Regions</div>
              </div>
            </div>
          </div>

          {/* Region Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.nodes?.map((node) => (
              <div key={node.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <Server className="w-6 h-6 text-teal-600" />
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                    {node.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-base">{node.name}</h3>
                  <p className="text-xs text-slate-500">{node.region}</p>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Public/Mesh IP:</span>
                    <span className="font-mono font-semibold text-slate-700">{node.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role:</span>
                    <span className="font-semibold text-slate-800">{node.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Local VMs & LXC:</span>
                    <span className="font-semibold text-slate-800">{node.vms_count} Workloads</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vault Storage:</span>
                    <span className="font-semibold text-slate-800">{node.storage_human}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Inter-DC Ping:</span>
                    <span className="font-semibold text-teal-600 font-mono">{node.latency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
