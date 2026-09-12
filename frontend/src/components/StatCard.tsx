'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatCard({
  label,
  value,
  icon,
  tone = 'blue',
  delay = 0,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: 'blue' | 'green' | 'red' | 'yellow';
  delay?: number;
}) {
  const tones: Record<string, { bg: string; text: string; glow: string; ring: string; dot: string; gradient: string }> = {
    blue: {
      bg: 'bg-accent/8',
      text: 'text-accent',
      glow: 'hover:shadow-[0_0_12px_rgb(var(--rgb-accent)/0.06)]',
      ring: 'ring-accent/15',
      dot: 'bg-accent',
      gradient: 'from-accent/10 to-accent/3',
    },
    green: {
      bg: 'bg-emerald-500/8',
      text: 'text-emerald-400',
      glow: 'hover:shadow-[0_0_12px_rgba(16,185,129,0.06)]',
      ring: 'ring-emerald-500/15',
      dot: 'bg-emerald-400',
      gradient: 'from-emerald-500/10 to-emerald-500/3',
    },
    red: {
      bg: 'bg-red-500/8',
      text: 'text-red-400',
      glow: 'hover:shadow-[0_0_12px_rgba(239,68,68,0.06)]',
      ring: 'ring-red-500/15',
      dot: 'bg-red-400',
      gradient: 'from-red-500/10 to-red-500/3',
    },
    yellow: {
      bg: 'bg-amber-500/8',
      text: 'text-amber-400',
      glow: 'hover:shadow-[0_0_12px_rgba(245,158,11,0.06)]',
      ring: 'ring-amber-500/15',
      dot: 'bg-amber-400',
      gradient: 'from-amber-500/10 to-amber-500/3',
    },
  };
  const t = tones[tone];

  return (
    <div className="card-3d">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -4, transition: { duration: 0.25 } }}
        className={`card-3d-inner glass rounded-xl p-5 flex items-center gap-4 card-hover-glow cursor-default relative overflow-hidden border-beam hover-lift`}
      >
        {/* Subtle gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-50 pointer-events-none`} />

        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${t.bg} ${t.text} ring-1 ${t.ring}`}>
          {icon}
          <span className={`absolute -top-0.5 -end-0.5 pulse-dot ${t.dot}`} />
        </div>
        <div className="relative">
          <p className="text-2xl font-bold text-white leading-tight text-embossed font-display">
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium tracking-wide">{label}</p>
        </div>
      </motion.div>
    </div>
  );
}
