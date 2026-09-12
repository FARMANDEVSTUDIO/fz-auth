'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { query } from '@/lib/db';
import { PLAN_PRICES, getOwnerPlan, PlanKey } from '@/lib/plans';

export async function purchasePlan(planKey: string): Promise<{ ok: boolean; message: string }> {
  const owner = await requireOwner();

  if (planKey !== 'pro' && planKey !== 'enterprise') {
    return { ok: false, message: 'Invalid plan' };
  }

  const currentPlan = getOwnerPlan(owner);
  if (currentPlan === 'enterprise' && planKey === 'pro') {
    return { ok: false, message: 'You already have Enterprise — no need to buy Pro' };
  }
  if (currentPlan === planKey) {
    return { ok: false, message: `You already have an active ${planKey === 'pro' ? 'Pro' : 'Enterprise'} plan` };
  }

  const price = PLAN_PRICES[planKey as keyof typeof PLAN_PRICES];
  const fresh = await query('SELECT credits, plan_expires_at FROM owners WHERE id=$1', [owner.id]);
  const credits = fresh.rows[0]?.credits || 0;

  if (credits < price.credits) {
    return { ok: false, message: `Not enough credits. You need ${price.credits} but have ${credits}.` };
  }

  const now = new Date();
  const existingExpiry = fresh.rows[0]?.plan_expires_at ? new Date(fresh.rows[0].plan_expires_at) : null;
  let newExpiry: Date;

  if (existingExpiry && existingExpiry > now && owner.plan_type === planKey) {
    newExpiry = new Date(existingExpiry.getTime() + price.durationDays * 24 * 60 * 60 * 1000);
  } else {
    newExpiry = new Date(now.getTime() + price.durationDays * 24 * 60 * 60 * 1000);
  }

  await query(
    `UPDATE owners SET credits = credits - $1, plan_type = $2, plan_expires_at = $3 WHERE id = $4`,
    [price.credits, planKey, newExpiry.toISOString(), owner.id]
  );

  await query(
    `INSERT INTO payment_transactions (owner_id, provider, plan, amount, currency, status, completed_at, provider_ref)
     VALUES ($1, 'credits', $2, $3, 'CREDITS', 'completed', NOW(), $4)`,
    [owner.id, planKey, price.credits, 'CREDITS_' + Date.now()]
  );

  revalidatePath('/', 'layout');
  return { ok: true, message: `${planKey === 'pro' ? 'Pro' : 'Enterprise'} plan activated until ${newExpiry.toLocaleDateString()}!` };
}
