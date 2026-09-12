'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, ArrowRight, ChevronDown, Code2, Terminal, CheckCircle2,
  Zap, Lock, Globe, Users, Clock, ShieldCheck, Server, Cpu, Eye,
} from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import MagneticButton from '@/components/MagneticButton';

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setDisplay(value); return; }
    const duration = 1500;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = eased * num;
      setDisplay(value.includes('.') ? current.toFixed(1) : Math.floor(current).toLocaleString());
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

function FadeInSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const languages = ['C++', 'C#', 'Python', 'Go', 'Rust', 'JavaScript', 'Java'];

const stats = [
  { icon: Users, label: 'ACTIVE APPS', value: '2,800', suffix: '+' },
  { icon: Zap, label: 'API CALLS / DAY', value: '1.2', suffix: 'M' },
  { icon: Clock, label: 'AVG LATENCY', value: '38', suffix: 'ms' },
  { icon: Lock, label: 'KEYS ISSUED', value: '94,000', suffix: '+' },
];

const features = [
  {
    icon: Lock,
    title: 'HWID Locking',
    desc: 'Bind each license to a single device. Prevent key sharing and unauthorized access with hardware-level verification.',
  },
  {
    icon: Server,
    title: 'Cloud Dashboard',
    desc: 'Manage users, keys, and sessions from one panel. Real-time stats, team roles, and webhook alerts included.',
  },
  {
    icon: Code2,
    title: 'Plug & Play SDKs',
    desc: 'Copy-paste snippets for C++, C#, Python, and more. Your app talks to our API — we handle the rest.',
  },
];

const provides = [
  'Encrypted Key Generation & Validation',
  'Per-device Hardware Binding',
  'Cloud-hosted Auth Endpoints',
  'Multi-app Session Tracking',
  'Webhook & Event Logging',
];

const responsibilities = [
  'Call our API before granting access',
  'Obfuscate your binary if distributing',
  'Store secrets server-side only',
  'Keep your admin key private',
  'Test before pushing to production',
];

const taglines = [
  'License Management',
  'HWID Protection',
  'Session Control',
  'Webhook Alerts',
  'Team Roles',
  'User Analytics',
  'Key Generation',
  'Auto Expiry',
];

function TaglineContent({ text }: { text: string }) {
  return (
    <>
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 border border-accent/30">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </span>
      <span className="text-xl font-bold tracking-tight text-gradient drop-shadow-sm">
        {text}
      </span>
    </>
  );
}

function RotatingTagline() {
  const [index, setIndex] = useState(0);
  // AnimatePresence renders differently on server vs client, so mount it
  // only after hydration; until then show a static copy of the first tagline.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setIndex((i) => (i + 1) % taglines.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-10 overflow-hidden">
      {mounted ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -32, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute start-0 inline-flex items-center gap-3"
          >
            <TaglineContent text={taglines[index]} />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="absolute start-0 inline-flex items-center gap-3">
          <TaglineContent text={taglines[0]} />
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative z-10">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 start-0 end-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-bg/80 backdrop-blur-xl border-b border-edge/50 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/10 text-accent flex items-center justify-center border border-accent/20"
            >
              <Shield className="w-5 h-5" />
            </motion.div>
            <span className="font-bold text-[15px] tracking-tight">
              FZ <span className="text-accent">AUTH</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#stats" className="text-sm text-gray-400 hover:text-white transition-colors">Stats</a>
            <a href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">About</a>
            <div className="w-px h-5 bg-edge/50" />
            <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
              Log In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent/25"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3">
            <Link href="/login" className="text-sm text-gray-300">Log In</Link>
            <Link href="/login" className="px-4 py-1.5 bg-accent text-white rounded-lg text-sm font-semibold">
              Sign Up
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold tracking-wider uppercase mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              NOW IN PUBLIC BETA
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6 text-3d-hero"
            >
              PROTECT YOUR{' '}
              <span className="text-metallic">
                SOFTWARE
              </span>
              <br />
              LIKE A PRO.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-5 h-10"
            >
              <RotatingTagline />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-gray-400 text-lg max-w-lg mb-8 leading-relaxed"
            >
              License keys, HWID locks, session control — everything you need
              to ship secure apps without writing auth from scratch.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <MagneticButton
                href="/login"
                className="group flex items-center gap-2 px-7 py-3.5 btn-gradient text-white rounded-2xl font-bold text-sm tracking-wider uppercase transition-all hover:shadow-xl hover:shadow-accent/30"
              >
                GET FREE ACCESS
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <MagneticButton
                href="#features"
                className="flex items-center gap-2 px-7 py-3.5 bg-white/5 border border-edge hover:bg-white/10 text-white rounded-2xl font-bold text-sm tracking-wider uppercase transition-all"
              >
                SEE HOW IT WORKS
              </MagneticButton>
            </motion.div>
          </div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: -12 }}
            animate={{ opacity: 1, x: 0, rotateY: -4 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="hidden lg:block relative [perspective:1200px] [transform-style:preserve-3d]"
          >
            <div className="relative rounded-2xl overflow-hidden glass-strong shadow-2xl shadow-black/40 border border-edge/50">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-edge/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[11px] text-gray-500 bg-bg/50 px-3 py-0.5 rounded-md">fzauth.dev/dashboard</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">FZ AUTH</p>
                    <p className="text-[10px] text-gray-500">Dashboard</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { l: 'Total Apps', v: '3', c: 'text-accent' },
                    { l: 'Active Users', v: '1,247', c: 'text-green-400' },
                    { l: 'Licenses', v: '892', c: 'text-amber-400' },
                    { l: 'Sessions', v: '156', c: 'text-fuchsia-400' },
                  ].map((s) => (
                    <div key={s.l} className="bg-bg/60 rounded-xl p-3 border border-edge/30">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">{s.l}</p>
                      <p className={`text-lg font-bold font-display ${s.c} mt-0.5`}>{s.v}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-bg/60 rounded-xl p-4 border border-edge/30">
                  <p className="text-xs font-semibold text-white mb-2">Application Details</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-gray-400">MyApp</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-green-500/15 text-green-400">ACTIVE</span>
                  </div>
                  <div className="h-px bg-edge/30 my-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-gray-500">Secret Key</p>
                      <p className="text-[11px] text-gray-300 font-mono">••••••••••••</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Version</p>
                      <p className="text-[11px] text-gray-300">1.0.0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -end-4 w-32 h-32 bg-accent/20 rounded-full blur-[60px]" />
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-gray-600" />
        </motion.div>
      </section>

      {/* Language bar */}
      <section className="py-20 border-t border-edge/30">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <FadeInSection>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 font-semibold mb-8">
              Drop-in SDKs for every stack
            </p>
          </FadeInSection>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            {languages.map((lang, i) => (
              <FadeInSection key={lang} delay={i * 0.08}>
                <motion.span
                  whileHover={{ scale: 1.15, color: '#8b5cf6' }}
                  className="text-xl sm:text-2xl font-bold text-gray-500 italic cursor-default transition-colors"
                >
                  {lang}
                </motion.span>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <GlowCard key={s.label} delay={i * 0.1} className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <s.icon className="w-4 h-4 text-accent" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{s.label}</span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-white text-embossed font-display">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInSection className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold tracking-wider uppercase mb-4">
              Core Toolkit
            </span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-3d">
              SHIP SECURE,{' '}
              <span className="text-metallic">SHIP FAST</span>
            </h2>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <GlowCard key={f.title} delay={i * 0.15} className="p-7 h-full group">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-edge/50 flex items-center justify-center mb-5 group-hover:bg-accent/10 group-hover:border-accent/20 transition-all">
                  <f.icon className="w-5 h-5 text-gray-400 group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-3 text-3d">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* About / Important */}
      <section id="about" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInSection>
            <div className="glass rounded-2xl border border-accent/20 p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 start-0 w-full h-1 bar-gradient" />

              <div className="flex items-start gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2.5 py-0.5 bg-accent/15 text-accent text-[10px] font-bold rounded uppercase tracking-wider">Heads Up</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    HOW THE SPLIT WORKS
                  </h3>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-4">We Handle</h4>
                  <ul className="space-y-3">
                    {provides.map((p) => (
                      <li key={p} className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-4">You Handle</h4>
                  <ul className="space-y-3">
                    {responsibilities.map((r) => (
                      <li key={r} className="flex items-center gap-3 text-sm text-gray-300">
                        <Eye className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[150px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeInSection>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 text-3d">
              STOP REINVENTING
              <br />
              <span className="text-metallic">
                THE WHEEL.
              </span>
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
              Your next app deserves real auth — not a weekend hack.
              Set up once, protect forever.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <MagneticButton
              href="/login"
              className="group inline-flex items-center gap-3 px-10 py-4 btn-gradient text-white rounded-2xl font-bold text-sm tracking-wider uppercase transition-all hover:shadow-2xl hover:shadow-accent/30"
            >
              CREATE FREE ACCOUNT
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-edge/30 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/10 text-accent flex items-center justify-center border border-accent/20">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="font-bold text-[15px]">
                  FZ <span className="text-accent">AUTH</span>
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                The no-BS licensing and auth backend your projects actually need.
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4">Navigation</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="text-sm text-gray-500 hover:text-white transition-colors">Features</a></li>
                <li><a href="#stats" className="text-sm text-gray-500 hover:text-white transition-colors">Stats</a></li>
                <li><Link href="/login" className="text-sm text-gray-500 hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/login" className="text-sm text-gray-500 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><Link href="/about" className="text-sm text-gray-500 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-500 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-edge/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} FZ Auth. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">Developed by FZ</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
