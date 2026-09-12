'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Crown, Monitor, Loader2, Gift, Link, Copy, Check, Trophy, Sparkles } from 'lucide-react';
import { claimDaily, afkTick, claimReferralMilestone } from './actions';
import { fireConfetti } from '@/lib/confetti';
import { soundCopy } from '@/lib/sounds';

const TICK_SECONDS = 60;

interface Milestone {
  count: number;
  reward: number;
  reached: boolean;
  claimed: boolean;
}

export default function EarnClient({
  streak,
  canClaim,
  nextReward,
  hoursUntilClaim,
  referralCode,
  referralCount,
  referralClicks,
  milestones,
}: {
  streak: number;
  canClaim: boolean;
  nextReward: number;
  hoursUntilClaim: number;
  referralCode: string;
  referralCount: number;
  referralClicks: number;
  milestones: Milestone[];
}) {
  const [claiming, startClaim] = useTransition();
  const [claimed, setClaimed] = useState(!canClaim);
  const [luckyResult, setLuckyResult] = useState<{ multiplier: number; label: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [claimingMilestone, setClaimingMilestone] = useState<number | null>(null);

  // AFK session state
  const [progress, setProgress] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [active, setActive] = useState(true);
  const tickingRef = useRef(false);

  useEffect(() => {
    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 100 / TICK_SECONDS;
        if (next >= 100 && !tickingRef.current) {
          tickingRef.current = true;
          afkTick()
            .then(res => {
              if (res.ok) {
                setSessionTotal(t => t + 1);
              }
            })
            .finally(() => { tickingRef.current = false; });
          return 0;
        }
        return next >= 100 ? 0 : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/login?ref=${referralCode}`
    : `http://localhost:3001/login?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    soundCopy();
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimMilestone = async (count: number) => {
    setClaimingMilestone(count);
    const res = await claimReferralMilestone(count);
    if (res.ok) {
      toast.success(res.message);
      fireConfetti();
    } else {
      toast.error(res.message);
    }
    setClaimingMilestone(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Reward */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-yellow-500/15 text-yellow-500 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold">Daily Reward</h3>
              <p className="text-xs text-gray-500">Consecutive Days: <span className="text-white font-bold">{streak}</span></p>
            </div>
            <div className="ms-auto">
              <span className="px-2 py-1 text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full">
                LUCKY BONUS
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed mb-2">
            Claim your daily reward to earn credits. Your reward increases by <span className="text-yellow-400 font-semibold">10 credits</span> for
            each consecutive day, up to a maximum of <span className="text-yellow-400 font-semibold">1,000 credits</span> per day!
          </p>
          <p className="text-xs text-gray-500 mb-5">
            <Sparkles className="w-3 h-3 inline text-yellow-400" /> Each claim has a chance for <span className="text-yellow-300">2x</span>, <span className="text-orange-400">3x</span>, or <span className="text-red-400">5x JACKPOT</span> bonus!
          </p>

          {/* Lucky result popup */}
          <AnimatePresence>
            {luckyResult && luckyResult.multiplier > 1 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`mb-4 p-4 rounded-xl text-center border ${
                  luckyResult.multiplier >= 5 ? 'bg-red-500/10 border-red-500/40' :
                  luckyResult.multiplier >= 3 ? 'bg-orange-500/10 border-orange-500/40' :
                  'bg-yellow-500/10 border-yellow-500/40'
                }`}
              >
                <p className={`text-2xl font-black ${
                  luckyResult.multiplier >= 5 ? 'text-red-400' :
                  luckyResult.multiplier >= 3 ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>
                  {luckyResult.label}
                </p>
                <p className="text-xs text-gray-400 mt-1">Your reward was multiplied!</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={claimed || claiming}
            onClick={() => {
              startClaim(async () => {
                const res = await claimDaily();
                if (res.ok) {
                  toast.success(res.message);
                  fireConfetti();
                  setClaimed(true);
                  if (res.luckyMultiplier && res.luckyMultiplier > 1) {
                    setLuckyResult({ multiplier: res.luckyMultiplier, label: res.luckyLabel || '' });
                    setTimeout(() => setLuckyResult(null), 5000);
                  }
                } else {
                  toast.error(res.message);
                }
              });
            }}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              claimed
                ? 'border border-edge text-gray-600 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-400 text-black hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {claiming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : claimed ? (
              `Claimed — come back in ~${hoursUntilClaim}h`
            ) : (
              <><Gift className="w-4 h-4" /> Claim Reward (+{nextReward} credits)</>
            )}
          </button>
        </motion.div>

        {/* AFK Session */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-green-500/15 text-green-500 flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold">AFK Session</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                Status:
                <span className={`flex items-center gap-1 font-semibold ${active ? 'text-green-400' : 'text-yellow-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                  {active ? 'Earning' : 'Paused'}
                </span>
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed mb-5">
            Stay on this page to accumulate credits. Every minute of activity grants
            you <span className="text-green-400 font-semibold">1 Credit</span>.
          </p>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Progress to next credit</span>
              <span className="text-[10px] text-gray-500 font-bold">{Math.floor(progress)}%</span>
            </div>
            <div className="h-1.5 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-bg/50 border border-edge/50 rounded-xl">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Session Total</p>
              <p className="text-xs text-gray-500">Credits earned this session</p>
            </div>
            <p className="text-2xl font-bold text-green-400">+{sessionTotal}</p>
          </div>
        </motion.div>
      </div>

      {/* Referral System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <Link className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold">Referral Program</h3>
            <p className="text-xs text-gray-500">
              Registrations: <span className="text-accent font-bold">{referralCount}</span>
              <span className="mx-1.5 text-gray-700">•</span>
              Link Clicks: <span className="text-blue-400 font-bold">{referralClicks}</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          Share your referral link. When someone <span className="text-accent font-semibold">registers and logs in</span> using
          your link, it counts as a referral. Reach milestones to claim rewards!
        </p>

        {/* Referral Link */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 px-4 py-2.5 bg-bg/50 border border-edge/50 rounded-xl text-xs text-gray-400 font-mono truncate select-all">
            {referralLink}
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-2.5 bg-accent/15 text-accent border border-accent/30 rounded-xl hover:bg-accent/25 transition-colors flex items-center gap-2 text-xs font-semibold shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {milestones.map((m) => (
            <div
              key={m.count}
              className={`relative p-4 rounded-xl border text-center transition-all ${
                m.claimed
                  ? 'bg-green-500/5 border-green-500/30'
                  : m.reached
                  ? 'bg-accent/5 border-accent/40 ring-1 ring-accent/20'
                  : 'bg-bg/50 border-edge/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                m.claimed ? 'bg-green-500/20 text-green-400' :
                m.reached ? 'bg-accent/20 text-accent' :
                'bg-gray-800 text-gray-600'
              }`}>
                {m.claimed ? <Check className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
              </div>
              <p className={`text-lg font-black ${m.reached ? 'text-white' : 'text-gray-600'}`}>
                {Math.min(referralCount, m.count)}/{m.count}
              </p>
              <p className="text-[10px] text-gray-500 mb-2">referrals</p>
              <p className={`text-sm font-bold ${m.claimed ? 'text-green-400' : m.reached ? 'text-accent' : 'text-gray-600'}`}>
                +{m.reward}
              </p>
              <p className="text-[10px] text-gray-500 mb-3">credits</p>

              {m.claimed ? (
                <span className="text-[10px] text-green-400/60 font-semibold">Claimed</span>
              ) : m.reached ? (
                <button
                  onClick={() => handleClaimMilestone(m.count)}
                  disabled={claimingMilestone === m.count}
                  className="px-3 py-1.5 text-[10px] font-bold bg-accent text-white rounded-lg hover:bg-accent/80 transition-all hover:scale-105 active:scale-95"
                >
                  {claimingMilestone === m.count ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Claim'}
                </button>
              ) : (
                <div className="w-full bg-bg/70 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-accent/40 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (referralCount / m.count) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
