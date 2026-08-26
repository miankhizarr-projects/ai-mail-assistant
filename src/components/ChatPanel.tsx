import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ArrowRight, CornerDownLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConversationMessage, DraftReply, EmailMessage } from '../types';
import { api } from '../services/api';
import { DraftCard } from './DraftCard';

interface ChatPanelProps {
  conversationId?: string;
  messages: ConversationMessage[];
  emails?: EmailMessage[];
  onMessagesChange: (msgs: ConversationMessage[], convId: string) => void;
  onRefreshInbox: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  conversationId,
  messages,
  emails = [],
  onMessagesChange,
  onRefreshInbox
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate dynamic, context-aware suggestions directly from user's actual emails & chat data
  const dynamicSuggestions = useMemo(() => {
    const suggestions: string[] = [];

    // Helper to clean sender name
    const getCleanSender = (senderStr: string) => {
      if (!senderStr) return 'Sender';
      const match = senderStr.match(/^([^<]+)/);
      return match ? match[1].trim() : senderStr;
    };

    // 1. Check unread emails for instant action suggestion
    const unreadEmails = emails.filter(e => !e.isRead);
    if (unreadEmails.length > 0) {
      const firstUnread = unreadEmails[0];
      const senderName = getCleanSender(firstUnread.sender);
      suggestions.push(`Summarize unread email from ${senderName}`);

      if (unreadEmails.length > 1) {
        suggestions.push(`Show all ${unreadEmails.length} unread emails in my inbox`);
      } else {
        const shortSubject = firstUnread.subject.length > 28 ? firstUnread.subject.slice(0, 25) + '...' : firstUnread.subject;
        suggestions.push(`Draft a reply to ${senderName} regarding "${shortSubject}"`);
      }
    }

    // 2. High priority or starred emails
    const highPriority = emails.find(e => e.priority === 'high' || e.isImportant || e.isStarred);
    if (highPriority) {
      const senderName = getCleanSender(highPriority.sender);
      const shortSubject = highPriority.subject.length > 26 ? highPriority.subject.slice(0, 23) + '...' : highPriority.subject;
      suggestions.push(`Review key details from ${senderName}'s email: "${shortSubject}"`);
    }

    // 3. Email with extracted action items or tasks
    const emailWithTasks = emails.find(e => e.extractedTasks && e.extractedTasks.length > 0);
    if (emailWithTasks) {
      const shortSubject = emailWithTasks.subject.length > 28 ? emailWithTasks.subject.slice(0, 25) + '...' : emailWithTasks.subject;
      suggestions.push(`What are my pending tasks from "${shortSubject}"?`);
    }

    // 4. Most recent email sender suggestion
    if (emails.length > 0) {
      const latest = emails[0];
      const senderName = getCleanSender(latest.sender);
      if (!suggestions.some(s => s.includes(senderName))) {
        suggestions.push(`Find recent emails from ${senderName}`);
      }
    }

    // 5. Context from user's last conversation query if available
    const lastUserQuery = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserQuery && lastUserQuery.content.length > 5) {
      const snippet = lastUserQuery.content.slice(0, 30);
      if (!suggestions.some(s => s.toLowerCase().includes(snippet.toLowerCase()))) {
        suggestions.push(`Follow up on: "${snippet}..."`);
      }
    }

    // Smart fallback suggestions based on active inbox count
    const defaultPrompts = [
      unreadEmails.length > 0 ? `Show all ${unreadEmails.length} unread messages` : 'Show me all my recent unread emails',
      'What action items do I need to complete today?',
      'Summarize key updates from my recent email threads',
      'Find emails with pending replies or follow-ups'
    ];

    for (const d of defaultPrompts) {
      if (suggestions.length < 4 && !suggestions.includes(d)) {
        suggestions.push(d);
      }
    }

    return suggestions.slice(0, 4);
  }, [emails, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, activeStep]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim() || isLoading) return;

    const userMsg: ConversationMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    onMessagesChange(newMessages, conversationId || '');
    setInput('');
    setIsLoading(true);
    setActiveStep('Searching Gmail...');

    try {
      // Simulate progress status steps for friendly UX
      const statusTimer1 = setTimeout(() => setActiveStep('Retrieving email content...'), 1200);
      const statusTimer2 = setTimeout(() => setActiveStep('Analyzing email intelligence...'), 2400);

      const res = await api.sendAgentChat(promptText, conversationId);

      clearTimeout(statusTimer1);
      clearTimeout(statusTimer2);

      const assistantMsg: ConversationMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        toolCalls: res.toolsExecuted,
        draft: res.draft
      };

      onMessagesChange([...newMessages, assistantMsg], res.conversationId);
      onRefreshInbox(); // update inbox list if mail state changed
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ConversationMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: `An error occurred while processing your request: ${err.message || 'Server error'}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      onMessagesChange([...newMessages, errorMsg], conversationId || '');
    } finally {
      setIsLoading(false);
      setActiveStep(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 flex-1">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto my-8 space-y-6 text-center">
            <div className="inline-flex p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">How can I assist with your Gmail inbox today?</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1 leading-relaxed">
                I can search your emails, summarize threads, extract tasks, and create draft replies for your approval.
              </p>
            </div>

            {/* Context-aware suggestions derived from user's actual emails & chat history */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
              {dynamicSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs text-slate-300 transition-all text-left flex items-start justify-between group shadow-sm"
                >
                  <span className="leading-snug font-medium">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 border border-indigo-500/30 text-indigo-400'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-2 max-w-2xl min-w-0 overflow-hidden">
                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed break-words [word-break:break-word] overflow-hidden ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white shadow-md rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-md rounded-tl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words [word-break:break-word]">{msg.content}</p>
                  ) : (
                    <div className="markdown-body max-w-full overflow-x-auto">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  )}
                </div>

                {/* Display Executed Tools */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300 block mb-1">
                      Executed Agent Tools ({msg.toolCalls.length})
                    </span>
                    {msg.toolCalls.map((tc, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-400 font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-indigo-400 font-semibold">{tc.tool}</span>
                        <span className="truncate text-slate-500">
                          {JSON.stringify(tc.input)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Display Interactive Draft Reply if created */}
                {msg.draft && (
                  <DraftCard draft={msg.draft} onSentSuccess={onRefreshInbox} />
                )}

                <span className="text-[10px] text-slate-500 block px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Live Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl max-w-sm text-xs text-indigo-300 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
            <div>
              <p className="font-semibold">{activeStep || 'Thinking...'}</p>
              <p className="text-[10px] text-slate-400">Selecting Gmail tools & processing intelligence</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 focus-within:border-indigo-500/50 shadow-inner"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask AI about emails, draft replies, search inbox..."
            disabled={isLoading}
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 flex items-center justify-center shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
