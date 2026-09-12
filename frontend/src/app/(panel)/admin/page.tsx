import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import StatCard from '@/components/StatCard';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import { getPageData } from '@/lib/page-data';
import { isMasterAdmin, getOwnerPlan, PLAN_LIMITS } from '@/lib/plans';
import { query } from '@/lib/db';
import { grantPremium, revokePremium, deleteOwnerAdmin, restoreOwnerAdmin, permanentDeleteOwner, toggleMaintenance } from './actions';
import { isMaintenanceMode } from '@/lib/settings';
import Link from 'next/link';
import {
  ShieldAlert, Users, LayoutDashboard, Crown, Trash2, Star,
  UserCheck, Ban, RotateCcw, Skull, Wrench, Power, Database, Cloud, Eraser, Shield,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { owner, apps, selected } = await getPageData();

  if (!isMasterAdmin(owner.email)) redirect('/dashboard');

  const maintenanceOn = await isMaintenanceMode();

  const [ownersRes, deletedRes, appsRes, usersRes] = await Promise.all([
    query('SELECT id, email, name, avatar_url, credits, plan_type, plan_expires_at, created_at FROM owners WHERE deleted_at IS NULL ORDER BY created_at DESC'),
    query('SELECT id, email, name, avatar_url, credits, created_at, deleted_at FROM owners WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'),
    query('SELECT COUNT(*)::int AS c FROM apps'),
    query('SELECT COUNT(*)::int AS c FROM users'),
  ]);

  const allOwners = ownersRes.rows as Array<{
    id: string; email: string; name: string | null;
    avatar_url: string | null; credits: number; created_at: string;
  }>;
  const deletedOwners = deletedRes.rows as Array<{
    id: string; email: string; name: string | null;
    avatar_url: string | null; credits: number; created_at: string; deleted_at: string;
  }>;
  const totalApps = appsRes.rows[0].c;
  const totalUsers = usersRes.rows[0].c;

  const appCountsRes = await query(
    'SELECT owner_id, COUNT(*)::int AS c FROM apps GROUP BY owner_id'
  );
  const appCounts: Record<string, number> = Object.fromEntries(
    appCountsRes.rows.map((r: { owner_id: string; c: number }) => [r.owner_id, r.c])
  );

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Admin Panel" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {/* Warning banner */}
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-semibold">Private Admin Panel</p>
            <p className="text-xs text-gray-400">This page is only visible to you. No other user can see or access this panel.</p>
          </div>
        </div>

        {/* Maintenance Toggle */}
        <MotionCard delay={0.1} className={`glass rounded-xl p-5 border ${maintenanceOn ? 'border-yellow-500/30 bg-yellow-500/[0.03]' : 'border-edge/50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintenanceOn ? 'bg-yellow-500/15 text-yellow-400' : 'bg-gray-500/10 text-gray-500'}`}>
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-display">Maintenance Mode</p>
                <p className="text-[10px] text-gray-500">
                  {maintenanceOn ? 'Site is DOWN — only you can access the panel' : 'Site is running normally'}
                </p>
              </div>
            </div>
            <form action={toggleMaintenance}>
              <input type="hidden" name="enabled" value={maintenanceOn ? 'false' : 'true'} />
              <button type="submit" className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                maintenanceOn
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                  : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
              }`}>
                <Power className="w-3.5 h-3.5" />
                {maintenanceOn ? 'Turn Off' : 'Turn On'}
              </button>
            </form>
          </div>
        </MotionCard>

        {/* DB Backup */}
        <MotionCard delay={0.15} className="glass rounded-xl p-5 border border-edge/50 card-hover-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 ring-1 ring-blue-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-display">Database Backup</p>
                <p className="text-[10px] text-gray-500">Download full JSON backup of all tables</p>
              </div>
            </div>
            <a href="/api/admin/backup" target="_blank"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
              <Database className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </MotionCard>

        {/* Database Cleanup */}
        <MotionCard delay={0.18} className="glass rounded-xl p-5 border border-edge/50 card-hover-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 ring-1 ring-purple-500/20">
                <Eraser className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-display">Database Cleanup</p>
                <p className="text-[10px] text-gray-500">Remove expired sessions, old logs, stale data</p>
              </div>
            </div>
            <Link href="/admin/cleanup"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
              <Eraser className="w-3.5 h-3.5" /> Manage
            </Link>
          </div>
        </MotionCard>

        {/* Cloudflare Guide */}
        <MotionCard delay={0.2} className="glass rounded-xl p-5 border border-edge/50 card-hover-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 ring-1 ring-orange-500/20">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-display">Cloudflare Setup</p>
                <p className="text-[10px] text-gray-500">DDoS protection, SSL, rate limiting guide</p>
              </div>
            </div>
            <Link href="/admin/cloudflare"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5" /> View Guide
            </Link>
          </div>
        </MotionCard>

        {/* IP Rules */}
        <MotionCard delay={0.22} className="glass rounded-xl p-5 border border-edge/50 card-hover-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 ring-1 ring-red-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-display">IP Rules</p>
                <p className="text-[10px] text-gray-500">Manage IP whitelist &amp; blacklist for API routes</p>
              </div>
            </div>
            <Link href="/admin/ip-rules"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Manage
            </Link>
          </div>
        </MotionCard>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Owners" value={allOwners.length} icon={<Users className="w-5 h-5" />} tone="blue" delay={0} />
          <StatCard label="Total Apps" value={totalApps} icon={<LayoutDashboard className="w-5 h-5" />} tone="green" delay={0.05} />
          <StatCard label="Total Users" value={totalUsers} icon={<UserCheck className="w-5 h-5" />} tone="yellow" delay={0.1} />
          <StatCard label="Premium Owners" value={allOwners.filter(o => o.credits >= 1000).length} icon={<Crown className="w-5 h-5" />} tone="red" delay={0.15} />
        </div>

        {/* Owners Table */}
        <MotionCard delay={0.2} className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge/50 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-red-400" /> All Registered Owners
              <span className="text-gray-500 font-normal">({allOwners.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="table-enhanced">
              <thead>
                <tr className="border-b border-edge/50 bg-white/[0.02]">
                  {['Owner', 'Email', 'Plan', 'Apps', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allOwners.map(o => {
                  const plan = getOwnerPlan(o);
                  const isMe = o.email === owner.email;
                  return (
                    <tr key={o.id} className={`border-b border-edge/30 hover:bg-white/[0.02] transition-colors ${isMe ? 'bg-red-500/[0.03]' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {o.avatar_url ? (
                            <img src={o.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
                              {(o.name || o.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium flex items-center gap-1.5">
                              {o.name || '—'}
                              {isMe && <ShieldAlert className="w-3 h-3 text-red-400" />}
                            </p>
                            <p className="text-[10px] text-gray-600 font-mono">{o.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{o.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          plan === 'enterprise' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                          plan === 'pro' ? 'bg-accent/15 text-accent border border-accent/30' :
                          'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                        }`}>
                          {PLAN_LIMITS[plan].label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{appCounts[o.id] || 0}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        {isMe ? (
                          <span className="text-[10px] text-red-400/50 italic">Master</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {plan === 'free' ? (
                              <>
                                <form action={grantPremium}>
                                  <input type="hidden" name="owner_id" value={o.id} />
                                  <input type="hidden" name="plan" value="pro" />
                                  <button type="submit" className="px-2 py-1 text-[10px] text-accent bg-accent/10 border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors font-semibold">
                                    Give Pro
                                  </button>
                                </form>
                                <form action={grantPremium}>
                                  <input type="hidden" name="owner_id" value={o.id} />
                                  <input type="hidden" name="plan" value="enterprise" />
                                  <button type="submit" className="px-2 py-1 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors font-semibold">
                                    Give Enterprise
                                  </button>
                                </form>
                              </>
                            ) : (
                              <form action={revokePremium}>
                                <input type="hidden" name="owner_id" value={o.id} />
                                <button type="submit" className="px-2 py-1 text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-colors font-semibold">
                                  Revoke
                                </button>
                              </form>
                            )}
                            <form action={deleteOwnerAdmin}>
                              <input type="hidden" name="owner_id" value={o.id} />
                              <ConfirmSubmit
                                message={`Delete owner "${o.email}" and ALL their apps/data permanently?`}
                                confirmText={o.email}
                                className="px-2 py-1 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors font-semibold"
                              >
                                <Trash2 className="w-3 h-3" />
                              </ConfirmSubmit>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </MotionCard>
        {/* Deleted Owners (Trash) */}
        {deletedOwners.length > 0 && (
          <MotionCard delay={0.3} className="glass rounded-xl overflow-hidden border border-red-500/20">
            <div className="px-5 py-4 border-b border-red-500/30 bg-red-500/[0.03] section-header">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" /> Deleted Owners
                <span className="text-gray-500 font-normal">({deletedOwners.length})</span>
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Soft-deleted accounts. Restore or permanently delete them.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="table-enhanced">
                <thead>
                  <tr className="border-b border-red-500/20 bg-red-500/[0.02]">
                    {['Owner', 'Email', 'Deleted At', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deletedOwners.map(o => (
                    <tr key={o.id} className="border-b border-red-500/10 hover:bg-red-500/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {o.avatar_url ? (
                            <img src={o.avatar_url} alt="" className="w-8 h-8 rounded-full opacity-50" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">
                              {(o.name || o.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400 font-medium line-through">{o.name || '—'}</p>
                            <p className="text-[10px] text-gray-600 font-mono">{o.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{o.email}</td>
                      <td className="px-4 py-3 text-red-400/70 text-xs whitespace-nowrap">
                        {new Date(o.deleted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <form action={restoreOwnerAdmin}>
                            <input type="hidden" name="owner_id" value={o.id} />
                            <button type="submit" className="px-2.5 py-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors font-semibold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" /> Restore
                            </button>
                          </form>
                          <form action={permanentDeleteOwner}>
                            <input type="hidden" name="owner_id" value={o.id} />
                            <ConfirmSubmit
                              message={`Permanently delete "${o.email}" and ALL their data? This cannot be undone.`}
                              confirmText={o.email}
                              className="px-2.5 py-1 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors font-semibold flex items-center gap-1"
                            >
                              <Skull className="w-3 h-3" /> Delete Forever
                            </ConfirmSubmit>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MotionCard>
        )}
      </main>
    </>
  );
}
