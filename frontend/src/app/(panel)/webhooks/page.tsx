import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import LockedFeature from '@/components/LockedFeature';
import CopyButton from '@/components/CopyButton';
import { getPageData } from '@/lib/page-data';
import { getOwnerPlan } from '@/lib/plans';
import { query } from '@/lib/db';
import { addWebhook, toggleWebhook, deleteWebhook } from './actions';
import { Webhook, Plus, Trash2, Pause, Play, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WebhooksPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);

  if (plan === 'free') {
    return (
      <>
        <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Webhooks" />
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <LockedFeature feature="Webhooks" />
        </main>
      </>
    );
  }

  let hooks: Array<{ id: string; url: string; events: string[]; secret: string; active: boolean; created_at: string }> = [];

  if (selected) {
    const r = await query(
      `SELECT id, url, events, secret, active, created_at FROM webhooks WHERE app_id=$1 ORDER BY created_at DESC`,
      [selected.id]
    );
    hooks = r.rows;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Webhooks" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {!selected ? (
          <div className="glass rounded-xl p-10 text-center text-gray-500">Select an application first.</div>
        ) : (
          <>
            {/* Navigation */}
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center gap-2">
                <Webhook className="w-3.5 h-3.5" /> Webhooks
              </span>
              <Link
                href="/webhooks/logs"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-edge text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Clock className="w-3.5 h-3.5" /> Delivery Logs
              </Link>
            </div>

            <MotionCard delay={0} className="glass rounded-xl">
              <div className="px-5 py-4 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent" /> Add Webhook
                </h3>
                <p className="text-xs text-gray-500 mt-1">Receive HTTP POST notifications when events occur in your app.</p>
              </div>
              <form action={addWebhook} className="p-5 flex flex-wrap gap-3 items-end">
                <input type="hidden" name="app_id" value={selected.id} />
                <div className="flex-[2] min-w-[250px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Endpoint URL</label>
                  <input type="url" name="url" required placeholder="https://example.com/webhook" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Events (comma-separated)</label>
                  <input type="text" name="events" placeholder="login,register,license,ban" className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced" />
                </div>
                <button type="submit" className="flex items-center gap-2 px-5 py-2 btn-gradient text-white rounded-xl text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>
            </MotionCard>

            <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-accent" /> Webhooks
                  <span className="text-gray-500 font-normal">({hooks.length})</span>
                </h3>
              </div>
              {hooks.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic text-sm">No webhooks configured</div>
              ) : (
                <div className="divide-y divide-edge/30">
                  {hooks.map(h => (
                    <div key={h.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${h.active ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <p className="text-sm text-white font-mono truncate">{h.url}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {(h.events || []).map(ev => (
                              <span key={ev} className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent/10 text-accent">{ev}</span>
                            ))}
                            {(!h.events || h.events.length === 0) && <span className="text-[10px] text-gray-500">All events</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-gray-500">Secret:</span>
                            <span className="text-[10px] text-gray-400 font-mono">{h.secret.slice(0, 8)}...</span>
                            <CopyButton value={h.secret} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <form action={toggleWebhook}>
                            <input type="hidden" name="app_id" value={selected.id} />
                            <input type="hidden" name="webhook_id" value={h.id} />
                            <button type="submit" className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title={h.active ? 'Pause' : 'Resume'}>
                              {h.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                          </form>
                          <form action={deleteWebhook}>
                            <input type="hidden" name="app_id" value={selected.id} />
                            <input type="hidden" name="webhook_id" value={h.id} />
                            <button type="submit" className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </MotionCard>
          </>
        )}
      </main>
    </>
  );
}
