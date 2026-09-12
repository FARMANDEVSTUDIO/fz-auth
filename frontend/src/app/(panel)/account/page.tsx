import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import StatCard from '@/components/StatCard';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { updateProfile, changePassword, deleteAccount } from './actions';
import { getOwnerPlan, isMasterAdmin, PLAN_LIMITS } from '@/lib/plans';
import TwoFASetup from '@/components/TwoFASetup';
import { getLoginHistory } from '@/lib/login-history';
import { UserCircle, Crown, Key, Users, Shield, Trash2, Lock, Save, ShieldAlert, Pencil, History, Monitor, Globe, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);
  const isAdmin = isMasterAdmin(owner.email);
  const planLabel = PLAN_LIMITS[plan].label.toUpperCase();
  const planStyle = plan === 'enterprise'
    ? 'badge-red'
    : plan === 'pro'
    ? 'badge-accent'
    : 'badge-yellow';

  const totalUsers = apps.length > 0
    ? (await query('SELECT COUNT(*)::int AS c FROM users WHERE app_id = ANY($1)', [apps.map(a => a.id)])).rows[0].c
    : 0;

  const totalLicenses = apps.length > 0
    ? (await query('SELECT COUNT(*)::int AS c FROM licenses WHERE app_id = ANY($1)', [apps.map(a => a.id)])).rows[0].c
    : 0;

  const loginHistory = await getLoginHistory(owner.id, 20);

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Account" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {/* Profile */}
        <MotionCard delay={0} className="glass rounded-xl gradient-border">
          <div className="px-5 py-4 border-b border-edge/50 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-accent" /> Account Settings
            </h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt="" className="w-16 h-16 rounded-xl ring-2 ring-accent/20" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-accent/15 text-accent flex items-center justify-center text-2xl font-bold ring-2 ring-accent/20">
                  {(owner.name || owner.email)[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">{owner.name || 'User'}</p>
                <p className="text-sm text-gray-400">{owner.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${planStyle}`}>
                    {isAdmin && <ShieldAlert className="w-3 h-3" />}
                    {isAdmin ? 'MASTER ADMIN' : `${planLabel} PLAN`}
                  </span>
                  <span className="text-[10px] text-gray-600">via {owner.provider}</span>
                </div>
              </div>
            </div>

            <form action={updateProfile} className="flex flex-wrap gap-4 items-end pt-4 border-t border-edge/30">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-accent/40" />
                  Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={owner.name || ''}
                  placeholder="Your name"
                  className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-accent/40" />
                  Avatar URL
                </label>
                <input
                  type="url"
                  name="avatar_url"
                  defaultValue={owner.avatar_url || ''}
                  placeholder="https://..."
                  className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
                />
              </div>
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold">
                <Pencil className="w-4 h-4" /> Update Profile
              </button>
            </form>
          </div>
        </MotionCard>

        {/* Plan & Usage */}
        <MotionCard delay={0.1} className="glass rounded-xl">
          <div className="px-5 py-4 border-b border-edge/50 section-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" /> Plan & Usage
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Your Credits" value={owner.credits} icon={<Crown className="w-5 h-5" />} tone="yellow" delay={0} />
              <StatCard label="Apps" value={apps.length} icon={<Shield className="w-5 h-5" />} tone="blue" delay={0.05} />
              <StatCard label="Total Users" value={totalUsers} icon={<Users className="w-5 h-5" />} tone="green" delay={0.1} />
              <StatCard label="Total Licenses" value={totalLicenses} icon={<Key className="w-5 h-5" />} tone="blue" delay={0.15} />
            </div>
          </div>
        </MotionCard>

        {/* Change Password — only for email/password accounts, not OAuth */}
        {owner.provider === 'credentials' && (
        <MotionCard delay={0.2} className="glass rounded-xl">
          <div className="px-5 py-4 border-b border-edge/50 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" /> Change Password
            </h3>
            <p className="text-xs text-gray-500 mt-1">Set or update your password for email login.</p>
          </div>
          <form action={changePassword} className="p-5 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent/40" />
                New Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-accent/40" />
                Confirm
              </label>
              <input
                type="password"
                name="confirm"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
              />
            </div>
            <button type="submit" className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold">
              <Save className="w-4 h-4" /> Update Password
            </button>
          </form>
        </MotionCard>
        )}

        {/* 2FA */}
        <MotionCard delay={0.25}>
          <TwoFASetup enabled={!!owner.totp_enabled} />
        </MotionCard>

        {/* Login History */}
        <MotionCard delay={0.3} className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 section-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-accent" /> Login History
            </h3>
            <span className="text-[10px] text-gray-500">{loginHistory.length} entries</span>
          </div>
          {loginHistory.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6 text-accent/40" />
              </div>
              <p className="text-gray-500 text-sm">No login history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-enhanced">
                <thead>
                  <tr>
                    {['Time', 'IP Address', 'Location', 'Browser / Device'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className="text-gray-400 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-gray-600" />
                          {new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                          {new Date(entry.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="text-gray-400 text-xs font-mono">{entry.ip || '—'}</td>
                      <td className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-gray-600" />
                          <span className="text-gray-400">{entry.location || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-3 h-3 text-gray-600" />
                          <span className="text-gray-400">{entry.browser || 'Unknown'}</span>
                          <span className="text-gray-600">on</span>
                          <span className="text-gray-400">{entry.os || 'Unknown'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </MotionCard>

        {/* Danger Zone */}
        <MotionCard delay={0.35} className="glass rounded-xl border-red-500/20" style={{ borderColor: 'rgb(239 68 68 / 0.2)' }}>
          <div className="px-5 py-4 border-b border-red-500/15">
            <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Danger Zone
            </h3>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Delete Account</p>
              <p className="text-xs text-gray-500">Permanently remove your account and all data. This cannot be undone.</p>
            </div>
            <form action={deleteAccount}>
              <ConfirmSubmit
                message="Are you absolutely sure? This will permanently delete your account, all applications, and all associated data."
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-500/25 rounded-xl hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.12)] transition-all font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </ConfirmSubmit>
            </form>
          </div>
        </MotionCard>
      </main>
    </>
  );
}
