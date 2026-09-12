'use client';

import { useState } from 'react';
import SearchFilter from '@/components/SearchFilter';
import CopyButton from '@/components/CopyButton';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import { KeyRound, Trash2, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { deleteKey } from './actions';

interface LicenseRow {
  license_key: string;
  duration_seconds: string;
  level: number;
  used: boolean;
  used_by_name: string | null;
  expires_at: string | null;
  created_at: string;
}

const LIFETIME = 100 * 365 * 24 * 3600;
const PER_PAGE = 15;

function fmtDuration(s: number) {
  if (s >= LIFETIME - 1) return 'Lifetime';
  const units: [string, number][] = [['y', 31536000], ['d', 86400], ['h', 3600], ['m', 60]];
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

function getStatus(l: LicenseRow): { label: string; cls: string } {
  if (!l.used) return { label: 'UNUSED', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' };
  if (l.expires_at && new Date(l.expires_at) < new Date()) return { label: 'EXPIRED', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' };
  return { label: 'USED', cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' };
}

export default function LicensesClient({ licenses, appId }: { licenses: LicenseRow[]; appId: string }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);

  const filtered = licenses.filter(l => {
    if (search && !l.license_key.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'unused' && l.used) return false;
    if (filter === 'used' && (!l.used || (l.expires_at && new Date(l.expires_at) < new Date()))) return false;
    if (filter === 'expired' && !(l.used && l.expires_at && new Date(l.expires_at) < new Date())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="space-y-4">
      <SearchFilter
        placeholder="Search license keys..."
        filters={[
          { value: 'all', label: 'All Status' },
          { value: 'unused', label: 'Unused' },
          { value: 'used', label: 'Used' },
          { value: 'expired', label: 'Expired' },
        ]}
        onSearch={(v) => { setSearch(v); setPage(0); }}
        onFilter={(v) => { setFilter(v); setPage(0); }}
      />

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-edge/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent" /> License Keys
            <span className="text-gray-500 font-normal">({filtered.length})</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge/50 bg-white/[0.02]">
                {['Key', 'Duration', 'Level', 'Status', 'Used By', 'Created', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500 italic">No licenses found.</td></tr>
              ) : paged.map(l => {
                const status = getStatus(l);
                return (
                  <tr key={l.license_key} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-accent text-xs font-mono">{l.license_key}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs font-semibold">{fmtDuration(Number(l.duration_seconds))}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent/10 text-accent border border-accent/30">
                        Lv.{l.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{l.used_by_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(l.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <CopyButton text={l.license_key} />
                        <form action={deleteKey}>
                          <input type="hidden" name="app_id" value={appId} />
                          <input type="hidden" name="license_key" value={l.license_key} />
                          <ConfirmSubmit
                            message={`Delete key ${l.license_key.slice(0, 20)}...?`}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

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
            <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
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
    </div>
  );
}
