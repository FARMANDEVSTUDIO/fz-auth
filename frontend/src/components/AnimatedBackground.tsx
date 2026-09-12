'use client';

import { useEffect, useRef } from 'react';

function getThemeColors(): { particle: string; orbs: { hue: number; sat: number }[] } {
  if (typeof document === 'undefined') return { particle: '139, 92, 246', orbs: [{ hue: 270, sat: 70 }, { hue: 290, sat: 60 }, { hue: 320, sat: 50 }] };
  const html = document.documentElement;
  if (html.classList.contains('warm')) {
    return { particle: '245, 158, 11', orbs: [{ hue: 35, sat: 80 }, { hue: 25, sat: 70 }, { hue: 45, sat: 60 }] };
  }
  if (html.classList.contains('light')) {
    return { particle: '184, 58, 8', orbs: [{ hue: 15, sat: 75 }, { hue: 25, sat: 65 }, { hue: 10, sat: 55 }] };
  }
  return { particle: '139, 92, 246', orbs: [{ hue: 270, sat: 70 }, { hue: 290, sat: 60 }, { hue: 320, sat: 50 }] };
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    let colors = getThemeColors();

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; pulse: number; pulseSpeed: number;
    }[] = [];

    const count = Math.min(55, Math.floor((w * h) / 28000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.25 + 0.05,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.008 + 0.004,
      });
    }

    const orbs = [
      { x: w * 0.15, y: h * 0.25, r: Math.min(350, w * 0.25), vx: 0.12, vy: 0.08 },
      { x: w * 0.8, y: h * 0.65, r: Math.min(280, w * 0.2), vx: -0.1, vy: -0.06 },
      { x: w * 0.5, y: h * 0.5, r: Math.min(220, w * 0.16), vx: 0.06, vy: -0.12 },
    ];

    let mouseX = -1000;
    let mouseY = -1000;

    function handleMouse(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];
        const c = colors.orbs[i];
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;

        const g = ctx!.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        g.addColorStop(0, `hsla(${c.hue}, ${c.sat}%, 50%, 0.07)`);
        g.addColorStop(0.4, `hsla(${c.hue}, ${c.sat - 10}%, 40%, 0.035)`);
        g.addColorStop(1, 'transparent');
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      for (const p of particles) {
        p.pulse += p.pulseSpeed;

        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150 * 0.015;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }

        p.vx *= 0.999;
        p.vy *= 0.999;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const o = p.opacity * (0.6 + Math.sin(p.pulse) * 0.4);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${colors.particle}, ${o})`;
        ctx!.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = dx * dx + dy * dy;
          if (d < 14400) {
            const o = (1 - Math.sqrt(d) / 120) * 0.07;
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(${colors.particle}, ${o})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();

    function handleResize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }

    const observer = new MutationObserver(() => {
      colors = getThemeColors();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouse, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.6, zIndex: 0 }}
      suppressHydrationWarning
    />
  );
}
