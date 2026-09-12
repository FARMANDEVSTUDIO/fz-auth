import Topbar from '@/components/Topbar';
import StatCard from '@/components/StatCard';
import CopyField from '@/components/CopyField';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import { requireOwner } from '@/lib/session';
import { getAppsForOwner, getSelectedApp } from '@/lib/apps';
import { query } from '@/lib/db';
import { createApp, renameApp, toggleAppStatus, deleteApp, refreshSecret, selectApp } from '../actions';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const owner = await requireOwner();
  const apps = await getAppsForOwner(owner.id);
  const selected = await getSelectedApp(owner.id);

  const active = apps.filter(a => a.status === 'active').length;
  const paused = apps.length - active;

  let activeSessions = 0;
  let userCounts: Record<string, number> = {};
  if (apps.length > 0) {
    const ids = apps.map(a => a.id);
    const s = await query(
      'SELECT COUNT(*)::int AS c FROM sessions WHERE app_id = ANY($1) AND expires_at > now()',
      [ids]
    );
    activeSessions = s.rows[0].c;
    const u = await query(
      'SELECT app_id, COUNT(*)::int AS c FROM users WHERE app_id = ANY($1) GROUP BY app_id',
      [ids]
    );
    userCounts = Object.fromEntries(u.rows.map((r: { app_id: string; c: number }) => [r.app_id, r.c]));
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Manage Apps" />

      <main className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Apps" value={apps.length} icon="ri-apps-2-fill" tone="blue" />
          <StatCard label="Active" value={active} icon="ri-checkbox-circle-fill" tone="green" />
          <StatCard label="Paused" value={paused} icon="ri-pause-circle-fill" tone="yellow" />
          <StatCard label="Active Sessions" value={activeSessions} icon="ri-flashlight-fill" tone="blue" />
        </div>

        {/* Application credentials */}
        {selected && (
          <div className="bg-card border border-edge rounded-xl">
            <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <i className="ri-shield-keyhole-line text-accent" /> Application Credentials
              </h3>
              <form action={refreshSecret}>
                <input type="hidden" name="app_id" value={selected.id} />
                <ConfirmSubmit
                  message="Refresh the app secret? Clients shipped with the old secret will fail signature verification."
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 border border-edge rounded-lg hover:bg-card2 hover:text-white transition-colors"
                >
                  <i className="ri-refresh-line" /> Refresh Secret
                </ConfirmSubmit>
              </form>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <CopyField label="App Name" value={selected.name} />
              <CopyField label="Owner ID" value={owner.id} />
              <CopyField label="App ID" value={selected.id} />
              <CopyField label="App Secret" value={selected.secret} mask />
              <CopyField label="App Version" value={selected.version} />
            </div>
          </div>
        )}

        {/* My applications */}
        <div className="bg-card border border-edge rounded-xl">
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <i className="ri-apps-2-line text-accent" /> My Applications
            </h3>
          </div>

          {/* Create app */}
          <div className="px-5 py-4 border-b border-edge">
            <form action={createApp} className="flex gap-3">
              <input
                type="text"
                name="name"
                placeholder="New application name..."
                required
                className="flex-1 max-w-sm bg-[#0b0b0d] border border-edge rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent2 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <i className="ri-add-line" /> Create Application
              </button>
            </form>
          </div>

          {/* App cards */}
          <div className="p-5">
            {apps.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-8">
                No applications yet — create your first one above.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {apps.map(app => (
                  <div
                    key={app.id}
                    className={`bg-card2 border rounded-xl p-4 ${
                      selected?.id === app.id ? 'border-accent/60' : 'border-edge'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{app.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          v{app.version} · {userCounts[app.id] || 0} users
                        </p>
                      </div>
                      {app.status === 'active' ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-500">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/15 text-yellow-500">
                          PAUSED
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <form action={selectApp}>
                        <input type="hidden" name="app_id" value={app.id} />
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 text-xs text-accent border border-accent/40 rounded-lg hover:bg-accent/10 transition-colors"
                        >
                          Select
                        </button>
                      </form>

                      <details className="relative">
                        <summary className="list-none px-2.5 py-1.5 text-xs text-gray-300 border border-edge rounded-lg hover:bg-card cursor-pointer transition-colors [&::-webkit-details-marker]:hidden">
                          Rename
                        </summary>
                        <form
                          action={renameApp}
                          className="absolute left-0 mt-1.5 z-10 bg-card border border-edge rounded-lg p-2 flex gap-1.5 shadow-xl"
                        >
                          <input type="hidden" name="app_id" value={app.id} />
                          <input
                            type="text"
                            name="name"
                            defaultValue={app.name}
                            required
                            className="w-36 bg-[#0b0b0d] border border-edge rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent"
                          />
                          <button type="submit" className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent2">
                            Save
                          </button>
                        </form>
                      </details>

                      <form action={toggleAppStatus}>
                        <input type="hidden" name="app_id" value={app.id} />
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 text-xs text-gray-300 border border-edge rounded-lg hover:bg-card transition-colors"
                        >
                          {app.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                      </form>

                      <form action={deleteApp}>
                        <input type="hidden" name="app_id" value={app.id} />
                        <ConfirmSubmit
                          message={`Delete "${app.name}"? All its users, keys and sessions will be permanently removed.`}
                          className="px-2.5 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
