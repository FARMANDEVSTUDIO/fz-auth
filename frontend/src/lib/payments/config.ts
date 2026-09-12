export const PAYMENT_PLANS = {
  pro: {
    name: 'Pro',
    usd: 9.99,
    pkr: 2800,
    duration_days: 30,
  },
  enterprise: {
    name: 'Enterprise',
    usd: 29.99,
    pkr: 8400,
    duration_days: 30,
  },
} as const;

export type PaymentPlan = keyof typeof PAYMENT_PLANS;

export type PaymentProvider = 'stripe' | 'jazzcash' | 'easypaisa' | 'binance';

export interface PaymentResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  txnId?: string;
}

export function isProviderConfigured(provider: PaymentProvider): boolean {
  switch (provider) {
    case 'stripe':
      return !!process.env.STRIPE_SECRET_KEY;
    case 'jazzcash':
      return !!(process.env.JAZZCASH_MERCHANT_ID && process.env.JAZZCASH_PASSWORD && process.env.JAZZCASH_SALT);
    case 'easypaisa':
      return !!(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY);
    case 'binance':
      return !!(process.env.BINANCE_PAY_API_KEY && process.env.BINANCE_PAY_SECRET_KEY);
    default:
      return false;
  }
}

export function getConfiguredProviders(): PaymentProvider[] {
  const all: PaymentProvider[] = ['stripe', 'jazzcash', 'easypaisa', 'binance'];
  return all.filter(isProviderConfigured);
}
