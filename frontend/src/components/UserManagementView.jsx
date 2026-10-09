import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Activity, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import { api } from '../api';

export default function UserManagementView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // User Form
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    company: 'Client Company',
    role: 'user',
    quota: {
      max_vms: 3,
      max_cores: 4,
      max_ram_mb: 4096,
      max_disk_gb: 50,
    },
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await api.createUser({
        ...formData,
        quota: {
          max_vms: parseInt(formData.quota.max_vms, 10),
          max_cores: parseInt(formData.quota.max_cores, 10),
          max_ram_mb: parseInt(formData.quota.max_ram_mb, 10),
          max_disk_gb: parseInt(formData.quota.max_disk_gb, 10),
        },
      });
      setShowModal(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        company: 'Client Company',
        role: 'user',
        quota: { max_vms: 3, max_cores: 4, max_ram_mb: 4096, max_disk_gb: 50 },
      });
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (username === 'imon') {
      alert('Cannot delete primary Root Super Admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove user '${username}'?`)) {
      return;
    }
    try {
      await api.deleteUser(userId);
      await fetchUsers();
    } catch (err) {
      alert(`Delete user failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Multi-Tenant & User Access Control
            </h1>
            <span className="text-[11px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200">
              RBAC ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create Client Accounts, Assign Quota Budgets (vCPU, RAM, Storage), and Isolate Tenant VMs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-lg text-rose-900 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="underline font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* User Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((u) => {
          const isSuper = u.role === 'super_admin';
          const isTenant = u.role === 'tenant_admin';

          return (
            <div 
              key={u.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                      isSuper ? 'bg-amber-100 text-amber-900' : isTenant ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-slate-900 text-sm">{u.username}</span>
                      </div>
                      <p className="text-xs text-slate-500">{u.company || 'Personal Tenant'}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isSuper ? 'bg-amber-50 text-amber-900 border-amber-300' :
                    isTenant ? 'bg-blue-50 text-blue-900 border-blue-300' :
                    'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {isSuper ? 'SUPER ADMIN' : isTenant ? 'TENANT ADMIN' : 'USER'}
                  </span>
                </div>

                <div className="mt-4 text-xs text-slate-500 space-y-1">
                  <div>Email: <span className="font-semibold text-slate-700">{u.email}</span></div>
                  <div>Assigned VMs: <span className="font-semibold text-slate-700">{u.allowed_vmids?.length || (isSuper ? 'All (Cluster)' : 'None')}</span></div>
                </div>

                {/* Quota Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-lg space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Allocated Resource Quota
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <Cpu className="w-3.5 h-3.5 text-sky-600" />
                      <span>{u.quota?.max_cores || 0} vCPUs</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <Activity className="w-3.5 h-3.5 text-amber-600" />
                      <span>{Math.round((u.quota?.max_ram_mb || 0) / 1024)} GB RAM</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{u.quota?.max_disk_gb || 0} GB Disk</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-700">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Max {u.quota?.max_vms || 0} VMs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">ID: {u.id}</span>
                {!isSuper && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.username)}
                    className="p-1 rounded text-rose-600 hover:bg-rose-50 transition"
                    title="Remove User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Provision Tenant User</h3>
                  <p className="text-xs text-slate-500">Assign Role & Hardware Quota Limit</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                    placeholder="e.g. client_dev"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Team</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                    placeholder="e.g. Apex Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                    placeholder="dev@client.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Access Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-sky-600"
                >
                  <option value="user">Standard User (Only assigned VMs)</option>
                  <option value="tenant_admin">Tenant Admin (Can manage company team)</option>
                  <option value="super_admin">Super Admin (Full cluster control)</option>
                </select>
              </div>

              {/* Quota Sliders */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Hardware Quota Limits
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">Max vCPU Cores</label>
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={formData.quota.max_cores}
                      onChange={(e) => setFormData({
                        ...formData,
                        quota: { ...formData.quota, max_cores: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Max RAM (MB)</label>
                    <input
                      type="number"
                      step="512"
                      min="512"
                      value={formData.quota.max_ram_mb}
                      onChange={(e) => setFormData({
                        ...formData,
                        quota: { ...formData.quota, max_ram_mb: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Max Disk (GB)</label>
                    <input
                      type="number"
                      min="10"
                      value={formData.quota.max_disk_gb}
                      onChange={(e) => setFormData({
                        ...formData,
                        quota: { ...formData.quota, max_disk_gb: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Max VM Count</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quota.max_vms}
                      onChange={(e) => setFormData({
                        ...formData,
                        quota: { ...formData.quota, max_vms: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? 'Creating User...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
