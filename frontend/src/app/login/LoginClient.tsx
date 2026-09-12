'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, KeyRound, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Turnstile from '@/components/Turnstile';

type OtpResult = { ok: boolean; message: string };

export default function LoginClient({
  googleAction,
  githubAction,
  loginAction,
  registerAction,
  sendOtpAction,
  verifyOtpAction,
  turnstileRequired,
}: {
  googleAction: (fd: FormData) => Promise<{ error?: string } | undefined>;
  githubAction: (fd: FormData) => Promise<{ error?: string } | undefined>;
  loginAction: (fd: FormData) => Promise<{ error?: string; needs2FA?: boolean } | undefined>;
  registerAction: (fd: FormData) => Promise<{ error?: string } | undefined>;
  sendOtpAction: (fd: FormData) => Promise<OtpResult>;
  verifyOtpAction: (fd: FormData) => Promise<OtpResult>;
  turnstileRequired: boolean;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regStep, setRegStep] = useState<'email' | 'otp' | 'details'>('email');
  const [regEmail, setRegEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [countdown, setCountdown] = useState(0);
  const [regPassword, setRegPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [cfToken, setCfToken] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) { setRefCode(ref); setMode('register'); }
  }, []);

  const pwRules = [
    { label: '8+ characters', met: regPassword.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(regPassword) },
    { label: 'Lowercase', met: /[a-z]/.test(regPassword) },
    { label: 'Number', met: /[0-9]/.test(regPassword) },
    { label: 'Special char', met: /[^A-Za-z0-9]/.test(regPassword) },
  ];
  const pwStrength = pwRules.filter(r => r.met).length;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const resetRegister = () => {
    setRegStep('email');
    setRegEmail('');
    setOtpDigits(['', '', '', '', '', '']);
    setRegPassword('');
    setAgreed(false);
    setError('');
    setCountdown(0);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    if (value.length > 1) {
      const chars = value.split('').filter(c => /\d/.test(c)).slice(0, 6);
      chars.forEach((ch, i) => {
        if (index + i < 6) newDigits[index + i] = ch;
      });
      setOtpDigits(newDigits);
      const focusIdx = Math.min(index + chars.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const isCaptchaReady = !turnstileRequired || !!cfToken;

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (turnstileRequired && !cfToken) {
      const msg = 'Please complete the CAPTCHA verification first';
      setError(msg); toast.error(msg); return;
    }
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('cf_token', cfToken);
    setLoginEmail(fd.get('email') as string);
    setLoginPassword(fd.get('password') as string);
    startTransition(async () => {
      const res = await loginAction(fd);
      if (res?.needs2FA) {
        setNeeds2FA(true);
        setTotpCode('');
        return;
      }
      if (res?.error) { setError(res.error); toast.error(res.error); }
    });
  };

  const handle2FASubmit = () => {
    if (totpCode.length !== 6) return;
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('email', loginEmail);
      fd.set('password', loginPassword);
      fd.set('totp_code', totpCode);
      const res = await loginAction(fd);
      if (res?.error) { setError(res.error); toast.error(res.error); }
    });
  };

  // Step 1: Send OTP
  const handleSendOtp = () => {
    if (!regEmail.trim()) { setError('Email is required'); return; }
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('email', regEmail.trim());
      const res = await sendOtpAction(fd);
      if (res.ok) {
        toast.success(res.message);
        setRegStep('otp');
        setCountdown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.message);
        toast.error(res.message);
      }
    });
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = () => {
    const code = otpDigits.join('');
    if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('email', regEmail.trim());
      fd.set('code', code);
      const res = await verifyOtpAction(fd);
      if (res.ok) {
        toast.success(res.message);
        setRegStep('details');
      } else {
        setError(res.message);
        toast.error(res.message);
      }
    });
  };

  // Resend OTP
  const handleResend = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('email', regEmail.trim());
      const res = await sendOtpAction(fd);
      if (res.ok) {
        toast.success('New code sent!');
        setCountdown(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.message);
        toast.error(res.message);
      }
    });
  };

  // Step 3: Register
  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed) {
      const msg = 'You must agree to the Terms of Service and Privacy Policy';
      setError(msg); toast.error(msg); return;
    }
    if (turnstileRequired && !cfToken) {
      const msg = 'Please complete the CAPTCHA verification first';
      setError(msg); toast.error(msg); return;
    }
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('email', regEmail.trim());
    if (refCode) fd.set('ref', refCode);
    fd.set('cf_token', cfToken);
    startTransition(async () => {
      const res = await registerAction(fd);
      if (res?.error) { setError(res.error); toast.error(res.error); }
    });
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    resetRegister();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden z-10">

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px]"
      >
        {/* Back to Home */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </motion.div>

        <div className="glass-strong rounded-2xl p-8 sm:p-10 shadow-2xl gradient-border aurora-glow depth-shadow">
          {/* Logo */}
          <div className="text-center mb-7">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'backOut', delay: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-purple-400/10 text-accent mb-4 relative border border-accent/20"
            >
              <Shield className="w-7 h-7" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-2xl border border-accent/20"
              />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold tracking-tight text-3d font-display">
              <span className="text-gradient-animated">{mode === 'login' ? 'Welcome Back' : regStep === 'email' ? 'Create Account' : regStep === 'otp' ? 'Verify Email' : 'Complete Setup'}</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-400 text-sm mt-1.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {mode === 'login'
                ? 'Login to manage your apps'
                : regStep === 'email'
                ? 'Enter your email to get started'
                : regStep === 'otp'
                ? `Code sent to ${regEmail}`
                : 'Set your password to finish'}
            </motion.p>
          </div>

          {/* Step indicators for register */}
          {mode === 'register' && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {(['email', 'otp', 'details'] as const).map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    regStep === step
                      ? 'btn-gradient text-white scale-110'
                      : (['email', 'otp', 'details'].indexOf(regStep) > i)
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-bg border border-edge text-gray-600'
                  }`}>
                    {(['email', 'otp', 'details'].indexOf(regStep) > i) ? '✓' : i + 1}
                  </div>
                  {i < 2 && <div className={`w-8 h-0.5 rounded ${(['email', 'otp', 'details'].indexOf(regStep) > i) ? 'bg-accent/40' : 'bg-edge/50'}`} />}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Turnstile CAPTCHA — must verify before ANY action */}
          {!needs2FA && (
            <div className="mb-4">
              <Turnstile onToken={setCfToken} />
              {turnstileRequired && !cfToken && (
                <p className="text-[10px] text-yellow-400/70 text-center mt-1 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> Complete CAPTCHA to continue
                </p>
              )}
            </div>
          )}

          {/* ====== LOGIN MODE ====== */}
          {mode === 'login' && !needs2FA && (
            <motion.form
              onSubmit={handleLogin}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="email" name="email" required placeholder="name@example.com"
                    className="w-full bg-bg border border-edge rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPw ? 'text' : 'password'} name="password" required minLength={6} placeholder="••••••••"
                    className="w-full bg-bg border border-edge rounded-xl ps-10 pe-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-accent hover:text-accent2 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={pending || !isCaptchaReady}
                className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : !isCaptchaReady ? <><Shield className="w-4 h-4" /><span>Complete CAPTCHA First</span></> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </motion.form>
          )}

          {/* ====== 2FA STEP ====== */}
          {mode === 'login' && needs2FA && (
            <motion.div
              key="2fa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>Two-factor authentication is required for this account</span>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Enter 6-digit code from your authenticator app</label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-bg border border-edge rounded-xl px-4 py-3 text-white text-center text-lg font-mono tracking-[0.3em] focus:outline-none focus:border-accent transition-colors placeholder:text-gray-700"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handle2FASubmit(); }}
                />
              </div>

              <button
                onClick={handle2FASubmit}
                disabled={pending || totpCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Verify & Sign In</>}
              </button>

              <button
                onClick={() => { setNeeds2FA(false); setTotpCode(''); setError(''); }}
                className="w-full text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to login
              </button>
            </motion.div>
          )}

          {/* ====== REGISTER STEP 1: EMAIL ====== */}
          {mode === 'register' && regStep === 'email' && (
            <motion.div
              key="reg-email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-bg border border-edge rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSendOtp(); } }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">We&apos;ll send a verification code to this email</p>
              </div>

              <button onClick={handleSendOtp} disabled={pending}
                className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send Verification Code</>}
              </button>
            </motion.div>
          )}

          {/* ====== REGISTER STEP 2: OTP ====== */}
          {mode === 'register' && regStep === 'otp' && (
            <motion.div
              key="reg-otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs text-gray-400 font-medium mb-3 text-center">Enter 6-digit verification code</label>
                <div className="flex justify-center gap-2">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold bg-bg border rounded-xl text-white focus:outline-none transition-all ${
                        digit ? 'border-accent/50 glow-accent' : 'border-edge focus:border-accent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button onClick={handleVerifyOtp} disabled={pending || otpDigits.join('').length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Verify Code</>}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setRegStep('email'); setError(''); }}
                  className="text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Change email
                </button>
                <button type="button" onClick={handleResend} disabled={pending || countdown > 0}
                  className="text-accent hover:text-accent2 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed">
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ====== REGISTER STEP 3: PASSWORD & NAME ====== */}
          {mode === 'register' && regStep === 'details' && (
            <motion.form
              key="reg-details"
              onSubmit={handleRegister}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Verified badge */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span><strong>{regEmail}</strong> verified</span>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Name</label>
                <div className="relative">
                  <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" name="name" placeholder="Your name"
                    className="w-full bg-bg border border-edge rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type={showPw ? 'text' : 'password'} name="password" required minLength={8} placeholder="Strong password..."
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    className="w-full bg-bg border border-edge rounded-xl ps-10 pe-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {regPassword && (
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
                  <input type={showPw ? 'text' : 'password'} name="confirm" required minLength={8} placeholder="Repeat password..."
                    className="w-full bg-bg border border-edge rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group py-1">
                <div className="relative mt-0.5">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
                  <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                    agreed ? 'bg-accent border-accent' : 'border-gray-600 group-hover:border-gray-500'
                  }`}>
                    {agreed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
                </span>
              </label>

              <button type="submit" disabled={pending || !isCaptchaReady}
                className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : !isCaptchaReady ? <><Shield className="w-4 h-4" /><span>Complete CAPTCHA First</span></> : <><KeyRound className="w-4 h-4" /> Create Account</>}
              </button>
            </motion.form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-edge/50" />
            <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">or continue with</span>
            <div className="flex-1 border-t border-edge/50" />
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            <form action={(fd: FormData) => {
              fd.set('cf_token', cfToken);
              startTransition(async () => {
                const res = await googleAction(fd);
                if (res?.error) { setError(res.error); toast.error(res.error); }
              });
            }}>
              <button type="submit" disabled={!isCaptchaReady || pending}
                className="w-full flex items-center justify-center gap-2.5 py-3 bg-white/5 border border-edge hover:bg-white/10 hover:border-accent/30 hover:shadow-[0_0_20px_rgb(var(--rgb-accent)/0.12)] text-white rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Google
              </button>
            </form>
            <form action={(fd: FormData) => {
              fd.set('cf_token', cfToken);
              startTransition(async () => {
                const res = await githubAction(fd);
                if (res?.error) { setError(res.error); toast.error(res.error); }
              });
            }}>
              <button type="submit" disabled={!isCaptchaReady || pending}
                className="w-full flex items-center justify-center gap-2.5 py-3 bg-white/5 border border-edge hover:bg-white/10 hover:border-accent/30 hover:shadow-[0_0_20px_rgb(var(--rgb-accent)/0.12)] text-white rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </form>
          </div>

          {/* Toggle */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center text-xs text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-accent hover:text-accent2 font-semibold transition-colors">
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </motion.p>
        </div>

        {/* Footer */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center text-xs text-gray-600 mt-5">
          Developed by FZ
        </motion.p>
      </motion.div>
    </div>
  );
}
