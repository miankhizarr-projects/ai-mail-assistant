import React from 'react';
import { Loader2 } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center select-none overflow-hidden">
      <div className="relative flex items-center justify-center">
        {/* Soft subtle indigo ambient glow behind spinner */}
        <div className="absolute w-16 h-16 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
        
        {/* Single Loader Animation */}
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin relative z-10" />
      </div>
    </div>
  );
};
