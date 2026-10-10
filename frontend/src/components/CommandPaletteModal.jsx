import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Server, Zap, Shield, Archive, Terminal, 
  Cpu, ArrowRight, X, Sparkles, Plus, HardDrive
} from 'lucide-react';
import { api } from '../api';

export default function CommandPaletteModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      handleSearch('');
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (val) => {
    setQuery(val);
    setLoading(true);
    try {
      const res = await api.searchGlobal(val);
      setResults(res.results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    onClose();
    if (item.action) {
      onNavigate(item.action);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search VMs, containers, networks, or type a command..."
            className="flex-1 bg-transparent border-none text-slate-900 text-sm font-semibold focus:outline-none focus:ring-0 placeholder:text-slate-400"
          />
          <kbd className="px-2 py-0.5 text-2xs font-bold text-slate-500 bg-slate-200 border border-slate-300 rounded">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
          {loading && results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-semibold">Searching datacenter...</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-semibold">
              No results found for "{query}"
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item)}
                className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors">
                    {item.type === 'vm' ? <Server className="w-4 h-4" /> :
                     item.type === 'lxc' ? <Zap className="w-4 h-4" /> :
                     <Sparkles className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold">{item.subtitle}</div>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-2xs font-bold text-slate-500 px-4">
          <span>Navigate with mouse or keyboard</span>
          <span>TOTO CLOUD OS v2.5</span>
        </div>
      </div>
    </div>
  );
}
