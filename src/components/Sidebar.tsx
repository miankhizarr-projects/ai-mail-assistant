import React, { useState, useRef, useEffect } from 'react';
import {
  Inbox,
  MailWarning,
  Star,
  Send,
  Bot,
  Activity,
  MessageSquare,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Settings,
  UserCheck,
  LogOut,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  MoreVertical,
  FileText,
  ShoppingBag,
  AlertOctagon,
  Clock
} from 'lucide-react';
import { Conversation, User } from '../types';

export type ActiveView =
  | 'inbox'
  | 'unread'
  | 'important'
  | 'starred'
  | 'drafts'
  | 'purchases'
  | 'spam'
  | 'scheduled'
  | 'sent'
  | 'chat'
  | 'activity';

interface SidebarProps {
  user: User | null;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  unreadCount: number;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRefresh: () => void;
  onOpenCompose: () => void;
  onOpenTemplates: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeView,
  setActiveView,
  unreadCount,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRefresh,
  onOpenCompose,
  onOpenTemplates,
  onOpenSettings,
  onOpenProfile,
  onSignOut
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRecentChatsOpen, setIsRecentChatsOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: null },
    { id: 'unread', label: 'Unread', icon: MailWarning, count: unreadCount > 0 ? unreadCount : null },
    { id: 'starred', label: 'Starred', icon: Star, count: null },
    { id: 'drafts', label: 'Drafts', icon: FileText, count: null },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag, count: null },
    { id: 'spam', label: 'Spam', icon: AlertOctagon, count: null },
    { id: 'scheduled', label: 'Scheduled', icon: Clock, count: null },
    { id: 'sent', label: 'Sent', icon: Send, count: null }
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-full shrink-0 select-none relative z-30 transition-[width] duration-300 ease-in-out`}
    >
      {/* Fixed Non-Scrollable Upper Section (Header, Folders, AI Intelligence) */}
      <div className="shrink-0 p-2 space-y-3">
        {/* Sidebar Top Brand Header */}
        <div>
          {isCollapsed ? (
            <div className="flex flex-col gap-2 items-center w-full pt-1">
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenCompose}
                className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow flex items-center justify-center transition-colors shrink-0"
                title="Compose Email"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                onClick={onRefresh}
                className="w-10 h-10 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                title="Refresh Mailbox"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 p-1">
              {/* Logo & App Title */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2.5">
                  <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 p-2 rounded-xl text-white shadow-md shadow-indigo-500/20 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h1 className="font-bold text-sm text-slate-100 truncate">Mail Assistant</h1>
                      <span className="text-[9px] font-semibold uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.2 rounded-full">
                        AI
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">Gmail Agent</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={onRefresh}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Refresh Mailbox"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={onOpenCompose}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1.5 px-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors truncate"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Compose</span>
                </button>

                <button
                  onClick={() => {
                    onNewChat();
                    setActiveView('chat');
                  }}
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs py-1.5 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors truncate"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">New Chat</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Mailbox Folders */}
        <div>
          {!isCollapsed && (
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1.5 truncate">
              Mailbox
            </div>
          )}
          <nav className="space-y-1">
            {folders.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  title={isCollapsed ? `${item.label}${item.count ? ` (${item.count})` : ''}` : undefined}
                  className={`w-full flex items-center h-10 rounded-xl text-xs font-medium transition-colors relative ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="w-12 h-10 shrink-0 flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.count !== null && (
                        <span className="mr-3 bg-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0">
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && item.count !== null && item.count > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Intelligence Views */}
        <div>
          {!isCollapsed && (
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1.5 truncate">
              AI Intelligence
            </div>
          )}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveView('chat')}
              title={isCollapsed ? 'AI Agent Assistant' : undefined}
              className={`w-full flex items-center h-10 rounded-xl text-xs font-medium transition-colors relative ${
                activeView === 'chat'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="w-12 h-10 shrink-0 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              {!isCollapsed && <span className="truncate flex-1 text-left">AI Agent Assistant</span>}
            </button>

            <button
              onClick={() => setActiveView('activity')}
              title={isCollapsed ? 'Agent Activity Log' : undefined}
              className={`w-full flex items-center h-10 rounded-xl text-xs font-medium transition-colors relative ${
                activeView === 'activity'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="w-12 h-10 shrink-0 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              {!isCollapsed && <span className="truncate flex-1 text-left">Agent Activity Log</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* Scrollable Recent Chat Conversations Section (Scrolls independently with hidden scrollbar) */}
      {!isCollapsed ? (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 pt-1 pb-2">
          <button
            onClick={() => setIsRecentChatsOpen(!isRecentChatsOpen)}
            className="w-full flex items-center justify-between px-3 mb-1 text-[11px] font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors group cursor-pointer"
          >
            <span className="truncate">Recent AI Chats</span>
            {isRecentChatsOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform" />
            )}
          </button>

          {isRecentChatsOpen && (
            conversations.length === 0 ? (
              <div className="px-3 py-1.5 text-[11px] text-slate-500 italic">No chat history</div>
            ) : (
              <div className="space-y-1">
                {conversations.map(conv => {
                  const isSelected = activeView === 'chat' && activeConversationId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        setActiveView('chat');
                      }}
                      className={`w-full flex items-center h-8 rounded-xl text-xs transition-colors px-2.5 ${
                        isSelected
                          ? 'bg-slate-800 text-indigo-300 font-medium'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                      <span className="truncate text-[11px] flex-1 text-left">{conv.title || 'Conversation'}</span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Bottom User Section with Popup Menu */}
      <div ref={userMenuRef} className="relative border-t border-slate-800/80 p-2 shrink-0 bg-slate-900 z-50">
        {/* User Popup Menu */}
        {isUserMenuOpen && (
          <div
            className={`absolute bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 ${
              isCollapsed
                ? 'bottom-1 left-full ml-3 w-60'
                : 'bottom-full left-2 right-2 mb-2 w-auto'
            }`}
          >
            {/* Header User Info */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2.5">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                  {user?.name ? user.name[0] : 'U'}
                </div>
              )}
              <div className="overflow-hidden text-left">
                <div className="font-semibold text-xs text-slate-100 truncate">{user?.name || 'Google User'}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onOpenTemplates();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
              >
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Templates</span>
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-left"
              >
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile</span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Signout</span>
              </button>
            </div>
          </div>
        )}

        {/* User Button */}
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="w-full flex items-center h-10 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800/80 text-slate-200 transition-colors text-left group px-1"
          title="User Account Menu"
        >
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-indigo-500/40 object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0">
                {user?.name ? user.name[0] : 'U'}
              </div>
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="overflow-hidden flex-1 min-w-0 pr-2">
                <div className="font-semibold text-xs truncate leading-tight text-slate-100">{user?.name || 'Google User'}</div>
                <div className="text-[10px] text-slate-400 truncate leading-tight">{user?.email}</div>
              </div>
              <div className="pr-1">
                <MoreVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0 transition-colors" />
              </div>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
