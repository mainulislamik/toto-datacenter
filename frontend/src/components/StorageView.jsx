import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, 
  Download, 
  Upload, 
  Disc, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Search,
  FileCheck,
  Zap,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function StorageView() {
  const [isos, setIsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // 1-Click URL Download
  const [downloadUrl, setDownloadUrl] = useState('https://releases.ubuntu.com/24.04.1/ubuntu-24.04.1-live-server-amd64.iso');
  const [downloadFilename, setDownloadFilename] = useState('ubuntu-24.04-live-server.iso');
  const [downloading, setDownloading] = useState(false);
  const [urlAnalysis, setUrlAnalysis] = useState(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  // Search filter
  const [searchFilter, setSearchFilter] = useState('');

  const loadISOs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getISOs();
      setIsos(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadISOs();
    handleAnalyzeUrl(downloadFilename);
  }, []);

  const handleAnalyzeUrl = async (name) => {
    if (!name) return;
    try {
      const res = await api.analyzeISOName(name);
      setUrlAnalysis(res);
    } catch (e) {
      // silent
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    try {
      const res = await api.analyzeISOName(file.name);
      setFileAnalysis(res);
    } catch (e) {
      // silent
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.uploadISOFile(formData);
      setSuccessMsg(`ISO Uploaded & Classified Successfully: ${res.analysis?.distro || res.filename}`);
      setSelectedFile(null);
      setFileAnalysis(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadISOs();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!downloadUrl) return;
    setDownloading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const res = await api.uploadISOFromURL(downloadUrl, downloadFilename);
      setSuccessMsg(`ISO Download started on Proxmox Node! Detected as: ${res.analysis?.distro || res.filename}`);
      loadISOs();
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const filteredISOs = isos.filter(i => {
    const fn = (i.filename || i.volid || '').toLowerCase();
    const distro = (i.analysis?.distro || '').toLowerCase();
    const q = searchFilter.toLowerCase();
    return fn.includes(q) || distro.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <HardDrive className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Storage & Intelligent ISO Vault
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> AI Auto-Classifier
              </span>
            </h2>
            <p className="text-sm text-slate-500">
              Manage ISO images with automatic OS detection, architecture matching, and hardware spec recommendations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadISOs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Vault
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Dual Ingestion Grid: Direct Upload & URL Download */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Local File Upload with Live AI Analyzer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Direct ISO File Upload</h3>
                  <p className="text-xs text-slate-500">Upload bootable ISO file from your computer</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                PVD Parser Ready
              </span>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-xl p-6 text-center transition cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".iso,.img"
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white shadow-sm border border-slate-200 rounded-full text-indigo-600 mb-2">
                  <Disc className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Click to select ISO file or drag and drop'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Supports standard bootable .iso and .img'}
                </p>
              </div>
            </div>

            {/* Live AI Classification Card for Selected File */}
            {fileAnalysis && (
              <div className="mt-4 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Classification Detected
                  </span>
                  <span className="text-xs px-2 py-0.5 font-bold rounded bg-indigo-600 text-white">
                    {fileAnalysis.category}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {fileAnalysis.distro} ({fileAnalysis.version})
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {fileAnalysis.description}
                </p>
                <div className="mt-3 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs text-slate-700">
                  <span>Recommended Specs:</span>
                  <span className="font-semibold text-indigo-900">
                    {fileAnalysis.recommended_specs.cores} vCPU • {fileAnalysis.recommended_specs.memory_mb} MB RAM • {fileAnalysis.recommended_specs.disk_gb} GB SSD
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Streaming & Storing in Vault...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Classify to Vault
                </>
              )}
            </button>
          </div>
        </div>

        {/* Module 2: 1-Click URL Downloader with Instant AI Classifier */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">1-Click Remote ISO Downloader</h3>
                  <p className="text-xs text-slate-500">Download directly to Proxmox hypervisor storage</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Direct SSH Stream
              </span>
            </div>

            <form onSubmit={handleDownload} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Remote ISO Image Direct URL:
                </label>
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => {
                    setDownloadUrl(e.target.value);
                    const suggestedName = e.target.value.split('/').pop()?.split('?')[0] || 'os.iso';
                    setDownloadFilename(suggestedName);
                    handleAnalyzeUrl(suggestedName);
                  }}
                  placeholder="https://releases.ubuntu.com/24.04/.../ubuntu-server.iso"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Target Filename:
                </label>
                <input
                  type="text"
                  value={downloadFilename}
                  onChange={(e) => {
                    setDownloadFilename(e.target.value);
                    handleAnalyzeUrl(e.target.value);
                  }}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Classifier Card for URL */}
              {urlAnalysis && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Target OS Classification
                    </span>
                    <span className="text-xs px-2 py-0.5 font-bold rounded bg-emerald-700 text-white">
                      {urlAnalysis.category}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {urlAnalysis.distro} ({urlAnalysis.version})
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {urlAnalysis.tags?.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={downloading}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Dispatching to Proxmox Node...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-emerald-400" />
                      Download to Proxmox Vault
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ISO Vault Table with AI Detection Badges */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Installed ISO Images in Vault ({filteredISOs.length})
            </h3>
            <p className="text-xs text-slate-500">
              Classified operating system images ready for 1-click VM creation and boot attachment.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by OS or filename..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Scanning Proxmox storage vault...</p>
          </div>
        ) : filteredISOs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="p-4 bg-slate-50 rounded-full border border-slate-200 text-slate-400">
              <Disc className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">No ISO images found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload or download an ISO above to start provisioning virtual machines.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Operating System & Distro</th>
                  <th className="px-6 py-3.5">Classification & Category</th>
                  <th className="px-6 py-3.5">Architecture & Boot</th>
                  <th className="px-6 py-3.5">Size & Storage</th>
                  <th className="px-6 py-3.5">Recommended Hardware</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredISOs.map((iso, idx) => {
                  const analysis = iso.analysis || {};
                  const sizeMB = iso.size ? (iso.size / (1024 * 1024)).toFixed(0) : '—';
                  const sizeGB = iso.size ? (iso.size / (1024 * 1024 * 1024)).toFixed(2) : null;
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex-shrink-0">
                            <Disc className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {analysis.distro || iso.filename}
                              {analysis.version && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {analysis.version}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-slate-400 mt-0.5">
                              {iso.filename || iso.volid}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {analysis.category || 'General OS'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {analysis.tags?.slice(0, 3).map((t, tidx) => (
                              <span key={tidx} className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-800">
                          {analysis.arch || 'x86_64'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {analysis.boot_type || 'UEFI / BIOS'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-800">
                          {sizeGB ? `${sizeGB} GB` : `${sizeMB} MB`}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          local:iso
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {analysis.recommended_specs ? (
                          <div className="text-xs text-slate-600">
                            <div className="font-semibold text-slate-900">
                              {analysis.recommended_specs.cores} vCPU / {analysis.recommended_specs.memory_mb} MB RAM
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Min SSD: {analysis.recommended_specs.disk_gb} GB
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <FileCheck className="w-3.5 h-3.5" /> Ready for VM
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
