import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  DownloadCloud, 
  Layers, 
  FolderPlus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../api';

export default function StorageView() {
  const [isos, setIsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Direct ISO Download Form
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const fetchISOs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getISOs();
      setIsos(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch ISO vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchISOs();
  }, []);

  const handleDownloadISO = async (e) => {
    e.preventDefault();
    if (!downloadUrl) return;
    setDownloadLoading(true);
    setDownloadSuccess(null);
    setError(null);
    try {
      const res = await api.uploadISOFromURL(downloadUrl, downloadFilename);
      setDownloadSuccess(`ISO download initiated: ${res.filename || 'OS Image'}`);
      setDownloadUrl('');
      setDownloadFilename('');
      setTimeout(fetchISOs, 3000);
    } catch (err) {
      setError(err.message || 'Failed to trigger ISO download');
    } finally {
      setDownloadLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Datacenter Storage & ISO Vault
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Physical SSD Pools & Virtual Boot Images on Second Drive (/dev/sda1)
          </p>
        </div>

        <button
          onClick={fetchISOs}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Vault</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-lg text-rose-900 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchISOs} className="underline font-bold text-xs">Dismiss</button>
        </div>
      )}

      {downloadSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-lg text-emerald-900 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Storage Pools Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pool 1: local-lvm */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">local-lvm (Thin Pool)</h3>
                <p className="text-xs text-slate-500 font-mono">Location: /dev/pve/data</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              ACTIVE
            </span>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Allocated Capacity</span>
              <span>135.84 GB VirtIO Storage</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-sky-600 h-2 rounded-full" style={{ width: '2%' }}></div>
            </div>
            <p className="text-xs text-slate-400">
              Optimized for high-speed QEMU Virtual Machine raw disk images and snapshots.
            </p>
          </div>
        </div>

        {/* Pool 2: local directory */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">local (Directory)</h3>
                <p className="text-xs text-slate-500 font-mono">Location: /var/lib/vz</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              ACTIVE
            </span>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>ISO & Backup Storage</span>
              <span>17.39 GB Ext4 Volume</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '18%' }}></div>
            </div>
            <p className="text-xs text-slate-400">
              Dedicated repository for bootable OS ISO templates and container archives.
            </p>
          </div>
        </div>
      </div>

      {/* ISO Direct Downloader Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold">
            <DownloadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">1-Click ISO Image Downloader</h3>
            <p className="text-xs text-slate-500">Fetch custom Linux, Windows, or BSD ISOs directly into Proxmox</p>
          </div>
        </div>

        <form onSubmit={handleDownloadISO} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Direct Download URL (HTTP / HTTPS)
              </label>
              <input
                type="url"
                required
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://releases.ubuntu.com/24.04/ubuntu-24.04-live-server-amd64.iso"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Filename (Optional)
              </label>
              <input
                type="text"
                value={downloadFilename}
                onChange={(e) => setDownloadFilename(e.target.value)}
                placeholder="ubuntu-24.04.iso"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-semibold">Suggested:</span>
              <button
                type="button"
                onClick={() => {
                  setDownloadUrl('https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/x86_64/alpine-virt-3.20.3-x86_64.iso');
                  setDownloadFilename('alpine-virt-3.20.3.iso');
                }}
                className="text-sky-700 hover:underline"
              >
                Alpine Virt (60MB)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setDownloadUrl('https://cloud-images.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-cloudimg-amd64.img');
                  setDownloadFilename('ubuntu-24.04-cloud.img');
                }}
                className="text-sky-700 hover:underline"
              >
                Ubuntu 24.04 Server
              </button>
            </div>

            <button
              type="submit"
              disabled={downloadLoading}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>{downloadLoading ? 'Initiating Download...' : 'Download to Proxmox'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Available ISO List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Installed ISO Images in Vault
            </h3>
            <p className="text-xs text-slate-500">Ready for VM Provisioning</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
            {isos.length} Images Available
          </span>
        </div>

        {isos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No ISO images uploaded yet. Use the 1-Click downloader above or upload directly from Proxmox GUI.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {isos.map((iso) => (
              <div key={iso.volid} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4 text-sky-700" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {iso.volid.replace('local:iso/', '')}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{iso.volid}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                    {formatBytes(iso.size)}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    READY
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
