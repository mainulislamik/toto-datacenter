import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import VMListView from './components/VMListView';
import LXCHubView from './components/LXCHubView';
import MarketplaceView from './components/MarketplaceView';
import UserManagementView from './components/UserManagementView';
import StorageView from './components/StorageView';
import GitOpsView from './components/GitOpsView';
import VNCConsoleModal from './components/VNCConsoleModal';
import SnapshotModal from './components/SnapshotModal';
import LoginView from './components/LoginView';
import { getCurrentUser, setAuthToken, setCurrentUser } from './api';

const TAB_TITLES = {
  overview: 'Datacenter Overview & Metrics',
  vms: 'KVM Virtual Machines',
  lxc: 'LXC Micro-Containers',
  marketplace: '1-Click App Marketplace',
  storage: 'Storage & ISO Vault',
  users: 'Tenants & RBAC Quota Management',
  gitops: '1-Click ISO Builder & GitOps'
};

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [consoleModal, setConsoleModal] = useState({ isOpen: false, vmid: null, vmName: '' });
  const [snapshotModal, setSnapshotModal] = useState({ isOpen: false, vmid: null, name: '', isLXC: false });

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
    };
    window.addEventListener('toto:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('toto:auth-expired', handleAuthExpired);
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setActiveTab('overview');
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

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans flex text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Modern Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Workspace (Offset for Sidebar on Large Screens) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-200">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          activeTabTitle={TAB_TITLES[activeTab]}
          user={user}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <div className="animate-in fade-in duration-200">
            {activeTab === 'overview' && (
              <OverviewView onNavigate={setActiveTab} user={user} />
            )}
            {activeTab === 'vms' && (
              <VMListView 
                onOpenConsole={handleOpenConsole} 
                onOpenSnapshots={handleOpenSnapshots}
                user={user} 
              />
            )}
            {activeTab === 'lxc' && (
              <LXCHubView 
                onOpenConsole={handleOpenConsole}
                onOpenSnapshots={handleOpenSnapshots}
              />
            )}
            {activeTab === 'marketplace' && (
              <MarketplaceView onDeployed={() => setActiveTab('lxc')} />
            )}
            {activeTab === 'storage' && <StorageView />}
            {activeTab === 'users' && <UserManagementView currentUser={user} />}
            {activeTab === 'gitops' && <GitOpsView />}
          </div>
        </main>

        {/* Modern Clean Footer */}
        <footer className="bg-white/80 backdrop-blur-xs border-t border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8 mt-auto">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 font-medium">
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900">TOTO CLOUD OS</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">Enterprise Private Datacenter v2.0</span>
            </div>
            <div className="text-slate-600 font-semibold">
              Proxmox VE 8.4 • Second SSD (240GB) • KVM & LXC Containerization
            </div>
          </div>
        </footer>
      </div>

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
    </div>
  );
}
