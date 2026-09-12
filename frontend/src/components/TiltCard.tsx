'use client';

import { useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function TiltCard({
  children,
  className = '',
  intensity = 8,
  glare = true,
  scale = 1.02,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [hovering, setHovering] = useState(false);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTransform({
      rotateX: (0.5 - y) * intensity,
      rotateY: (x - 0.5) * intensity,
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
    <div ref={ref} style={{ perspective: '1000px' }} className={className}>
      <motion.div
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        animate={{
          rotateX: transform.rotateX,
          rotateY: transform.rotateY,
          scale: hovering ? scale : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-full"
      >
        {children}
        {glare && (
          <motion.div
            animate={{ opacity: hovering ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
            style={{
              background: `radial-gradient(circle at ${transform.glareX}% ${transform.glareY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
