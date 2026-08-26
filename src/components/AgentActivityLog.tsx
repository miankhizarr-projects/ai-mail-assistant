import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, Terminal, RefreshCw } from 'lucide-react';
import { AgentAction } from '../types';
import { api } from '../services/api';

export const AgentActivityLog: React.FC = () => {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAgentActions();
      setActions(data);
    } catch (err) {
      console.error('Failed to load agent actions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  return (
    <div className="flex-1 h-full bg-slate-950 text-slate-100 flex flex-col overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Agent Tool Activity Audit</h2>
            <p className="text-xs text-slate-400">
              Real-time audit log of tools executed by the AI Agent
            </p>
          </div>
        </div>

        <button
          onClick={fetchActions}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      <div className="space-y-3">
        {actions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
            No agent actions logged yet. Start a chat with the AI Agent to view executed tools.
          </div>
        ) : (
          actions.map(act => (
            <div
              key={act.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                    {act.tool}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  {act.status === 'completed' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Success
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Failed
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold mb-1">
                    Input Parameters
                  </div>
                  <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(act.input, null, 2)}
                  </pre>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold mb-1">
                    Tool Result Output
                  </div>
                  <pre className="text-slate-400 overflow-x-auto whitespace-pre-wrap line-clamp-6">
                    {JSON.stringify(act.output, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
