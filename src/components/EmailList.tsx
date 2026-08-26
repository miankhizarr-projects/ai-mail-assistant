import React, { useState } from 'react';
import { Search, Mail, Star, Clock, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import { EmailMessage } from '../types';

interface EmailListProps {
  emails: EmailMessage[];
  selectedEmailId?: string;
  onSelectEmail: (id: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  onSearch,
  isLoading
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleQuickTag = (tag: string) => {
    setSearchInput(tag);
    onSearch(tag);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-80 lg:w-96 shrink-0">
      {/* Search Bar Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search Gmail query (e.g. from:ahmed)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </form>

        {/* Filter Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-0.5 no-scrollbar">
          <button
            onClick={() => handleQuickTag('')}
            className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              !searchInput ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleQuickTag('is:unread')}
            className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              searchInput === 'is:unread' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => handleQuickTag('is:starred')}
            className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              searchInput === 'is:starred' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Starred
          </button>
          <button
            onClick={() => handleQuickTag('is:draft')}
            className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              searchInput === 'is:draft' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => handleQuickTag('category:purchases')}
            className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              searchInput === 'category:purchases' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Purchases
          </button>
        </div>
      </div>

      {/* Email Item Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading mailbox emails...</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No emails matched query.</div>
        ) : (
          emails.map(email => {
            const isSelected = selectedEmailId === email.id;
            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email.id)}
                className={`p-3.5 cursor-pointer transition-colors relative ${
                  isSelected
                    ? 'bg-slate-800/90 border-l-2 border-indigo-500'
                    : 'hover:bg-slate-800/40'
                } ${!email.isRead ? 'bg-slate-900/90' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {email.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    <span
                      className={`text-xs truncate ${
                        !email.isRead ? 'font-bold text-white' : 'font-medium text-slate-300'
                      }`}
                    >
                      {email.sender.split('<')[0]}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(email.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div
                  className={`text-xs mb-1 truncate ${
                    !email.isRead ? 'font-semibold text-slate-100' : 'text-slate-300'
                  }`}
                >
                  {email.subject || '(No Subject)'}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {email.snippet}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {!email.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  )}
                  {email.isImportant && (
                    <span className="bg-amber-500/10 text-amber-400 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-amber-500/20">
                      Important
                    </span>
                  )}
                  {email.isDraft && (
                    <span className="bg-blue-500/10 text-blue-400 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-blue-500/20">
                      Draft
                    </span>
                  )}
                  {email.category === 'purchases' && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-emerald-500/20">
                      Purchase
                    </span>
                  )}
                  {email.isSpam && (
                    <span className="bg-rose-500/10 text-rose-400 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-rose-500/20">
                      Spam
                    </span>
                  )}
                  {email.isScheduled && (
                    <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-cyan-500/20 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Scheduled
                    </span>
                  )}
                  {email.aiSummary && (
                    <span className="bg-purple-500/10 text-purple-300 text-[9px] font-medium px-1.5 py-0.2 rounded border border-purple-500/20">
                      AI Analyzed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
