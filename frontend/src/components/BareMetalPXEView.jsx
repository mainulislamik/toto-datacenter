import React, { useState, useEffect } from 'react';
import { Server, HardDrive, Cpu, Play, CheckCircle2, AlertTriangle, RefreshCw, Power } from 'lucide-react';
import { api } from '../api';

const BareMetalPXEView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getBareMetalPXE();
      setData(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-emerald-400" />
            Bare-Metal Provisioning & PXE Hub
          </h2>
          <p className="text-slate-400 mt-1">Deploy physical servers via metal-as-a-service over network boot.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!loading && data && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Power className="w-5 h-5 text-emerald-400" /> Discovered Metal Nodes
            </h3>
            <p className="text-sm text-slate-400 mb-4">PXE/DHCP Server: <span className="font-mono text-emerald-400">{data.pxe_server}</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.discovered_nodes.map((node, i) => (
                <div key={i} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-white">{node.mac}</span>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${node.status === 'Ready for Deploy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 mt-2 text-sm">
                    <div className="text-slate-400">Vendor:</div><div className="text-white text-right">{node.vendor}</div>
                    <div className="text-slate-400">IPMI IP:</div><div className="text-emerald-400 text-right font-mono">{node.ipmi_ip}</div>
                    <div className="text-slate-400">CPU:</div><div className="text-white text-right">{node.cpu}</div>
                    <div className="text-slate-400">RAM:</div><div className="text-white text-right">{node.ram}</div>
                  </div>
                  <div className="h-0 group-hover:h-10 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-2 flex gap-2">
                    <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" /> Install OS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BareMetalPXEView;
