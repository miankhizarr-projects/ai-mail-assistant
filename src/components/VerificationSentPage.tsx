import React, { useState, useEffect } from 'react';
import { Mail, Clock, ArrowLeft, CheckCircle } from 'lucide-react';

interface VerificationSentPageProps {
  email: string;
  verificationUrl?: string;
  onNavigateToLogin: () => void;
  onNavigateToLanding: () => void;
}

export const VerificationSentPage: React.FC<VerificationSentPageProps> = ({
  email,
  verificationUrl,
  onNavigateToLogin,
  onNavigateToLanding,
}) => {
  const [timerSeconds, setTimerSeconds] = useState<number>(15 * 60);

  // 15-minute countdown timer effect
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-indigo-500 selection:text-white font-sans">
      {/* Background ambient glow */}
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

      <div className="max-w-lg w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 mx-auto">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-center text-white mb-2">Check Your Email</h2>
        <p className="text-slate-400 text-xs sm:text-sm text-center mb-6 leading-relaxed">
          We sent a verification email to <strong className="text-white">{email}</strong> from <span className="text-indigo-300 font-mono">mypcaccc01@gmail.com</span>.
        </p>

        {/* 15-Minute Expiration Badge */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Verification Link Expiration:</span>
          </div>
          <span className={`font-mono text-sm font-bold ${timerSeconds < 180 ? 'text-rose-400' : 'text-amber-400'}`}>
            {formatTimer(timerSeconds)}
          </span>
        </div>

        {/* Information Callout */}
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 mb-8 space-y-2 text-xs text-indigo-200">
          <div className="flex items-center gap-2 font-semibold text-white">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Click the Link to Activate</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Please open the link contained in the verification email within 15 minutes. Once clicked, your account will be verified automatically and you will be redirected straight to your active dashboard.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-3">
          <button
            onClick={onNavigateToLogin}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
