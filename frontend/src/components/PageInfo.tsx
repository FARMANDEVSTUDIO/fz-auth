'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

export default function PageInfo({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-3.5 p-4 glass rounded-xl relative overflow-hidden"
    >
      {/* Left accent bar */}
      <div className="absolute start-0 top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-accent via-accent/60 to-transparent" />

      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent ring-1 ring-accent/20 ms-1">
        {icon || <Info className="w-4 h-4" />}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}
