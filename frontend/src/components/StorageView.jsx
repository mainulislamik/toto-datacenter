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
  ShieldCheck,
  Tag,
  Check
} from 'lucide-react';
import { api } from '../api';

export default function StorageView({ onSelectISOForVM }) {
  const [pools, setPools] = useState([]);
  const [isos, setIsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef(null);

  // URL Download state
  const [downloadUrl, setDownloadUrl] = useState('https://releases.ubuntu.com/24.04.1/ubuntu-24.04.1-live-server-amd64.iso');
  const [downloadFilename, setDownloadFilename] = useState('ubuntu-24.04.1-live-server-amd64.iso');
  const [urlAnalysis, setUrlAnalysis] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [deletingVolid, setDeletingVolid] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteISO = async (volid, name) => {
    const displayName = name || volid;
    if (!window.confirm(`Are you sure you want to permanently remove "${displayName}" from the storage vault?`)) {
      return;
    }
    setDeletingVolid(volid);
    setError(null);
    setSuccessMsg('');
    try {
      await api.deleteISO(volid);
      setSuccessMsg(`Successfully deleted ${displayName} from ISO vault.`);
      await loadData();
    } catch (err) {
      setError(`Failed to delete ISO: ${err.message}`);
    } finally {
      setDeletingVolid(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [poolsData, isosData] = await Promise.all([
        api.getStoragePools().catch(() => []),
        api.getISOs().catch(() => [])
      ]);
      setPools(poolsData);
      setIsos(isosData);
      if (downloadFilename) {
        checkUrlAnalysis(downloadFilename);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadISOs = async () => {
    try {
      const isosData = await api.getISOs();
      setIsos(isosData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadProgress(0);
    setUploadStats(null);
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
    setUploadProgress(0);
    setError(null);
    setSuccessMsg('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const res = await api.uploadISOFile(formData, (percent, loaded, total) => {
        setUploadProgress(percent);
        setUploadStats({
          loadedMB: (loaded / (1024 * 1024)).toFixed(1),
          totalMB: (total / (1024 * 1024)).toFixed(1)
        });
      });

      setSuccessMsg(`ISO Uploaded & Classified Successfully: ${res.analysis?.distro || res.filename}`);
      setSelectedFile(null);
      setFileAnalysis(null);
      setUploadProgress(0);
      setUploadStats(null);
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

  const checkUrlAnalysis = async (filename) => {
    try {
      const res = await api.analyzeISOName(filename);
      setUrlAnalysis(res);
    } catch (e) {
      // silent
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
            onClick={loadData}
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

            <div 
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-xl p-6 text-center transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
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

            {/* Live Upload Progress Bar */}
            {uploading && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    {uploadProgress < 100 ? 'Streaming ISO to Proxmox Staging...' : 'Storing into Proxmox Vault...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {uploadStats && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Transferred: {uploadStats.loadedMB} MB</span>
                    <span>Total: {uploadStats.totalMB} MB</span>
                  </div>
                )}
              </div>
            )}

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
                High Speed Async
              </span>
            </div>

            <form onSubmit={handleDownload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Direct ISO Download URL
                </label>
                <input
                  type="url"
                  required
                  value={downloadUrl}
                  onChange={(e) => {
                    setDownloadUrl(e.target.value);
                    const fn = e.target.value.split('/').pop().split('?')[0];
                    if (fn && fn.endsWith('.iso')) {
                      setDownloadFilename(fn);
                      checkUrlAnalysis(fn);
                    }
                  }}
                  placeholder="https://releases.ubuntu.com/24.04/ubuntu-24.04-live-server-amd64.iso"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Filename (.iso)
                </label>
                <input
                  type="text"
                  required
                  value={downloadFilename}
                  onChange={(e) => {
                    setDownloadFilename(e.target.value);
                    checkUrlAnalysis(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-800"
                />
              </div>
            </form>

            {/* Live AI Classification Card for URL */}
            {urlAnalysis && (
              <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> AI Classification Detected
                  </span>
                  <span className="text-xs px-2 py-0.5 font-bold rounded bg-emerald-600 text-white">
                    {urlAnalysis.category}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {urlAnalysis.distro} ({urlAnalysis.version})
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {urlAnalysis.description}
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-xs text-slate-700">
                  <span>Recommended Specs:</span>
                  <span className="font-semibold text-emerald-900">
                    {urlAnalysis.recommended_specs.cores} vCPU • {urlAnalysis.recommended_specs.memory_mb} MB RAM • {urlAnalysis.recommended_specs.disk_gb} GB SSD
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleDownload}
              disabled={!downloadUrl || downloading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Initiating Proxmox Download...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download to Proxmox
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Physical Storage Pools */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-600" />
          Active Physical Storage Pools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map((p, idx) => {
            const usedGB = ((p.used || 0) / (1024 * 1024 * 1024)).toFixed(2);
            const totalGB = ((p.total || 0) / (1024 * 1024 * 1024)).toFixed(2);
            const pct = p.total ? Math.round((p.used / p.total) * 100) : 0;
            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{p.storage}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                    {p.type.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Capacity Usage</span>
                    <span className="font-medium text-slate-700">{usedGB} GB / {totalGB} GB ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Target Content: {p.content || 'images, iso, rootdir'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ISO Images Vault Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Disc className="w-5 h-5 text-indigo-600" />
              Installed Bootable ISO Vault ({filteredISOs.length})
            </h3>
            <p className="text-xs text-slate-500">All available OS images ready for 1-click VM creation</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search OS, distro or filename..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">OS & Distribution</th>
                <th className="px-6 py-3.5">Category & Arch</th>
                <th className="px-6 py-3.5">Recommended Hardware</th>
                <th className="px-6 py-3.5">File Size</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredISOs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <Disc className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No ISO images found in vault. Upload or download an ISO above.
                  </td>
                </tr>
              ) : (
                filteredISOs.map((iso, idx) => {
                  const sizeMB = ((iso.size || 0) / (1024 * 1024)).toFixed(1);
                  const analysis = iso.analysis || {};
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Disc className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <span>{analysis.distro || iso.filename}</span>
                          {analysis.version && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                              v{analysis.version}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {iso.filename}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            analysis.os_family === 'Windows' ? 'bg-blue-100 text-blue-800' :
                            analysis.os_family === 'BSD' ? 'bg-orange-100 text-orange-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {analysis.category || 'Linux OS'}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">
                            {analysis.arch || 'x86_64'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {analysis.recommended_specs ? (
                          <div className="text-xs text-slate-700 flex items-center gap-2">
                            <span className="font-medium bg-slate-100 px-2 py-1 rounded">
                              {analysis.recommended_specs.cores} vCPU
                            </span>
                            <span className="font-medium bg-slate-100 px-2 py-1 rounded">
                              {analysis.recommended_specs.memory_mb} MB RAM
                            </span>
                            <span className="font-medium bg-slate-100 px-2 py-1 rounded">
                              {analysis.recommended_specs.disk_gb} GB Disk
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {sizeMB} MB
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectISOForVM && onSelectISOForVM(iso.volid, analysis)}
                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                            title="Launch new VM with this ISO"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Launch VM
                          </button>
                          <button
                            onClick={() => handleDeleteISO(iso.volid, iso.filename || analysis.distro)}
                            disabled={deletingVolid === iso.volid}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 border border-rose-200/60"
                            title="Remove ISO from storage"
                          >
                            {deletingVolid === iso.volid ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
