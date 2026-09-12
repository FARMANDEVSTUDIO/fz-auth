import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import StatCard from '@/components/StatCard';
import UsersClient from './UsersClient';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import PageInfo from '@/components/PageInfo';
import ExportButton from '@/components/ExportButton';
import { LayoutDashboard, Users, UserCheck, UserX, Fingerprint } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const { owner, apps, selected } = await getPageData();

  let users: any[] = [];
  let stats = { total: 0, active: 0, banned: 0, hwid: 0 };

  if (selected) {
    const r = await query(
      `SELECT username, hwid, hwid_locked, expiry, banned, suspended, ban_reason, last_login, created_at
       FROM users WHERE app_id=$1 ORDER BY created_at DESC LIMIT 200`,
      [selected.id]
    );
    users = r.rows;
    stats.total = users.length;
    stats.active = users.filter(u => !u.banned && (!u.expiry || new Date(u.expiry) > new Date())).length;
    stats.banned = users.filter(u => u.banned).length;
    stats.hwid = users.filter(u => u.hwid).length;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Users" />
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
                icon={<Users className="w-4 h-4" />}
                title="User Management"
                description="View and manage all registered users. You can ban/unban users, reset their HWID, extend their subscription time, or delete accounts. Use search and filters to find specific users."
              />
              <ExportButton appId={selected.id} type="users" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.total} icon={<Users className="w-5 h-5" />} tone="blue" delay={0} />
              <StatCard label="Active" value={stats.active} icon={<UserCheck className="w-5 h-5" />} tone="green" delay={0.1} />
              <StatCard label="Banned" value={stats.banned} icon={<UserX className="w-5 h-5" />} tone="red" delay={0.2} />
              <StatCard label="HWID Locked" value={stats.hwid} icon={<Fingerprint className="w-5 h-5" />} tone="yellow" delay={0.3} />
            </div>

            <UsersClient users={users} appId={selected.id} />
          </>
        )}
      </main>
    </>
  );
}
