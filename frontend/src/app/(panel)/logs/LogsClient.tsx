'use client';

import { useState } from 'react';
import SearchFilter from '@/components/SearchFilter';
import { FileText, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import type { GeoResult } from '@/lib/geoip';

interface LogRow {
  id: string;
  action: string;
  username: string | null;
  ip: string | null;
  detail: string | null;
  created_at: string;
}

const PER_PAGE = 20;

const actionColors: Record<string, string> = {
  login: 'bg-green-500/15 text-green-400 border border-green-500/30',
  register: 'bg-accent/15 text-accent border border-accent/30',
  license: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  ban: 'bg-red-500/15 text-red-400 border border-red-500/30',
  unban: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  hwid_reset: 'bg-accent/15 text-accent border border-accent/30',
  delete: 'bg-red-500/15 text-red-400 border border-red-500/30',
};

export default function LogsClient({ logs, geoMap = {} }: { logs: LogRow[]; geoMap?: Record<string, GeoResult> }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  const filtered = logs.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      const matches = (l.username || '').toLowerCase().includes(q)
        || (l.action || '').toLowerCase().includes(q)
        || (l.ip || '').toLowerCase().includes(q)
        || (l.detail || '').toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filter !== 'all' && l.action !== filter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="space-y-4">
      <SearchFilter
        placeholder="Search logs by user, action, IP..."
        filters={[
          { value: 'all', label: 'All Actions' },
          ...uniqueActions.map(a => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) })),
        ]}
        onSearch={(v) => { setSearch(v); setPage(0); }}
        onFilter={(v) => { setFilter(v); setPage(0); }}
      />

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-edge/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" /> Event Logs
            <span className="text-gray-500 font-normal">({filtered.length})</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge/50 bg-white/[0.02]">
                {['Action', 'User', 'IP / Location', 'Detail', 'Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-500 text-sm">No logs found</p>
                    <p className="text-gray-600 text-xs mt-1">Events will appear here as users interact with your app.</p>
                  </td>
                </tr>
              ) : paged.map(log => (
                <tr key={log.id} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${actionColors[log.action] || 'bg-gray-500/15 text-gray-400 border border-gray-500/30'}`}>
                      {(log.action || '—').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white text-xs font-medium">{log.username || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-gray-400 font-mono">{log.ip || '—'}</span>
                    {log.ip && geoMap[log.ip] && (
                      <span className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {geoMap[log.ip].location}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[300px] truncate">{log.detail || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
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
