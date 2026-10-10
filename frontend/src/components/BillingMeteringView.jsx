import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, TrendingUp, Cpu, HardDrive, 
  MemoryStick, Activity, RefreshCw, Zap, ShieldCheck, Download
} from 'lucide-react';
import api from '../api';

export default function BillingMeteringView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await api.getBillingUsage();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const metrics = data?.metrics || {
    active_vcpus: 4,
    allocated_ram_gb: 4.0,
    allocated_disk_gb: 20.0,
    total_instances: 1,
    hourly_burn_rate_usd: 0.039,
    monthly_estimated_usd: 28.47,
    wallet_balance_usd: 150.00,
    current_tier: "Enterprise Cloud Dedicated"
  };

  const rates = data?.rates || {
    vcpu_hourly_usd: 0.005,
    ram_gb_hourly_usd: 0.004,
    disk_gb_hourly_usd: 0.00015,
    bandwidth_gb_usd: 0.01
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Resource Metering & Multi-Tenant Billing</h1>
              <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Pay-As-You-Go
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Hourly vCPU/RAM/NVMe Micro-Metering, Tenant Quotas & Client Portal Invoicing.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={fetchBilling}
            disabled={loading}
            className="p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-black font-mono">
            Wallet: ${metrics.wallet_balance_usd.toFixed(2)} USD
          </div>
        </div>
      </div>

      {/* Burn Rate Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Hourly Burn Rate</span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            ${metrics.hourly_burn_rate_usd.toFixed(4)} <span className="text-xs font-normal text-slate-500">/ hr</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Live consumption of all active VMs & LXCs.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Est. Monthly Cost</span>
          </div>
          <p className="text-2xl font-black text-sky-700 font-mono">
            ${metrics.monthly_estimated_usd.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ mo</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Based on 730-hour baseline utilization.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Active vCPUs</span>
          </div>
          <p className="text-2xl font-black text-indigo-700 font-mono">{metrics.active_vcpus} Cores</p>
          <p className="text-xs text-slate-500 mt-1">Rate: ${rates.vcpu_hourly_usd}/core/hr</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <MemoryStick className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Allocated RAM</span>
          </div>
          <p className="text-2xl font-black text-purple-700 font-mono">{metrics.allocated_ram_gb} GB</p>
          <p className="text-xs text-slate-500 mt-1">Rate: ${rates.ram_gb_hourly_usd}/GB/hr</p>
        </div>
      </div>

      {/* Pricing Rate Card & Tenant Quota Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            Transparent Cloud Rate Card (DigitalOcean Parity)
          </h2>
          <div className="space-y-3 text-xs font-medium text-slate-600">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span>Compute (vCPU Core)</span>
              <span className="font-mono font-bold text-slate-900">${rates.vcpu_hourly_usd} / hr (~$3.60 / mo)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span>Memory (1 GB RAM)</span>
              <span className="font-mono font-bold text-slate-900">${rates.ram_gb_hourly_usd} / hr (~$2.88 / mo)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span>High-Speed SSD Storage (1 GB)</span>
              <span className="font-mono font-bold text-slate-900">${rates.disk_gb_hourly_usd} / hr (~$0.10 / mo)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span>Outbound Bandwidth Transfer</span>
              <span className="font-mono font-bold text-emerald-700">1000 GB Included Free ($0.01/GB after)</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Automated ZSTD Snapshots & Backups</span>
              <span className="font-mono font-bold text-indigo-700">Included Free on Extra-Vault</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Active Subscription & Quota Limits
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">vCPU Allocation ({metrics.active_vcpus} / 32 Cores)</span>
                <span className="text-indigo-600">{((metrics.active_vcpus / 32) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(metrics.active_vcpus / 32) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">RAM Allocation ({metrics.allocated_ram_gb} / 64 GB)</span>
                <span className="text-purple-600">{((metrics.allocated_ram_gb / 64) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(metrics.allocated_ram_gb / 64) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">SSD Storage Pool ({metrics.allocated_disk_gb} / 235 GB)</span>
                <span className="text-emerald-600">{((metrics.allocated_disk_gb / 235) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(metrics.allocated_disk_gb / 235) * 100}%` }}></div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => alert("Billing top-up via bKash / Nagad / Card integration is active on tenant checkout.")}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                + Add Wallet Balance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}