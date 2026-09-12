'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CreditCard, Wallet, Smartphone, Bitcoin, Loader2, ArrowRight, Shield,
  Check, Crown, Sparkles, Clock, X, ChevronRight,
} from 'lucide-react';

interface Props {
  providers: string[];
  currentPlan: string;
  planExpiresAt: string | null;
}

type PlanKey = 'pro' | 'enterprise';

const PLANS: { key: PlanKey; name: string; usd: number; pkr: number; icon: typeof Crown; features: string[] }[] = [
  {
    key: 'pro',
    name: 'Pro',
    usd: 9.99,
    pkr: 2800,
    icon: Sparkles,
    features: ['5 Applications', '500 Users/App', 'Webhooks & Teams', 'File Hosting'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    usd: 29.99,
    pkr: 8400,
    icon: Crown,
    features: ['Unlimited Apps', 'Unlimited Users', 'Custom Branding', 'Everything in Pro'],
  },
];

const PROVIDERS = [
  {
    id: 'stripe',
    name: 'Visa / Mastercard',
    icon: CreditCard,
    color: 'from-blue-600 to-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    textColor: 'text-blue-400',
    currency: 'USD',
    badge: null,
  },
  {
    id: 'binance',
    name: 'Binance Pay',
    icon: Bitcoin,
    color: 'from-yellow-500 to-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    textColor: 'text-yellow-400',
    currency: 'USDT',
    badge: 'Crypto',
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    icon: Smartphone,
    color: 'from-green-600 to-green-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
    textColor: 'text-green-400',
    currency: 'PKR',
    badge: 'Pakistan',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: Wallet,
    color: 'from-red-600 to-red-500',
    bgColor: 'bg-red-500/10 border-red-500/30',
    textColor: 'text-red-400',
    currency: 'PKR',
    badge: 'Pakistan',
  },
];

export default function PaymentCheckout({ providers, currentPlan, planExpiresAt }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableProviders = PROVIDERS.filter(p => providers.includes(p.id));
  const hasAnyProvider = availableProviders.length > 0;

  const expiry = planExpiresAt ? new Date(planExpiresAt) : null;
  const isActive = expiry && expiry.getTime() > Date.now();
  const daysLeft = isActive ? Math.ceil((expiry!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  async function handlePayment() {
    if (!selectedPlan || !selectedProvider) return;
    setLoading(true);

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, plan: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Payment failed');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const selectedPlanInfo = PLANS.find(p => p.key === selectedPlan);
  const selectedProviderInfo = PROVIDERS.find(p => p.id === selectedProvider);

  function getPrice(plan: typeof PLANS[0], provider: typeof PROVIDERS[0]) {
    return provider.currency === 'PKR'
      ? `Rs. ${plan.pkr.toLocaleString()}`
      : `$${plan.usd}`;
  }

  return (
    <div className="space-y-6">
      {/* Active Plan Banner */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-green-500/30 bg-green-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-400">
                {currentPlan === 'pro' ? 'Pro' : 'Enterprise'} Plan Active
              </p>
              <p className="text-xs text-gray-400">
                Expires {expiry!.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}{daysLeft} days left
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 1: Choose Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">1</div>
          <h3 className="text-sm font-semibold text-white">Choose Plan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.key;
            const isCurrent = currentPlan === plan.key && isActive;
            const Icon = plan.icon;

            return (
              <motion.button
                key={plan.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => { setSelectedPlan(plan.key); setSelectedProvider(null); }}
                className={`relative text-start glass rounded-xl p-5 transition-all border ${
                  isSelected
                    ? 'border-accent/60 ring-1 ring-accent/30 bg-accent/5'
                    : 'border-edge/50 hover:border-edge'
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 end-3 px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                    ACTIVE
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-gray-500'}`} />
                  <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-accent">${plan.usd}</span>
                  <span className="text-xs text-gray-500">/ month</span>
                  <span className="text-xs text-gray-600 ms-2">or Rs. {plan.pkr.toLocaleString()}</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isSelected && (
                  <motion.div
                    layoutId="plan-check"
                    className="absolute top-3 start-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Step 2: Payment Method */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">2</div>
              <h3 className="text-sm font-semibold text-white">Payment Method</h3>
            </div>

            {!hasAnyProvider ? (
              <div className="glass rounded-xl p-6 text-center border border-yellow-500/30 bg-yellow-500/5">
                <Wallet className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                <p className="text-sm font-semibold text-yellow-300 mb-1">Payment Methods Coming Soon</p>
                <p className="text-xs text-gray-500">
                  No payment provider is configured yet. Contact admin to set up Stripe, Binance Pay, JazzCash, or EasyPaisa.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableProviders.map((provider) => {
                  const isSelected = selectedProvider === provider.id;
                  const Icon = provider.icon;
                  const price = selectedPlanInfo ? getPrice(selectedPlanInfo, provider) : '';

                  return (
                    <motion.button
                      key={provider.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`relative text-start rounded-xl p-4 transition-all border ${
                        isSelected
                          ? `${provider.bgColor} ring-1 ring-current`
                          : 'glass border-edge/50 hover:border-edge'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${isSelected ? provider.textColor : 'text-white'}`}>
                              {provider.name}
                            </h4>
                            {provider.badge && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-white/5 text-gray-500 border border-edge/30">
                                {provider.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{price} · {provider.currency}</p>
                        </div>
                        {isSelected && (
                          <div className={`w-5 h-5 rounded-full ${provider.textColor} bg-current/20 flex items-center justify-center`}>
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3: Confirm & Pay */}
      <AnimatePresence>
        {selectedPlan && selectedProvider && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">3</div>
              <h3 className="text-sm font-semibold text-white">Confirm & Pay</h3>
            </div>

            <div className="glass rounded-xl overflow-hidden border border-accent/30">
              <div className="p-5 border-b border-edge/50 bg-accent/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">
                      FZ AUTH {selectedPlanInfo?.name} Plan
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> 30 days access
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xl font-bold text-accent">
                      {selectedPlanInfo && selectedProviderInfo
                        ? getPrice(selectedPlanInfo, selectedProviderInfo)
                        : ''}
                    </p>
                    <p className="text-[10px] text-gray-500">{selectedProviderInfo?.currency}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Payment via</span>
                  <span className={`font-semibold ${selectedProviderInfo?.textColor}`}>
                    {selectedProviderInfo?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Plan</span>
                  <span className="text-white font-semibold">{selectedPlanInfo?.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-white font-semibold">1 Month</span>
                </div>

                <div className="pt-3 flex items-center gap-2 text-[10px] text-gray-600">
                  <Shield className="w-3 h-3 flex-shrink-0" />
                  Secure payment. You will be redirected to {selectedProviderInfo?.name} to complete.
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed btn-gradient text-white glow-accent flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay {selectedPlanInfo && selectedProviderInfo ? getPrice(selectedPlanInfo, selectedProviderInfo) : ''}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No payment method selected yet - show all available */}
      {!selectedPlan && hasAnyProvider && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl p-5 border border-edge/50"
        >
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Accepted Payment Methods</h4>
          <div className="flex flex-wrap gap-3">
            {availableProviders.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg/50 border border-edge/30">
                  <div className={`w-6 h-6 rounded bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">{p.name}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
