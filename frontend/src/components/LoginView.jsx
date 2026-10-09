import React, { useState } from 'react';
import { Server, Lock, User, AlertCircle, ShieldCheck, Cpu } from 'lucide-react';
import { api, setAuthToken, setCurrentUser } from '../api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('imon');
  const [password, setPassword] = useState('ImonAdmin2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      setAuthToken(data.access_token);
      setCurrentUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-sky-700 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
          <Server className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Toto Company Datacenter
        </h2>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          TOTO CLOUD OS • Virtual Infrastructure Control Panel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-slate-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-5 bg-rose-50 border-l-4 border-rose-600 p-3.5 rounded text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username / Identifier
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  placeholder="admin username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-600 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Datacenter'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Role Switcher (Demo / Testing)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCredentials('imon', 'ImonAdmin2026!')}
                className="text-left p-2 rounded border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
                  <span>Imon Sir</span>
                </div>
                <div className="text-[10px] text-slate-500">Super Admin (Full Access)</div>
              </button>
              <button
                type="button"
                onClick={() => setCredentials('developer1', 'DevPassword123!')}
                className="text-left p-2 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                  <Cpu className="w-3.5 h-3.5 text-slate-600" />
                  <span>Developer 1</span>
                </div>
                <div className="text-[10px] text-slate-500">Restricted Quota User</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            Connected to Proxmox VE KVM Hypervisor on Second SSD (AFOX 240GB)
          </p>
        </div>
      </div>
    </div>
  );
}
