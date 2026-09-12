import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOwnerByEmail } from '@/lib/owners';
import { createCheckoutSession, isStripeConfigured, type StripePlanKey } from '@/lib/stripe';

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Payment system is not configured' },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const owner = await getOwnerByEmail(session.user.email);
  if (!owner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const plan = body.plan as StripePlanKey;
  if (plan !== 'pro' && plan !== 'enterprise') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const checkoutUrl = await createCheckoutSession(owner.id, owner.email, plan, origin);

  if (!checkoutUrl) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutUrl });
}
