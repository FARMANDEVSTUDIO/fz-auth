'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sendResetLink } from './actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('email', email.trim());
      const res = await sendResetLink(fd);
      if (res.ok) {
        setSent(true);
        toast.success('Reset link sent!');
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
        className="w-full max-w-[480px]"
      >
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mb-5">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
        </motion.div>

        <div className="glass-strong rounded-2xl p-8 sm:p-10 shadow-2xl gradient-border">
          <div className="text-center mb-7">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'backOut', delay: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-400/10 text-accent mb-4 relative border border-accent/20"
            >
              <Shield className="w-7 h-7" />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-white tracking-tight">
              {sent ? 'Check Your Email' : 'Forgot Password'}
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-400 text-sm mt-1.5">
              {sent ? 'We sent a password reset link to your email' : 'Enter your email to receive a reset link'}
            </motion.p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-sm text-gray-400">
                If <strong className="text-white">{email}</strong> is registered, you&apos;ll receive a reset link shortly.
              </p>
              <p className="text-xs text-gray-600">
                The link expires in 60 minutes. Check your spam folder.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent2 transition-colors mt-4">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {error && (
                <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-bg border border-edge/60 rounded-xl input-enhanced ps-10 pe-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <button type="submit" disabled={pending}
                className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send Reset Link</>}
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
