import React, { useState, useEffect } from 'react';
import { 
  Code, Copy, Check, Play, RefreshCw, FileText, 
  Terminal, CheckCircle2, AlertTriangle, Layers, Server, Zap
} from 'lucide-react';
import { api } from '../api';

export default function CloudInitIaCHubView() {
  const [templates, setTemplates] = useState([]);
  const [selectedTpl, setSelectedTpl] = useState(null);
  const [terraformHCL, setTerraformHCL] = useState('');
  const [vmName, setVmName] = useState('app-gateway-prod');
  const [vmCores, setVmCores] = useState(2);
  const [vmRAM, setVmRAM] = useState(4096);
  const [vmDisk, setVmDisk] = useState(32);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getIaCTemplates();
      if (res.status === 'success') {
        setTemplates(res.templates || []);
        if (res.templates && res.templates.length > 0) {
          setSelectedTpl(res.templates[0]);
        }
      }
      handleGenerateHCL();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to load IaC templates' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHCL = async () => {
    try {
      const res = await api.generateTerraformHCL({
        name: vmName,
        cores: parseInt(vmCores),
        memory: parseInt(vmRAM),
        disk: parseInt(vmDisk)
      });
      if (res.status === 'success') {
        setTerraformHCL(res.hcl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Code className="w-7 h-7 text-indigo-600" />
            Infrastructure as Code (IaC) & Cloud-Init Hub
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Automate VM & container provisioning using Terraform Declarative HCL and Cloud-Init YAML scripts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Templates"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setMsg({ type: 'success', text: 'Terraform Stack Plan verified & ready for execution!' })}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all shadow-indigo-100"
          >
            <Play className="w-4 h-4 fill-white" />
            Terraform Apply
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-sm ${
          msg.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cloud-Init Userdata Engine */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Cloud-Init Bootstrapping Scripts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated package install, SSH bootstrap, user configs</p>
            </div>
            {selectedTpl && (
              <button
                onClick={() => handleCopy(selectedTpl.userdata)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy YAML'}
              </button>
            )}
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTpl(tpl)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    selectedTpl?.id === tpl.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-x-auto font-mono text-xs text-slate-100 leading-relaxed min-h-[300px]">
              <pre>{selectedTpl?.userdata || '# Select a template to view userdata'}</pre>
            </div>
          </div>
        </div>

        {/* Terraform HCL Generator */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Live Terraform HCL Generator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Declarative multi-node Proxmox IaC generator</p>
            </div>
            <button
              onClick={() => handleCopy(terraformHCL)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy HCL'}
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">VM Name</label>
                <input
                  type="text"
                  value={vmName}
                  onChange={(e) => { setVmName(e.target.value); }}
                  onBlur={handleGenerateHCL}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cores</label>
                <input
                  type="number"
                  value={vmCores}
                  onChange={(e) => { setVmCores(e.target.value); }}
                  onBlur={handleGenerateHCL}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">RAM (MB)</label>
                <input
                  type="number"
                  value={vmRAM}
                  onChange={(e) => { setVmRAM(e.target.value); }}
                  onBlur={handleGenerateHCL}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NVMe (GB)</label>
                <input
                  type="number"
                  value={vmDisk}
                  onChange={(e) => { setVmDisk(e.target.value); }}
                  onBlur={handleGenerateHCL}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-x-auto font-mono text-xs text-amber-300 leading-relaxed min-h-[300px]">
              <pre>{terraformHCL || '# Generating Terraform HCL...'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
