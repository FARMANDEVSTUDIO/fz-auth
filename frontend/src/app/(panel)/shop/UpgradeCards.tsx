'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, CreditCard, Check, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  key: 'pro' | 'enterprise';
  name: string;
  price: string;
  credits: string;
  features: PlanFeature[];
}

const UPGRADE_PLANS: Plan[] = [
  {
    key: 'pro',
    name: 'Pro',
    price: '$9.99/mo',
    credits: '500 credits',
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
    key: 'enterprise',
    name: 'Enterprise',
    price: '$29.99/mo',
    credits: '5,000 credits',
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

export default function UpgradeCards({ stripeEnabled }: { stripeEnabled: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(planKey: string) {
    if (!stripeEnabled) return;
    setLoading(planKey);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {UPGRADE_PLANS.map((plan, i) => {
        const isEnterprise = plan.key === 'enterprise';
        return (
          <motion.div
            key={plan.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`glass rounded-xl overflow-hidden ${isEnterprise ? 'ring-1 ring-accent/50 glow-accent' : ''}`}
          >
            <div className={`px-5 py-5 border-b border-edge/50 ${isEnterprise ? 'bg-accent/5' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                {isEnterprise ? (
                  <Crown className="w-4 h-4 text-accent" />
                ) : (
                  <Sparkles className="w-4 h-4 text-accent" />
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                {!stripeEnabled && (
                  <span className="ms-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                    COMING SOON
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-accent">{plan.price}</p>
              <p className="text-xs text-gray-500 mt-1">{plan.credits}/month</p>
            </div>
            <div className="p-5">
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li
                    key={f.text}
                    className={`flex items-center gap-2.5 text-sm ${
                      f.included ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {f.included ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>

              {stripeEnabled ? (
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading !== null}
                  className={`flex items-center justify-center gap-2 w-full mt-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEnterprise
                      ? 'btn-gradient text-white glow-accent'
                      : 'border border-edge text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {loading === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {loading === plan.key ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold border border-edge text-gray-500 cursor-default"
                >
                  Coming Soon
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
