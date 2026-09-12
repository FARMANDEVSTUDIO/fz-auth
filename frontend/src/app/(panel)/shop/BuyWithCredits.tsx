'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Crown, Sparkles, Loader2, Clock, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { purchasePlan } from './actions';

interface Props {
  credits: number;
  currentPlan: string;
  planExpiresAt: string | null;
}

const CREDIT_PLANS = [
  {
    key: 'pro' as const,
    name: 'Pro',
    cost: 1000,
    duration: '1 Month',
    icon: Sparkles,
    features: ['5 Applications', '500 Users per App', 'Webhooks & Team', 'File Hosting'],
  },
  {
    key: 'enterprise' as const,
    name: 'Enterprise',
    cost: 10000,
    duration: '1 Month',
    icon: Crown,
    features: ['Unlimited Apps', 'Unlimited Users', 'Custom Branding', 'Everything in Pro'],
  },
];

export default function BuyWithCredits({ credits, currentPlan, planExpiresAt }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleBuy(planKey: string) {
    setLoading(planKey);
    try {
      const res = await purchasePlan(planKey);
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  const expiryDate = planExpiresAt ? new Date(planExpiresAt) : null;
  const isActive = expiryDate && expiryDate.getTime() > Date.now();

  return (
    <div className="space-y-4">
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-green-500/30 bg-green-500/5"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-400">
                {currentPlan === 'pro' ? 'Pro' : 'Enterprise'} Plan Active
              </p>
              <p className="text-xs text-gray-400">
                Expires: {expiryDate!.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}
                {Math.ceil((expiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CREDIT_PLANS.map((plan, i) => {
          const canAfford = credits >= plan.cost;
          const isCurrentPlan = currentPlan === plan.key;
          const Icon = plan.icon;
          const isEnterprise = plan.key === 'enterprise';

          return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={`glass rounded-xl overflow-hidden ${isEnterprise ? 'ring-1 ring-accent/50 glow-accent' : ''}`}
            >
              <div className={`px-5 py-5 border-b border-edge/50 ${isEnterprise ? 'bg-accent/5' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-accent" />
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {isCurrentPlan && isActive && (
                    <span className="ms-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-accent">{plan.cost.toLocaleString()}</p>
                  <span className="text-sm text-gray-500">credits</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3 inline me-1" />
                  {plan.duration} access
                </p>
              </div>
              <div className="p-5">
                <ul className="space-y-2.5 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mb-4 p-2.5 bg-bg/50 border border-edge/50 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-gray-500">Your credits:</span>
                  <span className={`text-sm font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    {credits.toLocaleString()}
                  </span>
                </div>

                {isCurrentPlan && isActive ? (
                  <button
                    onClick={() => handleBuy(plan.key)}
                    disabled={!canAfford || loading !== null}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === plan.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    Extend 1 Month
                  </button>
                ) : canAfford ? (
                  <button
                    onClick={() => handleBuy(plan.key)}
                    disabled={loading !== null}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
                      isEnterprise
                        ? 'btn-gradient text-white glow-accent'
                        : 'border border-accent/50 text-accent hover:bg-accent/10'
                    }`}
                  >
                    {loading === plan.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Coins className="w-4 h-4" />
                    )}
                    Buy with {plan.cost.toLocaleString()} Credits
                  </button>
                ) : (
                  <a
                    href="/earn"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-edge text-gray-500 hover:bg-white/5 transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    Need {(plan.cost - credits).toLocaleString()} more credits
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
