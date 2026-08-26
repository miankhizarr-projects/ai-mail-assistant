import { ActiveView } from '../components/Sidebar';

export type AuthPage = 'landing' | 'login' | 'signup' | 'verification_sent';
export type ModalType = 'settings' | 'profile' | 'compose' | 'templates' | null;

const FOLDERS: ActiveView[] = [
  'inbox',
  'unread',
  'important',
  'starred',
  'drafts',
  'purchases',
  'spam',
  'scheduled',
  'sent'
];

export interface ParsedRoute {
  authPage?: AuthPage;
  activeView: ActiveView;
  emailId?: string;
  convId?: string;
  modal?: ModalType;
}

export function parseCurrentRoute(pathname: string = window.location.pathname): ParsedRoute {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath ? cleanPath.split('/') : [];

  if (segments.length === 0) {
    return { activeView: 'inbox' };
  }

  const first = segments[0].toLowerCase();

  // Auth pages
  if (['landing', 'login', 'signup', 'verification_sent', 'verification-sent'].includes(first)) {
    const authPage: AuthPage = first === 'verification-sent' ? 'verification_sent' : (first as AuthPage);
    return { authPage, activeView: 'inbox' };
  }

  // Modals
  if (['settings', 'profile', 'compose', 'templates'].includes(first)) {
    const modal = first as ModalType;
    let view: ActiveView = 'inbox';
    let emailId: string | undefined;
    if (segments[1] && FOLDERS.includes(segments[1] as ActiveView)) {
      view = segments[1] as ActiveView;
      if (segments[2]) emailId = segments[2];
    }
    return { activeView: view, emailId, modal };
  }

  // Chat
  if (first === 'chat') {
    return { activeView: 'chat', convId: segments[1] || undefined };
  }

  // Activity
  if (first === 'activity') {
    return { activeView: 'activity' };
  }

  // Mail alias: /mail/:id or /email/:id
  if (first === 'mail' || first === 'email') {
    return { activeView: 'inbox', emailId: segments[1] || undefined };
  }

  // Folders
  if (FOLDERS.includes(first as ActiveView)) {
    return { activeView: first as ActiveView, emailId: segments[1] || undefined };
  }

  return { activeView: 'inbox' };
}

export function getRouteUrl(state: {
  isConnected: boolean;
  authPage: AuthPage;
  activeView: ActiveView;
  emailId?: string | null;
  convId?: string | null;
  isSettingsOpen?: boolean;
  isProfileOpen?: boolean;
  isComposeOpen?: boolean;
  isTemplatesOpen?: boolean;
}): string {
  if (!state.isConnected) {
    if (state.authPage === 'verification_sent') return '/verification-sent';
    return `/${state.authPage || 'landing'}`;
  }

  if (state.isSettingsOpen) return '/settings';
  if (state.isProfileOpen) return '/profile';
  if (state.isComposeOpen) return '/compose';
  if (state.isTemplatesOpen) return '/templates';

  if (state.activeView === 'chat') {
    return state.convId ? `/chat/${state.convId}` : '/chat';
  }

  if (state.activeView === 'activity') {
    return '/activity';
  }

  if (state.emailId) {
    return `/${state.activeView}/${state.emailId}`;
  }

  return `/${state.activeView}`;
}
