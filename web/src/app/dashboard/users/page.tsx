'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { callAdmin } from '@/lib/api';
import { useToast } from '@/lib/toast';
import Modal from '@/components/Modal';

interface User {
  username: string;
  hwid: string | null;
  expiry: string | null;
  banned: boolean;
  ban_reason: string | null;
  last_login: string | null;
  last_ip?: string | null;
  created_at: string;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function relativeTime(d: string | null) {
  if (!d) return 'Never';
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function UsersPage() {
  const { auth } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [infoModal, setInfoModal] = useState<User | null>(null);
  const [banModal, setBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [timeModal, setTimeModal] = useState<string | null>(null);
  const [timeDuration, setTimeDuration] = useState('30d');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'users');
    if (res.success) setUsers(res.users);
    setLoading(false);
  }, [auth]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.hwid && u.hwid.toLowerCase().includes(search.toLowerCase()))
  );

  async function doAction(action: string, body: Record<string, unknown>, successMsg: string) {
    if (!auth) return;
    setActionLoading(true);
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, action, body);
    setActionLoading(false);
    if (res.success) {
      toast(successMsg, 'success');
      loadUsers();
    } else {
      toast(res.message || 'Action failed', 'error');
    }
  }

  async function showInfo(username: string) {
    if (!auth) return;
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'userinfo', { username });
    if (res.success) setInfoModal(res.user);
    else toast(res.message, 'error');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <i className="ri-group-line text-[var(--color-primary)]" />
          Users
          <span className="text-base font-normal text-[var(--color-muted)]">({users.length})</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)] w-60 transition-all"
            />
          </div>
          <button onClick={loadUsers} className="p-2 text-[var(--color-muted-fg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors">
            <i className="ri-refresh-line" />
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Username', 'Status', 'Expiry', 'HWID', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide bg-[var(--color-input)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted)] italic">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted)] italic">No users found</td></tr>
              ) : filtered.map(user => {
                const isExpired = user.expiry && new Date(user.expiry) < new Date();
                return (
                  <tr key={user.username} className="border-b border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors">
                    <td className="px-4 py-3 font-medium">{user.username}</td>
                    <td className="px-4 py-3">
                      {user.banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger)]">
                          <i className="ri-close-circle-fill text-[10px]" /> Banned
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning)]">
                          <i className="ri-time-fill text-[10px]" /> Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-success-bg)] text-[var(--color-success)]">
                          <i className="ri-checkbox-circle-fill text-[10px]" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{user.expiry ? fmtDate(user.expiry) : '—'}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)] font-mono text-xs max-w-[120px] truncate" title={user.hwid || ''}>
                      {user.hwid || '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-fg)]">{relativeTime(user.last_login)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => showInfo(user.username)} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-info-bg)] hover:text-[var(--color-info)] hover:border-[var(--color-info)] transition-all" title="Info">
                          <i className="ri-information-line text-sm" />
                        </button>
                        {user.banned ? (
                          <button onClick={() => doAction('unban', { username: user.username }, `${user.username} unbanned`)} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-success-bg)] hover:text-[var(--color-success)] hover:border-[var(--color-success)] transition-all" title="Unban">
                            <i className="ri-lock-unlock-line text-sm" />
                          </button>
                        ) : (
                          <button onClick={() => { setBanModal(user.username); setBanReason(''); }} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-warning-bg)] hover:text-[var(--color-warning)] hover:border-[var(--color-warning)] transition-all" title="Ban">
                            <i className="ri-forbid-line text-sm" />
                          </button>
                        )}
                        <button onClick={() => doAction('resethwid', { username: user.username }, `HWID reset for ${user.username}`)} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-foreground)] transition-all" title="Reset HWID">
                          <i className="ri-device-line text-sm" />
                        </button>
                        <button onClick={() => { setTimeModal(user.username); setTimeDuration('30d'); }} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-foreground)] transition-all" title="Add Time">
                          <i className="ri-time-line text-sm" />
                        </button>
                        <button onClick={() => setDeleteModal(user.username)} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] transition-all" title="Delete">
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Info Modal */}
      <Modal open={!!infoModal} onClose={() => setInfoModal(null)} title={`User: ${infoModal?.username || ''}`}>
        {infoModal && (
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Username', infoModal.username],
              ['Status', infoModal.banned ? 'Banned' : (infoModal.expiry && new Date(infoModal.expiry) < new Date() ? 'Expired' : 'Active')],
              ['HWID', infoModal.hwid || 'Not set'],
              ['Expiry', fmtDate(infoModal.expiry)],
              ['Last Login', fmtDate(infoModal.last_login)],
              ['Last IP', infoModal.last_ip || 'Unknown'],
              ['Ban Reason', infoModal.ban_reason || '—'],
              ['Created', fmtDate(infoModal.created_at)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-1">{label}</p>
                <p className={`text-sm ${label === 'HWID' || label === 'Last IP' ? 'font-mono text-xs' : ''}`}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Ban Modal */}
      <Modal
        open={!!banModal}
        onClose={() => setBanModal(null)}
        title={`Ban ${banModal}`}
        footer={
          <>
            <button onClick={() => setBanModal(null)} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)] transition-colors">Cancel</button>
            <button
              disabled={actionLoading}
              onClick={async () => {
                await doAction('ban', { username: banModal, reason: banReason || 'Banned from panel' }, `${banModal} banned`);
                setBanModal(null);
              }}
              className="px-4 py-2 text-sm bg-[var(--color-danger)] text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <i className="ri-forbid-line" /> Ban User
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-2">Reason</label>
          <input
            type="text"
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            placeholder="Enter ban reason..."
            className="w-full px-4 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
            autoFocus
          />
        </div>
      </Modal>

      {/* Add Time Modal */}
      <Modal
        open={!!timeModal}
        onClose={() => setTimeModal(null)}
        title={`Add Time — ${timeModal}`}
        footer={
          <>
            <button onClick={() => setTimeModal(null)} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)] transition-colors">Cancel</button>
            <button
              disabled={actionLoading}
              onClick={async () => {
                await doAction('addtime', { username: timeModal, duration: timeDuration }, `Added ${timeDuration} to ${timeModal}`);
                setTimeModal(null);
              }}
              className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <i className="ri-time-line" /> Add Time
            </button>
          </>
        }
      >
        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-2">Duration</label>
          <input
            type="text"
            value={timeDuration}
            onChange={e => setTimeDuration(e.target.value)}
            placeholder="e.g. 30d, 12h, 1y, lifetime"
            className="w-full px-4 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all"
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title={`Delete ${deleteModal}`}
        footer={
          <>
            <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)] transition-colors">Cancel</button>
            <button
              disabled={actionLoading}
              onClick={async () => {
                await doAction('deluser', { username: deleteModal }, `${deleteModal} deleted`);
                setDeleteModal(null);
              }}
              className="px-4 py-2 text-sm bg-[var(--color-danger)] text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <i className="ri-delete-bin-line" /> Delete User
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted-fg)]">
          Are you sure you want to delete <strong className="text-[var(--color-foreground)]">{deleteModal}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
