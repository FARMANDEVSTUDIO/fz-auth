import Topbar from '@/components/Topbar';
import StatCard from '@/components/StatCard';
import CopyField from '@/components/CopyField';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import MotionCard from '@/components/MotionCard';
import CodeSnippet from '@/components/CodeSnippet';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { getOwnerPlan, PLAN_LIMITS } from '@/lib/plans';
import { createApp, renameApp, toggleAppStatus, deleteApp, refreshSecret, selectApp, updateVersion, clearExpired } from '../actions';
import WelcomeGuide from '@/components/WelcomeGuide';
import ActionForm from '@/components/ActionForm';
import Heatmap from '@/components/Heatmap';
import {
  LayoutDashboard, CheckCircle, Zap, ShieldCheck, Plus, RefreshCw,
  Users, Key, Fingerprint, Clock, Crown, PauseCircle, Edit3, Trash2,
  AlertTriangle, Activity, Layers, TrendingUp, Sparkles, Globe, Server,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { owner, apps, selected } = await getPageData();

  const plan = getOwnerPlan(owner);
  const limits = PLAN_LIMITS[plan];
  const active = apps.filter(a => a.status === 'active').length;
  const paused = apps.length - active;
  const canCreate = limits.maxApps === -1 || apps.length < limits.maxApps;

  let activeSessions = 0;
  let totalUsers = 0;
  let totalKeys = 0;
  let hwidLocked = 0;
  let usedLicenses = 0;
  let userCounts: Record<string, number> = {};

  let heatmapData: Record<string, number> = {};

  if (apps.length > 0) {
    const ids = apps.map(a => a.id);
    const [sRes, uRes, kRes, hRes, ulRes, ucRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS c FROM sessions WHERE app_id = ANY($1) AND expires_at > now()', [ids]),
      query('SELECT COUNT(*)::int AS c FROM users WHERE app_id = ANY($1)', [ids]),
      query('SELECT COUNT(*)::int AS c FROM licenses WHERE app_id = ANY($1)', [ids]),
      query('SELECT COUNT(*)::int AS c FROM users WHERE app_id = ANY($1) AND hwid IS NOT NULL', [ids]),
      query('SELECT COUNT(*)::int AS c FROM licenses WHERE app_id = ANY($1) AND used = true', [ids]),
      query('SELECT app_id, COUNT(*)::int AS c FROM users WHERE app_id = ANY($1) GROUP BY app_id', [ids]),
    ]);
    activeSessions = sRes.rows[0].c;
    totalUsers = uRes.rows[0].c;
    totalKeys = kRes.rows[0].c;
    hwidLocked = hRes.rows[0].c;
    usedLicenses = ulRes.rows[0].c;
    userCounts = Object.fromEntries(ucRes.rows.map((r: { app_id: string; c: number }) => [r.app_id, r.c]));

    const heatRes = await query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS c
       FROM logs WHERE app_id = ANY($1) AND created_at > NOW() - INTERVAL '182 days'
       GROUP BY DATE(created_at)`,
      [ids]
    );
    heatmapData = Object.fromEntries(
      heatRes.rows.map((r: { day: string; c: number }) => [new Date(r.day).toISOString().slice(0, 10), r.c])
    );
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Manage Apps" />

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {/* Welcome Guide for new users */}
        {apps.length === 0 && <WelcomeGuide />}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Apps" value={apps.length} icon={<Layers className="w-5 h-5" />} tone="blue" delay={0} />
          <StatCard label="Active" value={active} icon={<CheckCircle className="w-5 h-5" />} tone="green" delay={0.05} />
          <StatCard label="Paused" value={paused} icon={<PauseCircle className="w-5 h-5" />} tone="yellow" delay={0.1} />
          <StatCard label="Active Sessions" value={activeSessions} icon={<Zap className="w-5 h-5" />} tone="green" delay={0.15} />
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT: Application Credentials */}
          <MotionCard delay={0.2} className="glass rounded-xl h-fit gradient-border">
            <div className="px-5 py-4 border-b border-edge/50 section-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-display tracking-wide">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                </div>
                Application Credentials
              </h3>
              {selected && (
                <span className={`badge ${selected.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                  <span className={`pulse-dot ${selected.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  {selected.status.toUpperCase()}
                </span>
              )}
            </div>

            {selected ? (
              <>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/[0.04] border border-accent/10">
                  <Sparkles className="w-3.5 h-3.5 text-accent/50" />
                  <p className="text-xs text-gray-400">Replace the placeholder code in the example with these credentials.</p>
                </div>

                <CopyField label="Application Name" value={selected.name} />
                <CopyField label="Owner ID" value={owner.id} mask />
                <CopyField label="App ID" value={selected.id} mask />
                <CopyField label="Application Secret" value={selected.secret} mask />
                <CopyField label="Admin Key (Bot)" value={selected.admin_key} mask />

                <div className="pt-1">
                  <p className="text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" />
                    Application Version
                  </p>
                  <div className="flex items-center gap-2">
                    <form action={updateVersion} className="flex items-center gap-2 flex-1">
                      <input type="hidden" name="app_id" value={selected.id} />
                      <code className="flex-1 bg-bg border border-edge/60 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono">
                        v{selected.version}
                      </code>
                      <input type="text" name="version" defaultValue={selected.version} className="w-16 bg-bg border border-edge/60 rounded-lg px-2 py-2 text-xs text-white font-mono focus:outline-none focus:border-accent transition-colors input-enhanced" />
                      <button type="submit" className="px-3 py-2 text-xs btn-gradient text-white rounded-lg font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">Update</button>
                    </form>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-edge/30 mt-3">
                  <form action={refreshSecret} className="pt-3">
                    <input type="hidden" name="app_id" value={selected.id} />
                    <ConfirmSubmit
                      message="Refresh the app secret? All clients using the old secret will stop working."
                      className="flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 bg-red-500/8 border border-red-500/25 rounded-lg hover:bg-red-500/15 hover:shadow-[0_0_12px_rgba(239,68,68,0.15)] transition-all font-semibold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh Application Secret
                    </ConfirmSubmit>
                  </form>
                  <form action={clearExpired} className="pt-3">
                    <input type="hidden" name="app_id" value={selected.id} />
                    <ConfirmSubmit
                      message="Auto-clear all expired users and used licenses?"
                      className="flex items-center gap-2 px-3.5 py-2 text-xs text-yellow-400 bg-yellow-500/8 border border-yellow-500/25 rounded-lg hover:bg-yellow-500/15 hover:shadow-[0_0_12px_rgba(234,179,8,0.15)] transition-all font-semibold"
                    >
                      <Clock className="w-3.5 h-3.5" /> Auto Clear Expired
                    </ConfirmSubmit>
                  </form>
                </div>

                <div className="p-3 bg-accent/5 border border-accent/15 rounded-xl flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <p className="text-xs text-accent/70 leading-relaxed pt-1">
                    Application secrets are sensitive credentials. Never share them publicly or commit them to version control.
                  </p>
                </div>
              </div>

              <CodeSnippet appName={selected.name} ownerId={owner.id} appVersion={selected.version} appId={selected.id} appSecret={selected.secret} />
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mx-auto mb-4 ring-1 ring-accent/20">
                  <LayoutDashboard className="w-8 h-8 text-accent/60" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Select an application to view its credentials.</p>
                <p className="text-xs text-gray-600 mt-1">Choose from the panel on the right</p>
              </div>
            )}
          </MotionCard>

          {/* RIGHT: My Applications */}
          <MotionCard delay={0.25} className="glass rounded-xl h-fit">
            <div className="px-5 py-4 border-b border-edge/50 section-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-display tracking-wide">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                  <LayoutDashboard className="w-3.5 h-3.5 text-accent" />
                </div>
                My Applications
              </h3>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">
                  <Sparkles className="w-3 h-3" />
                  {limits.label} Plan
                </span>
              </div>
            </div>

            {/* Create app */}
            <div className="p-4 border-b border-edge/30 bg-accent/[0.02]">
              {canCreate ? (
                <ActionForm action={createApp} resetOnSuccess celebrate className="flex gap-2">
                  <input
                    type="text"
                    name="name"
                    placeholder="Application name..."
                    required
                    className="flex-1 bg-bg border border-edge/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform hover:shadow-[0_0_20px_rgb(var(--rgb-accent)/0.2)]"
                  >
                    <Plus className="w-4 h-4" /> Create Application
                  </button>
                </ActionForm>
              ) : (
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-yellow-500/20">
                    <Crown className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-300 font-semibold">App Limit Reached</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {limits.label} plan allows {limits.maxApps} apps.{' '}
                      <a href="/shop" className="text-accent hover:underline">Upgrade your plan</a> to create more.
                    </p>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-600 mt-2">
                {apps.length}{limits.maxApps !== -1 ? ` / ${limits.maxApps}` : ''} applications · Names must be unique
              </p>
            </div>

            {/* App list */}
            <div className="p-4">
              {apps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mx-auto mb-4 ring-1 ring-accent/20">
                    <Plus className="w-8 h-8 text-accent/60" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No applications yet</p>
                  <p className="text-xs text-gray-600 mt-1">Create your first one above to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apps.map(app => (
                    <div
                      key={app.id}
                      className={`bg-bg/40 border rounded-xl p-4 transition-all duration-300 hover:bg-bg/60 group ${
                        selected?.id === app.id ? 'border-accent/40 ring-1 ring-accent/15 shadow-[0_0_20px_rgb(var(--rgb-accent)/0.1)] bg-accent/[0.03]' : 'border-edge/40 hover:border-accent/20 hover:shadow-[0_0_15px_rgb(var(--rgb-accent)/0.05)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            selected?.id === app.id ? 'bg-accent/15 text-accent ring-1 ring-accent/20' : 'bg-white/5 text-gray-400 ring-1 ring-edge/30 group-hover:ring-accent/15 group-hover:text-accent/60'
                          } transition-all`}>
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm font-display">{app.name}</p>
                          </div>
                          <span className={`badge ${app.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                            <span className={`pulse-dot ${app.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            {app.status === 'active' ? 'ACTIVE' : 'PAUSED'}
                          </span>
                        </div>
                      </div>

                      {/* App stats row */}
                      <div className="flex items-center gap-4 mb-3 flex-wrap">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/8 text-xs text-blue-400/80">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-blue-300 font-semibold">v{app.version}</span>
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/8 text-xs text-accent/80">
                          <Users className="w-3 h-3" />
                          <span className="text-accent font-semibold">{userCounts[app.id] || 0}</span> Users
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/8 text-xs text-green-400/80">
                          <span className="pulse-dot bg-green-400" />
                          <span className="text-green-400 font-semibold">Good</span>
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-edge/20">
                        <form action={selectApp} className="pt-2">
                          <input type="hidden" name="app_id" value={app.id} />
                          <button type="submit" className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            selected?.id === app.id
                              ? 'bg-green-600 text-white shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                              : 'btn-gradient text-white'
                          }`}>
                            {selected?.id === app.id ? (
                              <><CheckCircle className="w-3 h-3" /> Selected</>
                            ) : (
                              'Select'
                            )}
                          </button>
                        </form>

                        <details className="relative pt-2">
                          <summary className="list-none flex items-center gap-1.5 px-3 py-1.5 text-xs text-orange-300 bg-orange-500/10 border border-orange-500/25 rounded-lg hover:bg-orange-500/20 hover:shadow-[0_0_10px_rgba(251,146,60,0.1)] cursor-pointer transition-all font-semibold [&::-webkit-details-marker]:hidden">
                            <Edit3 className="w-3 h-3" /> Rename
                          </summary>
                          <ActionForm action={renameApp} className="absolute start-0 mt-1.5 z-10 glass-strong rounded-xl p-3 flex gap-2 shadow-2xl border border-edge/50">
                            <input type="hidden" name="app_id" value={app.id} />
                            <input type="text" name="name" defaultValue={app.name} required className="w-40 bg-bg border border-edge/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent input-enhanced" />
                            <button type="submit" className="px-3 py-1.5 text-xs btn-gradient text-white rounded-lg font-semibold">Save</button>
                          </ActionForm>
                        </details>

                        <form action={toggleAppStatus} className="pt-2">
                          <input type="hidden" name="app_id" value={app.id} />
                          <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/25 rounded-lg hover:bg-yellow-500/20 hover:shadow-[0_0_10px_rgba(234,179,8,0.1)] transition-all font-semibold">
                            <PauseCircle className="w-3 h-3" /> {app.status === 'active' ? 'Pause' : 'Resume'}
                          </button>
                        </form>

                        <form action={deleteApp} className="pt-2">
                          <input type="hidden" name="app_id" value={app.id} />
                          <ConfirmSubmit
                            message={`You are about to permanently delete "${app.name}". All users, licenses, sessions, and data will be lost forever.`}
                            confirmText={app.name}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg hover:bg-red-500/20 hover:shadow-[0_0_10px_rgba(239,68,68,0.1)] transition-all font-semibold"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </MotionCard>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={totalUsers} icon={<Users className="w-5 h-5" />} tone="blue" delay={0.3} />
          <StatCard label="HWID Locked" value={hwidLocked} icon={<Fingerprint className="w-5 h-5" />} tone="yellow" delay={0.35} />
          <StatCard label="Total Keys" value={totalKeys} icon={<Key className="w-5 h-5" />} tone="red" delay={0.4} />
          <StatCard label="Used Licenses" value={usedLicenses} icon={<Key className="w-5 h-5" />} tone="green" delay={0.45} />
        </div>

        {/* Activity Heatmap */}
        {apps.length > 0 && (
          <MotionCard delay={0.5} className="glass rounded-xl">
            <div className="px-5 py-4 border-b border-edge/50 section-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-display tracking-wide">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                </div>
                Activity Heatmap
              </h3>
              <span className="badge badge-accent">Last 6 months</span>
            </div>
            <div className="p-5 overflow-x-auto">
              <Heatmap data={heatmapData} />
            </div>
          </MotionCard>
        )}
      </main>
    </>
  );
}
