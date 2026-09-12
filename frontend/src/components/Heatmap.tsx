'use client';

import { motion } from 'framer-motion';

const WEEKS = 26;
const DAYS = 7;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getColor(count: number): string {
  if (count === 0) return 'bg-white/[0.03]';
  if (count <= 2) return 'bg-accent/20';
  if (count <= 5) return 'bg-accent/40';
  if (count <= 10) return 'bg-accent/60';
  return 'bg-accent/90 shadow-[0_0_6px_rgb(var(--rgb-accent)/0.3)]';
}

export default function Heatmap({ data }: { data: Record<string, number> }) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS * 7 - 1));

  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  const cells: Array<{ date: string; count: number; day: number; week: number }> = [];

  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(cellDate.getDate() + w * 7 + d);
      const key = cellDate.toISOString().slice(0, 10);
      const count = data[key] || 0;
      if (cellDate <= today) {
        cells.push({ date: key, count, day: d, week: w });
      }
    }
  }

  const totalEvents = Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          <span className="text-accent font-semibold">{totalEvents}</span> events in the last {WEEKS * 7} days
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          Less
          {[0, 2, 5, 10, 15].map(n => (
            <div key={n} className={`w-2.5 h-2.5 rounded-sm ${getColor(n)} transition-all hover:scale-150`} />
          ))}
          More
        </div>
      </div>
      <div className="flex gap-0.5">
        <div className="flex flex-col gap-0.5 me-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-2.5 text-[8px] text-gray-600 flex items-center">{label}</div>
          ))}
        </div>
        {Array.from({ length: WEEKS }, (_, w) => (
          <div key={w} className="flex flex-col gap-0.5">
            {Array.from({ length: DAYS }, (_, d) => {
              const cell = cells.find(c => c.week === w && c.day === d);
              if (!cell) return <div key={d} className="w-2.5 h-2.5" />;
              return (
                <motion.div
                  key={d}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: w * 0.02 + d * 0.01,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`w-2.5 h-2.5 rounded-sm ${getColor(cell.count)} transition-all hover:scale-[2] hover:rounded-md hover:z-10 relative cursor-crosshair`}
                  title={`${cell.date}: ${cell.count} events`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
