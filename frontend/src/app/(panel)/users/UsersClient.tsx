'use client';

import { useState, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import SearchFilter from '@/components/SearchFilter';
import Modal from '@/components/Modal';
import {
  Users, ShieldOff, ShieldCheck, RotateCcw, Clock, Trash2, UserPlus,
  LayoutGrid, List, MoreVertical, ChevronLeft, ChevronRight, Wifi, Fingerprint,
  Calendar, Activity, AlertTriangle, Lock, Loader2,
} from 'lucide-react';
import { banUser, unbanUser, resetHwid, addTime, deleteUser, createUser, toggleHwidLock, toggleSuspend } from './actions';
import { fireConfetti } from '@/lib/confetti';

const DURATIONS = [
  { value: '1d', label: '1 Day' },
  { value: '3d', label: '3 Days' },
  { value: '1w', label: '1 Week' },
  { value: '30d', label: '1 Month' },
  { value: '90d', label: '3 Months' },
  { value: '180d', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: 'lifetime', label: 'Lifetime' },
];

interface UserRow {
  username: string;
  hwid: string | null;
  hwid_locked?: boolean | null;
  expiry: string | null;
  banned: boolean;
  suspended?: boolean;
  ban_reason: string | null;
  last_login: string | null;
  created_at: string;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtShort(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatus(u: UserRow): { label: string; color: string; bg: string } {
  if (u.banned) return { label: 'Banned', color: 'text-red-400', bg: 'bg-red-500/15 text-red-400 border-red-500/30' };
  if (u.suspended) return { label: 'Suspended', color: 'text-orange-400', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
  if (u.expiry && new Date(u.expiry) < new Date()) return { label: 'Expired', color: 'text-yellow-400', bg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' };
  return { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/15 text-green-400 border-green-500/30' };
}

const PER_PAGE = 12;

export default function UsersClient({ users, appId }: { users: UserRow[]; appId: string }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const [modalUser, setModalUser] = useState<UserRow | null>(null);
  const [modalType, setModalType] = useState<'ban' | 'addtime' | 'delete' | null>(null);
  const [banReason, setBanReason] = useState('');
  const [addDuration, setAddDuration] = useState('30d');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const createFormRef = useRef<HTMLFormElement>(null);
  const [creating, startCreate] = useTransition();

  const filtered = users.filter(u => {
    if (search && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active' && (u.banned || (u.expiry && new Date(u.expiry) < new Date()))) return false;
    if (filter === 'banned' && !u.banned) return false;
    if (filter === 'expired' && !(u.expiry && new Date(u.expiry) < new Date() && !u.banned)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const openModal = (u: UserRow, type: 'ban' | 'addtime' | 'delete') => {
    setModalUser(u);
    setModalType(type);
    setBanReason('');
    setAddDuration('30d');
    setDeleteConfirm('');
  };

  const closeModal = () => { setModalUser(null); setModalType(null); };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchFilter
            placeholder="Search users..."
            filters={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'banned', label: 'Banned' },
              { value: 'expired', label: 'Expired' },
            ]}
            onSearch={(v) => { setSearch(v); setPage(0); }}
            onFilter={(v) => { setFilter(v); setPage(0); }}
          />
        </div>
        <div className="flex items-center gap-1 bg-bg border border-edge rounded-xl p-0.5">
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-accent/15 text-accent' : 'text-gray-500 hover:text-white'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-accent/15 text-accent' : 'text-gray-500 hover:text-white'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" /> Create User
        </button>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <div className="glass rounded-xl p-5 gradient-border">
          <form
            ref={createFormRef}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startCreate(async () => {
                const res = await createUser(fd);
                if (res.ok) {
                  toast.success(res.message);
                  fireConfetti();
                  createFormRef.current?.reset();
                  setShowCreate(false);
                } else {
                  toast.error(res.message);
                }
              });
            }}
            className={`flex flex-wrap gap-3 items-end ${creating ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input type="hidden" name="app_id" value={appId} />
            <div className="flex-1 min-w-[150px]">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Username</label>
              <input type="text" name="username" required placeholder="username" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Password</label>
              <input type="text" name="password" required placeholder="password" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
            </div>
            <div className="w-[140px]">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Duration</label>
              <select name="expiry" defaultValue="30d" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent cursor-pointer input-enhanced">
                {DURATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none pb-2.5">
              <input type="checkbox" name="hwid_lock" defaultChecked className="w-4 h-4 rounded accent-accent cursor-pointer" />
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-accent" /> HWID Lock
              </span>
            </label>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Create User
            </button>
          </form>
        </div>
      )}

      {/* Users display */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-edge/50 section-header flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" /> Users
            <span className="text-gray-500 font-normal">({filtered.length})</span>
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-accent/50" />
            </div>
            <p className="text-sm text-gray-500">No users found.</p>
          </div>
        ) : view === 'grid' ? (
          /* ---- GRID VIEW (Cards) ---- */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {paged.map(u => {
              const status = getStatus(u);
              return (
                <div key={u.username} className="bg-bg/50 border border-edge/50 rounded-xl p-4 hover:border-accent/20 transition-all card-hover-glow group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-bold text-sm">{u.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${status.bg}`}>
                        {status.label}
                      </span>
                      <UserMenu user={u} appId={appId} onAction={openModal} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-300">{fmtShort(u.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-500">Last Login:</span>
                      <span className="text-gray-300">{fmtShort(u.last_login)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-500">Expiry:</span>
                      <span className="text-gray-300">{fmtShort(u.expiry)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="w-3 h-3 text-gray-600" />
                      <span className="text-gray-500">HWID:</span>
                      <span className="text-gray-300">{u.hwid ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ---- LIST VIEW (Table) ---- */
          <div className="overflow-x-auto">
            <table className="table-enhanced">
              <thead>
                <tr className="border-b border-edge/50 bg-white/[0.02]">
                  {['Username', 'Status', 'Created', 'Last Login', 'Expiry', 'HWID', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(u => {
                  const status = getStatus(u);
                  return (
                    <tr key={u.username} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${status.bg}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtShort(u.created_at)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtShort(u.last_login)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtShort(u.expiry)}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.hwid ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3">
                        <UserMenu user={u} appId={appId} onAction={openModal} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-edge/50 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 border border-edge rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 border border-edge rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}

      {/* Ban Modal */}
      <Modal open={modalType === 'ban' && !!modalUser} onClose={closeModal} title="Ban User">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <ShieldOff className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm text-gray-300 pt-2">
            You&apos;re about to ban user: <span className="text-white font-semibold">{modalUser?.username}</span>
          </p>
        </div>
        <div className="mb-5">
          <label className="flex items-center gap-1.5 text-xs text-accent/60 mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Ban Reason</label>
          <input
            type="text"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Reason for ban..."
            className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 border border-edge rounded-xl hover:bg-white/5 transition-colors">Cancel</button>
          <form action={banUser} onSubmit={() => closeModal()}>
            <input type="hidden" name="app_id" value={appId} />
            <input type="hidden" name="username" value={modalUser?.username || ''} />
            <input type="hidden" name="reason" value={banReason || 'Banned from panel'} />
            <button type="submit" className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
              Ban User
            </button>
          </form>
        </div>
      </Modal>

      {/* Add Time Modal */}
      <Modal open={modalType === 'addtime' && !!modalUser} onClose={closeModal} title="Add Time">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <p className="text-sm text-gray-300 pt-2">
            Add subscription time for: <span className="text-white font-semibold">{modalUser?.username}</span>
          </p>
        </div>
        <div className="mb-5">
          <label className="flex items-center gap-1.5 text-xs text-accent/60 mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Duration</label>
          <select
            value={addDuration}
            onChange={(e) => setAddDuration(e.target.value)}
            className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent cursor-pointer input-enhanced"
            autoFocus
          >
            {DURATIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 border border-edge rounded-xl hover:bg-white/5 transition-colors">Cancel</button>
          <form action={addTime} onSubmit={() => closeModal()}>
            <input type="hidden" name="app_id" value={appId} />
            <input type="hidden" name="username" value={modalUser?.username || ''} />
            <input type="hidden" name="duration" value={addDuration} />
            <button type="submit" className="px-4 py-2 text-sm font-semibold btn-gradient text-white rounded-xl transition-colors">
              Add Time
            </button>
          </form>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal open={modalType === 'delete' && !!modalUser} onClose={closeModal} title="Delete User">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="pt-1">
            <p className="text-sm text-gray-300">
              You&apos;re about to delete user: <span className="text-white font-semibold">{modalUser?.username}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
          </div>
        </div>
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-2">
            Type <span className="text-red-400 font-semibold">{modalUser?.username}</span> to confirm:
          </p>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Enter username"
            className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors input-enhanced"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 border border-edge rounded-xl hover:bg-white/5 transition-colors">Cancel</button>
          <form action={deleteUser} onSubmit={() => closeModal()}>
            <input type="hidden" name="app_id" value={appId} />
            <input type="hidden" name="username" value={modalUser?.username || ''} />
            <button
              type="submit"
              disabled={deleteConfirm !== modalUser?.username}
              className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Delete User
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

/* ---- Action Menu per user ---- */
function UserMenu({
  user, appId, onAction,
}: {
  user: UserRow;
  appId: string;
  onAction: (u: UserRow, type: 'ban' | 'addtime' | 'delete') => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute end-0 mt-1 z-30 w-44 glass-strong rounded-xl shadow-2xl overflow-hidden border border-edge/50">
            {user.banned ? (
              <form action={unbanUser} onSubmit={() => setOpen(false)}>
                <input type="hidden" name="app_id" value={appId} />
                <input type="hidden" name="username" value={user.username} />
                <button type="submit" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-green-400 hover:bg-green-500/10 transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5" /> Unban User
                </button>
              </form>
            ) : (
              <button onClick={() => { setOpen(false); onAction(user, 'ban'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                <ShieldOff className="w-3.5 h-3.5" /> Ban User
              </button>
            )}
            <form action={resetHwid} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="app_id" value={appId} />
              <input type="hidden" name="username" value={user.username} />
              <button type="submit" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-gray-300 hover:bg-white/5 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Reset HWID
              </button>
            </form>
            <form action={toggleHwidLock} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="app_id" value={appId} />
              <input type="hidden" name="username" value={user.username} />
              <button type="submit" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-accent hover:bg-accent/10 transition-colors">
                <Fingerprint className="w-3.5 h-3.5" />
                {user.hwid_locked === false ? 'Enable HWID Lock' : 'Disable HWID Lock'}
              </button>
            </form>
            <form action={toggleSuspend} onSubmit={() => setOpen(false)}>
              <input type="hidden" name="app_id" value={appId} />
              <input type="hidden" name="username" value={user.username} />
              <button type="submit" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-orange-400 hover:bg-orange-500/10 transition-colors">
                <AlertTriangle className="w-3.5 h-3.5" />
                {user.suspended ? 'Resume User' : 'Suspend User'}
              </button>
            </form>
            <button onClick={() => { setOpen(false); onAction(user, 'addtime'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-accent hover:bg-accent/10 transition-colors">
              <Clock className="w-3.5 h-3.5" /> Add Time
            </button>
            <div className="border-t border-edge/50" />
            <button onClick={() => { setOpen(false); onAction(user, 'delete'); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete User
            </button>
          </div>
        </>
      )}
    </div>
  );
}
