import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  HardDrive, 
  Terminal, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  FileCode, 
  Layers, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../api';

export default function GitOpsView() {
  const [gitData, setGitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchGit = async () => {
    setLoading(true);
    try {
      const data = await api.getGitStatus();
      setGitData(data);
    } catch (err) {
      console.warn('Git status query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGit();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isoBuildCmd = `cd /home/imon/toto-datacenter/iso-builder && ./build-iso.sh`;
  const ddFlashCmd = `sudo dd if=toto-datacenter-v1.0.iso of=/dev/sdX bs=4M status=progress conv=fdatasync`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Git-Ops & Bare-Metal ISO System
            </h1>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              INFRASTRUCTURE AS CODE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-Touch Automated Proxmox Hypervisor Deployment for New Hardware Nodes
          </p>
        </div>

        <button
          onClick={fetchGit}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Check Git Sync</span>
        </button>
      </div>

      {/* Git Repository Status Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <GitBranch className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {gitData?.git_repo || 'mainulislamik/toto-datacenter'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                  Branch: {gitData?.branch || 'main'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Commit: <span className="font-mono text-slate-700">{gitData?.last_commit || 'HEAD'}</span>
              </p>
            </div>
          </div>

          <a
            href="https://github.com/mainulislamik/toto-datacenter"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition"
          >
            <span>GitHub Repo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Automated Answer File</span>
            <span className="font-bold text-slate-800">iso-builder/answer.toml</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">First-Boot Hook</span>
            <span className="font-bold text-slate-800">iso-builder/firstboot.sh</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">ISO Generator</span>
            <span className="font-bold text-slate-800">iso-builder/build-iso.sh</span>
          </div>
        </div>
      </div>

      {/* 4-Step Bare-Metal Setup Pipeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            🚀 1-Click Bare-Metal Deployment Pipeline (How to Setup Any New PC)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Follow these 4 steps to install this complete Datacenter environment onto any bare-metal computer:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold">1</span>
              <h4 className="font-bold text-slate-900 text-sm">Generate Custom Datacenter ISO</h4>
            </div>
            <p className="text-xs text-slate-600">
              Run the automated build script to inject your unattended answers and firstboot orchestration into the Proxmox ISO:
            </p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between">
              <code>{isoBuildCmd}</code>
              <button
                onClick={() => handleCopy(isoBuildCmd, 'cmd1')}
                className="text-slate-400 hover:text-white transition"
              >
                {copiedKey === 'cmd1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold">2</span>
              <h4 className="font-bold text-slate-900 text-sm">Flash to USB Pendrive</h4>
            </div>
            <p className="text-xs text-slate-600">
              Write the resulting <code className="text-sky-700 font-bold">toto-datacenter-v1.0.iso</code> to your USB drive via Rufus (Windows) or dd (Linux):
            </p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between">
              <code>{ddFlashCmd}</code>
              <button
                onClick={() => handleCopy(ddFlashCmd, 'cmd2')}
                className="text-slate-400 hover:text-white transition"
              >
                {copiedKey === 'cmd2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold">3</span>
              <h4 className="font-bold text-slate-900 text-sm">Plug USB into New PC & Boot</h4>
            </div>
            <p className="text-xs text-slate-600">
              Insert the pendrive into the target machine and select USB boot. The installer runs 100% automatically (no mouse or keyboard interaction needed).
            </p>
          </div>

          {/* Step 4 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">4</span>
              <h4 className="font-bold text-slate-900 text-sm">Ready in 5 Minutes</h4>
            </div>
            <p className="text-xs text-slate-600">
              The machine will auto-reboot. The firstboot hook pulls the Git repo, installs all services, and launches this Control Panel on port 3099 immediately!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
