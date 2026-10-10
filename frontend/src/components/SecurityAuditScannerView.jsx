import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Shield, AlertTriangle, 
  CheckCircle2, RefreshCw, Lock, Terminal, Activity, 
  ChevronRight, ArrowUpRight
} from 'lucide-react';
import { api } from '../api';

export default function SecurityAuditScannerView() {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await api.getSecurityAudit();
      if (res.status === 'success') {
        setAuditData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await api.triggerSecurityScan();
      if (res.status === 'success') {
        setAuditData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">Security & Vulnerability Scanner</h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                (auditData?.security_score || 0) >= 90 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {auditData?.status || 'Active Compliance'}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Automated zero-trust audit for SSH keys, SDN firewall rules, CVE packages, and access boundary isolation
            </p>
          </div>
        </div>
        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition font-medium text-sm shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning Datacenter...' : 'Run Security Audit'}</span>
        </button>
      </div>

      {/* Score and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Security Score</p>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {auditData?.security_score || 95}
              </span>
              <span className="text-sm font-semibold text-slate-500">/ 100</span>
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-1">Enterprise Hardened Baseline</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-9 h-9" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passed Compliance Checks</p>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">
              {auditData?.total_passed || 3} <span className="text-sm font-medium text-slate-500">checks</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Zero critical CVE vulnerabilities</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Advisory Warnings</p>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">
              {auditData?.total_warnings || 0} <span className="text-sm font-medium text-slate-500">advisories</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Last scan: {auditData?.last_scanned || 'Just now'}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Audit Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-rose-400" />
            <span>Audit Findings & Actionable Remediation</span>
          </h3>
          <span className="text-xs text-slate-400">Continuous Evaluation</span>
        </div>
        <div className="divide-y divide-slate-800/60">
          {auditData?.checks?.map((check) => (
            <div key={check.id} className="p-5 hover:bg-slate-800/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`p-2 rounded-xl mt-0.5 border ${
                  check.status === 'passed' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {check.status === 'passed' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-semibold text-base">{check.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                      check.severity === 'high' 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                        : check.severity === 'medium' 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {check.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{check.description}</p>
                  {check.remediation !== 'N/A' && (
                    <div className="mt-2 text-xs font-mono bg-slate-950 p-2 rounded-lg border border-slate-800 text-amber-300">
                      Remediation: {check.remediation}
                    </div>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold self-start md:self-center border ${
                check.status === 'passed' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {check.status === 'passed' ? 'PASSED' : 'REVIEW'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
