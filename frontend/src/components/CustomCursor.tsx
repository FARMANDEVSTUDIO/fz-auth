'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const arrowRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const arrow = arrowRef.current;
    const trail = trailRef.current;
    if (!arrow || !trail) return;

    document.documentElement.classList.add('custom-cursor');

    let mouseX = -100;
    let mouseY = -100;
    let trailX = -100;
    let trailY = -100;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      arrow.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    };

    const onEnterInteractive = () => {
      arrow.classList.add('hovering');
      trail.classList.add('hovering');
    };
    const onLeaveInteractive = () => {
      arrow.classList.remove('hovering');
      trail.classList.remove('hovering');
    };

    const addHoverListeners = () => {
      document.querySelectorAll('a, button, [role="button"], input, select, textarea, .cursor-hover').forEach((el) => {
        el.addEventListener('mouseenter', onEnterInteractive);
        el.addEventListener('mouseleave', onLeaveInteractive);
      });
    };

    let animId: number;
    const animate = () => {
      trailX += (mouseX - trailX) * 0.12;
      trailY += (mouseY - trailY) * 0.12;
      const s = trail.classList.contains('hovering') ? 25 : 15;
      trail.style.transform = `translate(${trailX - s}px, ${trailY - s}px)`;
      animId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    addHoverListeners();
    animId = requestAnimationFrame(animate);

    const observer = new MutationObserver(() => addHoverListeners());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
      observer.disconnect();
      document.documentElement.classList.remove('custom-cursor');
    };
  }, []);

  return (
    <>
      <div ref={arrowRef} className="cursor-arrow hidden md:block">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.85 2.36a.5.5 0 0 0-.35.85z"
            fill="rgb(var(--rgb-accent))"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.2"
          />
        </svg>
      </div>
      <div ref={trailRef} className="cursor-trail hidden md:block" />
    </>
  );
}
