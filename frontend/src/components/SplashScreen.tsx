'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
          style={{ background: 'var(--color-bg)' }}
        >
          {/* Ambient glow rings */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.02, 0.06] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgb(var(--rgb-accent) / 0.08), transparent 70%)' }}
          />
          <motion.div
            animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.04, 0.08, 0.04] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgb(var(--rgb-accent2) / 0.04), transparent 70%)' }}
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-5 relative"
            style={{ perspective: '800px' }}
          >
            <motion.div
              animate={{
                scale: [1, 1.12, 1],
                opacity: [0.8, 1, 0.8],
                rotateY: [0, 10, 0, -10, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center relative glow-pulse"
            >
              <Shield className="w-10 h-10 text-accent" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-2xl border border-accent/15"
                style={{ borderStyle: 'dashed' }}
              />
            </motion.div>

            <div className="text-center">
              <h1 className="text-3xl font-black tracking-wider font-display text-3d-hero">
                FZ <span className="text-gradient-animated">AUTH</span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-gray-500 mt-2 tracking-[0.25em] uppercase"
              >
                Securing Your Software
              </motion.p>
            </div>

            <div className="w-52 h-1.5 rounded-full bg-white/5 overflow-hidden mt-3 relative">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bar-gradient relative"
              >
                <div className="absolute inset-0 shimmer" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
