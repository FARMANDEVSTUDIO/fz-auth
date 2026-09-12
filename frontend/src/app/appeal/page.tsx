'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Loader2, CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitAppeal } from './actions';
import Turnstile from '@/components/Turnstile';

export default function AppealPage() {
  const [appId, setAppId] = useState('');
  const [username, setUsername] = useState('');
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [cfToken, setCfToken] = useState('');
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId.trim() || !username.trim() || !reason.trim()) { setError('All fields are required'); return; }
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('app_id', appId.trim());
      fd.set('username', username.trim());
      fd.set('reason', reason.trim());
      if (cfToken) fd.set('cf_token', cfToken);
      const res = await submitAppeal(fd);
      if (res.ok) {
        setSent(true);
        toast.success('Appeal submitted!');
      } else {
        setError(res.message);
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden z-10">

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[520px]"
      >
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </motion.div>

        <div className="glass-strong rounded-2xl p-8 sm:p-10 shadow-2xl gradient-border">
          <div className="text-center mb-7">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'backOut', delay: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 text-yellow-400 mb-4 border border-yellow-500/20"
            >
              <Shield className="w-7 h-7" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">{sent ? 'Appeal Submitted' : 'Ban Appeal'}</h1>
            <p className="text-gray-400 text-sm mt-1.5">
              {sent ? 'Your appeal is being reviewed' : 'Submit an appeal if you believe your ban was unfair'}
            </p>
          </div>

          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-sm text-gray-400">Your appeal has been submitted. The app owner will review it.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>
              )}
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Application ID</label>
                <input type="text" value={appId} onChange={e => setAppId(e.target.value)} required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full bg-bg border border-edge rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Your Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="username"
                  className="w-full bg-bg border border-edge rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Why should you be unbanned?</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={4} placeholder="Explain your case..."
                  className="w-full bg-bg border border-edge rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors resize-none" />
              </div>
              <Turnstile onToken={setCfToken} />
              <button type="submit" disabled={pending}
                className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Appeal</>}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
