import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverviewView from './components/OverviewView';
import VMListView from './components/VMListView';
import UserManagementView from './components/UserManagementView';
import StorageView from './components/StorageView';
import GitOpsView from './components/GitOpsView';
import VNCConsoleModal from './components/VNCConsoleModal';
import LoginView from './components/LoginView';
import { getCurrentUser, setAuthToken, setCurrentUser, api } from './api';

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [consoleModal, setConsoleModal] = useState({ isOpen: false, vmid: null, vmName: '' });

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

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView onNavigate={setActiveTab} user={user} />
        )}
        {activeTab === 'vms' && (
          <VMListView onOpenConsole={handleOpenConsole} user={user} />
        )}
        {activeTab === 'storage' && <StorageView />}
        {activeTab === 'users' && <UserManagementView currentUser={user} />}
        {activeTab === 'gitops' && <GitOpsView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span className="font-bold text-slate-800">Toto Company Datacenter</span> • High-Performance Virtual Infrastructure
          </div>
          <div>
            Proxmox VE 8.4 • Second SSD (240GB) • KVM Hardware Engine
          </div>
        </div>
      </footer>

      {/* Live VNC Console Modal */}
      {consoleModal.isOpen && (
        <VNCConsoleModal
          vmid={consoleModal.vmid}
          vmName={consoleModal.vmName}
          onClose={handleCloseConsole}
        />
      )}
    </div>
  );
}
