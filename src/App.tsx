import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, ActiveView } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { EmailViewer } from './components/EmailViewer';
import { ChatPanel } from './components/ChatPanel';
import { AgentActivityLog } from './components/AgentActivityLog';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { VerificationSentPage } from './components/VerificationSentPage';
import { TemplateManagerModal } from './components/TemplateManagerModal';
import { ComposeModal } from './components/ComposeModal';
import { SplashScreen } from './components/SplashScreen';
import { User, EmailMessage, Conversation, ConversationMessage, EmailTemplate } from './types';
import { api, getCachedAccessToken, setCachedAccessToken } from './services/api';
import { parseCurrentRoute, getRouteUrl, AuthPage } from './utils/router';

export default function App() {
  const initialRoute = parseCurrentRoute(window.location.pathname);

  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<ActiveView>(initialRoute.activeView || 'chat');

  // Emails State
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState<boolean>(false);

  // Reference for target email ID requested via URL path
  const targetEmailIdRef = useRef<string | null>(initialRoute.emailId || null);

  // Chat Conversations State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>(initialRoute.convId || '');
  const [chatMessages, setChatMessages] = useState<ConversationMessage[]>([]);

  // Modals & Navigation State
  const [authPage, setAuthPage] = useState<AuthPage>(initialRoute.authPage || 'landing');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>('');
  const [pendingVerificationUrl, setPendingVerificationUrl] = useState<string>('');

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(initialRoute.modal === 'settings');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(initialRoute.modal === 'profile');
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(initialRoute.modal === 'compose');
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(initialRoute.modal === 'templates');
  const [composeTemplate, setComposeTemplate] = useState<EmailTemplate | null>(null);

  // Handle URL token verification on initial mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('token');
    if (verifyToken) {
      api.verifyEmail(verifyToken).then(res => {
        if (res.success && res.user) {
          setCachedAccessToken(res.user.id);
          window.history.replaceState({}, document.title, window.location.pathname);
          loadUserAndEmails();
        } else {
          loadUserAndEmails();
        }
      }).catch(err => {
        console.error('Verification error:', err);
        loadUserAndEmails();
      });
    } else {
      loadUserAndEmails();
    }
  }, []);

  // Sync state to URL bar
  useEffect(() => {
    if (isInitializing) return;

    const targetUrl = getRouteUrl({
      isConnected,
      authPage,
      activeView,
      emailId: selectedEmail?.id || targetEmailIdRef.current,
      convId: activeConversationId,
      isSettingsOpen,
      isProfileOpen,
      isComposeOpen,
      isTemplatesOpen
    });

    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, document.title, targetUrl);
    }
  }, [
    isConnected,
    authPage,
    activeView,
    selectedEmail?.id,
    activeConversationId,
    isSettingsOpen,
    isProfileOpen,
    isComposeOpen,
    isTemplatesOpen,
    isInitializing
  ]);

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = async () => {
      const route = parseCurrentRoute(window.location.pathname);
      if (route.authPage) setAuthPage(route.authPage);
      setActiveView(route.activeView);

      setIsSettingsOpen(route.modal === 'settings');
      setIsProfileOpen(route.modal === 'profile');
      setIsComposeOpen(route.modal === 'compose');
      setIsTemplatesOpen(route.modal === 'templates');

      if (route.convId) {
        setActiveConversationId(route.convId);
      }

      if (route.emailId) {
        targetEmailIdRef.current = route.emailId;
        try {
          const detail = await api.getEmailById(route.emailId);
          setSelectedEmail(detail);
        } catch (err) {
          console.error('Failed to load email from popstate:', err);
        }
      } else {
        targetEmailIdRef.current = null;
        if (route.activeView !== 'chat' && route.activeView !== 'activity') {
          setSelectedEmail(prev => prev || null);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial Load & Refresh
  const loadUserAndEmails = async () => {
    const token = getCachedAccessToken();
    if (!token) {
      setUser(null);
      setIsConnected(false);
      setIsInitializing(false);
      return;
    }

    setIsLoadingEmails(true);
    try {
      const userRes = await api.getCurrentUser();
      if (userRes.user) {
        setUser(userRes.user);
        setIsConnected(true);

        let query = '';
        if (activeView === 'unread') query = 'is:unread';
        if (activeView === 'important') query = 'is:important';
        if (activeView === 'starred') query = 'is:starred';
        if (activeView === 'drafts') query = 'is:draft';
        if (activeView === 'purchases') query = 'category:purchases';
        if (activeView === 'spam') query = 'in:spam';
        if (activeView === 'scheduled') query = 'is:scheduled';
        if (activeView === 'sent') query = 'label:sent';

        const emailList = await api.getEmails(query);
        setEmails(emailList);

        // Target email requested from URL
        if (targetEmailIdRef.current) {
          const reqId = targetEmailIdRef.current;
          const foundInList = emailList.find(e => e.id === reqId);
          if (foundInList) {
            setSelectedEmail(foundInList);
          } else {
            try {
              const fetched = await api.getEmailById(reqId);
              if (fetched) setSelectedEmail(fetched);
            } catch (e) {
              if (emailList.length > 0) setSelectedEmail(emailList[0]);
            }
          }
        } else if (emailList.length > 0 && !selectedEmail) {
          setSelectedEmail(emailList[0]);
        }

        const convs = await api.getConversations();
        setConversations(convs);
      } else {
        setUser(null);
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Failed to load app data:', err);
    } finally {
      setIsLoadingEmails(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (user && isConnected) {
      loadUserAndEmails();
    }
  }, [activeView]);

  const handleSearchEmails = async (query: string) => {
    setIsLoadingEmails(true);
    try {
      const list = await api.getEmails(query);
      setEmails(list);
      if (list.length > 0) setSelectedEmail(list[0]);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleSelectEmail = async (id: string) => {
    targetEmailIdRef.current = id;
    try {
      const detail = await api.getEmailById(id);
      if (detail) {
        const isUnread = !detail.isRead;
        const readDetail = { ...detail, isRead: true };
        setSelectedEmail(readDetail);

        if (isUnread) {
          setEmails(prev => prev.map(e => (e.id === id ? { ...e, isRead: true } : e)));
          api.markAsRead(id)
            .then(() => loadUserAndEmails())
            .catch(console.error);
        }
      }
    } catch (err) {
      console.error('Failed to select email:', err);
    }
  };

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setChatMessages(conv.messages);
    }
  };

  const handleNewChat = () => {
    const newConvId = 'conv_' + Date.now();
    setActiveConversationId(newConvId);
    setChatMessages([]);
  };

  const handleSignOut = () => {
    setCachedAccessToken(null);
    setUser(null);
    setIsConnected(false);
    loadUserAndEmails();
  };

  const handleDraftReplyFromViewer = async (messageId: string, instructions: string) => {
    setActiveView('chat');
    const prompt = `Draft a reply to message ${messageId} saying: ${instructions}`;
    const newMsg: ConversationMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };

    const newChatList = [...chatMessages, newMsg];
    setChatMessages(newChatList);

    try {
      const res = await api.sendAgentChat(prompt, activeConversationId);
      const assistantMsg: ConversationMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        toolCalls: res.toolsExecuted,
        draft: res.draft
      };
      setChatMessages([...newChatList, assistantMsg]);
      setActiveConversationId(res.conversationId);
      loadUserAndEmails();
    } catch (err: any) {
      alert('Draft generation failed: ' + err.message);
    }
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  if (isInitializing) {
    return <SplashScreen />;
  }

  if (!isConnected || !user) {
    if (authPage === 'login') {
      return (
        <LoginPage
          onLoginSuccess={(loggedUser, sessionToken) => {
            if (sessionToken) setCachedAccessToken(sessionToken);
            setUser(loggedUser);
            setIsConnected(true);
            loadUserAndEmails();
          }}
          onNavigateToSignup={() => setAuthPage('signup')}
          onNavigateToLanding={() => setAuthPage('landing')}
        />
      );
    }

    if (authPage === 'signup') {
      return (
        <SignupPage
          onSignupComplete={(details) => {
            setPendingVerificationEmail(details.email);
            setPendingVerificationUrl(details.verificationUrl || '');
            setAuthPage('verification_sent');
          }}
          onGoogleSuccess={(loggedUser, sessionToken) => {
            if (sessionToken) setCachedAccessToken(sessionToken);
            setUser(loggedUser);
            setIsConnected(true);
            loadUserAndEmails();
          }}
          onNavigateToLogin={() => setAuthPage('login')}
          onNavigateToLanding={() => setAuthPage('landing')}
        />
      );
    }

    if (authPage === 'verification_sent') {
      return (
        <VerificationSentPage
          email={pendingVerificationEmail}
          verificationUrl={pendingVerificationUrl}
          onNavigateToLogin={() => setAuthPage('login')}
          onNavigateToLanding={() => setAuthPage('landing')}
        />
      );
    }

    return (
      <LandingPage
        onNavigateToLogin={() => setAuthPage('login')}
        onNavigateToSignup={() => setAuthPage('signup')}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-hidden">
      {/* Left Sidebar (contains branding, actions, mail folders, dropdownable recent chats, and user popup menu) */}
      <Sidebar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        unreadCount={unreadCount}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRefresh={loadUserAndEmails}
        onOpenCompose={() => {
          setComposeTemplate(null);
          setIsComposeOpen(true);
        }}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'chat' ? (
          <ChatPanel
            conversationId={activeConversationId}
            messages={chatMessages}
            emails={emails}
            onMessagesChange={(msgs, convId) => {
              setChatMessages(msgs);
              if (convId) setActiveConversationId(convId);
              api.getConversations().then(setConversations);
            }}
            onRefreshInbox={loadUserAndEmails}
          />
        ) : activeView === 'activity' ? (
          <AgentActivityLog />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <EmailList
              emails={emails}
              selectedEmailId={selectedEmail?.id}
              onSelectEmail={handleSelectEmail}
              onSearch={handleSearchEmails}
              isLoading={isLoadingEmails}
            />
            <EmailViewer
              email={selectedEmail}
              onBack={() => {
                targetEmailIdRef.current = null;
                setSelectedEmail(null);
              }}
              onDraftReply={handleDraftReplyFromViewer}
              onEmailUpdated={loadUserAndEmails}
            />
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isConnectedToGmail={isConnected}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSentSuccess={loadUserAndEmails}
        initialTemplate={composeTemplate}
      />

      {/* Template Manager System Modal */}
      <TemplateManagerModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplateForCompose={(tpl) => {
          setComposeTemplate(tpl);
          setIsComposeOpen(true);
        }}
      />
    </div>
  );
}
