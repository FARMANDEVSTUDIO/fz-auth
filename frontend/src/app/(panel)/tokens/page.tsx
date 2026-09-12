import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import StatCard from '@/components/StatCard';
import CopyButton from '@/components/CopyButton';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { killSession } from '../sessions/actions';
import PageInfo from '@/components/PageInfo';
import { Zap, Trash2, Shield, Users, LayoutDashboard, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TokensPage() {
  const { owner, apps, selected } = await getPageData();

  let tokens: Array<{ id: string; token: string; username: string | null; user_id: string; hwid: string | null; ip: string | null; expires_at: string; created_at: string }> = [];

  if (selected) {
    const r = await query(
      `SELECT s.id, s.token, s.user_id, s.hwid, s.ip, s.expires_at, s.created_at, u.username
       FROM sessions s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.app_id = $1 AND s.expires_at > now()
       ORDER BY s.created_at DESC LIMIT 200`,
      [selected.id]
    );
    tokens = r.rows;
  }

  const uniqueUsers = new Set(tokens.map(t => t.user_id)).size;
  const uniqueIPs = new Set(tokens.map(t => t.ip).filter(Boolean)).size;

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Tokens" />
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
              icon={<Zap className="w-4 h-4" />}
              title="Active Tokens"
              description="Session tokens are issued when users log in. Each token represents an active authenticated session. Revoke a token to immediately end that user's session."
            />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Active Tokens" value={tokens.length} icon={<Zap className="w-5 h-5" />} tone="blue" delay={0} />
              <StatCard label="Unique Users" value={uniqueUsers} icon={<Users className="w-5 h-5" />} tone="green" delay={0.05} />
              <StatCard label="Unique IPs" value={uniqueIPs} icon={<Globe className="w-5 h-5" />} tone="yellow" delay={0.1} />
              <StatCard label="App" value={selected.name} icon={<Shield className="w-5 h-5" />} tone="blue" delay={0.15} />
            </div>

            {/* Tokens Table */}
            <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 section-header flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" /> Active Session Tokens
                  <span className="text-gray-500 font-normal">({tokens.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table-enhanced">
                  <thead>
                    <tr>
                      {['User', 'Token', 'HWID', 'IP', 'Expires', ''].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                            <Zap className="w-6 h-6 text-accent/40" />
                          </div>
                          <p className="text-gray-500 text-sm">No active tokens</p>
                          <p className="text-gray-600 text-xs mt-1">Tokens appear when users authenticate with your app.</p>
                        </td>
                      </tr>
                    ) : tokens.map(t => (
                      <tr key={t.id}>
                        <td className="text-white font-medium text-xs">{t.username || t.user_id?.slice(0, 8) || '—'}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-accent font-mono">{t.token.slice(0, 20)}...</code>
                            <CopyButton text={t.token} />
                          </div>
                        </td>
                        <td className="text-gray-400 text-xs font-mono">{t.hwid?.slice(0, 12) || '—'}{t.hwid && t.hwid.length > 12 ? '...' : ''}</td>
                        <td className="text-gray-400 text-xs">{t.ip || '—'}</td>
                        <td className="text-gray-500 text-xs whitespace-nowrap">
                          {new Date(t.expires_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <form action={killSession}>
                            <input type="hidden" name="app_id" value={selected.id} />
                            <input type="hidden" name="session_id" value={t.id} />
                            <button type="submit" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Revoke">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
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
