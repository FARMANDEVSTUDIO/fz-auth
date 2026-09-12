import { redirect } from 'next/navigation';
import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import { getPageData } from '@/lib/page-data';
import { isMasterAdmin } from '@/lib/plans';
import { getIpRules } from '@/lib/ip-rules';
import { addIpRuleAction, deleteIpRuleAction } from './actions';
import { ShieldAlert, Plus, Trash2, ShieldCheck, ShieldBan, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function IpRulesPage() {
  const { owner, apps, selected } = await getPageData();

  if (!isMasterAdmin(owner.email)) redirect('/dashboard');

  const rules = await getIpRules();
  const allowRules = rules.filter(r => r.type === 'allow');
  const blockRules = rules.filter(r => r.type === 'block');

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="IP Rules" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {/* Warning banner */}
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-semibold">Admin IP Rules</p>
            <p className="text-xs text-gray-400">
              Manage IP whitelist and blacklist rules for all API routes.
              If any whitelist rules exist, only whitelisted IPs can access the API. Blacklist rules always take priority.
            </p>
          </div>
        </div>

        {/* Add Rule Form */}
        <MotionCard delay={0} className="glass rounded-xl gradient-border">
          <div className="px-5 py-4 border-b border-edge/50 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent" /> Add IP Rule
            </h3>
          </div>
          <form action={addIpRuleAction} className="p-5 flex flex-wrap gap-3 items-end">
            <div className="min-w-[120px]">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Type</label>
              <select
                name="type"
                required
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors appearance-none input-enhanced"
              >
                <option value="block">Block</option>
                <option value="allow">Allow</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />IP / CIDR</label>
              <input
                type="text"
                name="value"
                required
                placeholder="192.168.1.0/24 or 1.2.3.4"
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Reason (optional)</label>
              <input
                type="text"
                name="reason"
                placeholder="VPN abuse, etc."
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5"><span className="w-1 h-1 rounded-full bg-accent/40" />Expires in (hours)</label>
              <input
                type="number"
                name="expires_in"
                min="1"
                placeholder="Permanent"
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors input-enhanced"
              />
            </div>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </form>
        </MotionCard>

        {/* Block Rules */}
        <MotionCard delay={0.1} className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge/50 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldBan className="w-4 h-4 text-red-400" /> Blocked IPs
              <span className="text-gray-500 font-normal">({blockRules.length})</span>
            </h3>
          </div>
          {blockRules.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <ShieldBan className="w-7 h-7 text-red-400/50" />
              </div>
              <p className="text-sm text-gray-500">No blocked IPs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-enhanced">
                <thead>
                  <tr className="border-b border-edge/50 bg-white/[0.02]">
                    {['IP / CIDR', 'Reason', 'Expires', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blockRules.map(rule => (
                    <tr key={rule.id} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-red-400 text-xs font-mono">{rule.value}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{rule.reason || '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {rule.expires_at ? (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(rule.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                            {new Date(rule.expires_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-gray-600">Permanent</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(rule.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <form action={deleteIpRuleAction}>
                          <input type="hidden" name="rule_id" value={rule.id} />
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
          )}
        </MotionCard>

        {/* Allow Rules */}
        <MotionCard delay={0.2} className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge/50 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" /> Whitelisted IPs
              <span className="text-gray-500 font-normal">({allowRules.length})</span>
            </h3>
            {allowRules.length > 0 && (
              <p className="text-[10px] text-yellow-400/80 mt-1">Whitelist is active — only these IPs can access API routes.</p>
            )}
          </div>
          {allowRules.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7 text-green-400/50" />
              </div>
              <p className="text-sm text-gray-500">No whitelist rules — all non-blocked IPs are allowed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-enhanced">
                <thead>
                  <tr className="border-b border-edge/50 bg-white/[0.02]">
                    {['IP / CIDR', 'Reason', 'Expires', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allowRules.map(rule => (
                    <tr key={rule.id} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-green-400 text-xs font-mono">{rule.value}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{rule.reason || '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {rule.expires_at ? (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(rule.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                            {new Date(rule.expires_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-gray-600">Permanent</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(rule.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <form action={deleteIpRuleAction}>
                          <input type="hidden" name="rule_id" value={rule.id} />
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
          )}
        </MotionCard>
      </main>
    </>
  );
}
