'use client';

import { motion } from 'framer-motion';
import { Moon, Flame, Sun } from 'lucide-react';
import { useTheme, type Theme } from './ThemeProvider';

const icons: Record<Theme, { icon: typeof Moon; color: string; label: string }> = {
  dark:  { icon: Moon,  color: 'text-violet-400', label: 'Dark' },
  warm:  { icon: Flame, color: 'text-amber-400',  label: 'Warm' },
  light: { icon: Sun,   color: 'text-orange-500',  label: 'Light' },
};

export default function ThemeToggle() {
  const { theme, cycle } = useTheme();
  const { icon: Icon, color, label } = icons[theme];

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-edge hover:bg-white/5 transition-colors"
      title={`Theme: ${label} — click to switch`}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
      >
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </motion.div>
      <span className={`text-xs font-medium hidden sm:inline ${color}`}>{label}</span>
    </button>
  );
}
