import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import LockedFeature from '@/components/LockedFeature';
import { getPageData } from '@/lib/page-data';
import { getOwnerPlan } from '@/lib/plans';
import { getWebhookLogs } from '@/lib/webhooks';
import { retryWebhook } from './actions';
import { Webhook, RotateCcw, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WebhookLogsPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);

  if (plan === 'free') {
    return (
      <>
        <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Webhook Logs" />
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <LockedFeature feature="Webhook Logs" />
        </main>
      </>
    );
  }

  let logs: Awaited<ReturnType<typeof getWebhookLogs>> = [];
  if (selected) {
    logs = await getWebhookLogs(selected.id, 50);
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Webhook Logs" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {!selected ? (
          <div className="glass rounded-xl p-10 text-center text-gray-500">Select an application first.</div>
        ) : (
          <>
            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Link
                href="/webhooks"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-edge text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Webhook className="w-3.5 h-3.5" /> Webhooks
              </Link>
              <span className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Delivery Logs
              </span>
            </div>

            <MotionCard delay={0} className="glass rounded-xl overflow-hidden">
              <div className="px-5 py-4 section-header">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-accent" /> Delivery Logs
                  <span className="text-gray-500 font-normal">({logs.length})</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">Recent webhook delivery attempts for this application.</p>
              </div>
              {logs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic text-sm">No webhook deliveries yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-enhanced">
                    <thead>
                      <tr>
                        {['Status', 'Event', 'URL', 'Code', 'Duration', 'Time', 'Actions'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td className="px-4 py-3">
                            {log.success ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-accent/10 text-accent">
                              {log.event}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs font-mono max-w-[200px] truncate" title={log.webhook_url}>
                            {log.webhook_url}
                          </td>
                          <td className="px-4 py-3">
                            {log.status_code ? (
                              <span className={`badge ${
                                log.status_code >= 200 && log.status_code < 300
                                  ? 'badge-green'
                                  : 'badge-red'
                              }`}>
                                {log.status_code}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-600" title={log.error_message || undefined}>
                                {log.error_message ? 'ERR' : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {log.duration_ms}ms
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}{' '}
                            {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            {!log.success && (
                              <form action={retryWebhook}>
                                <input type="hidden" name="log_id" value={log.id} />
                                <button
                                  type="submit"
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-accent bg-accent/10 border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors font-semibold"
                                  title="Retry this webhook"
                                >
                                  <RotateCcw className="w-3 h-3" /> Retry
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </MotionCard>

            {/* Error Details for failed webhooks */}
            {logs.some(l => !l.success && l.error_message) && (
              <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden border border-red-500/20">
                <div className="px-5 py-4 border-b border-red-500/20">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" /> Recent Errors
                  </h3>
                </div>
                <div className="divide-y divide-edge/30">
                  {logs.filter(l => !l.success && l.error_message).slice(0, 10).map(log => (
                    <div key={log.id} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500/10 text-red-400">{log.event}</span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-red-400/80 font-mono">{log.error_message}</p>
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
