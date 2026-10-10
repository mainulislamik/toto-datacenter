import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, Play, RefreshCw, Trash2, Copy, 
  Check, ShieldAlert, Cpu, HardDrive, Zap, Info, ArrowUpRight
} from 'lucide-react';
import { api } from '../api';

export default function WebTerminalView() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([
    {
      id: 1,
      command: 'pvesm status && qm list',
      output: 'Name             Type     Status           Total            Used       Available        %\nextra-ssd         dir     active       102837780         8597288        88981604       8.36%\nlocal             dir     active        19323380         3219456        15096536      16.66%\nlocal-lvm      lvmthin    active       148897792               0       148897792       0.00%\n\n   VMID NAME                 STATUS     MEM(MB)    BOOTDISK(GB) PID       \n    101 test                 running    4096              20.00 1132',
      status: 'success',
      duration: 0.12,
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const terminalEndRef = useRef(null);

  const quickSnippets = [
    { label: 'Cluster Storage Status', cmd: 'pvesm status' },
    { label: 'VM Detailed List', cmd: 'qm list' },
    { label: 'LXC Containers List', cmd: 'pct list' },
    { label: 'Corosync VoteQuorum', cmd: 'pvecm status' },
    { label: 'RAM & Cache Free Memory', cmd: 'free -h' },
    { label: 'Disk Space (Root & Extra Vault)', cmd: 'df -h / /mnt/extra-vault' },
    { label: 'Node Hardware Load Average', cmd: 'uptime' },
    { label: 'Network Bridges & IP Routes', cmd: 'ip -br a' },
    { label: 'Active QEMU Processes', cmd: 'ps aux | grep qemu-system | head -n 5' }
  ];

  const handleExecute = async (cmdToRun = command) => {
    const finalCmd = cmdToRun.trim();
    if (!finalCmd || loading) return;

    setLoading(true);
    try {
      const res = await api.execTerminalCommand(finalCmd);
      const newEntry = {
        id: Date.now(),
        command: finalCmd,
        output: res.output || res.error || (res.status === 'success' ? 'Done (Empty output)' : 'Command failed'),
        status: res.status,
        duration: res.duration_sec || 0.05,
        time: new Date().toLocaleTimeString()
      };
      setHistory(prev => [...prev, newEntry]);
      setCommand('');
    } catch (err) {
      setHistory(prev => [...prev, {
        id: Date.now(),
        command: finalCmd,
        output: err.message || 'Execution error',
        status: 'error',
        duration: 0.01,
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg">
              <TerminalIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interactive Node Terminal & Web Shell</h1>
              <p className="text-sm font-semibold text-slate-600">Direct zero-latency administrative diagnostics for Proxmox VE hypervisor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={clearHistory}
            className="inline-flex items-center px-3.5 py-2 border border-slate-300 text-xs font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Trash2 className="w-4 h-4 mr-1.5 text-slate-500" />
            Clear Screen
          </button>
        </div>
      </div>

      {/* Quick Diagnostic Snippets */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Quick Diagnostic Snippets (1-Click Run)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickSnippets.map((snip, idx) => (
            <button
              key={idx}
              onClick={() => handleExecute(snip.cmd)}
              disabled={loading}
              className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{snip.label}</span>
              <ArrowUpRight className="w-3 h-3 ml-1 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Modern High-DPI Terminal Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
        {/* Terminal Titlebar */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-xs font-bold text-slate-400 ml-2">root@DC-1 (Proxmox VE 8.4 • TOTO-DC)</span>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
            HYBRID CLI ACTIVE
          </span>
        </div>

        {/* Terminal Output Area */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[550px] min-h-[350px] space-y-6 text-slate-200 selection:bg-emerald-800 selection:text-white">
          {history.length === 0 ? (
            <div className="text-slate-500 text-center py-12">
              <TerminalIcon className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
              <p className="font-semibold text-sm">Ready for administrative commands.</p>
              <p className="text-xs text-slate-600 mt-1">Type a command below or click a quick diagnostic snippet.</p>
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="space-y-2 group">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-2 font-bold">
                    <span className="text-emerald-400 font-black">root@DC-1:~#</span>
                    <span className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{entry.command}</span>
                  </div>
                  <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-slate-500">{entry.time} ({entry.duration}s)</span>
                    <button
                      onClick={() => handleCopy(entry.id, entry.output)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors p-1"
                      title="Copy output"
                    >
                      {copiedId === entry.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className={`rounded-lg p-3.5 text-xs whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto ${
                  entry.status === 'error'
                    ? 'bg-rose-950/40 border border-rose-900/60 text-rose-300'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                }`}>
                  {entry.output}
                </div>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
          <span className="text-emerald-400 font-bold pl-2">#</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExecute();
            }}
            placeholder="Type Proxmox CLI command (e.g. qm list, pvesm status, free -h)..."
            className="flex-1 bg-transparent border-none text-white text-sm font-mono focus:outline-none focus:ring-0 placeholder:text-slate-600"
            disabled={loading}
          />
          <button
            onClick={() => handleExecute()}
            disabled={loading || !command.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-lg transition-colors disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Run</span>
          </button>
        </div>
      </div>
    </div>
  );
}
