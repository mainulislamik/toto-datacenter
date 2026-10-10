import React, { useState, useEffect } from 'react';
import { 
  Cpu, Zap, CheckCircle2, AlertTriangle, RefreshCw, 
  Layers, HardDrive, ArrowRight, ShieldCheck, Play, Activity
} from 'lucide-react';
import { api } from '../api';

export default function GPUPassthroughView() {
  const [gpuData, setGpuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVM, setSelectedVM] = useState(101);
  const [msg, setMsg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getHardwareGPUs();
      if (res.status === 'success') {
        setGpuData(res);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to query PCIe hardware devices' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignGPU = async (pciId) => {
    try {
      const res = await api.assignGPUToVM({ pci_id: pciId, vmid: parseInt(selectedVM) });
      if (res.status === 'success') {
        setMsg({ type: 'success', text: res.message });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to attach PCIe GPU to VM' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-indigo-600" />
            PCIe GPU Passthrough & AI Accelerators
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Directly attach physical GPUs (Intel Arc A770 16GB / NVIDIA) to KVM Virtual Machines for zero-overhead AI training and LLM inference.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Devices"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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

      {/* IOMMU Status Banner */}
      <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Hypervisor Kernel IOMMU State
          </div>
          <h3 className="text-xl font-bold">Intel VT-d & VFIO Passthrough Active</h3>
          <p className="text-xs text-indigo-200 max-w-xl">
            IOMMU interrupt remapping is enabled on Linux Kernel 7.0. Devices in isolated groups can be attached with raw PCIe gen 4.0 bandwidth.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-indigo-300">Target VM for Passthrough</div>
            <select
              value={selectedVM}
              onChange={(e) => setSelectedVM(e.target.value)}
              className="mt-1 bg-indigo-950 border border-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="101">VM #101 (Ubuntu-Server-24.04)</option>
              <option value="102">VM #102 (AI-Inference-Node)</option>
            </select>
          </div>
        </div>
      </div>

      {/* GPU Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gpuData?.devices?.map((gpu) => (
          <div key={gpu.pci_id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
                  {gpu.pci_id}
                </span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {gpu.iommu_group}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{gpu.device_name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Vendor: <strong>{gpu.vendor}</strong> • Driver: <code className="font-mono">{gpu.driver_in_use}</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Dedicated VRAM</div>
                  <div className="text-sm font-bold text-slate-800">{gpu.vram_human}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Passthrough Engine</div>
                  <div className="text-sm font-bold text-emerald-600">VFIO-PCI Ready</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Status: <strong className="text-slate-800">{gpu.status}</strong>
              </span>
              <button
                onClick={() => handleAssignGPU(gpu.pci_id)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-100 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                Attach to VM #{selectedVM}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
