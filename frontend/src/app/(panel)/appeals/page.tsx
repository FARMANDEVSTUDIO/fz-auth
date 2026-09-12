import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { approveAppeal, denyAppeal } from './actions';
import { MessageSquare, Check, X, LayoutDashboard, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AppealsPage() {
  const { owner, apps, selected } = await getPageData();

  if (!selected) {
    return (
      <>
        <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Ban Appeals" />
        <main className="flex-1 p-4 sm:p-6">
          <MotionCard className="glass rounded-xl p-10 text-center text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard className="w-7 h-7 text-accent/50" />
            </div>
            Select an application first.
          </MotionCard>
        </main>
      </>
    );
  }

  const res = await query(
    'SELECT id, username, reason, status, admin_response, created_at, resolved_at FROM ban_appeals WHERE app_id=$1 ORDER BY created_at DESC LIMIT 50',
    [selected.id]
  );
  const appeals = res.rows as Array<{
    id: string; username: string; reason: string; status: string;
    admin_response: string | null; created_at: string; resolved_at: string | null;
  }>;

  const pending = appeals.filter(a => a.status === 'pending');
  const resolved = appeals.filter(a => a.status !== 'pending');

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Ban Appeals" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {pending.length === 0 && resolved.length === 0 ? (
          <MotionCard className="glass rounded-xl p-10 text-center text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-accent/50" />
            </div>
            No ban appeals yet. Users can submit appeals at <code className="text-accent">/appeal</code>
          </MotionCard>
        ) : (
          <>
            {pending.length > 0 && (
              <MotionCard delay={0} className="glass rounded-xl overflow-hidden">
                <div className="px-5 py-4 section-header">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400" /> Pending Appeals
                    <span className="text-gray-500 font-normal">({pending.length})</span>
                  </h3>
                </div>
                <div className="divide-y divide-edge/30">
                  {pending.map(a => (
                    <div key={a.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white font-semibold text-sm">{a.username}</span>
                            <span className="badge badge-yellow">
                              PENDING
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{a.reason}</p>
                          <p className="text-[10px] text-gray-600">
                            {new Date(a.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <form action={approveAppeal}>
                            <input type="hidden" name="appeal_id" value={a.id} />
                            <input type="hidden" name="app_id" value={selected.id} />
                            <input type="hidden" name="username" value={a.username} />
                            <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors font-semibold">
                              <Check className="w-3.5 h-3.5" /> Unban
                            </button>
                          </form>
                          <form action={denyAppeal}>
                            <input type="hidden" name="appeal_id" value={a.id} />
                            <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors font-semibold">
                              <X className="w-3.5 h-3.5" /> Deny
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </MotionCard>
            )}

            {resolved.length > 0 && (
              <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
                <div className="px-5 py-4 section-header">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" /> Resolved Appeals
                    <span className="text-gray-500 font-normal">({resolved.length})</span>
                  </h3>
                </div>
                <div className="divide-y divide-edge/30">
                  {resolved.map(a => (
                    <div key={a.id} className="p-5 opacity-60">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">{a.username}</span>
                        <span className={`badge ${
                          a.status === 'approved' ? 'badge-green' : 'badge-red'
                        }`}>
                          {a.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{a.reason}</p>
                    </div>
                  ))}
                </div>
              </MotionCard>
            )}
          </>
        )}
      </main>
    </>
  );
}
