'use client';

import { motion } from 'framer-motion';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
}

export default function BarChart({ data, color = 'bg-accent', height = 160 }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="relative">
      {/* Background grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="border-t border-edge/20 w-full" />
        ))}
      </div>

      <div className="flex items-end gap-1.5 relative" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
              <span className="text-[9px] text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-card/90 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                {d.value}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ duration: 0.6, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                className={`w-full ${color} rounded-t-md min-h-[2px] cursor-default transition-all duration-200 group-hover:brightness-125 group-hover:shadow-[0_0_10px_rgba(var(--rgb-accent)/0.2)]`}
                title={`${d.label}: ${d.value}`}
              />
              <span className="text-[8px] text-gray-600 truncate w-full text-center font-medium">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
