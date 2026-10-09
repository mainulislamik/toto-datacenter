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
  Cpu,
  ChevronRight,
  ExternalLink,
  Sliders,
  Database,
  Radio,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  user, 
  onLogout,
  isOpen,
  onClose 
}) {
  const isSuperAdmin = user?.role === 'super_admin';

  const computeItems = [
    { id: 'overview', label: 'Datacenter Overview', icon: Activity, badge: 'Live' },
    { id: 'cluster', label: 'Cluster Nodes & Scale-Out', icon: Cpu, badge: 'Nodes' },
    { id: 'vms', label: 'KVM Virtual Machines', icon: Server, badge: 'KVM' },
    { id: 'lxc', label: 'LXC Micro-Containers', icon: Zap, badge: 'Sub-Sec' },
    { id: 'marketplace', label: '1-Click App Store', icon: ShoppingBag, badge: 'New' },
  ];

  const infraItems = [
    { id: 'storage', label: 'Storage & ISO Vault', icon: HardDrive },
    { id: 'gitops', label: '1-Click ISO & Git-Ops', icon: GitBranch },
  ];

  const adminItems = [
    ...(isSuperAdmin ? [{ id: 'users', label: 'Tenants & RBAC Quotas', icon: Users, badge: 'Admin' }] : []),
  ];

  const renderNavGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="px-3 mb-2 text-[11px] font-black uppercase tracking-wider text-slate-600">
          {title}
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 translate-x-0.5'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-sky-500/20 text-sky-400' 
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold tracking-tight">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isActive 
                      ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-slate-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-18 px-5 border-b border-slate-200 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none" 
            onClick={() => {
              setActiveTab('overview');
              if (onClose) onClose();
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg shadow-slate-950/15 border border-slate-800">
              <Server className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-sm text-slate-900 tracking-tight">TOTO CLOUD</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded border border-sky-200">
                  v2.5
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-600 tracking-tight">
                Enterprise Datacenter
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Cluster Pill */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Cluster toto-dc</div>
                <div className="text-[10px] font-bold text-slate-600">Corosync VoteQuorum OK</div>
              </div>
            </div>
            <a 
              href="https://127.0.0.1:8006" 
              target="_blank" 
              rel="noreferrer"
              title="Open Proxmox Native Shell"
              className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Nav Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {renderNavGroup('Compute & Cloud Engine', computeItems)}
          {renderNavGroup('Storage & Automation', infraItems)}
          {renderNavGroup('Administration & Access', adminItems)}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center font-black text-xs shadow-inner">
                {isSuperAdmin ? <ShieldCheck className="w-5 h-5 text-sky-400" /> : <UserIcon className="w-4 h-4 text-white" />}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-black text-slate-900 truncate">
                  {user?.username}
                </div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                  {isSuperAdmin ? 'Super Administrator' : user?.company || 'Tenant User'}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
