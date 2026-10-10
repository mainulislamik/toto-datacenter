import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Lock, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { api } from '../api';

const EnterpriseKMSView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getEnterpriseKMS();
      setData(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-yellow-500" />
            Hardware Security Module (KMS)
          </h2>
          <p className="text-slate-400 mt-1">FIPS 140-2 Level 3 compliant encryption key management.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">HSM Cluster Status</h3>
            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded flex justify-between items-center border border-yellow-500/20">
                <span className="text-slate-400">Compliance</span>
                <span className="text-yellow-400 font-bold flex items-center gap-2"><Lock className="w-4 h-4" /> {data.hsm_status}</span>
              </div>
              <div className="bg-slate-800 p-4 rounded flex justify-between items-center">
                <span className="text-slate-400">Key Rotation Policy</span>
                <span className="text-white">{data.master_key_rotation}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Customer Managed Keys (CMK)</h3>
            <div className="space-y-3">
              {data.keys.map((key, i) => (
                <div key={i} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="font-mono text-yellow-400">{key.key_id}</span>
                    <span className="text-emerald-400 text-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {key.status}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>{key.usage}</span>
                    <span>{key.algorithm}</span>
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
export default EnterpriseKMSView;
