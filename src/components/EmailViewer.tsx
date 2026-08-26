import React, { useState, useEffect, useRef } from 'react';
import { Mail, Sparkles, Send, CheckCircle, Archive, AlertCircle, Calendar, User, ArrowLeft, CheckSquare, Square, Star, AlertOctagon, Globe, FileText, Layers, ExternalLink } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EmailMessage, TaskItem } from '../types';
import { api } from '../services/api';

interface EmailViewerProps {
  email: EmailMessage | null;
  onBack?: () => void;
  onDraftReply: (messageId: string, instructions: string) => void;
  onEmailUpdated: () => void;
}

// Sub-component for rendering isolated HTML email with auto height adjustment & secure links
const HtmlEmailIframe: React.FC<{ htmlContent: string; emailId: string }> = ({ htmlContent, emailId }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(150);

  const processedContent = React.useMemo(() => {
    if (!htmlContent) return '';
    const hasTags = /<[a-z][\s\S]*>/i.test(htmlContent);
    if (hasTags) return htmlContent;

    // Convert raw URLs to clickable anchor tags and newlines to breaks
    const linked = htmlContent.replace(
      /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return linked.replace(/\n/g, '<br/>');
  }, [htmlContent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let resizeObserver: ResizeObserver | null = null;

    const adjustHeight = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        // Ensure all links open in a new browser tab safely
        const links = doc.querySelectorAll('a');
        links.forEach(link => {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        });

        // Measure exact height of wrapper content element
        const contentEl = doc.getElementById('email-body-content');
        if (contentEl) {
          const contentHeight = contentEl.getBoundingClientRect().height;
          if (contentHeight > 0) {
            // 48px covers top and bottom body padding (24px + 24px)
            const finalHeight = Math.max(Math.ceil(contentHeight) + 48, 120);
            setIframeHeight(finalHeight);
          }
        }
      } catch (e) {
        // Ignore cross-origin access errors
      }
    };

    const setupObserver = () => {
      adjustHeight();
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        const contentEl = doc?.getElementById('email-body-content');
        if (contentEl && typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => {
            adjustHeight();
          });
          resizeObserver.observe(contentEl);
        }
      } catch (e) {
        // ignore
      }
    };

    iframe.addEventListener('load', setupObserver);
    const timer1 = setTimeout(setupObserver, 50);
    const timer2 = setTimeout(setupObserver, 250);
    const timer3 = setTimeout(setupObserver, 600);

    return () => {
      iframe.removeEventListener('load', setupObserver);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [processedContent, emailId]);

  const fullDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_blank">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
      color: #1e293b;
      line-height: 1.6;
      font-size: 14px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      box-sizing: border-box;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 6px;
      display: inline-block;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
    }
    table {
      max-width: 100% !important;
      border-collapse: collapse;
    }
    blockquote {
      margin: 1em 0;
      padding-left: 1em;
      border-left: 3px solid #cbd5e1;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div id="email-body-content">
    ${processedContent}
  </div>
</body>
</html>`;

  return (
    <div className="w-full bg-white rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
      <iframe
        key={emailId}
        ref={iframeRef}
        title="Rich HTML Email Content"
        srcDoc={fullDoc}
        className="w-full border-none block"
        style={{ height: `${iframeHeight}px` }}
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      />
    </div>
  );
};

export const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  onBack,
  onDraftReply,
  onEmailUpdated
}) => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(email?.aiSummary || null);
  const [extractedTasks, setExtractedTasks] = useState<TaskItem[]>(email?.extractedTasks || []);
  const [replyInstructions, setReplyInstructions] = useState('');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [isSenderImportant, setIsSenderImportant] = useState(false);
  const [isTogglingSender, setIsTogglingSender] = useState(false);
  const [isStarredState, setIsStarredState] = useState<boolean>(!!email?.isStarred);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to extract clean email address
  const senderEmailAddress = email?.sender
    ? (email.sender.match(/<([^>]+)>/)?.[1] || email.sender).trim()
    : '';

  // Synchronize state and reset scroll position whenever the selected email changes
  useEffect(() => {
    let active = true;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    if (email) {
      setExtractedTasks(email.extractedTasks || []);
      setIsSummarizing(false);
      setReplyInstructions('');
      setShowDraftModal(false);
      setArchiveConfirm(false);
      setToastMessage(null);
      setIsStarredState(!!email.isStarred);

      // Automatically mark unread email as read when opened
      if (!email.isRead) {
        api.markAsRead(email.id)
          .then(() => {
            if (active) {
              onEmailUpdated();
            }
          })
          .catch(err => console.error('Auto mark as read failed:', err));
      }

      // Check if sender is in important list
      api.getImportantSenders()
        .then(senders => {
          if (active) {
            const isImp = senders.some(s => s.toLowerCase() === senderEmailAddress.toLowerCase());
            setIsSenderImportant(isImp);
          }
        })
        .catch(() => {});

      // Fetch saved AI summary from dedicated database collection
      api.getEmailSummary(email.id)
        .then(summary => {
          if (active) {
            setAiSummaryText(summary || email.aiSummary || null);
          }
        })
        .catch(() => {
          if (active) {
            setAiSummaryText(email.aiSummary || null);
          }
        });
    } else {
      setAiSummaryText(null);
      setExtractedTasks([]);
      setIsSenderImportant(false);
    }

    return () => {
      active = false;
    };
  }, [email?.id, senderEmailAddress]);

  if (!email) {
    return (
      <div className="flex-1 h-full bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-slate-500">
        <Mail className="w-12 h-12 stroke-1 text-slate-700 mb-3" />
        <p className="text-sm">Select an email to view complete contents & AI insights</p>
      </div>
    );
  }

  const handleToggleStar = async () => {
    try {
      const updated = await api.toggleStarEmail(email.id);
      setIsStarredState(!!updated?.isStarred);
      setToastMessage(updated?.isStarred ? '⭐ Email starred!' : 'Email unstarred');
      onEmailUpdated();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert('Failed to update star state.');
    }
  };

  const handleMarkSpam = async () => {
    try {
      await api.markSpam(email.id);
      setToastMessage('🚫 Email moved to Spam folder');
      onEmailUpdated();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert('Failed to move to spam.');
    }
  };

  const handleToggleImportantSender = async () => {
    if (!senderEmailAddress) return;
    setIsTogglingSender(true);
    try {
      const res = await api.toggleImportantSender(senderEmailAddress);
      setIsSenderImportant(res.isImportant);
      setToastMessage(
        res.isImportant
          ? `⭐ Sender ${senderEmailAddress} marked as Important! All their emails will automatically appear in the Important folder.`
          : `Sender ${senderEmailAddress} removed from Important senders.`
      );
      onEmailUpdated();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert('Failed to update important sender setting.');
    } finally {
      setIsTogglingSender(false);
    }
  };

  const handleSummarizeWithAI = async () => {
    setIsSummarizing(true);
    try {
      const summary = await api.summarizeEmail(email.id, {
        subject: email.subject,
        sender: email.sender,
        body: email.body
      });
      setAiSummaryText(summary);
      setIsSummarizing(false);
    } catch (err) {
      alert('AI Summarization failed.');
      setIsSummarizing(false);
    }
  };

  const handleMarkRead = async () => {
    await api.markAsRead(email.id);
    onEmailUpdated();
  };

  const handleArchive = async () => {
    await api.archiveEmail(email.id);
    setArchiveConfirm(false);
    onEmailUpdated();
  };

  const toggleTask = (taskId: string) => {
    setExtractedTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div ref={containerRef} className="flex-1 h-full bg-slate-950 text-slate-100 flex flex-col overflow-y-auto">
      {/* Top Action Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email Details
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isStarredState
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Star"
          >
            <Star className={`w-3.5 h-3.5 ${isStarredState ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isStarredState ? 'Starred' : 'Star'}</span>
          </button>

          <button
            onClick={handleSummarizeWithAI}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSummarizing ? 'Analyzing...' : 'Summarize'}</span>
          </button>

          <button
            onClick={() => setShowDraftModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Draft Reply</span>
          </button>

          <button
            onClick={handleMarkRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Mark Read</span>
          </button>

          <button
            onClick={handleMarkSpam}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-300 rounded-lg text-xs font-medium border border-slate-700 hover:border-rose-500/30 transition-colors"
            title="Move to Spam"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Spam</span>
          </button>

          <button
            onClick={() => setArchiveConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-300 rounded-lg text-xs font-medium border border-slate-700 hover:border-red-500/30 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      <div className="p-6 w-full space-y-6">
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-xl flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span>{toastMessage}</span>
            </span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs ml-2">✕</button>
          </div>
        )}

        {/* Email Header Metadata */}
        <div className="space-y-3 pb-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-slate-100 leading-snug">
            {email.subject || '(No Subject)'}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-semibold">{email.sender}</span>
                  {isSenderImportant && (
                    <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> VIP Important User
                    </span>
                  )}
                </div>
                {email.recipients && (
                  <span className="text-slate-500 block text-[11px] mt-0.5">
                    To: {email.recipients.join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleImportantSender}
                disabled={isTogglingSender}
                title={isSenderImportant ? "Click to remove this user from Important senders" : "Click to mark all emails from this user as Important"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSenderImportant
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-amber-500/40 hover:text-amber-300'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isSenderImportant ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                <span>{isSenderImportant ? 'Important Sender' : 'Mark Sender as Important'}</span>
              </button>

              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(email.date).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Card (if available) */}
        {(aiSummaryText || email.aiSummary) && (
          <div className="bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
              <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs uppercase tracking-wider">
                <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>AI Intelligence Summary</span>
              </div>
              <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/20 font-mono">
                Gemini Model
              </span>
            </div>
            <div className="markdown-body text-xs sm:text-sm text-slate-200 leading-relaxed max-w-full overflow-x-auto">
              <Markdown remarkPlugins={[remarkGfm]}>
                {aiSummaryText || email.aiSummary || ''}
              </Markdown>
            </div>
          </div>
        )}

        {/* Extracted Tasks Checklist (if available) */}
        {extractedTasks.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> Extracted Action Tasks
              </h3>
              <span className="text-[10px] text-slate-500">
                {extractedTasks.filter(t => t.completed).length}/{extractedTasks.length} Done
              </span>
            </div>
            <div className="space-y-2">
              {extractedTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-2.5 p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors"
                >
                  {task.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <p className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.task}
                    </p>
                    {task.deadline && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        Deadline: {task.deadline}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Email Message Body Section */}
        <div className="w-full">
          <HtmlEmailIframe emailId={email.id} htmlContent={email.htmlBody || email.body} />
        </div>
      </div>

      {/* Draft Reply Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" /> Instruct AI Agent to Draft Reply
              </h3>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide brief instructions for the AI model on how to respond to {email.sender.split('<')[0]}.
            </p>

            <textarea
              value={replyInstructions}
              onChange={e => setReplyInstructions(e.target.value)}
              placeholder="e.g. Tell Ahmed that I'll review the project files and send them tonight before 9 PM..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDraftModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!replyInstructions.trim()) return;
                  onDraftReply(email.id, replyInstructions);
                  setShowDraftModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md"
              >
                Generate Draft Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">Archive Email Confirmation</h3>
                <p className="text-xs text-slate-400">Are you sure you want to archive this message?</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setArchiveConfirm(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-xl shadow-md"
              >
                Archive Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
