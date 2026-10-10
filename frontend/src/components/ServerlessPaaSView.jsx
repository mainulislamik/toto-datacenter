import React, { useState, useEffect } from 'react';
import { 
  Box, Terminal, Globe, Clock, CheckCircle2, AlertTriangle, 
  RefreshCw, Play, Github, HardDrive, Zap, Lock
} from 'lucide-react';
import { api } from '../api';

const ServerlessPaaSView = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const res = await api.getServerlessApps();
      setApps(res.apps || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Box className="w-6 h-6 text-purple-400" />
            Serverless PaaS & App Platform
          </h2>
          <p className="text-slate-400 mt-1">Scale Node.js, Python, and Rust applications instantly.</p>
        </div>
        <button onClick={loadApps} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map(app => (
          <div key={app.app_id} className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Github className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{app.name}</h3>
                <span className="text-xs text-slate-400">{app.repo} ({app.branch})</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Runtime:</span>
                <span className="text-slate-200 font-medium">{app.runtime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {app.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Memory Load:</span>
                <span className="text-slate-200 font-medium">{app.memory_usage}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <a href={app.url} target="_blank" rel="noreferrer" className="flex-1 btn-primary justify-center text-sm">
                <Globe className="w-4 h-4" /> Open App
              </a>
              <button className="px-3 btn-secondary">
                <Terminal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {/* Deploy New Action Card */}
        <div className="card p-5 border-dashed border-2 bg-slate-900/40 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/60 transition-colors">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-3">
            <Github className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-1">Deploy New App</h3>
          <p className="text-sm text-slate-400 mb-4">Connect GitHub & Auto-Deploy</p>
          <button className="btn-primary w-full justify-center">
            Connect Repo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerlessPaaSView;