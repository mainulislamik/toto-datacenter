import React, { useState, useEffect } from 'react';
import { 
  Clock, Play, Plus, RefreshCw, CheckCircle2, AlertTriangle, 
  Terminal, ShieldCheck, Activity, Calendar, Zap
} from 'lucide-react';
import { api } from '../api';

export default function CloudCronSchedulerView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: 'SSD Trim & Scrub',
    schedule: '0 2 * * *',
    command: 'fstrim -v /mnt/extra-vault',
    target: 'Hypervisor Host'
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getCronTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.createCronTask(formData);
      setMsg({ type: 'success', text: res.message });
      setTasks(prev => [res.task, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to create task' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunNow = async (taskId) => {
    try {
      setActionLoading(true);
      const res = await api.runCronTaskNow(taskId);
      setMsg({ type: 'success', text: res.message });
      fetchTasks();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Execution failed' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Global Cron & Autonomous Task Orchestrator</h2>
            <p className="text-sm text-slate-500">Autonomous Maintenance, Trims, System Prunes & Scheduled Hypervisor Scripts</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchTasks}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Task
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <span className="text-sm font-medium">{msg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200">
            {tasks.map((t) => (
              <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{t.name}</span>
                    <span className="px-2 py-0.5 text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200 rounded">
                      {t.schedule}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Target: {t.target}</span>
                  </div>
                  <div className="font-mono text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg inline-block">
                    $ {t.command}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>Last Run: {t.last_run}</span>
                    <span>•</span>
                    <span>Duration: {t.last_duration}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRunNow(t.id)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-600" />
                    Run Now
                  </button>
                  <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                    Enabled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Schedule Autonomous Cron Task</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cron Expression</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0 2 * * * (Daily at 2 AM)"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="w-full font-mono px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shell Command</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. fstrim -v /mnt/extra-vault"
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  className="w-full font-mono px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-lg transition"
                >
                  {actionLoading ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
