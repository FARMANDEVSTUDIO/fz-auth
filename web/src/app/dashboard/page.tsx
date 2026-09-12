'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { callAdmin } from '@/lib/api';
import { useToast } from '@/lib/toast';
import Link from 'next/link';

interface Stats {
  total_users: number;
  active_users: number;
  total_keys: number;
  unused_keys: number;
  active_sessions: number;
}

interface LogEntry {
  action: string;
  username: string | null;
  ip: string | null;
  detail: string | null;
  created_at: string;
}

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const statConfig = [
  { key: 'total_users', label: 'Total Users', icon: 'ri-group-fill', bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
  { key: 'active_users', label: 'Active Users', icon: 'ri-user-follow-fill', bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  { key: 'total_keys', label: 'Total Keys', icon: 'ri-key-2-fill', bg: 'var(--color-purple-bg)', color: 'var(--color-purple)' },
  { key: 'unused_keys', label: 'Unused Keys', icon: 'ri-coupon-fill', bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  { key: 'active_sessions', label: 'Active Sessions', icon: 'ri-flashlight-fill', bg: 'var(--color-cyan-bg)', color: 'var(--color-cyan)' },
] as const;

export default function DashboardPage() {
  const { auth } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!auth) return;
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'stats'),
        callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'logs'),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (logsRes.success) setLogs(logsRes.logs?.slice(0, 8) || []);
    } catch {
      toast('Failed to load dashboard', 'error');
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [auth]);

  function actionBadge(action: string) {
    if (action === 'login') return 'bg-[var(--color-info-bg)] text-[var(--color-info)]';
    if (action === 'register') return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
    if (action === 'license') return 'bg-[var(--color-purple-bg)] text-[var(--color-purple)]';
    if (action?.includes('fail') || action?.includes('block') || action?.includes('ban'))
      return 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]';
    return 'bg-[var(--color-border)]/50 text-[var(--color-muted-fg)]';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <i className="ri-dashboard-3-line text-[var(--color-primary)]" />
          Dashboard
        </h1>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-muted-fg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] hover:text-[var(--color-foreground)] transition-all"
        >
          <i className="ri-refresh-line" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statConfig.map(c => (
          <div key={c.key} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-4 hover:border-[var(--color-border-light)] hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: c.bg, color: c.color }}>
              <i className={c.icon} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-tight" style={{ color: c.color }}>
                {loading ? '—' : (stats?.[c.key] ?? '—')}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <i className="ri-time-line text-[var(--color-primary)]" /> Recent Activity
            </h3>
            <Link href="/dashboard/logs" className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
              View All →
            </Link>
          </div>
          <div className="p-4">
            {logs.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)] text-center py-6 italic">No recent activity</p>
            ) : (
              <div className="space-y-0">
                {logs.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0 text-sm">
                    <span className={`${actionBadge(l.action)} px-2 py-0.5 rounded text-xs font-semibold min-w-[70px] text-center`}>
                      {l.action}
                    </span>
                    <span className="text-[var(--color-foreground)]">{l.username || '—'}</span>
                    <span className="text-[var(--color-muted)] text-xs flex-1 truncate">{l.detail || ''}</span>
                    <span className="text-[var(--color-muted)] text-xs whitespace-nowrap">{relativeTime(l.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <i className="ri-speed-up-line text-[var(--color-primary)]" /> Quick Actions
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard/keys', icon: 'ri-add-line', label: 'Generate Keys', color: 'var(--color-primary)' },
              { href: '/dashboard/users', icon: 'ri-group-line', label: 'View Users', color: 'var(--color-info)' },
              { href: '/dashboard/blacklist', icon: 'ri-spam-2-line', label: 'Blacklist', color: 'var(--color-danger)' },
              { href: '/dashboard/logs', icon: 'ri-file-list-3-line', label: 'View Logs', color: 'var(--color-warning)' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-muted-fg)] font-medium hover:text-[var(--color-foreground)] hover:border-[var(--color-border-light)] hover:-translate-y-0.5 transition-all"
              >
                <i className={`${item.icon} text-lg`} style={{ color: item.color }} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
