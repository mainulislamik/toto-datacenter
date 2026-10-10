import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Flame, ShieldAlert, CheckCircle2, Clock, Activity, Cpu
} from 'lucide-react';
import { api } from '../api';

const AIIncidentResponderView = () => {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getIncidents();
      setIncidents(res.incidents || []);
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
        <Flame className="w-6 h-6 text-red-400" />
        AI Incident Responder & PagerDuty
      </h2>

      <div className="space-y-4">
        {incidents.map((inc, i) => (
          <div key={i} className="card p-0 overflow-hidden border-slate-700/60">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">{inc.id}</span>
                <h3 className="text-lg font-semibold text-slate-100">{inc.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-amber-400">{inc.severity}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${inc.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {inc.status}
                </span>
              </div>
            </div>
            
            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Event Timeline</h4>
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  {inc.timeline?.map((t, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-slate-700 bg-slate-900 group-[.is-active]:bg-purple-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-slate-800 p-3 rounded shadow-sm border border-slate-700 text-sm">
                        <div className="text-xs text-purple-400 mb-1">{t.time}</div>
                        <div className="text-slate-200">{t.event}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-5 border border-indigo-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <Cpu className="w-16 h-16 text-indigo-400" />
                </div>
                <h4 className="flex items-center gap-2 text-indigo-400 font-bold mb-3 relative z-10">
                  <Activity className="w-4 h-4" /> AI Root Cause Analysis
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed relative z-10">
                  {inc.ai_summary}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AIIncidentResponderView;