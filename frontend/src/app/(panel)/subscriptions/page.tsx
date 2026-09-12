import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import LockedFeature from '@/components/LockedFeature';
import { getPageData } from '@/lib/page-data';
import { getOwnerPlan } from '@/lib/plans';
import { query } from '@/lib/db';
import { addSubscription, deleteSubscription } from './actions';
import { CreditCard, Plus, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function humanize(s: number): string {
  if (s >= 315360000) return 'Lifetime';
  if (s >= 31536000) return `${Math.floor(s / 31536000)}y`;
  if (s >= 86400) return `${Math.floor(s / 86400)}d`;
  if (s >= 3600) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 60)}m`;
}

export default async function SubscriptionsPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);

  if (plan === 'free') {
    return (
      <>
        <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Subscriptions" />
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <LockedFeature feature="Subscriptions" />
        </main>
      </>
    );
  }

  let subs: Array<{ id: string; name: string; level: number; duration_seconds: number; price_credits: number; created_at: string }> = [];

  if (selected) {
    const r = await query(
      `SELECT id, name, level, duration_seconds, price_credits, created_at FROM subscriptions WHERE app_id=$1 ORDER BY level ASC`,
      [selected.id]
    );
    subs = r.rows;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Subscriptions" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {!selected ? (
          <div className="glass rounded-xl p-10 text-center text-gray-500">Select an application first.</div>
        ) : (
          <>
            <MotionCard delay={0} className="glass rounded-xl">
              <div className="px-5 py-4 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent" /> Add Subscription Tier
                </h3>
                <p className="text-xs text-gray-500 mt-1">Define subscription levels users can purchase with credits or license keys.</p>
              </div>
              <form action={addSubscription} className="p-5 flex flex-wrap gap-3 items-end">
                <input type="hidden" name="app_id" value={selected.id} />
                <div className="min-w-[150px] flex-1">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Name</label>
                  <input type="text" name="name" required placeholder="Basic" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <div className="w-[100px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Level</label>
                  <input type="number" name="level" defaultValue="1" min={1} className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <div className="w-[130px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Duration</label>
                  <input type="text" name="duration" defaultValue="30d" placeholder="30d, 1y, lifetime" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <div className="w-[120px]">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Price (credits)</label>
                  <input type="number" name="price" defaultValue="0" min={0} className="w-full bg-bg border border-edge rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors" />
                </div>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>
            </MotionCard>

            <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent" /> Subscription Tiers
                  <span className="text-gray-500 font-normal">({subs.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge/50 bg-white/[0.02]">
                      {['Name', 'Level', 'Duration', 'Price', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subs.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No subscription tiers yet</td></tr>
                    ) : subs.map(s => (
                      <tr key={s.id} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-white font-semibold">{s.name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent/15 text-accent">
                            Level {s.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{humanize(s.duration_seconds)}</td>
                        <td className="px-4 py-3 text-yellow-400 text-xs font-semibold">{s.price_credits} credits</td>
                        <td className="px-4 py-3">
                          <form action={deleteSubscription}>
                            <input type="hidden" name="app_id" value={selected.id} />
                            <input type="hidden" name="sub_id" value={s.id} />
                            <button type="submit" className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
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
