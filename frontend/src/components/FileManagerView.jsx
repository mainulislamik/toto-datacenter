import React, { useState, useEffect } from 'react';
import { 
  Folder, File, FileText, Download, Trash2, Plus, 
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, 
  Save, X, HardDrive, Edit3, Eye
} from 'lucide-react';
import { api } from '../api';

export default function FileManagerView() {
  const [currentPath, setCurrentPath] = useState('/mnt/extra-vault');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Editor Modal
  const [editor, setEditor] = useState({ isOpen: false, path: '', content: '', saving: false });
  
  // New File/Folder Modal
  const [newModal, setNewModal] = useState({ isOpen: false, name: '', isDir: false });

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const loadFiles = async (path) => {
    setLoading(true);
    try {
      const res = await api.browseFiles(path);
      setItems(res.items || []);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to list directory.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    setCurrentPath(path);
  };

  const handleGoUp = () => {
    if (currentPath === '/' || currentPath === '/mnt/extra-vault') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parent = '/' + parts.join('/');
    setCurrentPath(parent || '/');
  };

  const handleOpenFile = async (item) => {
    if (item.is_dir) {
      handleNavigate(item.path);
    } else {
      try {
        const res = await api.readFileData(item.path);
        setEditor({ isOpen: true, path: item.path, content: res.content || '', saving: false });
      } catch (err) {
        setMsg({ type: 'error', text: err.message || 'Failed to read file.' });
      }
    }
  };

  const handleSaveFile = async () => {
    setEditor((prev) => ({ ...prev, saving: true }));
    try {
      await api.saveFileData(editor.path, editor.content);
      setMsg({ type: 'success', text: `Saved file: ${editor.path}` });
      setEditor({ isOpen: false, path: '', content: '', saving: false });
      await loadFiles(currentPath);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to save file.' });
      setEditor((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteItem = async (path) => {
    if (!confirm(`Are you sure you want to delete '${path}'?`)) return;
    try {
      await api.deleteFileOrDir(path);
      setMsg({ type: 'success', text: `Deleted: ${path}` });
      await loadFiles(currentPath);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to delete item.' });
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newModal.name) return;
    const fullPath = `${currentPath.replace(/\/$/, '')}/${newModal.name}`;
    try {
      await api.createFileOrDir(fullPath, newModal.isDir);
      setMsg({ type: 'success', text: `Created ${newModal.isDir ? 'folder' : 'file'}: ${newModal.name}` });
      setNewModal({ isOpen: false, name: '', isDir: false });
      await loadFiles(currentPath);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to create.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <HardDrive className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Cloud File Manager & Configs</h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              100GB Extra-Vault
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            In-browser visual file manager for ISO images, VM disk storage, backups, and configuration files.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setNewModal({ isOpen: true, name: '', isDir: false })}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New File/Folder</span>
          </button>
          <button
            onClick={() => loadFiles(currentPath)}
            disabled={loading}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'}`}>
          <div className="flex items-center space-x-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="font-black hover:opacity-75">✕</button>
        </div>
      )}

      {/* Path Breadcrumb & Browser */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Navigation Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGoUp}
              disabled={currentPath === '/mnt/extra-vault' || currentPath === '/'}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
              title="Go Up"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="font-mono text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              {currentPath}
            </div>
          </div>
          <div className="text-xs font-bold text-slate-500">
            {items.length} items
          </div>
        </div>

        {/* Files Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Size</th>
                <th className="px-6 py-3">Permissions</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Modified</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {items.map((item) => (
                <tr key={item.path} className="hover:bg-slate-50/75 transition">
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => handleOpenFile(item)}
                      className="flex items-center space-x-2 text-left group"
                    >
                      {item.is_dir ? (
                        <Folder className="w-4 h-4 text-amber-500 fill-amber-100 group-hover:scale-110 transition" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition" />
                      )}
                      <span className={`font-bold ${item.is_dir ? 'text-amber-900 group-hover:text-amber-700' : 'text-slate-800 group-hover:text-sky-600'}`}>
                        {item.name}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-700">{item.is_dir ? '—' : item.size_human}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{item.permissions}</td>
                  <td className="px-6 py-3.5 text-slate-600">{item.owner}</td>
                  <td className="px-6 py-3.5 text-slate-500">{item.modified}</td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {!item.is_dir && (
                        <button
                          onClick={() => handleOpenFile(item)}
                          className="p-1 rounded-lg text-slate-600 hover:bg-slate-100"
                          title="Edit File"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteItem(item.path)}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-Browser Editor Modal */}
      {editor.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white">{editor.path}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveFile}
                  disabled={editor.saving}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editor.saving ? 'Saving...' : 'Save File'}</span>
                </button>
                <button
                  onClick={() => setEditor({ isOpen: false, path: '', content: '', saving: false })}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              value={editor.content}
              onChange={(e) => setEditor((prev) => ({ ...prev, content: e.target.value }))}
              className="flex-1 p-4 bg-slate-900 text-emerald-300 font-mono text-xs focus:outline-hidden resize-none overflow-y-auto"
              rows={22}
            />
          </div>
        </div>
      )}

      {/* New File/Folder Modal */}
      {newModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Create New File or Directory</h3>
              <button onClick={() => setNewModal({ isOpen: false, name: '', isDir: false })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateNew} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={newModal.name}
                  onChange={(e) => setNewModal((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. config.yaml or new-folder"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-hidden focus:border-amber-500"
                  required
                />
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newModal.isDir}
                  onChange={(e) => setNewModal((prev) => ({ ...prev, isDir: e.target.checked }))}
                  className="w-4 h-4 rounded-sm text-amber-600 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-700">Create as Directory / Folder</span>
              </label>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewModal({ isOpen: false, name: '', isDir: false })}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-black text-xs font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
