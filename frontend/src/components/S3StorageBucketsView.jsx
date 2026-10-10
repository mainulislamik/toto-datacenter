import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, Trash2, CheckCircle2, AlertTriangle, 
  RefreshCw, HardDrive, Globe, Lock, Download, File, Folder
} from 'lucide-react';
import { api } from '../api';

export default function S3StorageBucketsView() {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newVisibility, setNewVisibility] = useState('Private');
  const [creating, setCreating] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchBuckets = async () => {
    setLoading(true);
    try {
      const res = await api.getS3Buckets();
      if (res.status === 'success') {
        setBuckets(res.buckets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  const handleCreateBucket = async (e) => {
    e.preventDefault();
    if (!newBucketName) return;
    setCreating(true);
    try {
      await api.createS3Bucket({ name: newBucketName, visibility: newVisibility });
      setShowCreateModal(false);
      setNewBucketName('');
      setStatusMsg({ type: 'success', text: `Bucket '${newBucketName}' created successfully!` });
      fetchBuckets();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to create bucket' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBucket = async (bucketName) => {
    if (!confirm(`Are you sure you want to delete bucket '${bucketName}' and its objects?`)) return;
    try {
      await api.deleteS3Bucket(bucketName);
      setStatusMsg({ type: 'success', text: `Bucket '${bucketName}' deleted.` });
      fetchBuckets();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to delete bucket' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 shadow-inner">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">S3 Object Storage Buckets</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                100GB Extra-SSD
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              High-throughput S3-compatible object storage for media assets, database dumps, and cloud backups
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBuckets}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition font-medium text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bucket</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm border ${
          statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
        }`}>
          <div className="flex items-center space-x-3">
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Buckets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buckets.map((bucket) => (
          <div key={bucket.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg hover:border-slate-700 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                  <Database className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    bucket.visibility === 'Public-Read' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {bucket.visibility === 'Public-Read' ? <Globe className="w-3 h-3 inline mr-1" /> : <Lock className="w-3 h-3 inline mr-1" />}
                    {bucket.visibility}
                  </span>
                  <button
                    onClick={() => handleDeleteBucket(bucket.name)}
                    className="p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mt-4 tracking-tight">{bucket.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">s3://{bucket.name}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Storage Used</p>
                <p className="text-slate-200 font-bold mt-0.5">{bucket.size_human}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Objects</p>
                <p className="text-cyan-400 font-bold mt-0.5">{bucket.objects_count} files</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Bucket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>Create S3 Storage Bucket</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateBucket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Bucket Name</label>
                <input
                  type="text"
                  required
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="e.g. app-assets-vault"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Access Visibility</label>
                <select
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Private">Private (Auth & Signed URLs Only)</option>
                  <option value="Public-Read">Public-Read (Direct CDN Access)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-medium transition"
                >
                  {creating ? 'Creating...' : 'Create Bucket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
