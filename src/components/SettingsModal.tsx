import React, { useState, useEffect } from 'react';
import { X, UserCheck, Sparkles, Sliders, Database, Check, Star, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnectedToGmail: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isConnectedToGmail
}) => {
  const [replyTone, setReplyTone] = useState<'professional' | 'friendly' | 'concise'>('professional');
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [autoExtractTasks, setAutoExtractTasks] = useState(true);
  const [maxEmails, setMaxEmails] = useState(20);
  const [isSaved, setIsSaved] = useState(false);

  // Important Senders State
  const [importantSenders, setImportantSenders] = useState<string[]>([]);
  const [newSenderInput, setNewSenderInput] = useState('');
  const [isAddingSender, setIsAddingSender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getImportantSenders()
        .then(setImportantSenders)
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenderInput.trim()) return;
    setIsAddingSender(true);
    try {
      const updated = await api.addImportantSender(newSenderInput.trim());
      setImportantSenders(updated);
      setNewSenderInput('');
    } catch (err) {
      alert('Failed to add important sender');
    } finally {
      setIsAddingSender(false);
    }
  };

  const handleRemoveSender = async (emailToRemove: string) => {
    try {
      const updated = await api.removeImportantSender(emailToRemove);
      setImportantSenders(updated);
    } catch (err) {
      alert('Failed to remove sender');
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-xl border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">User Preferences</h3>
              <p className="text-xs text-slate-400">Account status, AI behavior & inbox options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Account & Security Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-400" /> Account Status
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isConnectedToGmail
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {isConnectedToGmail ? 'Connected' : 'Demo Mode'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {isConnectedToGmail
                ? 'Your Gmail account is connected. AI agent tools have permission to draft responses and organize emails with your approval.'
                : 'Operating in demo mode with sample data. Connect Google Account to access real inbox tools.'}
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>User profile, conversations, and agent history are saved in the database.</span>
            </div>
          </div>

          {/* AI Assistant Preferences */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Draft & Response Style
            </span>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium text-[11px]">Default Smart Reply Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {(['professional', 'friendly', 'concise'] as const).map(tone => (
                  <button
                    key={tone}
                    onClick={() => setReplyTone(tone)}
                    className={`py-1.5 px-2 rounded-lg text-center text-[11px] capitalize border transition-all ${
                      replyTone === tone
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 text-[11px]">Auto-Summarize Incoming Emails</span>
                <input
                  type="checkbox"
                  checked={autoSummarize}
                  onChange={e => setAutoSummarize(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300 text-[11px]">Extract Actionable Tasks Automatically</span>
                <input
                  type="checkbox"
                  checked={autoExtractTasks}
                  onChange={e => setAutoExtractTasks(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Important Senders VIP Rules */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Important Email Senders (VIPs)
              </span>
              <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
                {importantSenders.length} Active
              </span>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Emails from these users are automatically flagged as <strong className="text-amber-300">Important</strong> and sorted into your Important folder.
            </p>

            <form onSubmit={handleAddSender} className="flex gap-2">
              <input
                type="email"
                value={newSenderInput}
                onChange={e => setNewSenderInput(e.target.value)}
                placeholder="Enter email (e.g. boss@techcorp.io)..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                disabled={isAddingSender || !newSenderInput.trim()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
              {importantSenders.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic p-1">No important senders added yet.</div>
              ) : (
                importantSenders.map(sender => (
                  <div
                    key={sender}
                    className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-200"
                  >
                    <span className="font-mono text-amber-300/90 truncate">{sender}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSender(sender)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Remove from important senders"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sync & View Preferences */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-[11px] font-medium">Max Emails Per Search Query</span>
              <select
                value={maxEmails}
                onChange={e => setMaxEmails(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={10}>10 emails</option>
                <option value={20}>20 emails</option>
                <option value={50}>50 emails</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Preferences update dynamically</span>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" /> Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

