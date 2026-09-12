'use client';

import { motion } from 'framer-motion';

export default function TextReveal({
  text,
  className = '',
  delay = 0,
  speed = 0.03,
  once = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  once?: boolean;
}) {
  const words = text.split(' ');

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-40px' }}
      variants={{
        visible: { transition: { staggerChildren: speed * 3 } },
      }}
      className={className}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span key={wi} className="inline-block me-[0.25em]">
          {word.split('').map((char, ci) => (
            <motion.span
              key={ci}
              className="inline-block"
              variants={{
                hidden: {
                  opacity: 0,
                  y: 20,
                  rotateX: -90,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  transition: {
                    duration: 0.5,
                    delay: delay + (wi * word.length + ci) * speed,
                    ease: [0.22, 1, 0.36, 1],
                  },
                },
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
}

export function TextSlideUp({
  text,
  className = '',
  delay = 0,
  tag: Tag = 'h2',
}: {
  text: string;
  className?: string;
  delay?: number;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial={{ y: '110%', skewY: 4, opacity: 0 }}
        whileInView={{ y: '0%', skewY: 0, opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`block ${className}`}
      >
        {text}
      </motion.span>
    </span>
  );
}

export function CountUp({
  value,
  duration = 2,
  className = '',
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}
