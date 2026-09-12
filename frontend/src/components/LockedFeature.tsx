import { Lock, Crown, Sparkles } from 'lucide-react';
import MotionCard from './MotionCard';

export default function LockedFeature({ feature }: { feature: string }) {
  return (
    <MotionCard delay={0.1} className="glass rounded-xl p-10 text-center max-w-md mx-auto gradient-border">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 relative">
        <Lock className="w-7 h-7 text-amber-400" />
        <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -end-1 animate-pulse" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2 font-display">{feature} is a Pro Feature</h2>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        Upgrade your plan to unlock {feature.toLowerCase()} and other premium features.
      </p>
      <a
        href="/shop"
        className="inline-flex items-center gap-2 px-6 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Crown className="w-4 h-4" /> Upgrade Plan
      </a>
    </MotionCard>
  );
}
