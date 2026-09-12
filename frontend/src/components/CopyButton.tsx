'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CopyButton({ text, value, title = 'Copy' }: { text?: string; value?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const copyText = text || value || '';

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        navigator.clipboard.writeText(copyText);
        setCopied(true);
        toast.success('Copied!');
        setTimeout(() => setCopied(false), 1500);
      }}
      className="w-7 h-7 flex items-center justify-center rounded-lg border border-edge text-gray-400 hover:text-white hover:bg-card2 transition-colors"
      title={title}
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
  );
}
