'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { runCleanup, toggleAutoCleanup } from './actions';
import { Play, Eye, Timer, CheckCircle, XCircle, SkipForward, Loader2 } from 'lucide-react';

type CleanupResult = {
  category: string;
  count: number;
  status: 'success' | 'skipped' | 'error';
  detail?: string;
};

type CleanupResponse = {
  success: boolean;
  dry_run: boolean;
  total_cleaned: number;
  results: CleanupResult[];
  timestamp: string;
  error?: string;
};

export default function CleanupClient({
  autoSettings,
}: {
  autoSettings: { enabled: boolean; intervalHours: number };
}) {
  const [results, setResults] = useState<CleanupResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [autoEnabled, setAutoEnabled] = useState(autoSettings.enabled);
  const [interval, setInterval] = useState(autoSettings.intervalHours);

  const handleRun = (dryRun: boolean) => {
    startTransition(async () => {
      const data = await runCleanup(dryRun);
      if (data.success) {
        setResults(data);
        toast.success(dryRun ? 'Dry run complete' : `Cleanup complete — ${data.total_cleaned} items removed`);
      } else {
        toast.error(data.error || 'Cleanup failed');
      }
    });
  };

  const handleAutoToggle = () => {
    const newEnabled = !autoEnabled;
    setAutoEnabled(newEnabled);
    startTransition(async () => {
      await toggleAutoCleanup(newEnabled, interval);
      toast.success(newEnabled ? 'Auto-cleanup enabled' : 'Auto-cleanup disabled');
    });
  };

  const handleIntervalChange = (val: number) => {
    setInterval(val);
    if (autoEnabled) {
      startTransition(async () => {
        await toggleAutoCleanup(true, val);
      });
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    if (status === 'skipped') return <SkipForward className="w-3.5 h-3.5 text-yellow-400" />;
    return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  };

  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div>
      {/* Actions */}
      <div className="px-5 py-4 border-b border-edge/50 flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleRun(false)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          Run Cleanup Now
        </button>
        <button
          onClick={() => handleRun(true)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
          Dry Run
        </button>
      </div>

      {/* Auto-cleanup settings */}
      <div className="px-5 py-4 border-b border-edge/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${autoEnabled ? 'bg-accent/15 text-accent' : 'bg-gray-500/10 text-gray-500'}`}>
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Auto-Cleanup</p>
              <p className="text-[10px] text-gray-500">
                {autoEnabled ? `Runs every ${interval} hours via cron` : 'Disabled — run manually'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {autoEnabled && (
              <select
                value={interval}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                className="bg-bg border border-edge rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent"
              >
                <option value={6}>Every 6h</option>
                <option value={12}>Every 12h</option>
                <option value={24}>Every 24h</option>
                <option value={48}>Every 48h</option>
                <option value={168}>Weekly</option>
              </select>
            )}
            <button
              onClick={handleAutoToggle}
              className={`relative w-11 h-6 rounded-full transition-colors ${autoEnabled ? 'bg-accent' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoEnabled ? 'start-[22px]' : 'start-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Results table */}
      {results && (
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white">
              {results.dry_run ? 'Dry Run Results' : 'Cleanup Results'}
              <span className="text-gray-500 font-normal ms-2">
                {results.total_cleaned} total {results.dry_run ? 'would be removed' : 'removed'}
              </span>
            </p>
            <p className="text-[10px] text-gray-600">
              {new Date(results.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge/50 bg-white/[0.02]">
                  {['Category', 'Count', 'Status', 'Detail'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.results.map((r, i) => (
                  <tr key={i} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-white text-xs font-medium">{formatCategory(r.category)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-bold ${r.count > 0 ? 'text-accent' : 'text-gray-500'}`}>
                        {r.count}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1.5">
                        {statusIcon(r.status)}
                        <span className={`text-xs ${
                          r.status === 'success' ? 'text-green-400' :
                          r.status === 'skipped' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {r.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{r.detail || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!results && (
        <div className="px-5 py-10 text-center text-xs text-gray-600">
          Click &quot;Run Cleanup Now&quot; or &quot;Dry Run&quot; to see results
        </div>
      )}
    </div>
  );
}
