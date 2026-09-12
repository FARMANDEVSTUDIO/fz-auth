import Topbar from '@/components/Topbar';
import StatCard from '@/components/StatCard';
import PageInfo from '@/components/PageInfo';
import EarnClient from './EarnClient';
import { getPageData } from '@/lib/page-data';
import { getOwnerPlan, PLAN_LIMITS } from '@/lib/plans';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { Coins, Crown, TrendingUp, Users, Gift, Zap, Star, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CLAIM_COOLDOWN_HOURS = 20;
const STREAK_WINDOW_HOURS = 48;

const REFERRAL_MILESTONES = [
  { count: 5, reward: 50 },
  { count: 10, reward: 100 },
  { count: 25, reward: 300 },
  { count: 50, reward: 500 },
  { count: 100, reward: 1500 },
];

export default async function EarnPage() {
  const { owner, apps, selected } = await getPageData();
  const plan = getOwnerPlan(owner);

  const r = await query('SELECT last_claim_at, claim_streak, credits, referral_count, referral_code, referral_clicks FROM owners WHERE id=$1', [owner.id]);
  const row = r.rows[0];
  const credits = row.credits || 0;
  const lastClaim = row.last_claim_at ? new Date(row.last_claim_at).getTime() : 0;
  const hoursSince = lastClaim ? (Date.now() - lastClaim) / 3600000 : Infinity;

  const canClaim = hoursSince >= CLAIM_COOLDOWN_HOURS;
  const hoursUntilClaim = canClaim ? 0 : Math.ceil(CLAIM_COOLDOWN_HOURS - hoursSince);
  const streak = hoursSince <= STREAK_WINDOW_HOURS ? (row.claim_streak || 0) : 0;
  const nextReward = Math.min(10 * (streak + 1), 1000);

  let referralCode = row.referral_code;
  if (!referralCode) {
    referralCode = 'FZ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await query('UPDATE owners SET referral_code=$1 WHERE id=$2', [referralCode, owner.id]);
  }
  const referralCount = row.referral_count || 0;
  const referralClicks = row.referral_clicks || 0;

  const claimedRes = await query('SELECT milestone FROM referral_claims WHERE owner_id=$1', [owner.id]);
  const claimedSet = new Set(claimedRes.rows.map((r: any) => r.milestone));

  const milestones = REFERRAL_MILESTONES.map(m => ({
    ...m,
    reached: referralCount >= m.count,
    claimed: claimedSet.has(m.count),
  }));

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Earn Credits" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <PageInfo
          icon={<Coins className="w-4 h-4" />}
          title="Earn Credits"
          description="Earn free credits by claiming daily rewards, staying active, or inviting friends. Spend credits in the Shop — 1,000 credits = Pro for 1 month, 10,000 credits = Enterprise for 1 month."
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Your Credits" value={credits} icon={<Coins className="w-5 h-5" />} tone="yellow" delay={0} />
          <StatCard label="Current Plan" value={PLAN_LIMITS[plan].label} icon={<Crown className="w-5 h-5" />} tone="blue" delay={0.05} />
          <StatCard label="Claim Streak" value={streak} icon={<TrendingUp className="w-5 h-5" />} tone="green" delay={0.1} />
          <StatCard label="Referrals" value={referralCount} icon={<Users className="w-5 h-5" />} tone="red" delay={0.15} />
        </div>

        <EarnClient
          streak={streak}
          canClaim={canClaim}
          nextReward={nextReward}
          hoursUntilClaim={hoursUntilClaim}
          referralCode={referralCode}
          referralCount={referralCount}
          referralClicks={referralClicks}
          milestones={milestones}
        />

        {/* How it works */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-4 section-header">
            <h3 className="text-sm font-semibold text-white">How Credits Work</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-bg/40 border border-edge/40 rounded-xl hover:border-amber-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-amber-400 font-bold text-xs">Daily Reward</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Claim every day to build a streak. Day 1 = 10, Day 2 = 20... up to 1,000/day. Miss 2 days and streak resets. Lucky bonus chance on each claim!</p>
            </div>
            <div className="p-4 bg-bg/40 border border-edge/40 rounded-xl hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-bold text-xs">AFK Earning</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Keep this page open and earn 1 credit per minute. Earning pauses when you switch tabs.</p>
            </div>
            <div className="p-4 bg-bg/40 border border-edge/40 rounded-xl hover:border-accent/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="text-accent font-bold text-xs">Referral Rewards</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Share your link. When real users register through it, earn milestone rewards: 5 refs = 50, 10 = 100, up to 100 refs = 1,500 credits!</p>
            </div>
            <div className="p-4 bg-bg/40 border border-edge/40 rounded-xl hover:border-red-500/30 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-3.5 h-3.5 text-red-400" />
                </div>
                <p className="text-red-400 font-bold text-xs">Plan Purchases</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Go to the <a href="/shop" className="text-accent underline">Shop</a> to buy Pro (1,000 credits/month) or Enterprise (10,000 credits/month). Plans last 30 days.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
