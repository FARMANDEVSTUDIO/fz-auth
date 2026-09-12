'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldOff, Copy, Check, Loader2, Key } from 'lucide-react';
import { toast } from 'sonner';
import { setup2FA, verify2FASetup, disable2FA } from '@/app/(panel)/account/actions';
import { soundSuccess, soundCopy } from '@/lib/sounds';

export default function TwoFASetup({ enabled }: { enabled: boolean }) {
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle');
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSetup = () => {
    startTransition(async () => {
      const result = await setup2FA();
      setSecret(result.secret);
      setUri(result.uri);
      setBackupCodes(result.backupCodes);
      setStep('setup');
    });
  };

  const handleVerify = () => {
    if (code.length !== 6) return;
    startTransition(async () => {
      const res = await verify2FASetup(code);
      if (res.ok) {
        toast.success(res.message);
        soundSuccess();
        setStep('idle');
        setCode('');
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDisable = () => {
    if (code.length !== 6) return;
    startTransition(async () => {
      const res = await disable2FA(code);
      if (res.ok) {
        toast.success(res.message);
        setStep('idle');
        setCode('');
      } else {
        toast.error(res.message);
      }
    });
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    soundCopy();
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    soundCopy();
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-edge/50 flex items-center gap-3">
        <Shield className="w-4 h-4 text-accent" />
        <div>
          <h3 className="text-sm font-semibold text-white">Two-Factor Authentication</h3>
          <p className="text-[10px] text-gray-500">Add an extra layer of security to your account</p>
        </div>
        <div className="ms-auto">
          {enabled ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Enabled
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30 rounded-full">
              <ShieldOff className="w-3 h-3" /> Disabled
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-gray-400 mb-4">
                {enabled
                  ? 'Your account is protected with 2FA. You can disable it if needed.'
                  : 'Protect your account with an authenticator app like Google Authenticator, Authy, or 1Password.'}
              </p>
              {enabled ? (
                <button
                  onClick={() => { setStep('disable'); setCode(''); }}
                  className="px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  onClick={handleSetup}
                  disabled={pending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  Enable 2FA
                </button>
              )}
            </motion.div>
          )}

          {step === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <p className="text-sm text-white font-medium mb-2">Step 1: Add to your authenticator app</p>
                <p className="text-xs text-gray-400 mb-3">
                  Open your authenticator app and add a new account. Enter the secret key below manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 bg-bg border border-edge rounded-lg text-xs text-accent font-mono select-all break-all">
                    {secret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="px-3 py-2.5 border border-edge rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    {copiedSecret ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-white font-medium mb-2">Step 2: Save backup codes</p>
                <p className="text-xs text-gray-400 mb-3">
                  Save these codes somewhere safe. You can use them to access your account if you lose your authenticator.
                </p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {backupCodes.map((c, i) => (
                    <code key={i} className="px-2 py-1.5 text-center bg-bg border border-edge rounded text-[11px] text-gray-300 font-mono">
                      {c}
                    </code>
                  ))}
                </div>
                <button
                  onClick={copyBackupCodes}
                  className="text-xs text-accent hover:text-accent2 transition-colors flex items-center gap-1"
                >
                  {copiedCodes ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedCodes ? 'Copied!' : 'Copy all codes'}
                </button>
              </div>

              <button
                onClick={() => { setStep('verify'); setCode(''); }}
                className="px-4 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent2 rounded-lg transition-colors"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-white font-medium">Step 3: Verify setup</p>
              <p className="text-xs text-gray-400">Enter the 6-digit code from your authenticator app to confirm setup:</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-40 px-4 py-2.5 bg-bg border border-edge rounded-lg text-white text-center text-lg font-mono tracking-[0.3em] focus:outline-none focus:border-accent placeholder:text-gray-700"
                  autoFocus
                />
                <button
                  onClick={handleVerify}
                  disabled={pending || code.length !== 6}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Verify & Enable
                </button>
              </div>
              <button onClick={() => setStep('idle')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Cancel
              </button>
            </motion.div>
          )}

          {step === 'disable' && (
            <motion.div key="disable" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-sm text-white font-medium">Disable 2FA</p>
              <p className="text-xs text-gray-400">Enter a code from your authenticator app to confirm:</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-40 px-4 py-2.5 bg-bg border border-edge rounded-lg text-white text-center text-lg font-mono tracking-[0.3em] focus:outline-none focus:border-accent placeholder:text-gray-700"
                  autoFocus
                />
                <button
                  onClick={handleDisable}
                  disabled={pending || code.length !== 6}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                  Disable 2FA
                </button>
              </div>
              <button onClick={() => setStep('idle')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
