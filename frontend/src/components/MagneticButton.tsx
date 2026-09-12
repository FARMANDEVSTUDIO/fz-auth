'use client';

import { useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function MagneticButton({
  children,
  className = '',
  href,
  onClick,
  type,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: 'submit' | 'button';
  disabled?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.2;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.2;
    setPos({ x, y });
  };

  const reset = () => setPos({ x: 0, y: 0 });

  const props = {
    ref: ref as any,
    onMouseMove: handleMouse,
    onMouseLeave: reset,
    className,
    disabled,
    animate: { x: pos.x, y: pos.y },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  };

  if (href) {
    return (
      <motion.a href={href} {...props}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button type={type || 'button'} onClick={onClick} {...props}>
      {children}
    </motion.button>
  );
}
