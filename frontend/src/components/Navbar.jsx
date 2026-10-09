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
  ExternalLink
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const isSuperAdmin = user?.role === 'super_admin';
  const isTenantAdmin = user?.role === 'tenant_admin' || isSuperAdmin;

  const navItems = [
    { id: 'overview', label: 'Datacenter Overview', icon: Activity },
    { id: 'vms', label: 'Virtual Machines', icon: Layers },
    { id: 'storage', label: 'Storage & ISOs', icon: HardDrive },
    ...(isTenantAdmin ? [{ id: 'users', label: 'User & Quotas', icon: Users }] : []),
    { id: 'gitops', label: 'Git-Ops & Bare-Metal ISO', icon: GitBranch },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sky-700 flex items-center justify-center text-white font-bold shadow-sm">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">TOTO CLOUD OS</span>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded border border-sky-200">v1.0-ENTERPRISE</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Toto Company Datacenter Orchestrator</p>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* Proxmox Native GUI direct link */}
            <a 
              href="https://127.0.0.1:8006" 
              target="_blank" 
              rel="noreferrer"
              className="hidden md:inline-flex items-center space-x-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1.5 rounded-md transition"
              title="Open Native Proxmox VE Web GUI"
            >
              <span>Hypervisor Native GUI</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* User Profile Card */}
            <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-slate-900">{user?.username}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    user?.role === 'super_admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    user?.role === 'tenant_admin' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'tenant_admin' ? 'Tenant Admin' : 'User'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{user?.company || 'Datacenter'}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center space-x-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-md transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center space-x-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-sky-700 text-sky-800 bg-sky-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
