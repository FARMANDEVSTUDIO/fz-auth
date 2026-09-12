'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { callAdmin } from '@/lib/api';
import { useToast } from '@/lib/toast';

interface LogEntry {
  action: string;
  username: string | null;
  ip: string | null;
  detail: string | null;
  created_at: string;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function actionBadge(action: string) {
  if (action === 'login') return 'bg-[var(--color-info-bg)] text-[var(--color-info)]';
  if (action === 'register') return 'bg-[var(--color-success-bg)] text-[var(--color-success)]';
  if (action === 'license') return 'bg-[var(--color-purple-bg)] text-[var(--color-purple)]';
  if (action?.includes('fail') || action?.includes('block') || action?.includes('ban'))
    return 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]';
  return 'bg-[var(--color-border)]/50 text-[var(--color-muted-fg)]';
}

export default function LogsPage() {
  const { auth } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'logs');
    if (res.success) setLogs(res.logs);
    else toast('Failed to load logs', 'error');
    setLoading(false);
  }, [auth, toast]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.username && l.username.toLowerCase().includes(q)) ||
      (l.ip && l.ip.toLowerCase().includes(q)) ||
      (l.detail && l.detail.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <i className="ri-file-list-3-line text-[var(--color-primary)]" />
          Logs
          <span className="text-base font-normal text-[var(--color-muted)]">({logs.length})</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter logs..."
              className="pl-9 pr-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)] w-60 transition-all"
            />
          </div>
          <button onClick={loadLogs} className="p-2 text-[var(--color-muted-fg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors">
            <i className="ri-refresh-line" />
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Action', 'Username', 'IP', 'Detail', 'Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide bg-[var(--color-input)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted)] italic">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted)] italic">No logs found</td></tr>
              ) : filtered.map((l, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <span className={`${actionBadge(l.action)} inline-flex px-2.5 py-0.5 rounded text-xs font-semibold min-w-[70px] justify-center`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">{l.username || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-fg)]">{l.ip || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-fg)] max-w-[250px] truncate">{l.detail || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-fg)] whitespace-nowrap" title={fmtDate(l.created_at)}>
                    {relativeTime(l.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
