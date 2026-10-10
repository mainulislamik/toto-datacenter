import React, { useState, useEffect } from 'react';
import { Zap, Sun, Radio, Activity, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api';

const DarkFiberDWDMView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDarkFiber();
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
            <Radio className="w-6 h-6 text-fuchsia-500" />
            Dark Fiber DWDM Ring
          </h2>
          <p className="text-slate-400 mt-1">Inter-DC physical optical networking telemetry.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {!loading && data && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">QSFP28 Optical Transceivers</h3>
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4"/> {data.dwdm_ring_status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.transceivers.map((trx, i) => (
                <div key={i} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-3">
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="font-bold text-white font-mono">{trx.port} ({trx.speed})</span>
                    <span className="text-emerald-400">{trx.vendor}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-slate-400">Tx Launch Power:</div>
                    <div className="text-fuchsia-400 text-right font-mono">{trx.tx_power_dbm} dBm</div>
                    <div className="text-slate-400">Rx Receive Power:</div>
                    <div className="text-fuchsia-400 text-right font-mono">{trx.rx_power_dbm} dBm</div>
                    <div className="text-slate-400">Laser Temp:</div>
                    <div className="text-orange-400 text-right">{trx.temp_c} °C</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
             <h3 className="text-lg font-semibold text-white mb-4">ITU Lambda Wave Channels</h3>
             <div className="space-y-3">
                {data.lambda_channels.map((ch, i) => (
                  <div key={i} className="bg-slate-800 p-3 rounded flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded font-mono text-sm">CH {ch.channel}</span>
                      <span className="text-fuchsia-400 font-bold">{ch.wavelength}</span>
                    </div>
                    <span className={`text-sm ${ch.status.includes('Active') ? 'text-emerald-400' : 'text-slate-400'}`}>{ch.status}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DarkFiberDWDMView;
