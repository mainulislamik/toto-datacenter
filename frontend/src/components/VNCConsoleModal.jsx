import React, { useState, useEffect } from 'react';
import { Terminal, X, ExternalLink, RefreshCw, AlertCircle, Shield, MonitorPlay, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function VNCConsoleModal({ vmid, vmName, onClose }) {
  const [consoleData, setConsoleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const fetchConsole = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchFn = api.getVMConsole || api.getVMVNC;
      if (typeof fetchFn === 'function') {
        const data = await fetchFn(vmid);
        setConsoleData(data);
      }
    } catch (err) {
      console.warn('VNC ticket initialization:', err);
      // Don't treat ticket warning as fatal, Proxmox web UI handles noVNC auth directly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsole();
  }, [vmid]);

  // Dynamically resolve the host IP/Domain so it works from local or network (e.g., 192.168.0.100)
  const host = typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1';
  const proxmoxConsoleUrl = `https://${host}:8006/?console=kvm&novnc=1&vmid=${vmid}&vmname=${encodeURIComponent(vmName || '')}&node=pve`;

  const handleLaunchPopout = () => {
    const width = 1024;
    const height = 768;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    window.open(
      proxmoxConsoleUrl,
      `vnc_console_${vmid}`,
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-600/30">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-white tracking-tight">{vmName || `VM ${vmid}`}</span>
                <span className="text-[10px] font-mono bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-800 font-bold">
                  KVM #{vmid}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />
                  Live Web Stream
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Proxmox VE HTML5 noVNC Interactive Shell</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLaunchPopout}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-300 hover:text-white bg-sky-600/20 hover:bg-sky-600 border border-sky-500/40 px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
              title="Launch dedicated popout window for keyboard capture"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Launch Popout</span>
            </button>

            <a
              href={proxmoxConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Open full page in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title="Close Console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Console View Area */}
        <div className="flex-1 bg-black relative flex flex-col">
          {/* Quick Action Top Overlay Banner */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 z-10">
            <div className="flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted VNC Stream: <strong className="text-white">https://{host}:8006</strong></span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Tip: Click "Launch Popout" if browser blocks iframe keyboard focus
              </span>
              <button
                onClick={handleLaunchPopout}
                className="text-sky-400 hover:text-sky-300 underline font-bold cursor-pointer text-xs"
              >
                Open Full Window →
              </button>
            </div>
          </div>

          <div className="flex-1 relative w-full h-full bg-slate-950 flex items-center justify-center">
            <iframe
              src={proxmoxConsoleUrl}
              title={`VM ${vmid} Console`}
              className="w-full h-full border-0 bg-black"
              allow="fullscreen; clipboard-read; clipboard-write"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="font-semibold text-slate-300">Hypervisor Target: Proxmox pve</span>
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400">Resolution: Auto-fit (QEMU Standard VGA / VirtIO-GPU)</span>
          </div>

          <div className="flex items-center space-x-2 text-slate-400">
            <span>Direct Port: 8006</span>
          </div>
        </div>
      </div>
    </div>
  );
}
