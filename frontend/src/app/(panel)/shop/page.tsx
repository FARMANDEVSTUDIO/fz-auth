import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import StatCard from '@/components/StatCard';
import { getPageData } from '@/lib/page-data';
import { getOwnerPlan, getPlanExpiry, PLAN_LIMITS } from '@/lib/plans';
import { getConfiguredProviders } from '@/lib/payments/config';
import BuyWithCredits from './BuyWithCredits';
import PaymentCheckout from './PaymentCheckout';
import PaymentToast from './PaymentToast';
import Link from 'next/link';
import { Coins, ShoppingBag, Sparkles, Crown, Zap, Check, Lock, CreditCard, Clock, Receipt } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PLANS = [
  {
    key: 'free' as const,
    name: 'Starter',
    price: 'Free',
    features: [
      { text: '1 Application', included: true },
      { text: '50 Users per App', included: true },
      { text: 'Basic Support', included: true },
      { text: 'Community Discord', included: true },
      { text: 'Team Members', included: false },
      { text: 'Webhooks', included: false },
      { text: 'File Hosting', included: false },
    ],
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '$9.99',
    priceLabel: '/month',
    features: [
      { text: '5 Applications', included: true },
      { text: '500 Users per App', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Custom Messages', included: true },
      { text: 'Webhooks', included: true },
      { text: 'Team Members', included: true },
      { text: 'File Hosting', included: true },
      { text: 'Subscriptions', included: true },
    ],
  },
  {
    key: 'enterprise' as const,
    name: 'Enterprise',
    price: '$29.99',
    priceLabel: '/month',
    features: [
      { text: 'Unlimited Applications', included: true },
      { text: 'Unlimited Users', included: true },
      { text: '24/7 Support', included: true },
      { text: 'Custom Branding', included: true },
      { text: 'API Access', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'SLA Guarantee', included: true },
      { text: 'Everything in Pro', included: true },
    ],
  },
];

export default async function ShopPage() {
  const { owner, apps, selected } = await getPageData();
  const currentPlan = getOwnerPlan(owner);
  const expiry = getPlanExpiry(owner);
  const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const providers = getConfiguredProviders();

  return (
    <>
      <PaymentToast />
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Shop" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Current Plan" value={PLAN_LIMITS[currentPlan].label} icon={<Crown className="w-5 h-5" />} tone="yellow" delay={0} />
          <StatCard label="Your Credits" value={owner.credits} icon={<Coins className="w-5 h-5" />} tone="green" delay={0.05} />
          <StatCard label="Applications" value={`${apps.length} / ${PLAN_LIMITS[currentPlan].maxApps === -1 ? '∞' : PLAN_LIMITS[currentPlan].maxApps}`} icon={<Zap className="w-5 h-5" />} tone="blue" delay={0.1} />
          <StatCard label="Days Left" value={currentPlan === 'free' ? '—' : daysLeft} icon={<Clock className="w-5 h-5" />} tone="red" delay={0.15} />
        </div>

        <div className="flex justify-end">
          <Link href="/shop/history" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-accent transition-colors">
            <Receipt className="w-3.5 h-3.5" /> Payment History
          </Link>
        </div>

        {/* Plan Comparison */}
        <MotionCard delay={0.1} className="glass rounded-xl">
          <div className="px-5 py-4 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-accent" /> Plans & Pricing
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Plans are monthly. Pay with Visa/Mastercard, Binance, EasyPaisa, JazzCash, or spend earned credits.
            </p>
          </div>
        </MotionCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => {
            const isCurrent = plan.key === currentPlan;
            const isHighlight = plan.key === 'pro';
            return (
              <MotionCard
                key={plan.name}
                delay={0.15 * (i + 1)}
                className={`glass rounded-xl overflow-hidden ${isHighlight ? 'gradient-border glow-accent' : ''}`}
              >
                <div className={`px-5 py-5 border-b border-edge/50 relative overflow-hidden ${isHighlight ? 'bg-accent/5' : ''}`}>
                  {isHighlight && <Sparkles className="absolute top-3 end-3 w-4 h-4 text-accent/30 animate-pulse" />}
                  <div className="flex items-center gap-2 mb-2">
                    {isHighlight ? <Crown className="w-4 h-4 text-accent" /> : <Sparkles className="w-4 h-4 text-gray-500" />}
                    <h3 className="text-lg font-bold text-white font-display">{plan.name}</h3>
                    {isCurrent && (
                      <span className="ms-auto badge badge-green">
                        <span className="pulse-dot bg-green-400" /> CURRENT
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-bold text-accent font-display">{plan.price}</p>
                    {'priceLabel' in plan && (
                      <span className="text-xs text-gray-500">{(plan as any).priceLabel}</span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <ul className="space-y-3">
                    {plan.features.map(f => (
                      <li key={f.text} className={`flex items-center gap-2.5 text-sm ${f.included ? 'text-gray-300' : 'text-gray-600'}`}>
                        {f.included ? (
                          <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-500/10 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-3 h-3 text-gray-600" />
                          </div>
                        )}
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold border border-green-500/25 text-green-400 text-center bg-green-500/5">
                      {currentPlan === 'free' ? 'Current Plan' : `Active · ${daysLeft}d left`}
                    </div>
                  ) : (
                    <a
                      href="#pay"
                      className={`block text-center w-full mt-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isHighlight
                          ? 'btn-gradient text-white'
                          : 'border border-edge/60 text-gray-300 hover:bg-white/5 hover:text-white hover:border-accent/30'
                      }`}
                    >
                      Upgrade Now
                    </a>
                  )}
                </div>
              </MotionCard>
            );
          })}
        </div>

        {/* Real Payment Section */}
        <div id="pay">
          <MotionCard delay={0.5} className="glass rounded-xl">
            <div className="px-5 py-4 section-header">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-accent" /> Pay with Real Money
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Choose a plan and payment method. Supports Visa/Mastercard, Binance, EasyPaisa, and JazzCash.
              </p>
            </div>
          </MotionCard>
        </div>

        <PaymentCheckout
          providers={providers}
          currentPlan={currentPlan}
          planExpiresAt={owner.plan_expires_at || null}
        />

        {/* Credits Section */}
        <MotionCard delay={0.6} className="glass rounded-xl">
          <div className="px-5 py-4 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" /> Pay with Credits
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Spend earned credits instead. 1,000 credits = Pro (1 month), 10,000 credits = Enterprise (1 month).
            </p>
          </div>
        </MotionCard>

        <BuyWithCredits
          credits={owner.credits}
          currentPlan={currentPlan}
          planExpiresAt={owner.plan_expires_at || null}
        />
      </main>
    </>
  );
}
