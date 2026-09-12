'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden z-10">

      <div className="w-full max-w-md text-center">
        <div className="glass-strong rounded-2xl p-10 shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 text-red-400 mb-6 border border-red-500/20">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-3">500</p>
          <h2 className="text-xl font-bold text-white mb-2">Something Went Wrong</h2>
          <p className="text-sm text-gray-400 mb-8">
            An unexpected error occurred. Please try again.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-accent/25">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <Link href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-edge text-white rounded-xl text-sm font-semibold transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]">
              <Home className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-6 flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3" /> FZ AUTH
        </p>
      </div>
    </div>
  );
}
