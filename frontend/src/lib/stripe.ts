import Stripe from 'stripe';
import { query } from './db';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

export const STRIPE_PLANS = {
  pro: {
    name: 'Pro',
    price: 999,
    description: 'Pro Plan — 1 Month',
  },
  enterprise: {
    name: 'Enterprise',
    price: 2999,
    description: 'Enterprise Plan — 1 Month',
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

export function isStripeConfigured(): boolean {
  return !!stripe;
}

export async function createCheckoutSession(
  ownerId: string,
  ownerEmail: string,
  plan: StripePlanKey,
  origin: string
): Promise<string | null> {
  if (!stripe) return null;

  const planInfo = STRIPE_PLANS[plan];
  if (!planInfo) return null;

  const txnRef = 'STRIPE_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  await query(
    `INSERT INTO payment_transactions (owner_id, provider, plan, amount, currency, status, provider_ref)
     VALUES ($1, 'stripe', $2, $3, 'USD', 'pending', $4)`,
    [ownerId, plan, planInfo.price / 100, txnRef]
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: ownerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `FZ AUTH ${planInfo.name}`,
            description: planInfo.description,
          },
          unit_amount: planInfo.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      owner_id: ownerId,
      plan,
      txn_ref: txnRef,
    },
    success_url: `${origin}/shop?payment=success`,
    cancel_url: `${origin}/shop?payment=cancelled`,
  });

  return session.url;
}

export async function handleWebhook(
  body: string,
  signature: string
): Promise<{ ok: boolean; error?: string }> {
  if (!stripe) return { ok: false, error: 'Stripe not configured' };

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return { ok: false, error: 'Webhook secret not configured' };

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return { ok: false, error: 'Invalid signature' };
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const ownerId = session.metadata?.owner_id;
      const plan = session.metadata?.plan as StripePlanKey | undefined;
      const txnRef = session.metadata?.txn_ref;

      if (ownerId && plan && STRIPE_PLANS[plan]) {
        await query(
          `UPDATE owners
           SET plan_type = $1,
               plan_expires_at = CASE
                 WHEN plan_expires_at IS NOT NULL AND plan_expires_at > NOW()
                 THEN plan_expires_at + INTERVAL '30 days'
                 ELSE NOW() + INTERVAL '30 days'
               END
           WHERE id = $2`,
          [plan, ownerId]
        );

        if (txnRef) {
          await query(
            "UPDATE payment_transactions SET status = 'completed', completed_at = NOW(), provider_response = $1 WHERE provider_ref = $2",
            [JSON.stringify({ session_id: session.id, payment_status: session.payment_status }), txnRef]
          );
        }
      }
      break;
    }
  }

  return { ok: true };
}
