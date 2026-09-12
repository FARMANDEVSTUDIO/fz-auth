'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function MotionCard({
  children,
  className = '',
  delay = 0,
  tilt = true,
  tiltIntensity = 5,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  tilt?: boolean;
  tiltIntensity?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [hovering, setHovering] = useState(false);

  const handleMove = (e: React.MouseEvent) => {
    if (!tilt) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTransform({
      rotateX: (0.5 - y) * tiltIntensity,
      rotateY: (x - 0.5) * tiltIntensity,
      glareX: x * 100,
      glareY: y * 100,
    });
  };

  const handleEnter = () => setHovering(true);
  const handleLeave = () => {
    setHovering(false);
    setTransform({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  return (
    <div ref={ref} style={{ perspective: hovering ? '1200px' : undefined }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: tilt ? transform.rotateX : 0,
          rotateY: tilt ? transform.rotateY : 0,
        }}
        transition={{
          opacity: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
          rotateX: { type: 'spring', stiffness: 300, damping: 20 },
          rotateY: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ transformStyle: hovering ? 'preserve-3d' : undefined, ...style }}
        className={`card-hover-glow border-beam relative ${className}`}
      >
        {children}
        {tilt && (
          <motion.div
            animate={{ opacity: hovering ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
            style={{
              background: `radial-gradient(circle at ${transform.glareX}% ${transform.glareY}%, rgba(255,255,255,0.03) 0%, transparent 50%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
