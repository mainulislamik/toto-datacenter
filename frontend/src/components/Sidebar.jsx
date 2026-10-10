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
  Archive,
  DollarSign,
  Bot,
  Shield,
  Terminal,
  Folder,
  Globe,
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
    { id: 'docker', label: 'Docker & Compose Stacks', icon: Layers, badge: 'Moby' },
    { id: 'marketplace', label: '1-Click App Store', icon: ShoppingBag, badge: '10s' },
  ];

  const networkSecurityItems = [
    { id: 'proxy', label: 'Reverse Proxy & SSL', icon: Globe, badge: 'ACME' },
    { id: 'firewall', label: 'SDN & Cloud Firewall', icon: Shield, badge: 'Guard' },
    { id: 'vpc', label: 'VPC Subnets & Bridges', icon: Layers, badge: 'SDN' },
    { id: 'ha', label: 'High Availability (HA)', icon: ShieldCheck, badge: 'Self-Heal' },
  ];

  const storageBackupItems = [
    { id: 'storage', label: 'Storage & ISO Vault', icon: HardDrive },
    { id: 'files', label: 'Cloud File Explorer', icon: Folder, badge: '100GB' },
    { id: 'backups', label: 'Auto-Backup & VZDump', icon: Archive, badge: 'ZSTD' },
    { id: 'gitops', label: '1-Click ISO & Git-Ops', icon: GitBranch },
  ];

  const opsBillingItems = [
    { id: 'metrics', label: 'Observability & Metrics', icon: Activity, badge: '5s' },
    { id: 'terminal', label: 'Node Web Terminal', icon: Terminal, badge: 'CLI' },
    { id: 'billing', label: 'Metering & Multi-Tenant', icon: DollarSign, badge: 'PAYG' },
    { id: 'ai-ops', label: 'AI Cloud Architect', icon: Bot, badge: 'AI' },
    ...(isSuperAdmin ? [{ id: 'users', label: 'Tenants & RBAC Quotas', icon: Users, badge: 'Admin' }] : []),
  ];

  const renderNavGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-5">
        <div className="px-3 mb-2 text-[11px] font-black uppercase tracking-wider text-slate-500">
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
                className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
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
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
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
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none" 
            onClick={() => {
              setActiveTab('overview');
              if (onClose) onClose();
            }}
          >
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xs border border-slate-800">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-slate-950 text-base tracking-tight font-mono">TOTO CLOUD</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-sky-50 text-sky-700 border border-sky-200">
                  v3.0
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Enterprise Hypervisor
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 select-none custom-scrollbar">
          {renderNavGroup('Compute & Virtualization', computeItems)}
          {renderNavGroup('Network & Security', networkSecurityItems)}
          {renderNavGroup('Storage & Disaster Recovery', storageBackupItems)}
          {renderNavGroup('Operations & Multi-Tenancy', opsBillingItems)}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="p-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 font-bold font-mono text-xs">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'IM'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.username || 'Imon Khan'}
                </p>
                <div className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSuperAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {user?.role || 'Super Admin'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}