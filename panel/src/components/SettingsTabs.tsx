'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/settings', label: 'App Config', icon: 'ri-settings-3-line' },
  { href: '/settings/messages', label: 'Messages', icon: 'ri-chat-settings-line' },
  { href: '/settings/functions', label: 'Functions', icon: 'ri-toggle-line' },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 bg-card border border-edge rounded-xl p-1.5">
      {tabs.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-accent/15 text-accent'
                : 'text-gray-400 hover:text-white hover:bg-card2'
            }`}
          >
            <i className={tab.icon} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
