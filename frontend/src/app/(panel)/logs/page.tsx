import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import StatCard from '@/components/StatCard';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import LogsClient from './LogsClient';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { clearLogs } from './actions';
import { batchGeoLookup } from '@/lib/geoip';
import PageInfo from '@/components/PageInfo';
import ExportButton from '@/components/ExportButton';
import { FileText, Trash2, Activity, Users, Shield, LayoutDashboard, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const { owner, apps, selected } = await getPageData();

  let logs: Array<{ id: string; action: string; username: string | null; ip: string | null; detail: string | null; created_at: string }> = [];

  if (selected) {
    const r = await query(
      `SELECT id, action, username, ip, detail, created_at FROM logs WHERE app_id=$1 ORDER BY created_at DESC LIMIT 500`,
      [selected.id]
    );
    logs = r.rows;
  }

  const uniqueIps = [...new Set(logs.map(l => l.ip).filter(Boolean) as string[])];
  const geoMap = uniqueIps.length > 0 ? await batchGeoLookup(uniqueIps) : {};

  const actionCounts: Record<string, number> = {};
  for (const l of logs) {
    actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
  }
  const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];
  const uniqueUsers = new Set(logs.map(l => l.username).filter(Boolean)).size;

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Event Logs" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {!selected ? (
          <MotionCard className="glass rounded-xl p-10 text-center text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard className="w-7 h-7 text-accent/50" />
            </div>
            Create an application first on the{' '}
            <a href="/dashboard" className="text-accent hover:underline">Manage Apps</a> page.
          </MotionCard>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <PageInfo
                icon={<FileText className="w-4 h-4" />}
                title="Event Logs"
                description="Track all activity in your application — logins, registrations, license activations, bans, and more. Use search and filters to find specific events."
              />
              <ExportButton appId={selected.id} type="logs" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Events" value={logs.length} icon={<Activity className="w-5 h-5" />} tone="blue" delay={0} />
              <StatCard label="Unique Users" value={uniqueUsers} icon={<Users className="w-5 h-5" />} tone="green" delay={0.05} />
              <StatCard label="Action Types" value={Object.keys(actionCounts).length} icon={<TrendingUp className="w-5 h-5" />} tone="yellow" delay={0.1} />
              <StatCard label="Top Action" value={topAction ? topAction[0].toUpperCase() : '—'} icon={<Shield className="w-5 h-5" />} tone="red" delay={0.15} />
            </div>

            {/* Clear Logs */}
            {logs.length > 0 && (
              <div className="flex justify-end">
                <form action={clearLogs}>
                  <input type="hidden" name="app_id" value={selected.id} />
                  <ConfirmSubmit
                    message="Clear all logs for this app? This cannot be undone."
                    className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/10 hover:shadow-[0_0_12px_rgba(239,68,68,0.12)] transition-all font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All Logs
                  </ConfirmSubmit>
                </form>
              </div>
            )}

            <LogsClient logs={logs} geoMap={geoMap} />
          </>
        )}
      </main>
    </>
  );
}
