'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const mainNav = [
  { href: '/dashboard', label: 'Manage Apps', icon: 'ri-apps-2-line' },
  { href: '/licenses', label: 'Licenses', icon: 'ri-key-2-line' },
  { href: '/users', label: 'Users', icon: 'ri-group-line' },
  { href: '/team', label: 'Team', icon: 'ri-team-line' },
  { href: '/settings', label: 'Settings', icon: 'ri-settings-3-line' },
];

const soonNav = [
  { label: 'Tokens', icon: 'ri-token-swap-line' },
  { label: 'Subscriptions', icon: 'ri-vip-crown-line' },
  { label: 'Sessions', icon: 'ri-flashlight-line' },
  { label: 'Webhooks', icon: 'ri-webhook-line' },
  { label: 'Files', icon: 'ri-folder-line' },
  { label: 'Variables', icon: 'ri-braces-line' },
  { label: 'Rules', icon: 'ri-shield-check-line' },
  { label: 'Event Logs', icon: 'ri-file-list-3-line' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] bg-[#0e0e11] border-r border-edge flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-edge flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-base flex-shrink-0">
          <i className="ri-shield-keyhole-fill" />
        </div>
        <span className="font-bold text-white text-[15px] tracking-tight">
          FZ <span className="text-accent">KeyAuth</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          General
        </p>
        <div className="space-y-0.5">
          {mainNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-accent/15 text-accent'
                    : 'text-gray-400 hover:text-white hover:bg-card'
                }`}
              >
                <i className={`${item.icon} text-base`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <p className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Coming Soon
        </p>
        <div className="space-y-0.5">
          {soonNav.map(item => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 cursor-not-allowed select-none"
              title="Coming in a later phase"
            >
              <i className={`${item.icon} text-base`} />
              {item.label}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
