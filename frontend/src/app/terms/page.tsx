'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen text-white relative z-10">
      {/* Navbar */}
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

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-accent" />
            <h1 className="text-3xl font-black tracking-tight text-3d">Terms of Service</h1>
          </div>
          <p className="text-sm text-gray-500 mb-10">Last updated: June 12, 2026</p>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm">By accessing or using FZ Auth (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. FZ Auth provides authentication and licensing management tools for software developers.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
              <p className="text-sm">FZ Auth is a cloud-based authentication and software licensing platform. We provide APIs, SDKs, and a web dashboard for managing user authentication, license keys, HWID binding, and session management for your applications.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">3. Account Registration</h2>
              <p className="text-sm">You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials, API keys, and admin keys. You must not share your master key or admin credentials with unauthorized parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">4. Acceptable Use</h2>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li>You may not use FZ Auth for any illegal or unauthorized purpose.</li>
                <li>You may not distribute malware or malicious software through the platform.</li>
                <li>You may not attempt to reverse-engineer, exploit, or compromise the Service.</li>
                <li>You may not resell or redistribute FZ Auth services without written permission.</li>
                <li>You are responsible for all activity under your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">5. API Usage & Rate Limits</h2>
              <p className="text-sm">API usage is subject to rate limits based on your plan. Excessive or abusive API usage may result in temporary or permanent suspension. We reserve the right to modify rate limits at any time.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">6. Data & Privacy</h2>
              <p className="text-sm">We collect and process data as described in our Privacy Policy. You are responsible for ensuring your use of FZ Auth complies with applicable data protection laws (GDPR, CCPA, etc.) in your jurisdiction.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">7. Service Availability</h2>
              <p className="text-sm">We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance windows will be communicated in advance. We are not liable for losses caused by service downtime.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">8. Termination</h2>
              <p className="text-sm">We may suspend or terminate your account at any time for violation of these terms. Upon termination, your data will be deleted within 30 days. You may delete your account at any time through the Account settings page.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">9. Limitation of Liability</h2>
              <p className="text-sm">FZ Auth is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">10. Changes to Terms</h2>
              <p className="text-sm">We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms. Material changes will be communicated via email or dashboard notification.</p>
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-edge/30 py-8">
        <p className="text-center text-xs text-gray-600">Developed by FZ</p>
      </footer>
    </div>
  );
}
