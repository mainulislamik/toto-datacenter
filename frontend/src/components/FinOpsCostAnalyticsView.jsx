import React, { useState, useEffect } from 'react';
import { 
  CreditCard, TrendingDown, PieChart, Activity, Skull, 
  Trash2, Archive, DollarSign, Clock, CheckCircle2
} from 'lucide-react';
import { api } from '../api';

const FinOpsCostAnalyticsView = () => {
  const [data, setData] = useState({ cost_breakdown: [], zombie_resources: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getFinOpsAnalytics();
      setData(res);
    } catch (err) { }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-green-400" />
        FinOps & Cost Optimizer
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 bg-gradient-to-br from-slate-900 to-green-950/20">
          <h3 className="text-slate-400 text-sm font-medium mb-1">Current Monthly Burn</h3>
          <div className="text-4xl font-bold text-white mb-2">{data.monthly_burn_rate}</div>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Projected: {data.projected_cost}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-400" /> Cost Breakdown
        </h3>
        <div className="space-y-4">
          {data.cost_breakdown?.map((c, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{c.service}</span>
                <span className="text-slate-100 font-medium">{c.cost} ({c.percent}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.percent}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 border-amber-500/20 border">
        <h3 className="text-lg font-semibold text-amber-300 mb-4 flex items-center gap-2">
           Idle Zombie Resources Detective
        </h3>
        {data.zombie_resources?.map((z, i) => (
          <div key={i} className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div>
              <h4 className="text-slate-200 font-medium">{z.name} (VM {z.vmid})</h4>
              <p className="text-sm text-slate-400 mt-1">{z.reason}</p>
            </div>
            <div className="mt-3 md:mt-0 flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-green-400 font-bold">Save {z.savings_potential}</div>
                <div className="text-xs text-slate-500">{z.suggested_action}</div>
              </div>
              <button className="btn-primary text-sm flex items-center gap-2 bg-amber-600 hover:bg-amber-500 border-amber-500 text-white">
                <Archive className="w-4 h-4" /> Snapshot & Archive
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default FinOpsCostAnalyticsView;