import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import PageInfo from '@/components/PageInfo';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { addBlacklist, removeBlacklist } from './actions';
import { ShieldCheck, Plus, Trash2, Ban, LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
  const { owner, apps, selected } = await getPageData();

  let entries: Array<{ id: string; type: string; value: string; reason: string | null; created_at: string }> = [];

  if (selected) {
    const r = await query(
      `SELECT id, type, value, reason, created_at FROM blacklist WHERE app_id=$1 ORDER BY created_at DESC`,
      [selected.id]
    );
    entries = r.rows;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Blacklist" />
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
            <PageInfo
              icon={<Ban className="w-4 h-4" />}
              title="Blacklist Management"
              description="Block specific HWIDs or IP addresses from accessing your application. Blacklisted entries will be rejected on login, register, and license requests."
            />

            <MotionCard delay={0} className="glass rounded-xl gradient-border">
              <div className="px-5 py-4 border-b border-edge/50 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent" /> Add Blacklist Entry
                </h3>
              </div>
              <form action={addBlacklist} className="p-5 flex flex-wrap gap-3 items-end">
                <input type="hidden" name="app_id" value={selected.id} />
                <div className="min-w-[120px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" /> Type
                  </label>
                  <select name="type" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent cursor-pointer input-enhanced">
                    <option value="hwid">HWID</option>
                    <option value="ip">IP</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" /> Value
                  </label>
                  <input type="text" name="value" required placeholder="HWID or IP address..." className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" /> Reason (optional)
                  </label>
                  <input type="text" name="reason" placeholder="Reason..." className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>
            </MotionCard>

            <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 section-header flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent" /> Blacklist Entries
                  <span className="text-gray-500 font-normal">({entries.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table-enhanced">
                  <thead>
                    <tr>
                      {['Type', 'Value', 'Reason', 'Added', 'Actions'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                            <ShieldCheck className="w-6 h-6 text-accent/40" />
                          </div>
                          <p className="text-gray-500 text-sm">No blacklist entries</p>
                          <p className="text-gray-600 text-xs mt-1">Add an HWID or IP address above to block it from your app.</p>
                        </td>
                      </tr>
                    ) : entries.map(e => (
                      <tr key={e.id}>
                        <td>
                          <span className={`badge ${e.type === 'ip' ? 'badge-yellow' : 'badge-red'}`}>
                            {e.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-white font-mono text-xs">{e.value}</td>
                        <td className="text-gray-400 text-xs">{e.reason || '—'}</td>
                        <td className="text-gray-500 text-xs whitespace-nowrap">
                          {new Date(e.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <form action={removeBlacklist}>
                            <input type="hidden" name="app_id" value={selected.id} />
                            <input type="hidden" name="entry_id" value={e.id} />
                            <button type="submit" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </form>
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
