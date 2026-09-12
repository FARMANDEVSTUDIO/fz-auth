import Topbar from '@/components/Topbar';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import DiscordLinkPanel from '@/components/DiscordLinkPanel';
import MotionCard from '@/components/MotionCard';
import LockedFeature from '@/components/LockedFeature';
import { getPageData } from '@/lib/page-data';
import { getOwnerPlan } from '@/lib/plans';
import { query } from '@/lib/db';
import { inviteMember, changeRole, removeMember, generateLinkCode, unlinkDiscord } from './actions';
import { UserPlus, Users, Crown, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', reseller: 'Reseller', staff: 'Staff',
};

const roleBadge: Record<string, string> = {
  owner: 'bg-accent/15 text-accent',
  admin: 'bg-yellow-500/15 text-yellow-500',
  reseller: 'bg-green-500/15 text-green-500',
  staff: 'bg-gray-500/15 text-gray-400',
};

export default async function TeamPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);

  if (plan === 'free') {
    return (
      <>
        <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Team" />
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <LockedFeature feature="Team Members" />
        </main>
      </>
    );
  }

  const discordRow = await query('SELECT discord_id FROM discord_links WHERE account_id=$1 LIMIT 1', [owner.id]);
  const discordId = discordRow.rows[0]?.discord_id || null;

  let members: Array<{
    id: string; account_id: string; role: string; email: string;
    name: string | null; avatar_url: string | null; discord_id: string | null; created_at: string;
  }> = [];

  if (selected) {
    const r = await query(
      `SELECT m.id, m.account_id, m.role, m.created_at,
              o.email, o.name, o.avatar_url,
              d.discord_id
       FROM app_members m
       JOIN owners o ON o.id = m.account_id
       LEFT JOIN discord_links d ON d.account_id = m.account_id
       WHERE m.app_id = $1
       ORDER BY m.created_at ASC`,
      [selected.id]
    );
    members = r.rows;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Team" />

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {!selected ? (
          <MotionCard className="glass rounded-xl p-10 text-center text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-accent/50" />
            </div>
            Create an application first on the{' '}
            <a href="/dashboard" className="text-accent hover:underline">Manage Apps</a> page.
          </MotionCard>
        ) : (
          <>
            <DiscordLinkPanel
              discordId={discordId}
              generateAction={generateLinkCode}
              unlinkAction={unlinkDiscord}
            />

            {selected.owner_id === owner.id && (
              <MotionCard delay={0.1} className="glass rounded-xl gradient-border">
                <div className="px-5 py-4 border-b border-edge/50 section-header">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-accent" /> Invite Member
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Add someone to your app team. They must have signed into FZ AUTH at least once.
                  </p>
                </div>
                <form action={inviteMember} className="p-5 flex flex-wrap gap-3 items-end">
                  <input type="hidden" name="app_id" value={selected.id} />
                  <div className="flex-1 min-w-[200px]">
                    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="member@example.com"
                      className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
                    />
                  </div>
                  <div className="min-w-[140px]">
                    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Role</label>
                    <select
                      name="role"
                      defaultValue="staff"
                      className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent cursor-pointer input-enhanced"
                    >
                      <option value="admin">Admin</option>
                      <option value="reseller">Reseller</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <UserPlus className="w-4 h-4" /> Invite
                  </button>
                </form>
              </MotionCard>
            )}

            <MotionCard delay={0.2} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-edge/50 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> Team Members
                  <span className="text-gray-500 font-normal">({members.length + 1})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table-enhanced">
                  <thead>
                    <tr className="border-b border-edge/50 bg-white/[0.02]">
                      {['Member', 'Role', 'Discord', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-edge/30 bg-accent/[0.03]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {owner.avatar_url ? (
                            <img src={owner.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
                              {(owner.name || owner.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">{owner.name || '—'}</p>
                            <p className="text-xs text-gray-500">{owner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent/15 text-accent flex items-center gap-1 w-fit">
                          <Crown className="w-3 h-3" /> OWNER
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{discordId || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">—</td>
                      <td className="px-4 py-3 text-gray-600 text-xs italic">—</td>
                    </tr>

                    {members.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No team members yet</td></tr>
                    ) : members.map(m => (
                      <tr key={m.id} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {m.avatar_url ? (
                              <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-card2 text-gray-400 flex items-center justify-center text-xs font-bold">
                                {(m.name || m.email)[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium">{m.name || '—'}</p>
                              <p className="text-xs text-gray-500">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {selected.owner_id === owner.id ? (
                            <details className="relative">
                              <summary className={`list-none px-2 py-0.5 text-[10px] font-bold rounded-full cursor-pointer [&::-webkit-details-marker]:hidden ${roleBadge[m.role] || roleBadge.staff}`}>
                                {(ROLE_LABELS[m.role] || m.role).toUpperCase()}
                              </summary>
                              <form action={changeRole} className="absolute start-0 mt-1.5 z-10 glass-strong rounded-lg p-2 flex gap-1.5 shadow-xl">
                                <input type="hidden" name="app_id" value={selected.id} />
                                <input type="hidden" name="account_id" value={m.account_id} />
                                <select
                                  name="role"
                                  defaultValue={m.role}
                                  className="bg-bg border border-edge rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-accent"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="reseller">Reseller</option>
                                  <option value="staff">Staff</option>
                                </select>
                                <button type="submit" className="px-2 py-1 text-xs bg-accent text-white rounded-lg hover:bg-accent2">Save</button>
                              </form>
                            </details>
                          ) : (
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${roleBadge[m.role] || roleBadge.staff}`}>
                              {(ROLE_LABELS[m.role] || m.role).toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">{m.discord_id || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          {selected.owner_id === owner.id && (
                            <form action={removeMember}>
                              <input type="hidden" name="app_id" value={selected.id} />
                              <input type="hidden" name="account_id" value={m.account_id} />
                              <ConfirmSubmit
                                message={`Remove ${m.name || m.email} from the team?`}
                                className="px-2 py-1 text-[11px] text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                              >
                                Remove
                              </ConfirmSubmit>
                            </form>
                          )}
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
