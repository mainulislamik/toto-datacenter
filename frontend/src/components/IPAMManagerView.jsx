import React, { useState, useEffect } from 'react';
import { 
  Network, Globe, Server, CheckCircle2, AlertTriangle, 
  RefreshCw, MapPin
} from 'lucide-react';
import { api } from '../api';

const IPAMManagerView = () => {
  const [data, setData] = useState({ subnets: [], elastic_ips: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getIPAMSubnets();
      setData(res);
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-cyan-400" />
        IPAM & Elastic IPs
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 mb-4">VNet Subnets</h3>
          <div className="space-y-3">
            {data.subnets?.map((s, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-800/40 p-3 rounded border border-slate-700/50">
                <div>
                  <div className="text-blue-300 font-mono font-medium">{s.cidr}</div>
                  <div className="text-xs text-slate-400 mt-1">Gateway: {s.gateway} | VLAN: {s.vlan}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-200">{s.usage}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 mb-4 flex justify-between items-center">
            Elastic Public IPs
            <button className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded">Allocate New</button>
          </h3>
          <div className="space-y-3">
            {data.elastic_ips?.map((ip, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-800/40 p-3 rounded border border-slate-700/50">
                <div className="text-cyan-300 font-mono font-medium">{ip.ip}</div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded ${ip.status === 'Routed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                    {ip.status}
                  </span>
                  <div className="text-xs text-slate-400 mt-1">{ip.attached_to}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default IPAMManagerView;