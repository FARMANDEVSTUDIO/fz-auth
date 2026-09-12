'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { soundCopy } from '@/lib/sounds';

export default function CopyField({ label, value, mask = false }: { label: string; value: string; mask?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!mask);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    soundCopy();
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-accent/40" />
        {label}
      </p>
      <div className="flex items-center gap-1.5 bg-bg border border-edge/60 rounded-lg overflow-hidden hover:border-accent/20 transition-colors group">
        <code
          className={`flex-1 px-3 py-2.5 text-xs text-gray-300 font-mono truncate select-all transition-all duration-300 ${
            !revealed ? 'blur-[5px] hover:blur-none cursor-pointer' : ''
          }`}
          title={!revealed ? 'Hover to reveal' : undefined}
        >
          {value}
        </code>
        <div className="flex items-center gap-0.5 pe-1.5">
          {mask && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRevealed(r => !r)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-accent hover:bg-accent/10 transition-colors"
              title={revealed ? 'Blur' : 'Always show'}
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={copy}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-accent hover:bg-accent/10 transition-colors"
            title="Copy"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                </motion.div>
              ) : (
                <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
