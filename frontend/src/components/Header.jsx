import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ExternalLink, 
  ShieldCheck, 
  User as UserIcon,
  RefreshCw,
  Terminal,
  Server,
  Zap,
  HardDrive
} from 'lucide-react';

export default function Header({ 
  onOpenSidebar, 
  activeTabTitle, 
  user,
  onOpenSearch,
  onOpenNotifications
}) {
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header className="h-18 bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {activeTabTitle || 'Datacenter Overview'}
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              ● Live Sync
            </span>
          </div>
          <p className="hidden md:block text-xs font-semibold text-slate-600 mt-0.5">
            Enterprise Cloud Infrastructure & KVM/LXC Hypervisor Platform
          </p>
        </div>
      </div>

      {/* Right: Quick Actions & Status */}
      <div className="flex items-center space-x-3">
        {/* Global Spotlight Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 text-xs font-bold border border-slate-200 transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search VMs, tasks...</span>
          <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 font-mono">⌘K</kbd>
        </button>

        {/* Telegram Notifications Center Trigger */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer relative"
          title="Alerts & Telegram Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5"></span>
        </button>

        {/* Proxmox Core Direct Link */}
        <a
          href="https://127.0.0.1:8006"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 transition"
        >
          <Server className="w-3.5 h-3.5 text-sky-600" />
          <span>Proxmox Shell</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Global Status Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-tight">DC-1 OK</span>
        </div>
      </div>
    </header>
  );
}
