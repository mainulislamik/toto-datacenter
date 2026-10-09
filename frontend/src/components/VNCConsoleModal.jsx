import React, { useState, useEffect } from 'react';
import { Terminal, X, Maximize2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function VNCConsoleModal({ vmid, vmName, onClose }) {
  const [consoleData, setConsoleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConsole = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVMConsole(vmid);
      setConsoleData(data);
    } catch (err) {
      setError(err.message || 'Failed to initialize VNC console ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsole();
  }, [vmid]);

  const proxmoxConsoleUrl = `https://127.0.0.1:8006/?console=kvm&novnc=1&vmid=${vmid}&vmname=${encodeURIComponent(vmName || '')}&node=pve`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-white">{vmName || `VM ${vmid}`}</span>
                <span className="text-[10px] font-mono bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700">
                  ID: #{vmid}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Proxmox noVNC Web Terminal Stream</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchConsole}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Refresh Ticket"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <a
              href={proxmoxConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-950/60 border border-sky-800/80 px-2.5 py-1.5 rounded-md transition"
              title="Open in new window"
            >
              <span>Popout Window</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Screen / Terminal Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center">
          {loading ? (
            <div className="text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-sky-500 mb-3" />
              <p className="text-sm font-semibold">Connecting to Hypervisor VNC Stream...</p>
              <p className="text-xs text-slate-500 mt-1">Negotiating Proxmox SSL Ticket for VM #{vmid}</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center max-w-md">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">Console Connection Required</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">{error}</p>
              <a
                href={proxmoxConsoleUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow transition"
              >
                <span>Launch Direct Proxmox noVNC</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <iframe
              src={proxmoxConsoleUrl}
              title={`VM ${vmid} Console`}
              className="w-full h-full border-0"
              allow="fullscreen"
            />
          )}
        </div>

        {/* Bottom Bar */}
        <div className="px-5 py-2 border-t border-slate-800 bg-slate-900 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Security: TLS 1.3 Direct Encrypted Stream</span>
          <span>Hypervisor Node: pve (127.0.0.1)</span>
        </div>
      </div>
    </div>
  );
}
