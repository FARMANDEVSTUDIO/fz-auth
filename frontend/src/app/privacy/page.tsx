'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Eye } from 'lucide-react';

export default function PrivacyPage() {
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

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-6 h-6 text-accent" />
            <h1 className="text-3xl font-black tracking-tight text-3d">Privacy Policy</h1>
          </div>
          <p className="text-sm text-gray-500 mb-10">Last updated: June 12, 2026</p>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>
              <p className="text-sm mb-3">When you use FZ Auth, we collect the following information:</p>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li><strong>Account Data:</strong> Email address, name, profile picture (from OAuth providers).</li>
                <li><strong>Application Data:</strong> Application names, settings, license keys, and user records you create.</li>
                <li><strong>Usage Data:</strong> API calls, login events, session data, and platform usage analytics.</li>
                <li><strong>Device Data:</strong> HWID information submitted by your application&apos;s end users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Information</h2>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li>To provide and maintain the FZ Auth platform and services.</li>
                <li>To authenticate you and manage your account.</li>
                <li>To process license validations and session management for your apps.</li>
                <li>To send important service notifications and updates.</li>
                <li>To detect and prevent fraud, abuse, and security threats.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">3. Data Storage & Security</h2>
              <p className="text-sm">Your data is stored on encrypted PostgreSQL databases hosted on secure cloud infrastructure. All API communications are encrypted with TLS/SSL. Passwords are hashed with bcrypt (12 rounds). We implement industry-standard security measures to protect your data.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">4. Third-Party Services</h2>
              <p className="text-sm">We use the following third-party services:</p>
              <ul className="text-sm space-y-2 list-disc list-inside mt-2">
                <li><strong>Google OAuth:</strong> For account authentication (Google Privacy Policy applies).</li>
                <li><strong>GitHub OAuth:</strong> For account authentication (GitHub Privacy Policy applies).</li>
                <li><strong>Neon:</strong> For database hosting and management.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">5. Data Retention</h2>
              <p className="text-sm">We retain your data for as long as your account is active. When you delete your account, all associated data (applications, users, licenses, sessions, logs) is permanently deleted within 30 days. Expired sessions and licenses can be auto-cleared through the dashboard.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">6. Your Rights</h2>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li><strong>Access:</strong> You can view all your data through the dashboard.</li>
                <li><strong>Deletion:</strong> You can delete your account and all data at any time.</li>
                <li><strong>Export:</strong> Contact us to request a data export.</li>
                <li><strong>Correction:</strong> Update your profile information through Account settings.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">7. Cookies</h2>
              <p className="text-sm">We use essential cookies for authentication session management (NextAuth session cookies) and application selection preferences. We do not use tracking or advertising cookies.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white mb-3">8. Contact</h2>
              <p className="text-sm">For privacy-related questions or concerns, contact us through the Contact page or email us directly. We will respond to all privacy inquiries within 30 days.</p>
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
