import React, { useState } from 'react';
import { 
  Server, Layers, Users, HardDrive, GitBranch, LogOut, ShieldCheck, 
  Activity, Zap, ShoppingBag, Cpu, ChevronRight, ChevronDown,
  Database, Radio, Archive, DollarSign, Bot, Shield, Terminal, 
  Folder, Globe, Boxes, Key, TrendingUp, ShieldAlert, Code, RotateCcw, 
  FileText, GitFork, Clock, Network, Box, Lock, MapPin, Flame, CreditCard, X
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

  // State to track which groups are expanded
  const [openGroups, setOpenGroups] = useState({
    'Compute & Infra': true,
    'Network & Edge': true,
    'Storage & DR': false,
    'Datacenter Ops': false,
    'Billing & Identity': false,
  });

  const toggleGroup = (groupName) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const computeItems = [
    { id: 'overview', label: 'Datacenter Overview', icon: Activity, badge: 'Live' },
    { id: 'architecture', label: 'Datacenter Architecture', icon: Layers, badge: 'Tier-III' },
    { id: 'topology', label: 'Multi-Region Mesh Topology', icon: Network, badge: 'WireGuard' },
    { id: 'bare-metal', label: 'Bare-Metal & PXE', icon: HardDrive, badge: 'MaaS' },
    { id: 'cluster', label: 'Cluster Nodes & Scale', icon: Cpu, badge: 'Nodes' },
    { id: 'vms', label: 'KVM Virtual Machines', icon: Server, badge: 'KVM' },
    { id: 'lxc', label: 'LXC Micro-Containers', icon: Zap, badge: 'LXC' },
    { id: 'docker', label: 'Docker Stacks', icon: Layers, badge: 'Moby' },
    { id: 'k8s', label: 'Kubernetes K3s', icon: Boxes, badge: 'K3s' },
    { id: 'gpu', label: 'GPU Passthrough', icon: Zap, badge: 'A770' },
  ];

  const networkEdgeItems = [
    { id: 'vps-domains', label: 'Domains & vHost', icon: Globe, badge: 'SSL' },
    { id: 'magic-transit', label: 'Magic Transit Scrubber', icon: ShieldAlert, badge: 'DDoS' },
    { id: 'edge-wasm', label: 'Edge WASM Functions', icon: Code, badge: 'V8' },
    { id: 'cdn', label: 'Edge CDN Cache', icon: Zap, badge: 'CDN' },
    { id: 'dark-fiber', label: 'Dark Fiber DWDM', icon: Radio, badge: 'Optic' },
    { id: 'waf', label: 'Web Apps Firewall', icon: ShieldAlert, badge: 'WAF' },
    { id: 'lb', label: 'L4/L7 Load Balancers', icon: GitFork, badge: 'LB' },
    { id: 'dns', label: 'Anycast DNS Zones', icon: Globe, badge: 'DNS' },
    { id: 'vpc', label: 'VPC Subnets (SDN)', icon: Network, badge: 'SDN' },
    { id: 'firewall', label: 'Datacenter Firewall', icon: Shield, badge: 'Rules' },
  ];

  const storageItems = [
    { id: 'storage', label: 'Storage & ISO Vault', icon: HardDrive },
    { id: 'buckets', label: 'S3 Object Storage', icon: Database, badge: 'S3' },
    { id: 'files', label: 'Cloud File Explorer', icon: Folder },
    { id: 'backups', label: 'Auto-Backup Service', icon: Archive, badge: 'Cron' },
    { id: 'dr', label: 'ZFS Disaster Recovery', icon: RotateCcw, badge: '15m' },
  ];

  const opsItems = [
    { id: 'serverless-paas', label: 'Serverless App PaaS', icon: Box, badge: 'Git' },
    { id: 'iac', label: 'Terraform IaC Hub', icon: Code, badge: 'HCL' },
    { id: 'cron', label: 'Global Cron Auto', icon: Clock, badge: 'Cron' },
    { id: 'autoscaler', label: 'Dynamic Auto-Scaler', icon: TrendingUp, badge: 'Scale' },
    { id: 'ipam', label: 'Enterprise IPAM', icon: MapPin, badge: 'IPs' },
    { id: 'metrics', label: 'Live Observability', icon: Activity, badge: '5s' },
    { id: 'terminal', label: 'Web-based Terminal', icon: Terminal, badge: 'SSH' },
    { id: 'incident', label: 'PagerDuty Incidents', icon: Flame, badge: 'AI' },
  ];

  const securityBillingItems = [
    { id: 'zero-trust', label: 'Zero-Trust Bastion', icon: Lock, badge: 'MFA' },
    { id: 'kms', label: 'Hardware KMS Vault', icon: Key, badge: 'FIPS' },
    { id: 'ssh-keys', label: 'Keys & Identity', icon: Key, badge: 'RSA' },
    { id: 'security-audit', label: 'CVE Vulnerability Scan', icon: ShieldAlert, badge: 'Scan' },
    { id: 'audit', label: 'SOC2 Audit Ledger', icon: FileText, badge: 'Log' },
    { id: 'finops', label: 'FinOps Cost Analytics', icon: CreditCard, badge: 'ROI' },
    { id: 'billing', label: 'Metering & Invoices', icon: DollarSign, badge: 'PAYG' },
    ...(isSuperAdmin ? [{ id: 'users', label: 'Tenants & RBAC', icon: Users, badge: 'Admin' }] : []),
  ];

  const renderNavGroup = (title, items) => {
    if (!items || items.length === 0) return null;
    const isExpanded = openGroups[title];

    // Check if the current activeTab is inside this group
    const isActiveGroup = items.some(item => item.id === activeTab);

    return (
      <div className="mb-2">
        {/* Accordion Header */}
        <button 
          onClick={() => toggleGroup(title)}
          className={`w-full flex items-center justify-between px-3 py-2 transition-colors rounded-lg group ${
            isActiveGroup ? 'bg-sky-50/50' : 'hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${
            isActiveGroup ? 'text-sky-600' : 'text-slate-500 group-hover:text-slate-800'
          }`}>
            {title}
          </span>
          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className={`w-3.5 h-3.5 ${isActiveGroup ? 'text-sky-500' : 'text-slate-400'}`} />
          </div>
        </button>

        {/* Collapsible Content */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-1 px-1">
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
                  className={`relative w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1 border border-slate-700/50'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 border border-transparent hover:border-slate-200/50'
                  }`}
                >
                  {/* Subtle glass reflection on active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                  )}

                  <div className="flex items-center space-x-3 relative z-10">
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-sky-500/20 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
                        : 'bg-white text-slate-500 shadow-sm border border-slate-200/60 group-hover:bg-slate-100 group-hover:text-slate-800 group-hover:scale-105'
                    }`}>
                      <Icon className="w-[15px] h-[15px]" />
                    </div>
                    <span className={`tracking-tight ${isActive ? 'font-black drop-shadow-sm' : 'font-bold'}`}>
                      {item.label}
                    </span>
                  </div>
                  
                  {item.badge && (
                    <span className={`relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider transition-colors duration-300 ${
                      isActive 
                        ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-white group-hover:text-slate-700 group-hover:border-slate-300 shadow-sm'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-[280px] bg-[#fafafa] border-r border-slate-200/80 flex flex-col transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) shadow-2xl lg:shadow-none
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-[72px] px-5 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none group" 
            onClick={() => {
              setActiveTab('overview');
              if (onClose) onClose();
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-b from-slate-800 to-slate-950 rounded-xl flex items-center justify-center text-white shadow-md border border-slate-700 relative overflow-hidden group-hover:shadow-lg group-hover:shadow-sky-900/20 transition-all duration-300">
              <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Layers className="w-5 h-5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-900 text-[17px] tracking-tight font-mono">TOTO CLOUD</span>
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-blue-500/20">
                  v4.0
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                Enterprise Hyperscale
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5 select-none custom-scrollbar">
          {renderNavGroup('Compute & Infra', computeItems)}
          {renderNavGroup('Network & Edge', networkEdgeItems)}
          {renderNavGroup('Storage & DR', storageItems)}
          {renderNavGroup('Datacenter Ops', opsItems)}
          {renderNavGroup('Billing & Identity', securityBillingItems)}
        </div>

        {/* User Footer - Frosted Glass effect */}
        <div className="p-4 border-t border-slate-200/80 bg-white/60 backdrop-blur-md shrink-0">
          <div className="p-2.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 shrink-0 font-bold font-mono text-sm shadow-inner">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'IM'}
              </div>
              <div className="overflow-hidden">
                <p className="text-[13px] font-bold text-slate-900 truncate">
                  {user?.username || 'Imon Khan'}
                </p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className={`relative flex h-2 w-2`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSuperAdmin ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isSuperAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {user?.role || 'Super Admin'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}