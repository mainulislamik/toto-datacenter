import React, { useState } from 'react';
import { 
  Bot, Sparkles, Send, Terminal, Cpu, HardDrive, 
  CheckCircle2, AlertTriangle, ShieldCheck, Zap, RefreshCw
} from 'lucide-react';
import api from '../api';

export default function AICloudOpsView() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: "Hello Imon Sir! I am your Autonomous AI Cloud Architect. You can ask me to deploy VMs, trigger cluster backups, reclaim storage, or audit network security in natural language.",
      time: 'Just now'
    }
  ]);

  const handleSendPrompt = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userText = prompt;
    setPrompt('');
    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: userText, time: new Date().toLocaleTimeString() }
    ]);
    setLoading(true);

    try {
      const res = await api.executeAIOps(userText);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.message || 'Operation executed successfully.',
          action: res.action,
          time: new Date().toLocaleTimeString()
        }
      ]);
    } catch (e) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Error executing command: ${e.message}`,
          isError: true,
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Deploy a new Ubuntu VM with 2 vCPU and 2GB RAM",
    "Clean root storage by moving all ISOs to Extra-SSD",
    "Create a live ZSTD snapshot backup of VM #101",
    "Run security diagnostic and cluster health check"
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 border border-purple-200 text-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Cloud Architect & Autonomous Ops</h1>
              <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Antigravity AI Powered
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Execute complex datacenter operations, auto-scaling, and health audits with natural language prompts.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Chat Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {chatHistory.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {item.sender === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-xl p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                  item.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none'
                    : item.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-800 rounded-bl-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-bl-none'
                }`}
              >
                <p>{item.text}</p>
                {item.action && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Action Applied: {item.action}
                  </div>
                )}
                <span className="block text-[10px] text-slate-400 mt-1 text-right">{item.time}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                Executing cloud operation & orchestrating Proxmox nodes...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-bold shrink-0">Quick Ops:</span>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => setPrompt(qp)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold whitespace-nowrap transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleSendPrompt} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your command (e.g. 'Deploy Ubuntu VM with 2GB RAM' or 'Create backup')..."
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Execute</span>
          </button>
        </form>
      </div>
    </div>
  );
}