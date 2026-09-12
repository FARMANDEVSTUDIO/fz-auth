'use client';

import { Suspense, useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowLeft, Loader2, CheckCircle, XCircle, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { validateToken, resetPassword } from './actions';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const pwRules = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(password) },
    { label: 'Lowercase', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special char', met: /[^A-Za-z0-9]/.test(password) },
  ];
  const pwStrength = pwRules.filter(r => r.met).length;

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    validateToken(token).then(res => {
      if (res.valid && res.email) {
        setEmail(res.email);
        setStatus('valid');
      } else {
        setStatus('invalid');
      }
    });
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('token', token);
      fd.set('password', password);
      fd.set('confirm', confirm);
      const res = await resetPassword(fd);
      if (res.ok) {
        setStatus('success');
        toast.success(res.message);
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
              {status === 'loading' ? 'Verifying...' : status === 'invalid' ? 'Invalid Link' : status === 'success' ? 'Password Reset!' : 'New Password'}
            </motion.h1>
          </div>

          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          )}

          {status === 'invalid' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mx-auto">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-sm text-gray-400">This reset link is invalid or has expired.</p>
              <Link href="/forgot-password"
                className="inline-flex items-center gap-2 py-2.5 px-5 btn-gradient text-white rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]">
                Request New Link
              </Link>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-sm text-gray-400">Your password has been updated successfully.</p>
              <Link href="/login"
                className="inline-flex items-center gap-2 py-2.5 px-5 btn-gradient text-white rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]">
                Sign In
              </Link>
            </motion.div>
          )}

          {status === 'valid' && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>Resetting password for <strong className="text-white">{email}</strong></span>
              </div>

              {error && (
                <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Strong password..."
                    className="w-full bg-bg border border-edge rounded-xl ps-10 pe-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                          i <= pwStrength
                            ? pwStrength <= 2 ? 'bg-red-500' : pwStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                            : 'bg-edge'
                        }`} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {pwRules.map(r => (
                        <span key={r.label} className={`flex items-center gap-1 text-[10px] ${r.met ? 'text-green-400' : 'text-gray-600'}`}>
                          {r.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Repeat password..."
                    className="w-full bg-bg border border-edge rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                {confirm && password !== confirm && (
                  <p className="text-[10px] text-red-400 mt-1">Passwords don&apos;t match</p>
                )}
              </div>

              <button type="submit" disabled={pending}
                className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Reset Password</>}
              </button>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
