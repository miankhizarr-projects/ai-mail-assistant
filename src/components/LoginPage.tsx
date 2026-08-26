import React, { useState } from 'react';
import { Mail, Lock, Sparkles, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { api, setCachedAccessToken } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, sessionToken?: string) => void;
  onNavigateToSignup: () => void;
  onNavigateToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToSignup,
  onNavigateToLanding,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email, password });
      if (res.success && res.user && res.sessionToken) {
        setCachedAccessToken(res.sessionToken);
        onLoginSuccess(res.user, res.sessionToken);
      } else if (res.isUnverified) {
        setError(res.message || 'Account not verified. Please check your email for the verification link (expires in 15 mins).');
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const url = await api.getGoogleAuthUrl();
      const popup = window.open(url, 'google_oauth_popup', 'width=600,height=700');

      if (!popup) {
        setError('Popup was blocked by your browser. Please allow popups and try again.');
        setGoogleLoading(false);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.accessToken) {
          window.removeEventListener('message', handleMessage);
          setCachedAccessToken(event.data.accessToken);
          api.getCurrentUser().then(userData => {
            if (userData.user) {
              onLoginSuccess(userData.user, event.data.accessToken);
            } else {
              // Create user payload
              onLoginSuccess({
                id: event.data.accessToken,
                email: 'user@gmail.com',
                name: 'Google User',
                isVerified: true,
                isConnectedToGmail: true
              }, event.data.accessToken);
            }
          }).catch(() => {
            onLoginSuccess({
              id: event.data.accessToken,
              email: 'user@gmail.com',
              name: 'Google User',
              isVerified: true,
              isConnectedToGmail: true
            }, event.data.accessToken);
          });
          setGoogleLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'Failed to initiate Google Sign-In.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-indigo-500 selection:text-white font-sans">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={onNavigateToLanding}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-tr from-indigo-600 to-violet-500 p-3.5 rounded-2xl text-white shadow-xl shadow-indigo-500/20 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign In to MailBox AI</h1>
          <p className="text-xs text-slate-400 mt-1">Access your executive email dashboard and AI agent</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs mb-6 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google Login Option */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm mb-6"
        >
          {googleLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.7-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.1 0 12s.6 3.6 1.6 5.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">or email</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            <span>Sign In to Account</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
          <span>Don't have an account? </span>
          <button
            onClick={onNavigateToSignup}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};
