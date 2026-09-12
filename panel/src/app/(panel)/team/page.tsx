import Topbar from '@/components/Topbar';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import DiscordLinkPanel from '@/components/DiscordLinkPanel';
import { requireOwner } from '@/lib/session';
import { getAppsForOwner, getSelectedApp } from '@/lib/apps';
import { getTeamMembers, getDiscordLink } from '@/lib/team';
import { ROLE_LABELS } from '@/lib/permissions';
import { inviteMember, changeRole, removeMember } from './actions';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const owner = await requireOwner();
  const apps = await getAppsForOwner(owner.id);
  const selected = await getSelectedApp(owner.id);
  const discordId = await getDiscordLink(owner.id);

  let members: Awaited<ReturnType<typeof getTeamMembers>> = [];
  if (selected) {
    members = await getTeamMembers(selected.id);
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Team" />

      <main className="flex-1 p-6 space-y-6">
        {!selected ? (
          <div className="bg-card border border-edge rounded-xl p-10 text-center text-gray-500">
            <i className="ri-apps-2-line text-3xl mb-3 block" />
            Create an application first on the{' '}
            <a href="/dashboard" className="text-accent hover:underline">Manage Apps</a> page.
          </div>
        ) : (
          <>
            {/* Discord Link */}
            <DiscordLinkPanel discordId={discordId} />

            {/* Invite member */}
            {selected.owner_id === owner.id && (
              <div className="bg-card border border-edge rounded-xl">
                <div className="px-5 py-4 border-b border-edge">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <i className="ri-user-add-line text-accent" /> Invite Member
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Add someone to your app team. They must have signed into FZ KeyAuth at least once.
                  </p>
                </div>
                <form action={inviteMember} className="p-5 flex flex-wrap gap-3 items-end">
                  <input type="hidden" name="app_id" value={selected.id} />
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="member@example.com"
                      className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="min-w-[140px]">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Role</label>
                    <select
                      name="role"
                      defaultValue="staff"
                      className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="reseller">Reseller</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent2 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <i className="ri-user-add-line" /> Invite
                  </button>
                </form>
              </div>
            )}

            {/* Members table */}
            <div className="bg-card border border-edge rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-edge">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <i className="ri-team-line text-accent" /> Team Members
                  <span className="text-gray-500 font-normal">({members.length + 1})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge bg-[#101014]">
                      {['Member', 'Role', 'Discord', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Owner row */}
                    <tr className="border-b border-edge bg-accent/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {owner.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent/15 text-accent">OWNER</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                        {discordId || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">—</td>
                      <td className="px-4 py-3 text-gray-600 text-xs italic">—</td>
                    </tr>

                    {members.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No team members yet</td></tr>
                    ) : members.map(m => {
                      const roleBadge: Record<string, string> = {
                        admin: 'bg-yellow-500/15 text-yellow-500',
                        reseller: 'bg-green-500/15 text-green-500',
                        staff: 'bg-gray-500/15 text-gray-400',
                      };
                      return (
                        <tr key={m.id} className="border-b border-edge hover:bg-card2 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {m.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
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
                                <form action={changeRole} className="absolute left-0 mt-1.5 z-10 bg-card border border-edge rounded-lg p-2 flex gap-1.5 shadow-xl">
                                  <input type="hidden" name="app_id" value={selected.id} />
                                  <input type="hidden" name="account_id" value={m.account_id} />
                                  <select
                                    name="role"
                                    defaultValue={m.role}
                                    className="bg-[#0b0b0d] border border-edge rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="reseller">Reseller</option>
                                    <option value="staff">Staff</option>
                                  </select>
                                  <button type="submit" className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent2">Save</button>
                                </form>
                              </details>
                            ) : (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${roleBadge[m.role] || roleBadge.staff}`}>
                                {(ROLE_LABELS[m.role] || m.role).toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                            {m.discord_id || '—'}
                          </td>
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
                                  className="px-2 py-1 text-[11px] text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors"
                                >
                                  Remove
                                </ConfirmSubmit>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
