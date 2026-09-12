import Topbar from '@/components/Topbar';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import { requireOwner } from '@/lib/session';
import { getAppsForOwner, getSelectedApp } from '@/lib/apps';
import { query } from '@/lib/db';
import { banUser, unbanUser, resetHwid, addTime, deleteUser } from './actions';

export const dynamic = 'force-dynamic';

interface UserRow {
  username: string;
  hwid: string | null;
  expiry: string | null;
  banned: boolean;
  ban_reason: string | null;
  last_login: string | null;
  created_at: string;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function UsersPage() {
  const owner = await requireOwner();
  const apps = await getAppsForOwner(owner.id);
  const selected = await getSelectedApp(owner.id);

  let users: UserRow[] = [];
  if (selected) {
    const r = await query(
      `SELECT username, hwid, expiry, banned, ban_reason, last_login, created_at
       FROM users WHERE app_id=$1 ORDER BY created_at DESC LIMIT 200`,
      [selected.id]
    );
    users = r.rows;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Users" />

      <main className="flex-1 p-6">
        {!selected ? (
          <div className="bg-card border border-edge rounded-xl p-10 text-center text-gray-500">
            <i className="ri-apps-2-line text-3xl mb-3 block" />
            Create an application first on the{' '}
            <a href="/dashboard" className="text-accent hover:underline">Manage Apps</a> page.
          </div>
        ) : (
          <div className="bg-card border border-edge rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-edge">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <i className="ri-group-line text-accent" /> Users
                <span className="text-gray-500 font-normal">({users.length})</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge bg-[#101014]">
                    {['Username', 'Status', 'HWID', 'Expiry', 'Last Login', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500 italic">No users yet</td></tr>
                  ) : users.map(u => {
                    const expired = u.expiry && new Date(u.expiry) < new Date();
                    return (
                      <tr key={u.username} className="border-b border-edge hover:bg-card2 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                        <td className="px-4 py-3">
                          {u.banned ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/15 text-red-500" title={u.ban_reason || ''}>BANNED</span>
                          ) : expired ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/15 text-yellow-500">EXPIRED</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-500">ACTIVE</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-[130px] truncate" title={u.hwid || ''}>
                          {u.hwid || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(u.expiry)}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(u.last_login)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {u.banned ? (
                              <form action={unbanUser}>
                                <input type="hidden" name="app_id" value={selected.id} />
                                <input type="hidden" name="username" value={u.username} />
                                <button type="submit" className="px-2 py-1 text-[11px] text-green-500 border border-green-500/30 rounded-md hover:bg-green-500/10 transition-colors">
                                  Unban
                                </button>
                              </form>
                            ) : (
                              <details className="relative">
                                <summary className="list-none px-2 py-1 text-[11px] text-yellow-500 border border-yellow-500/30 rounded-md hover:bg-yellow-500/10 cursor-pointer transition-colors [&::-webkit-details-marker]:hidden">
                                  Ban
                                </summary>
                                <form action={banUser} className="absolute right-0 mt-1.5 z-10 bg-card border border-edge rounded-lg p-2 flex gap-1.5 shadow-xl">
                                  <input type="hidden" name="app_id" value={selected.id} />
                                  <input type="hidden" name="username" value={u.username} />
                                  <input type="text" name="reason" placeholder="Reason..."
                                    className="w-36 bg-[#0b0b0d] border border-edge rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent" />
                                  <button type="submit" className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Ban</button>
                                </form>
                              </details>
                            )}

                            <form action={resetHwid}>
                              <input type="hidden" name="app_id" value={selected.id} />
                              <input type="hidden" name="username" value={u.username} />
                              <button type="submit" className="px-2 py-1 text-[11px] text-gray-300 border border-edge rounded-md hover:bg-card transition-colors">
                                Reset HWID
                              </button>
                            </form>

                            <details className="relative">
                              <summary className="list-none px-2 py-1 text-[11px] text-accent border border-accent/30 rounded-md hover:bg-accent/10 cursor-pointer transition-colors [&::-webkit-details-marker]:hidden">
                                Add Time
                              </summary>
                              <form action={addTime} className="absolute right-0 mt-1.5 z-10 bg-card border border-edge rounded-lg p-2 flex gap-1.5 shadow-xl">
                                <input type="hidden" name="app_id" value={selected.id} />
                                <input type="hidden" name="username" value={u.username} />
                                <input type="text" name="duration" defaultValue="30d" placeholder="30d, 1y..."
                                  className="w-28 bg-[#0b0b0d] border border-edge rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent" />
                                <button type="submit" className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent2">Add</button>
                              </form>
                            </details>

                            <form action={deleteUser}>
                              <input type="hidden" name="app_id" value={selected.id} />
                              <input type="hidden" name="username" value={u.username} />
                              <ConfirmSubmit
                                message={`Delete user "${u.username}"? This cannot be undone.`}
                                className="px-2 py-1 text-[11px] text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors"
                              >
                                Delete
                              </ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
