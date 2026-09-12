'use client';

import { motion } from 'framer-motion';

const shapes = [
  { type: 'circle', size: 80, x: '10%', y: '20%', duration: 20, delay: 0 },
  { type: 'hexagon', size: 60, x: '85%', y: '15%', duration: 25, delay: 2 },
  { type: 'diamond', size: 40, x: '75%', y: '70%', duration: 18, delay: 1 },
  { type: 'circle', size: 50, x: '20%', y: '75%', duration: 22, delay: 3 },
  { type: 'ring', size: 90, x: '50%', y: '45%', duration: 30, delay: 0.5 },
  { type: 'triangle', size: 45, x: '90%', y: '50%', duration: 24, delay: 1.5 },
  { type: 'dot', size: 8, x: '30%', y: '30%', duration: 15, delay: 0 },
  { type: 'dot', size: 6, x: '60%', y: '80%', duration: 12, delay: 2 },
  { type: 'dot', size: 10, x: '45%', y: '10%', duration: 17, delay: 1 },
];

function Shape({ type, size }: { type: string; size: number }) {
  const cls = 'w-full h-full';

  switch (type) {
    case 'hexagon':
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <polygon
            points="50,2 95,25 95,75 50,98 5,75 5,25"
            fill="none"
            stroke="rgb(var(--rgb-accent))"
            strokeWidth="0.5"
            opacity="0.06"
          />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <polygon
            points="50,5 95,50 50,95 5,50"
            fill="none"
            stroke="rgb(var(--rgb-accent))"
            strokeWidth="0.5"
            opacity="0.05"
          />
        </svg>
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <polygon
            points="50,8 95,92 5,92"
            fill="none"
            stroke="rgb(var(--rgb-accent))"
            strokeWidth="0.5"
            opacity="0.04"
          />
        </svg>
      );
    case 'ring':
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="rgb(var(--rgb-accent))"
            strokeWidth="0.4"
            opacity="0.04"
          />
          <circle
            cx="50" cy="50" r="30"
            fill="none"
            stroke="rgb(var(--rgb-accent))"
            strokeWidth="0.3"
            opacity="0.03"
            strokeDasharray="4 4"
          />
        </svg>
      );
    case 'dot':
      return (
        <div
          className="rounded-full w-full h-full"
          style={{ background: `rgb(var(--rgb-accent) / 0.08)`, boxShadow: `0 0 ${size}px rgb(var(--rgb-accent) / 0.05)` }}
        />
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <circle
            cx="50" cy="50" r="45"
            fill="rgb(var(--rgb-accent))"
            opacity="0.02"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="rgb(var(--rgb-accent))"
            strokeWidth="0.4"
            opacity="0.04"
          />
        </svg>
      );
  }
}

export default function FloatingShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
          }}
          animate={{
            y: [0, -20, 0, 15, 0],
            x: [0, 10, 0, -8, 0],
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.05, 0.95, 1.03, 1],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Shape type={s.type} size={s.size} />
        </motion.div>
      ))}
    </div>
  );
}
