import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOwnerByEmail } from '@/lib/owners';
import { type PaymentProvider, type PaymentPlan, isProviderConfigured } from '@/lib/payments/config';
import { createJazzCashPayment } from '@/lib/payments/jazzcash';
import { createEasyPaisaPayment } from '@/lib/payments/easypaisa';
import { createBinancePayment } from '@/lib/payments/binance-pay';
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const owner = await getOwnerByEmail(session.user.email);
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { provider?: string; plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const provider = body.provider as PaymentProvider;
  const plan = body.plan as PaymentPlan;

  if (!provider || !plan) {
    return NextResponse.json({ error: 'Provider and plan are required' }, { status: 400 });
  }

  if (plan !== 'pro' && plan !== 'enterprise') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  if (provider === 'stripe') {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }
    const url = await createCheckoutSession(owner.id, owner.email, plan, origin);
    if (!url) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    return NextResponse.json({ url });
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.json({ error: `${provider} is not configured` }, { status: 503 });
  }

  let result;

  switch (provider) {
    case 'jazzcash':
      result = await createJazzCashPayment(owner.id, plan, origin);
      break;
    case 'easypaisa':
      result = await createEasyPaisaPayment(owner.id, owner.email, plan, origin);
      break;
    case 'binance':
      result = await createBinancePayment(owner.id, plan, origin);
      break;
    default:
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ url: result.redirectUrl });
}
