import React from 'react';
import { 
  Menu, Search, Bell, ExternalLink, Activity,
  Server, Zap, HardDrive, ChevronRight
} from 'lucide-react';

export default function Header({ 
  onOpenSidebar, 
  activeTabTitle, 
  user,
  onOpenSearch,
  onOpenNotifications
}) {
  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/60 transition-all duration-200 active:scale-95"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-0.5">
            <span>TOTO CLOUD</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-sky-500">Dashboard</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight drop-shadow-sm">
               {activeTabTitle || 'Datacenter Overview'}
            </h1>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/60 shadow-sm relative overflow-hidden group">
              <span className="absolute inset-0 bg-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider relative z-10">Live Sync</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions & Status */}
      <div className="flex items-center space-x-3">
        {/* Global Spotlight Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center space-x-3 px-4 py-2 rounded-xl bg-slate-100/50 hover:bg-white text-slate-500 hover:text-slate-900 text-[13px] font-bold border border-slate-200/80 transition-all duration-300 shadow-inner hover:shadow-md cursor-pointer w-64 group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
          <span className="flex-1 text-left">Search resources...</span>
          <div className="flex items-center space-x-1">
            <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200/80 text-slate-500 font-black shadow-sm tracking-tighter">⌘</kbd>
            <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200/80 text-slate-500 font-black shadow-sm font-mono">K</kbd>
          </div>
        </button>
        
        {/* Mobile Search Icon */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/60 transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Telegram Notifications */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/60 transition-all duration-300 cursor-pointer relative group shadow-sm hover:shadow-md hover:border-blue-200"
          title="Alerts & Telegram Notifications"
        >
          <Bell className="w-5 h-5 group-hover:animate-[wiggle_1s_ease-in-out_infinite]" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 border-2 border-white shadow-sm"></span>
        </button>

        {/* Proxmox Core Direct Link */}
        <a
          href="https://127.0.0.1:8006"
          target="_blank"
          rel="noreferrer"
          className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200/80 transition-all shadow-sm hover:shadow-md group"
        >
          <Server className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
          <span>Proxmox Shell</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>

        {/* Global Status Pill */}
        <div className="flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 shadow-lg shadow-slate-900/10 cursor-help" title="All Systems Operational">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-[13px] font-black tracking-tight text-white">DC-01</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </div>
      </div>
      
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
      `}</style>
    </header>
  );
}