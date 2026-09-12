'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { callAdmin } from '@/lib/api';
import { useToast } from '@/lib/toast';
import Modal from '@/components/Modal';

interface License {
  license_key: string;
  duration_seconds: number;
  level: number;
  used: boolean;
  hwid: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

function fmtDuration(s: number) {
  const LIFETIME = 100 * 365 * 24 * 3600;
  if (s >= LIFETIME - 1) return 'Lifetime';
  const units: [string, number][] = [['y', 31536000], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];
  const parts: string[] = [];
  let rem = Math.floor(s);
  for (const [label, size] of units) {
    if (rem >= size) { const v = Math.floor(rem / size); rem -= v * size; parts.push(`${v}${label}`); }
  }
  return parts.join(' ') || '0s';
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function KeysPage() {
  const { auth } = useAuth();
  const { toast } = useToast();

  const [duration, setDuration] = useState('30d');
  const [amount, setAmount] = useState(1);
  const [level, setLevel] = useState(1);
  const [prefix, setPrefix] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [genLoading, setGenLoading] = useState(false);

  const [licenses, setLicenses] = useState<License[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  const loadLicenses = useCallback(async () => {
    if (!auth) return;
    setListLoading(true);
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'licenses');
    if (res.success) setLicenses(res.licenses);
    setListLoading(false);
  }, [auth]);

  useEffect(() => { loadLicenses(); }, [loadLicenses]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!auth) return;
    setGenLoading(true);
    setGeneratedKeys([]);
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'keys', {
      duration, amount, level, prefix: prefix || undefined,
    });
    if (res.success) {
      setGeneratedKeys(res.keys);
      toast(`${res.keys.length} key(s) created`, 'success');
      loadLicenses();
    } else {
      toast(res.message || 'Failed to generate keys', 'error');
    }
    setGenLoading(false);
  }

  function copyAll() {
    navigator.clipboard.writeText(generatedKeys.join('\n'));
    toast('Copied to clipboard', 'success');
  }

  function copySingle(key: string) {
    navigator.clipboard.writeText(key);
    toast('Key copied', 'success');
  }

  async function doDeleteKey() {
    if (!auth || !deleteKey) return;
    const res = await callAdmin(auth.apiUrl, auth.adminKey, auth.appId, 'delkey', { license_key: deleteKey });
    if (res.success) {
      toast('Key deleted', 'success');
      loadLicenses();
    } else {
      toast(res.message || 'Failed', 'error');
    }
    setDeleteKey(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-6">
        <i className="ri-key-2-line text-[var(--color-primary)]" />
        License Keys
      </h1>

      {/* Generate form */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl mb-6">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <i className="ri-add-circle-line text-[var(--color-primary)]" /> Generate Keys
          </h3>
        </div>
        <form onSubmit={generate} className="p-5">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-1.5">Duration</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30d, 1y, lifetime"
                className="w-full px-3 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all" />
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-1.5">Amount</label>
              <input type="number" min={1} max={100} value={amount} onChange={e => setAmount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all" />
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-1.5">Level</label>
              <input type="number" min={1} value={level} onChange={e => setLevel(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all" />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold mb-1.5">Prefix</label>
              <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="FZ"
                className="w-full px-3 py-2.5 bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)] transition-all" />
            </div>
            <button type="submit" disabled={genLoading}
              className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2">
              {genLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <i className="ri-add-line" />}
              Generate
            </button>
          </div>
        </form>
      </div>

      {/* Generated keys display */}
      {generatedKeys.length > 0 && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl mb-6">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <i className="ri-checkbox-circle-line text-[var(--color-success)]" /> {generatedKeys.length} Key(s) Generated
            </h3>
            <button onClick={copyAll} className="flex items-center gap-2 px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)] transition-colors">
              <i className="ri-clipboard-line" /> Copy All
            </button>
          </div>
          <div className="p-4">
            <div className="bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg p-4 font-mono text-sm max-h-60 overflow-auto text-[var(--color-success)] leading-relaxed">
              {generatedKeys.join('\n')}
            </div>
          </div>
        </div>
      )}

      {/* All keys table */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <i className="ri-list-check text-[var(--color-primary)]" /> All Keys
            <span className="text-[var(--color-muted)] font-normal">({licenses.length})</span>
          </h3>
          <button onClick={loadLicenses} className="p-1.5 text-[var(--color-muted-fg)] hover:text-[var(--color-foreground)] transition-colors">
            <i className="ri-refresh-line" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['License Key', 'Duration', 'Level', 'Status', 'HWID', 'Expires', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide bg-[var(--color-input)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted)] italic">Loading...</td></tr>
              ) : licenses.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted)] italic">No license keys</td></tr>
              ) : licenses.map(l => (
                <tr key={l.license_key} className="border-b border-[var(--color-border)] hover:bg-[var(--color-card-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <code className="text-[var(--color-primary)] text-xs">{l.license_key}</code>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-fg)]">{fmtDuration(l.duration_seconds)}</td>
                  <td className="px-4 py-3">{l.level}</td>
                  <td className="px-4 py-3">
                    {l.used ? (
                      l.expires_at && new Date(l.expires_at) < new Date()
                        ? <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning)]">Expired</span>
                        : <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-border)]/50 text-[var(--color-muted-fg)]">Used</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-success-bg)] text-[var(--color-success)]">Unused</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)] font-mono text-xs max-w-[100px] truncate">{l.hwid || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-fg)]">{fmtDate(l.expires_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => copySingle(l.license_key)} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-foreground)] transition-all" title="Copy">
                        <i className="ri-clipboard-line text-sm" />
                      </button>
                      <button onClick={() => setDeleteKey(l.license_key)} className="w-7 h-7 flex items-center justify-center rounded border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-danger-bg)] hover:text-[var(--color-danger)] hover:border-[var(--color-danger)] transition-all" title="Delete">
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete key modal */}
      <Modal open={!!deleteKey} onClose={() => setDeleteKey(null)} title="Delete License Key"
        footer={
          <>
            <button onClick={() => setDeleteKey(null)} className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card-hover)] transition-colors">Cancel</button>
            <button onClick={doDeleteKey} className="px-4 py-2 text-sm bg-[var(--color-danger)] text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
              <i className="ri-delete-bin-line" /> Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-muted-fg)]">
          Delete key <code className="text-[var(--color-primary)]">{deleteKey}</code>?
        </p>
      </Modal>
    </div>
  );
}
