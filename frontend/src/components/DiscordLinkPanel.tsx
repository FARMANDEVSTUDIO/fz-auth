'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Unlink, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DiscordLinkPanel({
  discordId,
  generateAction,
  unlinkAction,
}: {
  discordId: string | null;
  generateAction: () => Promise<string | null>;
  unlinkAction: () => Promise<void>;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const c = await generateAction();
      if (c) {
        setCode(c);
        toast.success('Link code generated! Use /link in Discord.');
      } else {
        toast.error('Failed to generate code');
      }
    });
  };

  const handleUnlink = () => {
    if (!confirm('Unlink your Discord account?')) return;
    startTransition(async () => {
      await unlinkAction();
      toast.success('Discord unlinked');
    });
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl"
    >
      <div className="px-5 py-4 border-b border-edge/50">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-accent" /> Discord Link
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Link your Discord account to use bot commands with your website permissions.
        </p>
      </div>
      <div className="p-5">
        {discordId ? (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">
              Linked: {discordId}
            </span>
            <button
              onClick={handleUnlink}
              disabled={pending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5" /> Unlink
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleGenerate}
              disabled={pending}
              className="flex items-center gap-2 px-4 py-2 btn-gradient text-white rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              Generate Link Code
            </button>
            <AnimatePresence>
              {code && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="px-3 py-1.5 text-sm font-mono font-bold text-accent bg-accent/10 border border-accent/20 rounded-lg tracking-wider">
                    {code}
                  </span>
                  <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <span className="text-[11px] text-gray-500">Use <code className="text-accent">/link {code}</code> in Discord</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
