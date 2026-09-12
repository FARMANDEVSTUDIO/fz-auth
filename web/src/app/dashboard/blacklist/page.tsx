'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { callAdmin } from '@/lib/api';
import { useToast } from '@/lib/toast';
import Modal from '@/components/Modal';

interface BlacklistEntry {
  id: number;
  type: string;
  value: string;
  reason: string | null;
  created_at: string;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BlacklistPage() {
  const { auth } = useAuth();
  const { toast } = useToast();

  const [type, setType] = useState<'hwid' | 'ip'>('hwid');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [removeId, setRemoveId] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    if (!auth) return;
    setListLoading(true);
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'blacklists');
    if (res.success) setEntries(res.entries);
    setListLoading(false);
  }, [auth]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!auth || !value.trim()) return;
    setAddLoading(true);
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'blacklist', {
      type, value: value.trim(), reason: reason.trim() || undefined,
    });
    if (res.success) {
      toast(`${type.toUpperCase()} blacklisted`, 'success');
      setValue('');
      setReason('');
      loadEntries();
    } else {
      toast(res.message || 'Failed', 'error');
    }
    setAddLoading(false);
  }

  async function doRemove() {
    if (!auth || removeId === null) return;
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'unblacklist', { id: removeId });
    if (res.success) {
      toast('Blacklist entry removed', 'success');
      loadEntries();
    } else {
      toast(res.message || 'Failed', 'error');
    }
    setRemoveId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-6">
        <i className="ri-spam-2-line text-[var(--color-primary)]" />
        Blacklist
      </h1>

      {/* Add form */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl mb-6">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <i className="ri-add-circle-line text-[var(--color-primary)]" /> Add Entry
          </h3>
        </div>
        <form onSubmit={addEntry} className="p-5">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="min-w-[120px]">
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-1.5">Type</label>
              <select value={type} onChange={e => setType(e.target.value as 'hwid' | 'ip')}
                className="w-full px-3 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717a' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px' }}>
                <option value="hwid">HWID</option>
                <option value="ip">IP</option>
              </select>
            </div>
            <div className="flex-[2] min-w-[180px]">
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-1.5">Value</label>
              <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'hwid' ? 'HWID-XXXX-YYYY' : '192.168.1.1'} required
                className="w-full px-3 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all" />
            </div>
            <div className="flex-[2] min-w-[180px]">
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-1.5">Reason</label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional reason"
                className="w-full px-3 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all" />
            </div>
            <button type="submit" disabled={addLoading}
              className="px-5 py-2.5 bg-[var(--color-danger)] hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
              {addLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="ri-add-line" />}
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Entries table */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <i className="ri-list-check text-[var(--color-primary)]" /> Blacklist Entries
            <span className="text-[var(--color-muted)] font-normal">({entries.length})</span>
          </h3>
          <button onClick={loadEntries} className="p-1.5 text-[var(--color-muted-fg)] hover:text-[var(--color-foreground)] transition-colors">
            <i className="ri-refresh-line" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Type', 'Value', 'Reason', 'Added', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide bg-[var(--color-input)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted)] italic">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--color-muted)] italic">No blacklist entries</td></tr>
              ) : entries.map(entry => (
                <tr key={entry.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors">
                  <td className="px-4 py-3">
                    {entry.type === 'hwid'
                      ? <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-info-bg)] text-[var(--color-info)]">HWID</span>
                      : <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning)]">IP</span>
                    }
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.value}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-fg)]">{entry.reason || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-fg)]">{fmtDate(entry.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setRemoveId(entry.id)} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] transition-all" title="Remove">
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remove modal */}
      <Modal open={removeId !== null} onClose={() => setRemoveId(null)} title="Remove Blacklist Entry"
        footer={
          <>
            <button onClick={() => setRemoveId(null)} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)] transition-colors">Cancel</button>
            <button onClick={doRemove} className="px-4 py-2 text-sm bg-[var(--color-danger)] text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
              <i className="ri-delete-bin-line" /> Remove
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted-fg)]">Are you sure you want to remove this blacklist entry?</p>
      </Modal>
    </div>
  );
}
