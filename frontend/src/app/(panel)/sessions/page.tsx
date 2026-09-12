import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import StatCard from '@/components/StatCard';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { killSession, killAllSessions } from './actions';
import PageInfo from '@/components/PageInfo';
import { Radio, Trash2, XCircle, Wifi, WifiOff, Activity, LayoutDashboard, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const { owner, apps, selected } = await getPageData();

  let sessions: Array<{
    id: string; user_id: string; username: string | null; hwid: string | null;
    ip: string | null; expires_at: string; created_at: string;
  }> = [];

  if (selected) {
    const r = await query(
      `SELECT s.id, s.user_id, u.username, s.hwid, s.ip, s.expires_at, s.created_at
       FROM sessions s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.app_id = $1
       ORDER BY s.created_at DESC LIMIT 200`,
      [selected.id]
    );
    sessions = r.rows;
  }

  const now = new Date();
  const active = sessions.filter(s => new Date(s.expires_at) > now);
  const expired = sessions.filter(s => new Date(s.expires_at) <= now);

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Sessions" />
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
            <PageInfo
              icon={<Radio className="w-4 h-4" />}
              title="Session Management"
              description="View and manage all active and expired user sessions. Kill individual sessions or all sessions at once to force users to re-authenticate."
            />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Sessions" value={sessions.length} icon={<Activity className="w-5 h-5" />} tone="blue" delay={0} />
              <StatCard label="Active" value={active.length} icon={<Wifi className="w-5 h-5" />} tone="green" delay={0.05} />
              <StatCard label="Expired" value={expired.length} icon={<WifiOff className="w-5 h-5" />} tone="red" delay={0.1} />
              <StatCard
                label="Unique IPs"
                value={new Set(sessions.map(s => s.ip).filter(Boolean)).size}
                icon={<Globe className="w-5 h-5" />}
                tone="yellow"
                delay={0.15}
              />
            </div>

            {/* Kill All */}
            {sessions.length > 0 && (
              <div className="flex justify-end">
                <form action={killAllSessions}>
                  <input type="hidden" name="app_id" value={selected.id} />
                  <ConfirmSubmit
                    message="Kill ALL sessions for this app? All active users will be logged out."
                    className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/10 hover:shadow-[0_0_12px_rgba(239,68,68,0.12)] transition-all font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Kill All Sessions
                  </ConfirmSubmit>
                </form>
              </div>
            )}

            {/* Sessions Table */}
            <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 section-header flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-accent" /> All Sessions
                  <span className="text-gray-500 font-normal">({sessions.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table-enhanced">
                  <thead>
                    <tr>
                      {['Status', 'User', 'HWID', 'IP', 'Created', 'Expires', ''].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                            <Radio className="w-6 h-6 text-accent/40" />
                          </div>
                          <p className="text-gray-500 text-sm">No sessions found</p>
                          <p className="text-gray-600 text-xs mt-1">Sessions will appear here when users authenticate.</p>
                        </td>
                      </tr>
                    ) : sessions.map(s => {
                      const isActive = new Date(s.expires_at) > now;
                      return (
                        <tr key={s.id} className={!isActive ? 'opacity-50' : ''}>
                          <td>
                            <span className={`badge ${isActive ? 'badge-green' : 'badge-red'}`}>
                              <span className={`pulse-dot ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                              {isActive ? 'ACTIVE' : 'EXPIRED'}
                            </span>
                          </td>
                          <td className="text-white font-medium text-xs">{s.username || s.user_id?.slice(0, 8) || '—'}</td>
                          <td className="text-gray-400 text-xs font-mono">{s.hwid?.slice(0, 16) || '—'}{s.hwid && s.hwid.length > 16 ? '...' : ''}</td>
                          <td className="text-gray-400 text-xs">{s.ip || '—'}</td>
                          <td className="text-gray-500 text-xs whitespace-nowrap">
                            {new Date(s.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="text-xs whitespace-nowrap">
                            <span className={isActive ? 'text-green-400' : 'text-red-400'}>
                              {new Date(s.expires_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td>
                            {isActive && (
                              <form action={killSession}>
                                <input type="hidden" name="app_id" value={selected.id} />
                                <input type="hidden" name="session_id" value={s.id} />
                                <button type="submit" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Kill session">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </MotionCard>
          </>
        )}
      </main>
    </>
  );
}
