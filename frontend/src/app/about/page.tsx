'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield, ArrowLeft, ArrowRight, Server, Terminal, Code2, Lock,
  Zap, Users, Globe, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import MagneticButton from '@/components/MagneticButton';

const timeline = [
  { year: '2025', title: 'Founded', desc: 'FZ Auth was created to provide developers with a modern, secure authentication platform.' },
  { year: '2025', title: 'V1.0 Launch', desc: 'Initial release with license management, user auth, HWID binding, and session control.' },
  { year: '2026', title: 'V2.0 Release', desc: 'Complete redesign with new dashboard, team management, webhooks, subscriptions, and more.' },
];

const values = [
  { icon: Lock, title: 'Security First', desc: 'Every feature is designed with security as the top priority. Server-side validation, AES-256 encryption, bcrypt hashing.' },
  { icon: Zap, title: 'Developer Experience', desc: 'Clean APIs, native SDKs, comprehensive docs. Get integrated in minutes, not days.' },
  { icon: Globe, title: 'Reliability', desc: '99.9% uptime with globally distributed infrastructure. Your auth never goes down.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen text-white relative z-10">
      <nav className="fixed top-0 start-0 end-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-edge/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-[15px]">FZ <span className="text-accent">AUTH</span></span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-28 pb-20">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/15 text-accent mb-5">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 text-3d">
              About <span className="text-metallic">FZ Auth</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              We build authentication and licensing infrastructure so developers can focus on what matters — building great software.
            </p>
          </motion.div>
        </div>

        {/* Values */}
        <div className="max-w-5xl mx-auto px-6 mb-24">
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <GlowCard key={v.title} delay={0.2 + i * 0.1} className="p-7">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-embossed">{v.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
              </GlowCard>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto px-6 mb-24">
          <h2 className="text-2xl font-black text-center mb-12 text-3d">Our Journey</h2>
          <div className="space-y-8">
            {timeline.map((t, i) => (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="flex gap-5"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                    {t.year.slice(2)}
                  </div>
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-edge/50 mt-2" />}
                </div>
                <div className="pb-6">
                  <p className="text-xs text-accent font-semibold mb-1">{t.year}</p>
                  <h3 className="text-lg font-bold mb-1">{t.title}</h3>
                  <p className="text-sm text-gray-400">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass gradient-border rounded-2xl p-10 border border-accent/20"
          >
            <h2 className="text-2xl font-black mb-3 text-3d">Ready to Get Started?</h2>
            <p className="text-gray-400 text-sm mb-6">Join thousands of developers who trust FZ Auth for their authentication needs.</p>
            <MagneticButton
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3 btn-gradient text-white rounded-xl font-bold text-sm transition-all"
            >
              Start Building <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-edge/30 py-8">
        <p className="text-center text-xs text-gray-600">Developed by FZ</p>
      </footer>
    </div>
  );
}
