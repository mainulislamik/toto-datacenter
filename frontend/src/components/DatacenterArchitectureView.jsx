import React, { useState, useEffect } from 'react';
import { 
  Server, Zap, Shield, Cpu, HardDrive, RefreshCw, 
  CheckCircle2, AlertTriangle, Layers, Globe, Radio,
  Activity, ArrowRight, Wind, Lock, Info, ChevronRight
} from 'lucide-react';
import { api } from '../api';

export default function DatacenterArchitectureView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLayer, setActiveLayer] = useState('power_infrastructure');
  const [ipmiData, setIpmiData] = useState(null);
  const [bgpData, setBgpData] = useState(null);

  useEffect(() => {
    fetchBlueprint();
  }, []);

  const fetchBlueprint = async () => {
    setLoading(true);
    setError(null);
    try {
      const [archRes, ipmiRes, bgpRes] = await Promise.allSettled([
        api.getDatacenterArchitecture(),
        api.getIPMIStatus(),
        api.getBGPPeering()
      ]);

      if (archRes.status === 'fulfilled') setData(archRes.value);
      if (ipmiRes.status === 'fulfilled') setIpmiData(ipmiRes.value);
      if (bgpRes.status === 'fulfilled') setBgpData(bgpRes.value);
    } catch (err) {
      console.error("Failed to load datacenter architecture:", err);
      setError("Failed to fetch datacenter architecture blueprint.");
    } finally {
      setLoading(false);
    }
  };

  const currentLayerData = data?.layers?.find(l => l.id === activeLayer);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-indigo-500/20 backdrop-blur-md rounded-xl border border-indigo-400/30">
              <Layers className="w-6 h-6 text-indigo-300" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Datacenter Architecture & Operational Blueprint</h1>
          </div>
          <p className="text-indigo-100 text-sm max-w-3xl">
            Explore the complete 6-layer engineering anatomy of modern enterprise Tier-III+ datacenters: from high-voltage substation feeds and N+1 generator banks, to BGP upstream multi-homing, leaf-spine switching, KVM virtualization, and OpenZFS storage fabrics.
          </p>
        </div>
        <button
          onClick={fetchBlueprint}
          className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-sm transition-all border border-white/10 backdrop-blur-sm self-stretch md:self-auto justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Facility Tier Rating</span>
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{data?.tier_rating || "Tier III+ Resilient"}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Concurrently Maintainable</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Guaranteed SLA</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{data?.uptime_sla || "99.982%"}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Dual Power & Upstream Paths</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">BGP Transit Backbone</span>
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{bgpData?.asn || "AS65001"}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Telia + Hurricane Electric + BDIX</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Hardware Health (IPMI)</span>
            <Cpu className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{ipmiData?.system_health || "Optimal"}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Dual Redundant PSUs (230V AC)</div>
        </div>
      </div>

      {/* Main Interactive 6-Layer Datacenter Blueprint */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Layer Selection Navigation */}
        <div className="lg:col-span-4 space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
            Datacenter Infrastructure Stack (Layers 1 – 6)
          </h2>
          {data?.layers?.map((layer) => {
            const isSelected = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.01]'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                }`}
              >
                <div>
                  <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {layer.title}
                  </div>
                  <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {layer.category}
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Column: Layer Detailed Engineering Inspection */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          {currentLayerData ? (
            <div className="space-y-6">
              {/* Layer Header */}
              <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {currentLayerData.category}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">{currentLayerData.title}</h2>
                  <p className="text-slate-600 text-sm mt-1">{currentLayerData.summary}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {currentLayerData.status}
                </span>
              </div>

              {/* Component Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentLayerData.components.map((comp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 text-sm">{comp.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full">
                        {comp.status}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-700 mb-2">{comp.spec}</div>
                    
                    {/* Metadata attributes */}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                      {Object.entries(comp)
                        .filter(([k]) => !['name', 'spec', 'status'].includes(k))
                        .map(([k, v]) => (
                          <div key={k} className="bg-white px-2 py-1 rounded border border-slate-200">
                            <span className="text-slate-600 font-medium capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                            <span className="font-bold text-slate-900">{String(v)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Extra Layer Specific Telemetry Widget */}
              {activeLayer === 'power_infrastructure' && ipmiData && (
                <div className="mt-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <div className="font-bold text-indigo-950 text-sm mb-2 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span>Live Rack Power Telemetry (A+B Bus Feed)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {ipmiData.power_supplies?.map((psu, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-indigo-200/60">
                        <div className="font-bold text-slate-900">{psu.psu}</div>
                        <div className="text-slate-600 mt-1">Voltage: {psu.input_voltage} • Draw: <span className="font-bold text-indigo-600">{psu.power_draw_watts}W</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeLayer === 'network_transit_bgp' && bgpData && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="font-bold text-blue-950 text-sm mb-2 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Live BGP Upstream Peering Sessions</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {bgpData.peers?.map((peer, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-lg border border-blue-200/60 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{peer.peer_asn}</span>
                          <span className="text-slate-600 ml-2">({peer.peer_ip})</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-600">Routes: {peer.prefixes_received?.toLocaleString()}</span>
                          <span className="font-bold text-blue-600">{peer.latency_ms}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a layer to view operational specs.</div>
          )}
        </div>
      </div>
    </div>
  );
}
