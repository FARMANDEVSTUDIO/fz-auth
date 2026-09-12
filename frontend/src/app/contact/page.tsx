'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Send, Mail, MessageSquare, User, Loader2, CheckCircle2 } from 'lucide-react';
import MagneticButton from '@/components/MagneticButton';
import { toast } from 'sonner';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSent(true);
      toast.success('Message sent successfully!');
    }, 1500);
  };

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

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/15 text-accent mb-4">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2 text-3d">Contact Us</h1>
            <p className="text-gray-400 text-sm">Have a question or feedback? We&apos;d love to hear from you.</p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-10 text-center border border-edge/50"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/15 text-green-400 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">Message Sent!</h2>
              <p className="text-sm text-gray-400 mb-6">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
              <button
                onClick={() => setSent(false)}
                className="px-6 py-2 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-105"
              >
                Send Another
              </button>
            </motion.div>
          ) : (
            <div className="glass gradient-border rounded-2xl p-8 border border-edge/50">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Your Name</label>
                  <div className="relative">
                    <User className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      className="w-full bg-bg border border-edge rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="w-full bg-bg border border-edge rounded-xl ps-10 pe-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Subject</label>
                  <select className="w-full bg-bg border border-edge rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent transition-colors appearance-none">
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-medium mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="w-full bg-bg border border-edge rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 py-3 btn-gradient text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-accent/20 hover:scale-[1.02] disabled:opacity-50"
                >
                  {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            <div className="glass rounded-xl p-5 border border-edge/50 text-center">
              <Mail className="w-5 h-5 text-accent mx-auto mb-2" />
              <p className="text-sm font-semibold mb-1">Email</p>
              <p className="text-xs text-gray-400">support@fzauth.dev</p>
            </div>
            <div className="glass rounded-xl p-5 border border-edge/50 text-center">
              <MessageSquare className="w-5 h-5 text-accent mx-auto mb-2" />
              <p className="text-sm font-semibold mb-1">Discord</p>
              <p className="text-xs text-gray-400">Join our community server</p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-edge/30 py-8">
        <p className="text-center text-xs text-gray-600">Developed by FZ</p>
      </footer>
    </div>
  );
}
