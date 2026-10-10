import React, { useState, useEffect } from 'react';
import { Code, Zap, Globe, CheckCircle2, RefreshCw, Terminal, Play } from 'lucide-react';
import { api } from '../api';

const EdgeWasmFunctionsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getEdgeWasm();
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
            <Code className="w-6 h-6 text-sky-400" />
            Global Edge Functions & WASM
          </h2>
          <p className="text-slate-400 mt-1">Ultra-low latency serverless edge execution with V8 Isolate engine.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {!loading && data && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-400">Execution Runtime</p>
              <p className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-sky-400"/> {data.engine}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Cold Start Latency</p>
              <p className="text-2xl font-mono text-emerald-400">{data.cold_start}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.functions.map((fn, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 p-5 rounded-lg flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{fn.name}</h3>
                    <p className="text-sm font-mono text-sky-400">{fn.id}</p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 text-xs rounded">{fn.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div className="bg-slate-900 p-3 rounded">
                    <p className="text-slate-400 mb-1">Language</p>
                    <p className="font-semibold text-white">{fn.language}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded">
                    <p className="text-slate-400 mb-1">24h Invocations</p>
                    <p className="font-semibold text-white">{fn.invocations_24h.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-3">
                  <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded flex justify-center items-center gap-2 text-sm">
                    <Terminal className="w-4 h-4"/> Edit Code
                  </button>
                  <button className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2 rounded flex justify-center items-center gap-2 text-sm">
                    <Play className="w-4 h-4"/> Run Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default EdgeWasmFunctionsView;
