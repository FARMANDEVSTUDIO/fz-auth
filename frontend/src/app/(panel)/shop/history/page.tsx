import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import StatCard from '@/components/StatCard';
import { getPageData } from '@/lib/page-data';
import { query } from '@/lib/db';
import { getOwnerPlan, getPlanExpiry, PLAN_LIMITS } from '@/lib/plans';
import Link from 'next/link';
import {
  Receipt, CreditCard, Wallet, Smartphone, Bitcoin, Clock,
  CheckCircle, XCircle, Loader2, ArrowLeft, Crown, TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const PROVIDER_INFO: Record<string, { label: string; icon: typeof CreditCard; color: string }> = {
  stripe: { label: 'Visa/Mastercard', icon: CreditCard, color: 'text-blue-400' },
  jazzcash: { label: 'JazzCash', icon: Wallet, color: 'text-red-400' },
  easypaisa: { label: 'EasyPaisa', icon: Smartphone, color: 'text-green-400' },
  binance: { label: 'Binance Pay', icon: Bitcoin, color: 'text-yellow-400' },
  credits: { label: 'Credits', icon: Crown, color: 'text-accent' },
};

const STATUS_STYLES: Record<string, { label: string; style: string; icon: typeof CheckCircle }> = {
  completed: { label: 'Completed', style: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle },
  pending: { label: 'Pending', style: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: Loader2 },
  failed: { label: 'Failed', style: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
};

export default async function PaymentHistoryPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);
  const expiry = getPlanExpiry(owner);

  const txRes = await query(
    `SELECT id, provider, plan, amount, currency, status, created_at, completed_at
     FROM payment_transactions
     WHERE owner_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [owner.id]
  );
  const transactions = txRes.rows;

  const completedCount = transactions.filter((t: any) => t.status === 'completed').length;
  const totalSpent = transactions
    .filter((t: any) => t.status === 'completed' && t.currency === 'USD')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
  const totalSpentPKR = transactions
    .filter((t: any) => t.status === 'completed' && t.currency === 'PKR')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Payment History" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/shop" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Current Plan" value={PLAN_LIMITS[plan].label} icon={<Crown className="w-5 h-5" />} tone="yellow" delay={0} />
          <StatCard label="Total Payments" value={completedCount} icon={<Receipt className="w-5 h-5" />} tone="blue" delay={0.05} />
          <StatCard label="Spent (USD)" value={`$${totalSpent.toFixed(2)}`} icon={<TrendingUp className="w-5 h-5" />} tone="green" delay={0.1} />
          <StatCard label="Spent (PKR)" value={totalSpentPKR > 0 ? `Rs.${totalSpentPKR.toLocaleString()}` : '—'} icon={<TrendingUp className="w-5 h-5" />} tone="red" delay={0.15} />
        </div>

        <MotionCard delay={0.2} className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge/50 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-accent" /> Payment History
            </h3>
            <p className="text-xs text-gray-500 mt-1">All your payment transactions.</p>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-7 h-7 text-accent/50" />
              </div>
              <p className="text-sm text-gray-500">No payments yet</p>
              <Link href="/shop" className="text-xs text-accent hover:underline mt-2 inline-block">
                Go to Shop to upgrade your plan
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-enhanced">
                <thead>
                  <tr className="border-b border-edge/50 bg-white/[0.02]">
                    {['Date', 'Provider', 'Plan', 'Amount', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => {
                    const provider = PROVIDER_INFO[tx.provider] || PROVIDER_INFO.stripe;
                    const status = STATUS_STYLES[tx.status] || STATUS_STYLES.pending;
                    const ProviderIcon = provider.icon;
                    const StatusIcon = status.icon;

                    return (
                      <tr key={tx.id} className="border-b border-edge/30 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-600" />
                            {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' '}
                            {new Date(tx.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ProviderIcon className={`w-4 h-4 ${provider.color}`} />
                            <span className="text-xs text-gray-300">{provider.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent/15 text-accent border border-accent/30">
                            {tx.plan === 'enterprise' ? 'ENTERPRISE' : 'PRO'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-semibold text-xs">
                          {tx.currency === 'PKR' ? `Rs. ${parseFloat(tx.amount).toLocaleString()}` :
                           tx.currency === 'USDT' ? `${tx.amount} USDT` :
                           `$${parseFloat(tx.amount).toFixed(2)}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${status.style}`}>
                            <StatusIcon className={`w-3 h-3 ${tx.status === 'pending' ? 'animate-spin' : ''}`} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </MotionCard>
      </main>
    </>
  );
}
