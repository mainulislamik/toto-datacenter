import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import ClusterNodesView from './components/ClusterNodesView';
import VMListView from './components/VMListView';
import LXCHubView from './components/LXCHubView';
import MarketplaceView from './components/MarketplaceView';
import UserManagementView from './components/UserManagementView';
import StorageView from './components/StorageView';
import GitOpsView from './components/GitOpsView';
import FirewallView from './components/FirewallView';
import BackupSchedulerView from './components/BackupSchedulerView';
import BillingMeteringView from './components/BillingMeteringView';
import AICloudOpsView from './components/AICloudOpsView';
import WebTerminalView from './components/WebTerminalView';
import ClusterHAView from './components/ClusterHAView';
import VPCNetworkView from './components/VPCNetworkView';
import DockerOrchestratorView from './components/DockerOrchestratorView';
import SSLProxyManagerView from './components/SSLProxyManagerView';
import FileManagerView from './components/FileManagerView';
import LiveMetricsView from './components/LiveMetricsView';
import KubernetesClusterView from './components/KubernetesClusterView';
import SSHKeyringVaultView from './components/SSHKeyringVaultView';
import S3StorageBucketsView from './components/S3StorageBucketsView';
import AutoScalerPolicyView from './components/AutoScalerPolicyView';
import SecurityAuditScannerView from './components/SecurityAuditScannerView';
import DNSZoneManagerView from './components/DNSZoneManagerView';
import CloudInitIaCHubView from './components/CloudInitIaCHubView';
import DisasterRecoveryView from './components/DisasterRecoveryView';
import GPUPassthroughView from './components/GPUPassthroughView';
import AuditLogsView from './components/AuditLogsView';
import CommandPaletteModal from './components/CommandPaletteModal';
import NotificationsSettingsModal from './components/NotificationsSettingsModal';
import VNCConsoleModal from './components/VNCConsoleModal';
import SnapshotModal from './components/SnapshotModal';
import MigrateModal from './components/MigrateModal';
import LoginView from './components/LoginView';
import { getCurrentUser, setAuthToken, setCurrentUser } from './api';

const TAB_TITLES = {
  overview: 'Datacenter Overview & Metrics',
  cluster: 'Physical Cluster Nodes & Scale-Out',
  vms: 'KVM Virtual Machines',
  lxc: 'LXC Micro-Containers',
  docker: 'Docker Engine & Compose Stacks',
  k8s: 'Kubernetes K3s Micro-Cluster',
  gpu: 'PCIe GPU Passthrough & AI Accelerators',
  marketplace: '1-Click App Marketplace & Instant VM',
  dns: 'Anycast DNS & Global Zones Hub',
  proxy: 'Reverse Proxy & Auto-SSL Gateway',
  firewall: 'SDN & Visual Cloud Firewall Hub',
  vpc: 'VPC Subnets & Software-Defined Networking',
  ha: 'High Availability (HA) & Self-Healing Watchdog',
  'security-audit': 'Security & CVE Vulnerability Scanner',
  'ssh-keys': 'SSH Keyring Vault & Key Injection',
  storage: 'Storage & Dedicated ISO Vault',
  buckets: 'S3 Object Storage Buckets',
  files: 'Cloud File Explorer & Config Editor',
  backups: 'Auto-Backup & Disaster Recovery VZDump',
  dr: 'Disaster Recovery & ZFS Replication Sync',
  iac: 'Infrastructure as Code (IaC) & Cloud-Init',
  autoscaler: 'Dynamic Auto-Scaler & Policy Engine',
  metrics: 'Real-Time Observability & Process Tree',
  terminal: 'Node Web Terminal & Diagnostic Shell',
  audit: 'Compliance & Datacenter Audit Ledger',
  billing: 'Resource Metering & Multi-Tenant Billing',
  'ai-ops': 'AI Cloud Architect & Autonomous Ops',
  users: 'Tenants & RBAC Quota Management',
  gitops: '1-Click ISO Builder & GitOps'
};

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consoleModal, setConsoleModal] = useState({ isOpen: false, vmid: null, vmName: '' });
  const [snapshotModal, setSnapshotModal] = useState({ isOpen: false, vmid: null, name: '', isLXC: false });
  const [migrateModal, setMigrateModal] = useState({ isOpen: false, item: null, isLXC: false });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('toto:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('toto:auth-expired', handleAuthExpired);
  }, []);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K for Spotlight Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
  };

  const handleOpenConsole = (vmid, vmName) => {
    setConsoleModal({ isOpen: true, vmid, vmName });
  };

  const handleCloseConsole = () => {
    setConsoleModal({ isOpen: false, vmid: null, vmName: '' });
  };

  const handleOpenSnapshots = (vmid, name, isLXC = false) => {
    setSnapshotModal({ isOpen: true, vmid, name, isLXC });
  };

  const handleCloseSnapshots = () => {
    setSnapshotModal({ isOpen: false, vmid: null, name: '', isLXC: false });
  };

  const handleOpenMigrate = (item, isLXC = false) => {
    setMigrateModal({ isOpen: true, item, isLXC });
  };

  const handleCloseMigrate = () => {
    setMigrateModal({ isOpen: false, item: null, isLXC: false });
  };

  if (!user) {
    return <LoginView onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Dynamic Modern Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={TAB_TITLES[activeTab] || 'Datacenter Console'}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenNotifications={() => setNotificationsModalOpen(true)}
        />

        {/* Dynamic Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-[1600px] mx-auto pb-12">
            {activeTab === 'overview' && (
              <OverviewView
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenConsole={handleOpenConsole}
              />
            )}
            {activeTab === 'cluster' && (
              <ClusterNodesView />
            )}
            {activeTab === 'vms' && (
              <VMListView
                onOpenConsole={handleOpenConsole}
                onOpenSnapshots={(vmid, name) => handleOpenSnapshots(vmid, name, false)}
                onOpenMigrate={(item) => handleOpenMigrate(item, false)}
              />
            )}
            {activeTab === 'lxc' && (
              <LXCHubView
                onOpenConsole={handleOpenConsole}
                onOpenSnapshots={(vmid, name) => handleOpenSnapshots(vmid, name, true)}
                onOpenMigrate={(item) => handleOpenMigrate(item, true)}
              />
            )}
            {activeTab === 'docker' && (
              <DockerOrchestratorView />
            )}
            {activeTab === 'k8s' && (
              <KubernetesClusterView />
            )}
            {activeTab === 'gpu' && (
              <GPUPassthroughView />
            )}
            {activeTab === 'marketplace' && (
              <MarketplaceView onVMDeployed={() => setActiveTab('vms')} />
            )}
            {activeTab === 'dns' && (
              <DNSZoneManagerView />
            )}
            {activeTab === 'proxy' && (
              <SSLProxyManagerView />
            )}
            {activeTab === 'firewall' && (
              <FirewallView />
            )}
            {activeTab === 'vpc' && (
              <VPCNetworkView />
            )}
            {activeTab === 'ha' && (
              <ClusterHAView />
            )}
            {activeTab === 'security-audit' && (
              <SecurityAuditScannerView />
            )}
            {activeTab === 'ssh-keys' && (
              <SSHKeyringVaultView />
            )}
            {activeTab === 'storage' && (
              <StorageView />
            )}
            {activeTab === 'buckets' && (
              <S3StorageBucketsView />
            )}
            {activeTab === 'files' && (
              <FileManagerView />
            )}
            {activeTab === 'backups' && (
              <BackupSchedulerView />
            )}
            {activeTab === 'dr' && (
              <DisasterRecoveryView />
            )}
            {activeTab === 'iac' && (
              <CloudInitIaCHubView />
            )}
            {activeTab === 'autoscaler' && (
              <AutoScalerPolicyView />
            )}
            {activeTab === 'metrics' && (
              <LiveMetricsView />
            )}
            {activeTab === 'terminal' && (
              <WebTerminalView />
            )}
            {activeTab === 'audit' && (
              <AuditLogsView />
            )}
            {activeTab === 'billing' && (
              <BillingMeteringView />
            )}
            {activeTab === 'ai-ops' && (
              <AICloudOpsView />
            )}
            {activeTab === 'users' && (
              <UserManagementView currentUser={user} />
            )}
            {activeTab === 'gitops' && (
              <GitOpsView />
            )}
          </div>
        </main>

        {/* Modern Clean Footer */}
        <footer className="bg-white/80 backdrop-blur-xs border-t border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8 mt-auto">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 font-medium">
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900">TOTO CLOUD OS</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">Enterprise Next-Gen Cloud Platform v3.0</span>
            </div>
            <div className="text-slate-600 font-semibold">
              Proxmox VE 8.4 • K3s Kubernetes • S3 Storage • Auto-Scaler • Arc A770 GPU Passthrough • Anycast DNS
            </div>
          </div>
        </footer>
      </div>

      {/* Global Spotlight Search Modal (Cmd+K) */}
      <CommandPaletteModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Telegram Alert & Notification Settings Modal */}
      <NotificationsSettingsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
      />

      {/* Live VNC Console Modal */}
      {consoleModal.isOpen && (
        <VNCConsoleModal
          vmid={consoleModal.vmid}
          vmName={consoleModal.vmName}
          onClose={handleCloseConsole}
        />
      )}

      {/* Live Snapshot Manager Modal */}
      {snapshotModal.isOpen && (
        <SnapshotModal
          vmid={snapshotModal.vmid}
          name={snapshotModal.name}
          isLXC={snapshotModal.isLXC}
          onClose={handleCloseSnapshots}
        />
      )}

      {/* Live Cross-Node Migration Modal */}
      {migrateModal.isOpen && migrateModal.item && (
        <MigrateModal
          item={migrateModal.item}
          isLXC={migrateModal.isLXC}
          onClose={handleCloseMigrate}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
