import React from 'react';
import { 
  Server, 
  Layers, 
  Users, 
  HardDrive, 
  GitBranch, 
  LogOut, 
  ShieldCheck, 
  Activity, 
  User as UserIcon,
  Zap,
  ShoppingBag,
  Cpu
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const isSuperAdmin = user?.role === 'super_admin';

  const navItems = [
    { id: 'overview', label: 'Cluster Overview', icon: Activity },
    { id: 'vms', label: 'KVM Virtual Machines', icon: Server },
    { id: 'lxc', label: 'LXC Containers', icon: Zap },
    { id: 'marketplace', label: 'App Marketplace', icon: ShoppingBag },
    { id: 'storage', label: 'Storage & ISO Vault', icon: HardDrive },
    ...(isSuperAdmin ? [{ id: 'users', label: 'Users & RBAC Quotas', icon: Users }] : []),
    { id: 'gitops', label: '1-Click ISO & Git-Ops', icon: GitBranch },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Node Status */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md border border-slate-800">
                <Server className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-base text-slate-900 tracking-tight">TOTO CLOUD</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded border border-sky-200">
                    v2.0 Enterprise
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>DC-1 • Second SSD (240GB)</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-black text-slate-800">{user?.username}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isSuperAdmin ? 'Super Administrator' : user?.company || 'Tenant User'}
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
              {isSuperAdmin ? <ShieldCheck className="w-5 h-5 text-sky-600" /> : <UserIcon className="w-4 h-4" />}
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="flex xl:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
