import React, { useState } from 'react';
import { Bot, ShieldCheck, Sparkles, CheckCircle2, Settings, ArrowRight } from 'lucide-react';
import { api, setCachedAccessToken } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (token: string) => void;
  onOpenSettings: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenSettings }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const url = await api.getGoogleAuthUrl();
      const popup = window.open(url, 'google_oauth_popup', 'width=600,height=700');

      if (!popup) {
        setErrorMessage('Popup was blocked by browser. Please allow popups for this site and try again.');
        setIsLoggingIn(false);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.accessToken) {
          window.removeEventListener('message', handleMessage);
          setCachedAccessToken(event.data.accessToken);
          onLoginSuccess(event.data.accessToken);
          setIsLoggingIn(false);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMessage(err.message || 'Could not initiate Google Sign-In.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Right Settings Icon */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Config & API Keys</span>
        </button>
      </div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 backdrop-blur-md">
        {/* Logo & Heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex bg-gradient-to-tr from-indigo-600 to-blue-500 p-3.5 rounded-2xl text-white shadow-xl shadow-indigo-500/25 ring-1 ring-white/20 mb-1">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Mail Assistant AI</h1>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous Gmail Intelligence & Task Automation
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2.5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 text-xs">
          <div className="flex items-start gap-3 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Full Gmail Integration</span>
              <p className="text-[11px] text-slate-400">Search, summarize, and organize messages seamlessly.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Autonomous Agent Tools</span>
              <p className="text-[11px] text-slate-400">Extract action items, analyze threads, and draft smart replies.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Human Approval Safeguard</span>
              <p className="text-[11px] text-slate-400">Emails are never dispatched without explicit review & approval.</p>
            </div>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Primary Action Button: Sign in with Google */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 group cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoggingIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            {!isLoggingIn && (
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
            )}
          </button>

          <p className="text-[10px] text-slate-500 text-center leading-normal">
            By signing in, you grant Mail Assistant permission to access your Gmail inbox securely via official Google OAuth 2.0.
          </p>
        </div>
      </div>
    </div>
  );
};
