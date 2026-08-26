import React, { useState } from 'react';
import { Mail, Bot, Settings, LogOut, CheckCircle2, AlertTriangle, RefreshCw, Layers, Plus } from 'lucide-react';
import { User } from '../types';
import { api, setCachedAccessToken } from '../services/api';

interface NavbarProps {
  user: User | null;
  isConnected: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenCompose: () => void;
  onOpenTemplates: () => void;
  onConnectSuccess: (token: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isConnected,
  onRefresh,
  onOpenSettings,
  onOpenCompose,
  onOpenTemplates,
  onConnectSuccess
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      const url = await api.getGoogleAuthUrl();
      const popup = window.open(url, 'oauth_popup', 'width=600,height=700');

      if (!popup) {
        alert('Please allow popups to authorize Gmail access.');
        setIsConnecting(false);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.accessToken) {
          window.removeEventListener('message', handleMessage);
          setCachedAccessToken(event.data.accessToken);
          onConnectSuccess(event.data.accessToken);
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err: any) {
      console.error('OAuth connect error:', err);
      alert('Could not initiate Google OAuth: ' + (err.message || 'Check .env settings'));
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setCachedAccessToken(null);
    onRefresh();
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-tight text-slate-100">Mail Assistant</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              AI Agent
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Autonomous Gmail Intelligence & Task Automation
          </p>
        </div>
      </div>

      {/* Center Status Badge */}
      <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3.5 py-1 text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-medium text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connected: {user?.email || 'Google Account'}</span>
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-xl transition-all"
          title="HTML Email Template System"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Templates</span>
        </button>

        <button
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Refresh Inbox Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name || 'Google User'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
              {user?.name ? user.name[0] : 'G'}
            </div>
          )}

          <div className="hidden lg:block text-left text-xs">
            <div className="font-semibold text-slate-100 truncate max-w-[120px]">
              {user?.name || 'Google User'}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
              {user?.email}
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors ml-1"
            title="Sign Out of Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
