import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, Download, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, Search, Filter, Shield, User
} from 'lucide-react';
import { api } from '../api';

export default function AuditLogsView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [msg, setMsg] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      if (res.status === 'success') {
        setEvents(res.events || []);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to fetch audit logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredEvents = events.filter((evt) => {
    const matchQ = !searchQ || 
      evt.action.toLowerCase().includes(searchQ.toLowerCase()) ||
      evt.actor.toLowerCase().includes(searchQ.toLowerCase()) ||
      evt.target.toLowerCase().includes(searchQ.toLowerCase()) ||
      evt.details.toLowerCase().includes(searchQ.toLowerCase());
    
    const matchSev = filterSeverity === 'ALL' || evt.severity === filterSeverity;
    return matchQ && matchSev;
  });

  const handleExportCSV = () => {
    const headers = ["ID", "Timestamp", "Actor", "Action", "Target", "Severity", "Status", "Details"];
    const rows = filteredEvents.map(e => [
      e.id, e.timestamp, `"${e.actor}"`, e.action, `"${e.target}"`, e.severity, e.status, `"${e.details}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `datacenter_audit_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            Compliance & Datacenter Audit Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-proof immutable event stream tracking all hypervisor commands, API executions, and access events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-sm ${
          msg.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit ledger by actor, action, target, or details..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO Only</option>
            <option value="WARN">WARN Only</option>
            <option value="CRITICAL">CRITICAL Only</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Actor</th>
                <th className="py-3 px-6">Action / Event</th>
                <th className="py-3 px-6">Target Resource</th>
                <th className="py-3 px-6">Severity</th>
                <th className="py-3 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-sans text-slate-500 whitespace-nowrap">{evt.timestamp}</td>
                  <td className="py-3.5 px-6 font-sans font-bold text-slate-900">{evt.actor}</td>
                  <td className="py-3.5 px-6 font-bold text-indigo-600">
                    <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded">
                      {evt.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-sans text-slate-700 font-semibold">{evt.target}</td>
                  <td className="py-3.5 px-6 font-sans">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      evt.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      evt.severity === 'WARN' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {evt.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-sans text-slate-600 max-w-md truncate">{evt.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
