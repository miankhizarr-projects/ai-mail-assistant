import React from 'react';
import { Mail, Sparkles, Shield, Bot, ArrowRight, Layers, Lock } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToSignup,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                MailBox <span className="text-indigo-400 font-mono text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">AI AGENT</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToLogin}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Sign In
            </button>

            <button
              onClick={onNavigateToSignup}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-24 px-6 max-w-7xl mx-auto overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="text-center max-w-3xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Autonomous Gmail Agent & Security Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
              Supercharge Your Inbox with <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">AI Intelligence</span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8">
              Seamlessly draft, summarize, schedule, and organize your emails. Secured with email verification, Google OAuth integration, and autonomous agent tool execution.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onNavigateToSignup}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Sign In to Dashboard</span>
              </button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-900">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Complete Intelligence & Security Control</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Built for modern executive communication workflows</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">15-Min Token Email Verification</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Registration generates a unique 15-minute token sent from <span className="text-indigo-300">mypcaccc01@gmail.com</span> with automatic link verification and redirection.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Autonomous Agent Tools</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Instruct the AI assistant to star emails, move to spam, schedule future emails, summarize long threads, or filter your key categories.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Custom Templates & Smart Folders</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Compose high-impact executive emails using pre-seeded custom HTML templates, and navigate Starred, Drafts, Purchases, Spam, and Scheduled mail folders.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 MailBox AI Assistant. Secure Verification & Intelligent Execution Engine.</p>
      </footer>
    </div>
  );
};
