import React, { useState } from 'react';
import { Send, Edit3, Check, Mail, ShieldAlert, Sparkles, Eye, Code, X } from 'lucide-react';
import { DraftReply } from '../types';
import { api } from '../services/api';

interface DraftCardProps {
  draft: DraftReply;
  onSentSuccess: () => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({ draft, onSentSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [isHtml, setIsHtml] = useState(draft.isHtml || false);
  const [viewMode, setViewMode] = useState<'text' | 'preview'>('text');
  const [isSending, setIsSending] = useState(false);
  const [isConvertingToHtml, setIsConvertingToHtml] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const handleApplyHtmlTemplate = async () => {
    setIsConvertingToHtml(true);
    try {
      const html = await api.generateAiTemplate(`Convert this draft message into a beautiful corporate HTML email response: "${body}"`);
      setBody(html);
      setIsHtml(true);
      setViewMode('preview');
    } catch (err: any) {
      alert('Failed to generate HTML template: ' + (err.message || err));
    } finally {
      setIsConvertingToHtml(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      await api.sendEmail({
        to,
        subject,
        body,
        threadId: draft.threadId,
        isHtml,
        userApproved: true
      });
      setSentMessage('Email successfully sent through Gmail!');
      setShowConfirmModal(false);
      onSentSuccess();
    } catch (err: any) {
      alert('Failed to send email: ' + (err.message || err));
    } finally {
      setIsSending(false);
    }
  };

  if (sentMessage) {
    return (
      <div className="my-3 p-4 bg-emerald-900/30 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold">{sentMessage}</p>
            <p className="text-xs text-emerald-300/80">Recipient: {to}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 bg-slate-900 border border-indigo-500/40 rounded-xl shadow-xl overflow-hidden">
      {/* Draft Header */}
      <div className="bg-gradient-to-r from-indigo-900/80 to-slate-900 px-4 py-2.5 border-b border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
            AI Generated Draft Reply
          </span>
        </div>
        <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Approval Required
        </span>
      </div>

      {/* Draft Content Form */}
      <div className="p-4 space-y-3 text-xs sm:text-sm text-slate-200">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
            To:
          </label>
          {isEditing ? (
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
            />
          ) : (
            <span className="font-medium text-slate-100">{to}</span>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
            Subject:
          </label>
          {isEditing ? (
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
            />
          ) : (
            <span className="font-medium text-slate-100">{subject}</span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Message Body:
            </label>
            <div className="flex items-center gap-2">
              {!isHtml && (
                <button
                  type="button"
                  onClick={handleApplyHtmlTemplate}
                  disabled={isConvertingToHtml}
                  className="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{isConvertingToHtml ? 'Converting...' : '✨ Upgrade to HTML Template'}</span>
                </button>
              )}
              {isHtml && (
                <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-[10px]">
                  <button
                    type="button"
                    onClick={() => setViewMode('text')}
                    className={`px-2 py-0.5 rounded font-semibold ${viewMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    HTML Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={`px-2 py-0.5 rounded font-semibold ${viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    Live Preview
                  </button>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
            />
          ) : isHtml && viewMode === 'preview' ? (
            <div className="h-64 bg-white rounded-lg overflow-hidden border border-slate-800 shadow">
              <iframe
                title="Draft HTML Preview"
                srcDoc={body}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap font-sans text-slate-200 leading-relaxed text-xs sm:text-sm max-h-60 overflow-y-auto font-mono">
              {body}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg transition-colors border border-slate-700"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Done Editing' : 'Edit Draft'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-md transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Approve & Send Email</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirm Email Dispatch</h3>
                  <p className="text-xs text-slate-400">Human Approval Safety Verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Recipient:</span>{' '}
                <span className="text-white font-medium">{to}</span>
              </div>
              <div>
                <span className="text-slate-400">Subject:</span>{' '}
                <span className="text-white font-medium">{subject}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to send this email? This action will interact with your Gmail mailbox and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
