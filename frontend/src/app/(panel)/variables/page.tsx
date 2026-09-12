import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import PageInfo from '@/components/PageInfo';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { addVariable, deleteVariable } from './actions';
import { Variable, Plus, Trash2, Code2, LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VariablesPage() {
  const { owner, apps, selected } = await getPageData();

  let vars: Array<{ id: string; var_key: string; var_value: string; created_at: string }> = [];

  if (selected) {
    const r = await query(
      `SELECT id, var_key, var_value, created_at FROM app_variables WHERE app_id=$1 ORDER BY var_key ASC`,
      [selected.id]
    );
    vars = r.rows;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Variables" />
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
              icon={<Code2 className="w-4 h-4" />}
              title="App Variables"
              description="Store key-value pairs that your application can fetch at runtime via the API. Use variables for dynamic configuration like update URLs, announcements, version checks, or feature flags."
            />

            <MotionCard delay={0} className="glass rounded-xl gradient-border">
              <div className="px-5 py-4 border-b border-edge/50 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent" /> Add / Update Variable
                </h3>
              </div>
              <form action={addVariable} className="p-5 flex flex-wrap gap-3 items-end">
                <input type="hidden" name="app_id" value={selected.id} />
                <div className="min-w-[200px] flex-1">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" /> Key
                  </label>
                  <input type="text" name="key" required placeholder="variable_name" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono input-enhanced" />
                </div>
                <div className="min-w-[300px] flex-[2]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent/40" /> Value
                  </label>
                  <input type="text" name="value" placeholder="value..." className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Save
                </button>
              </form>
            </MotionCard>

            <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 section-header flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Variable className="w-4 h-4 text-accent" /> Variables
                  <span className="text-gray-500 font-normal">({vars.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table-enhanced">
                  <thead>
                    <tr>
                      {['Key', 'Value', 'Created', 'Actions'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vars.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                            <Variable className="w-6 h-6 text-accent/40" />
                          </div>
                          <p className="text-gray-500 text-sm">No variables yet</p>
                          <p className="text-gray-600 text-xs mt-1">Add a key-value pair above. Your app can fetch these at runtime.</p>
                        </td>
                      </tr>
                    ) : vars.map(v => (
                      <tr key={v.id}>
                        <td className="text-accent font-mono text-xs font-semibold">{v.var_key}</td>
                        <td className="text-white text-xs max-w-[400px] truncate">{v.var_value || <span className="text-gray-500 italic">empty</span>}</td>
                        <td className="text-gray-500 text-xs whitespace-nowrap">
                          {new Date(v.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <form action={deleteVariable}>
                            <input type="hidden" name="app_id" value={selected.id} />
                            <input type="hidden" name="var_id" value={v.id} />
                            <button type="submit" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
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
