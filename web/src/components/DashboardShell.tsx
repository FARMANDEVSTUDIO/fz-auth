'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { useEffect } from 'react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: 'ri-dashboard-3-line' },
  { href: '/dashboard/users', label: 'Users', icon: 'ri-group-line' },
  { href: '/dashboard/keys', label: 'License Keys', icon: 'ri-key-2-line' },
  { href: '/dashboard/blacklist', label: 'Blacklist', icon: 'ri-spam-2-line' },
  { href: '/dashboard/logs', label: 'Logs', icon: 'ri-file-list-3-line' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { auth, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!auth) router.push('/');
  }, [auth, router]);

  if (!auth) return null;

  return (
    <ToastProvider>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[260px] bg-[var(--color-sidebar)] border-r border-[var(--color-border)] flex flex-col flex-shrink-0">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-[var(--color-border)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-purple)] flex items-center justify-center text-white text-sm flex-shrink-0">
              <i className="ri-shield-keyhole-fill" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">FZ Auth</h2>
              <p className="text-[10px] text-[var(--color-muted)] font-mono">{auth.appId.slice(0, 12)}...</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {nav.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[var(--color-primary-glow)] text-[var(--color-primary)]'
                      : 'text-[var(--color-muted-fg)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-card)]'
                  }`}
                >
                  <i className={`${item.icon} text-lg ${active ? 'text-[var(--color-primary)]' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-[var(--color-border)]">
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
            >
              <i className="ri-logout-box-r-line text-lg" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-[var(--color-background)]">
          <div className="animate-page-in">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
