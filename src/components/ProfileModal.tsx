import React from 'react';
import { X, UserCheck, Mail, ShieldCheck, LogOut, Settings, Calendar, Sparkles } from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenSettings,
  onSignOut
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">User Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Avatar & Name Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full border-2 border-indigo-500/50 object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white uppercase shadow-lg">
                {user.name ? user.name[0] : 'G'}
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-slate-100">{user.name || 'Google User'}</h3>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> {user.email}
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Account Connected</span>
            </div>
          </div>

          {/* Account Details List */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-500">Account ID</span>
              <span className="font-mono text-slate-300 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {user.id}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-500">Authentication</span>
              <span className="text-slate-200 font-medium">Google OAuth 2.0</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">AI Assistant Mode</span>
              <span className="text-indigo-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Gemini Autonomous
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="px-4 py-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
