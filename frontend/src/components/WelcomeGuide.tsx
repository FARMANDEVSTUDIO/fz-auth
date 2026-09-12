'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, LayoutDashboard, Key, Users, Code2, Settings,
  ChevronRight, ChevronDown, Sparkles, CheckCircle2, X,
} from 'lucide-react';

const steps = [
  {
    icon: LayoutDashboard,
    title: 'Create Your First Application',
    desc: 'Go to "Manage Apps" and type a name to create your first app. This is your project — all users, licenses, and settings live under it.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Key,
    title: 'Generate License Keys',
    desc: 'Go to "Licenses" and generate keys with a duration (e.g. 30d, 1y, lifetime). Give these keys to your users so they can register.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: Users,
    title: 'Manage Users',
    desc: 'When users register with a license key, they appear in "Users". You can ban, unban, reset HWID, add time, or delete users from there.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Code2,
    title: 'Integrate Into Your App',
    desc: 'Use the code snippet on the dashboard to copy initialization code for your language (C#, Python, C++, etc.). Replace credentials with your app\'s real values.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Settings,
    title: 'Configure Settings',
    desc: 'Go to "Settings" to enable HWID lock, VPN blocking, session limits, and more. Use "Functions" tab to enable/disable API features. Use "Messages" to customize error messages.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
];

export default function WelcomeGuide() {
  const [open, setOpen] = useState(true);
  const [expandedStep, setExpandedStep] = useState(0);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass rounded-xl overflow-hidden border border-accent/20"
    >
      <div className="px-5 py-4 border-b border-edge/50 flex items-center justify-between bg-accent/[0.03]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Getting Started with FZ AUTH
              <Sparkles className="w-3.5 h-3.5 text-accent" />
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Follow these steps to set up your authentication system</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isExpanded = expandedStep === i;

          return (
            <motion.div key={i} className="rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedStep(isExpanded ? -1 : i)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors rounded-xl text-start"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.bg}`}>
                  <Icon className={`w-4 h-4 ${step.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-600 bg-gray-500/10 px-1.5 py-0.5 rounded">
                      STEP {i + 1}
                    </span>
                    {step.title}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-3 ps-[60px] text-xs text-gray-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-edge/50 bg-white/[0.01]">
        <p className="text-[11px] text-gray-600 text-center">
          Need help? Check the code snippet on the dashboard for integration examples.
        </p>
      </div>
    </motion.div>
  );
}
