'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { query } from '@/lib/db';
import crypto from 'crypto';

const CLAIM_COOLDOWN_HOURS = 20;
const STREAK_WINDOW_HOURS = 48;
const MAX_DAILY_REWARD = 1000;

const LUCKY_CHANCES = [
  { multiplier: 5, chance: 0.02, label: '🎰 JACKPOT! 5x' },
  { multiplier: 3, chance: 0.05, label: '🔥 SUPER LUCKY! 3x' },
  { multiplier: 2, chance: 0.15, label: '⭐ LUCKY! 2x' },
  { multiplier: 1, chance: 0.78, label: '' },
];

export type ClaimResult = {
  ok: boolean;
  message: string;
  reward?: number;
  streak?: number;
  luckyMultiplier?: number;
  luckyLabel?: string;
};

export async function claimDaily(): Promise<ClaimResult> {
  const owner = await requireOwner();

  const r = await query('SELECT last_claim_at, claim_streak, credits FROM owners WHERE id=$1', [owner.id]);
  const row = r.rows[0];
  const now = Date.now();
  const lastClaim = row.last_claim_at ? new Date(row.last_claim_at).getTime() : 0;

  const hoursSince = (now - lastClaim) / 3600000;
  if (lastClaim && hoursSince < CLAIM_COOLDOWN_HOURS) {
    const hoursLeft = Math.ceil(CLAIM_COOLDOWN_HOURS - hoursSince);
    return { ok: false, message: `Already claimed. Come back in ~${hoursLeft}h` };
  }

  const streak = lastClaim && hoursSince <= STREAK_WINDOW_HOURS ? (row.claim_streak || 0) + 1 : 1;
  const baseReward = Math.min(10 * streak, MAX_DAILY_REWARD);

  // Lucky bonus roll
  const roll = Math.random();
  let cumulative = 0;
  let luckyMultiplier = 1;
  let luckyLabel = '';
  for (const l of LUCKY_CHANCES) {
    cumulative += l.chance;
    if (roll <= cumulative) {
      luckyMultiplier = l.multiplier;
      luckyLabel = l.label;
      break;
    }
  }

  const reward = baseReward * luckyMultiplier;

  await query(
    'UPDATE owners SET credits = credits + $1, last_claim_at = now(), claim_streak = $2 WHERE id = $3',
    [reward, streak, owner.id]
  );

  revalidatePath('/earn');
  revalidatePath('/', 'layout');

  const msg = luckyMultiplier > 1
    ? `${luckyLabel} +${reward} credits (${baseReward} × ${luckyMultiplier})! Day ${streak} streak`
    : `+${reward} credits claimed! Day ${streak} streak`;

  return { ok: true, message: msg, reward, streak, luckyMultiplier, luckyLabel };
}

// Referral milestones: [referrals needed, reward]
const REFERRAL_MILESTONES = [
  { count: 5, reward: 50 },
  { count: 10, reward: 100 },
  { count: 25, reward: 300 },
  { count: 50, reward: 500 },
  { count: 100, reward: 1500 },
];

export async function getReferralData() {
  const owner = await requireOwner();

  const r = await query('SELECT referral_code, referral_count FROM owners WHERE id=$1', [owner.id]);
  const { referral_code, referral_count } = r.rows[0];

  // Generate code if missing
  let code = referral_code;
  if (!code) {
    code = 'FZ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await query('UPDATE owners SET referral_code=$1 WHERE id=$2', [code, owner.id]);
  }

  const claimed = await query('SELECT milestone FROM referral_claims WHERE owner_id=$1', [owner.id]);
  const claimedMilestones = new Set(claimed.rows.map((r: any) => r.milestone));

  const milestones = REFERRAL_MILESTONES.map(m => ({
    ...m,
    reached: (referral_count || 0) >= m.count,
    claimed: claimedMilestones.has(m.count),
  }));

  return {
    code,
    count: referral_count || 0,
    milestones,
  };
}

export async function claimReferralMilestone(milestone: number): Promise<{ ok: boolean; message: string }> {
  const owner = await requireOwner();

  const target = REFERRAL_MILESTONES.find(m => m.count === milestone);
  if (!target) return { ok: false, message: 'Invalid milestone' };

  const r = await query('SELECT referral_count FROM owners WHERE id=$1', [owner.id]);
  if ((r.rows[0].referral_count || 0) < target.count) {
    return { ok: false, message: `Need ${target.count} referrals first` };
  }

  const already = await query('SELECT 1 FROM referral_claims WHERE owner_id=$1 AND milestone=$2', [owner.id, milestone]);
  if ((already.rowCount ?? 0) > 0) return { ok: false, message: 'Already claimed' };

  await query('INSERT INTO referral_claims (owner_id, milestone, reward) VALUES ($1,$2,$3)', [owner.id, milestone, target.reward]);
  await query('UPDATE owners SET credits = credits + $1 WHERE id = $2', [target.reward, owner.id]);

  revalidatePath('/earn');
  revalidatePath('/', 'layout');
  return { ok: true, message: `+${target.reward} credits from referral milestone!` };
}

export async function afkTick(): Promise<{ ok: boolean; credits?: number }> {
  const owner = await requireOwner();

  // rate limit: only one credit per ~55 seconds
  const r = await query(
    `UPDATE owners SET credits = credits + 1, last_afk_tick = now()
     WHERE id = $1 AND (last_afk_tick IS NULL OR last_afk_tick < now() - interval '55 seconds')
     RETURNING credits`,
    [owner.id]
  );

  if ((r.rowCount ?? 0) === 0) return { ok: false };
  return { ok: true, credits: r.rows[0].credits };
}
