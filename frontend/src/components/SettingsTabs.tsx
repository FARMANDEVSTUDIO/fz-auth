'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, MessageSquare, ToggleLeft, Paintbrush } from 'lucide-react';

const tabs = [
  { href: '/settings', label: 'App Config', icon: Settings },
  { href: '/settings/messages', label: 'Messages', icon: MessageSquare },
  { href: '/settings/functions', label: 'Functions', icon: ToggleLeft },
  { href: '/settings/branding', label: 'Branding', icon: Paintbrush },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 p-1 glass rounded-xl w-fit">
      {tabs.map(tab => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link key={tab.href} href={tab.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors relative ${
                active ? 'bg-accent/15 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="settingsTab"
                  className="absolute inset-0 bg-accent/10 rounded-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
