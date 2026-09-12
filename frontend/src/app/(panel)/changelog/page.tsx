import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import { getPageData } from '@/lib/page-data';
import { Sparkles, Shield, Bug, Zap, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

const changelog = [
  {
    version: '2.5.0',
    date: '2026-06-15',
    type: 'major',
    changes: [
      'Dark/Light theme toggle with CSS variables',
      'Two-Factor Authentication (TOTP) with backup codes',
      'Multi-language support (English & Urdu)',
      'IP Geolocation on logs (batch lookup with location)',
      'Sound effects on copy, reward claim, and confetti',
      'Cloudflare setup guide for admin',
      'Changelog added to sidebar navigation',
      'Theme & language toggles in topbar',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-06-15',
    type: 'major',
    changes: [
      'Forgot Password system with email reset links',
      'Maintenance Mode toggle for admin',
      'Command Palette (Ctrl+K) for quick navigation',
      'Loading skeletons on all heavy pages',
      'Page transitions with smooth animations',
      'Custom branded 404 and 500 error pages',
      'App Analytics with bar charts (14-day view)',
      'Activity Heatmap on dashboard',
      'Export data as CSV/JSON (Users, Licenses, Logs)',
      'In-app notification bell system',
      'Webhook firing with HMAC signatures',
      'Profile settings — edit name and avatar',
      'Suspend/Resume users (temporary pause)',
      'Ban Appeal system for end users',
      'API Documentation page at /docs',
      'Database backup download for admin',
      'Auto cleanup endpoint for expired data',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-06-14',
    type: 'feature',
    changes: [
      'Referral system with milestone rewards',
      'Lucky bonus multiplier on daily claims',
      'Soft-delete system for owners (trash & restore)',
      'Force-signout to fix redirect loops',
      'Referral click tracking',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-10',
    type: 'major',
    changes: [
      'Initial release of FZ AUTH panel',
      'Google & GitHub OAuth login',
      'Email/password authentication with OTP verification',
      'Application management (create, rename, pause, delete)',
      'License key generation with custom duration/level',
      'User management (ban, unban, HWID reset, add time)',
      'Session management',
      'Webhook configuration',
      'Variable storage',
      'Blacklist (IP/HWID)',
      'Event logging',
      'Discord bot integration',
      'Earn credits system with daily rewards',
      'Shop for plan upgrades',
    ],
  },
];

const typeIcon: Record<string, React.ReactNode> = {
  major: <Sparkles className="w-4 h-4 text-accent" />,
  feature: <Zap className="w-4 h-4 text-green-400" />,
  fix: <Bug className="w-4 h-4 text-yellow-400" />,
  maintenance: <Wrench className="w-4 h-4 text-gray-400" />,
};

const typeBadge: Record<string, string> = {
  major: 'badge-accent',
  feature: 'badge-green',
  fix: 'badge-yellow',
  maintenance: 'badge-red',
};

export default async function ChangelogPage() {
  const { owner, apps, selected } = await getPageData();

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Changelog" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-display">Changelog</h1>
            <p className="text-xs text-gray-500">What&apos;s new in FZ AUTH</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-6">
          {/* Vertical line */}
          <div className="absolute start-[19px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-accent/30 via-accent/10 to-transparent hidden sm:block" />

          {changelog.map((release, i) => (
            <MotionCard key={release.version} delay={i * 0.1} className="glass rounded-xl overflow-hidden sm:ms-10 relative">
              {/* Timeline dot */}
              <div className="absolute -start-[29px] top-5 w-3 h-3 rounded-full bg-accent ring-4 ring-bg hidden sm:block" />

              <div className="px-5 py-4 section-header flex items-center gap-3">
                {typeIcon[release.type] || typeIcon.feature}
                <div>
                  <h3 className="text-sm font-bold text-white font-display">v{release.version}</h3>
                  <p className="text-[10px] text-gray-500">{new Date(release.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`ms-auto badge ${typeBadge[release.type] || 'badge-accent'}`}>
                  {release.type.toUpperCase()}
                </span>
              </div>
              <div className="p-5">
                <ul className="space-y-2">
                  {release.changes.map((change, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/40 flex-shrink-0 mt-[7px]" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </MotionCard>
          ))}
        </div>
      </main>
    </>
  );
}
