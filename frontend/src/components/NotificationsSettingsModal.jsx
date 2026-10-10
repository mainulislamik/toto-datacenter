import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, ShieldCheck, CheckCircle2, AlertTriangle, 
  X, RefreshCw, Key, MessageSquare, Smartphone
} from 'lucide-react';
import { api } from '../api';

export default function NotificationsSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    telegram_bot_token: '',
    telegram_chat_id: '',
    alert_on_vm_state: true,
    alert_on_high_cpu: true,
    alert_on_backup_complete: true,
    cpu_threshold_pct: 90,
    ram_threshold_pct: 90
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getNotificationSettings();
      setSettings(prev => ({
        ...prev,
        ...res,
        telegram_bot_token: res.telegram_bot_token || ''
      }));
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateNotificationSettings(settings);
      setStatusMsg({ type: 'success', text: 'Notification settings saved successfully!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestAlert = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await api.testNotificationAlert();
      if (res.status === 'success') {
        setStatusMsg({ type: 'success', text: 'Test alert sent successfully to your Telegram!' });
      } else {
        setStatusMsg({ type: 'error', text: res.message || 'Failed to send alert' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Telegram & Cloud Alert Center</h3>
              <p className="text-xs font-semibold text-slate-500">Instant push notifications on VM crashes and CPU spikes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className={`p-4 text-xs font-bold flex items-center space-x-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' 
              : 'bg-rose-50 text-rose-800 border-b border-rose-100'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Telegram Credentials */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telegram Bot API Token</label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.telegram_bot_token}
                  onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telegram Chat ID / User ID</label>
              <input
                type="text"
                value={settings.telegram_chat_id}
                onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                placeholder="e.g. 5955317017 or @your_channel"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Alert Trigger Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Automated Alert Triggers</div>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">Alert on VM Crash / Unexpected Stop</span>
              <input
                type="checkbox"
                checked={settings.alert_on_vm_state}
                onChange={(e) => setSettings({ ...settings, alert_on_vm_state: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">Alert on Node CPU &gt; 90% (Spike Guard)</span>
              <input
                type="checkbox"
                checked={settings.alert_on_high_cpu}
                onChange={(e) => setSettings({ ...settings, alert_on_high_cpu: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">Alert on Scheduled Backup Complete</span>
              <input
                type="checkbox"
                checked={settings.alert_on_backup_complete}
                onChange={(e) => setSettings({ ...settings, alert_on_backup_complete: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestAlert}
              disabled={testing || !settings.telegram_bot_token || !settings.telegram_chat_id}
              className="inline-flex items-center px-3.5 py-2 border border-slate-300 text-xs font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5 text-blue-600" />}
              <span>Send Test Alert</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
