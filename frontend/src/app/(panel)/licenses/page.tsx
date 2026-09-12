import Topbar from '@/components/Topbar';
import StatCard from '@/components/StatCard';
import MotionCard from '@/components/MotionCard';
import LicensesClient from './LicensesClient';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { generateKeys } from './actions';
import PageInfo from '@/components/PageInfo';
import ActionForm from '@/components/ActionForm';
import ExportButton from '@/components/ExportButton';
import { KeyRound, PlusCircle, LayoutDashboard, Key, CheckCircle, XCircle, Sparkles } from 'lucide-react';

const KEY_DURATIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' },
  { value: '3d', label: '3 Days' },
  { value: '1w', label: '1 Week' },
  { value: '30d', label: '1 Month' },
  { value: '90d', label: '3 Months' },
  { value: '180d', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: 'lifetime', label: 'Lifetime' },
];

export const dynamic = 'force-dynamic';

export default async function LicensesPage() {
  const { owner, apps, selected } = await getPageData();

  let licenses: any[] = [];
  let stats = { total: 0, unused: 0, used: 0, expired: 0 };

  if (selected) {
    const r = await query(
      `SELECT l.license_key, l.duration_seconds, l.level, l.used, l.expires_at, l.created_at,
              u.username AS used_by_name
       FROM licenses l
       LEFT JOIN users u ON u.id = l.used_by
       WHERE l.app_id = $1
       ORDER BY l.created_at DESC
       LIMIT 200`,
      [selected.id]
    );
    licenses = r.rows;
    stats.total = licenses.length;
    stats.unused = licenses.filter(l => !l.used).length;
    stats.used = licenses.filter(l => l.used && !(l.expires_at && new Date(l.expires_at) < new Date())).length;
    stats.expired = licenses.filter(l => l.used && l.expires_at && new Date(l.expires_at) < new Date()).length;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Licenses" />
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
                icon={<Key className="w-4 h-4" />}
                title="License Keys"
                description="Generate license keys and give them to your users. Users enter a key during registration to activate their account. Set duration (30d, 1y, lifetime) and level to control access."
              />
              <ExportButton appId={selected.id} type="licenses" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Keys" value={stats.total} icon={<Key className="w-5 h-5" />} tone="blue" delay={0} />
              <StatCard label="Unused" value={stats.unused} icon={<CheckCircle className="w-5 h-5" />} tone="green" delay={0.1} />
              <StatCard label="Used" value={stats.used} icon={<KeyRound className="w-5 h-5" />} tone="yellow" delay={0.2} />
              <StatCard label="Expired" value={stats.expired} icon={<XCircle className="w-5 h-5" />} tone="red" delay={0.3} />
            </div>

            {/* Generate keys */}
            <MotionCard delay={0.15} className="glass rounded-xl gradient-border">
              <div className="px-5 py-4 border-b border-edge/50 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-accent" /> Generate Keys
                  <Sparkles className="w-3 h-3 text-accent/50" />
                </h3>
              </div>
              <ActionForm action={generateKeys} className="p-5 flex flex-wrap gap-3 items-end" celebrate>
                <input type="hidden" name="app_id" value={selected.id} />
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" />
                    Amount
                  </label>
                  <input type="number" name="amount" min={1} max={100} defaultValue={1}
                    className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" />
                    Duration
                  </label>
                  <select name="duration" defaultValue="30d"
                    className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent cursor-pointer input-enhanced">
                    {KEY_DURATIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" />
                    Level
                  </label>
                  <input type="number" name="level" min={1} defaultValue={1}
                    className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" />
                    Prefix (optional)
                  </label>
                  <input type="text" name="prefix" placeholder="FZ"
                    className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <button type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold">
                  <KeyRound className="w-4 h-4" /> Generate
                </button>
              </ActionForm>
            </MotionCard>

            <LicensesClient licenses={licenses} appId={selected.id} />
          </>
        )}
      </main>
    </>
  );
}
