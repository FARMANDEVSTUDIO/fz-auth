import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { BarChart3, Users, Key, Activity, TrendingUp, LayoutDashboard, UserCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { owner, apps, selected } = await getPageData();

  if (!selected) {
    return (
      <>
        <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Analytics" />
        <main className="flex-1 p-4 sm:p-6">
          <MotionCard className="glass rounded-xl p-10 text-center text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard className="w-7 h-7 text-accent/50" />
            </div>
            Create an application first on the{' '}
            <a href="/dashboard" className="text-accent hover:underline">Manage Apps</a> page.
          </MotionCard>
        </main>
      </>
    );
  }

  const [loginsRes, registersRes, licensesRes, totalUsersRes, totalKeysRes, bannedRes] = await Promise.all([
    query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS c
       FROM logs WHERE app_id=$1 AND action='login' AND created_at > NOW() - INTERVAL '14 days'
       GROUP BY DATE(created_at) ORDER BY day`,
      [selected.id]
    ),
    query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS c
       FROM logs WHERE app_id=$1 AND action='register' AND created_at > NOW() - INTERVAL '14 days'
       GROUP BY DATE(created_at) ORDER BY day`,
      [selected.id]
    ),
    query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS c
       FROM licenses WHERE app_id=$1 AND used=true AND created_at > NOW() - INTERVAL '14 days'
       GROUP BY DATE(created_at) ORDER BY day`,
      [selected.id]
    ),
    query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1', [selected.id]),
    query('SELECT COUNT(*)::int AS c FROM licenses WHERE app_id=$1', [selected.id]),
    query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1 AND banned=true', [selected.id]),
  ]);

  const days14: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days14.push(d.toISOString().slice(0, 10));
  }

  const toMap = (rows: any[]) => Object.fromEntries(
    rows.map((r: { day: string; c: number }) => [new Date(r.day).toISOString().slice(0, 10), r.c])
  );

  const loginMap = toMap(loginsRes.rows);
  const registerMap = toMap(registersRes.rows);
  const licenseMap = toMap(licensesRes.rows);

  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const loginData = days14.map(d => ({ label: fmt(d), value: loginMap[d] || 0 }));
  const registerData = days14.map(d => ({ label: fmt(d), value: registerMap[d] || 0 }));
  const licenseData = days14.map(d => ({ label: fmt(d), value: licenseMap[d] || 0 }));

  const totalLogins = loginData.reduce((a, b) => a + b.value, 0);
  const totalRegisters = registerData.reduce((a, b) => a + b.value, 0);
  const totalLicenseUses = licenseData.reduce((a, b) => a + b.value, 0);

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Analytics" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={totalUsersRes.rows[0].c} icon={<Users className="w-5 h-5" />} tone="blue" delay={0} />
          <StatCard label="Total Keys" value={totalKeysRes.rows[0].c} icon={<Key className="w-5 h-5" />} tone="green" delay={0.05} />
          <StatCard label="Banned" value={bannedRes.rows[0].c} icon={<UserCheck className="w-5 h-5" />} tone="red" delay={0.1} />
          <StatCard label="14d Logins" value={totalLogins} icon={<TrendingUp className="w-5 h-5" />} tone="yellow" delay={0.15} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MotionCard delay={0.2} className="glass rounded-xl">
            <div className="px-5 py-4 section-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Logins
              </h3>
              <span className="text-[10px] text-gray-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full text-emerald-400">{totalLogins} total · 14 days</span>
            </div>
            <div className="p-5">
              <BarChart data={loginData} color="bg-emerald-500/70" />
            </div>
          </MotionCard>

          <MotionCard delay={0.25} className="glass rounded-xl">
            <div className="px-5 py-4 section-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" /> Registrations
              </h3>
              <span className="text-[10px] text-gray-500 font-medium bg-accent/10 px-2 py-0.5 rounded-full text-accent">{totalRegisters} total · 14 days</span>
            </div>
            <div className="p-5">
              <BarChart data={registerData} color="bg-accent/70" />
            </div>
          </MotionCard>
        </div>

        <MotionCard delay={0.3} className="glass rounded-xl">
          <div className="px-5 py-4 section-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> License Activations
            </h3>
            <span className="text-[10px] text-gray-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full text-amber-400">{totalLicenseUses} total · 14 days</span>
          </div>
          <div className="p-5">
            <BarChart data={licenseData} color="bg-amber-500/70" />
          </div>
        </MotionCard>
      </main>
    </>
  );
}
