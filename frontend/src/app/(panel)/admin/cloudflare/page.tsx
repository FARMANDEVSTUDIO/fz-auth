import Topbar from '@/components/Topbar';
import MotionCard from '@/components/MotionCard';
import { getPageData } from '@/lib/page-data';
import { isMasterAdmin } from '@/lib/plans';
import { redirect } from 'next/navigation';
import { Shield, Cloud, Lock, Zap, Globe, Server, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const steps = [
  {
    icon: Globe,
    title: '1. Add Your Domain',
    color: 'text-blue-400',
    items: [
      'Sign up at cloudflare.com and add your domain',
      'Cloudflare will scan existing DNS records',
      'Update your domain\'s nameservers to the ones Cloudflare provides',
      'Wait for DNS propagation (up to 24 hours)',
    ],
  },
  {
    icon: Lock,
    title: '2. Enable SSL/TLS',
    color: 'text-green-400',
    items: [
      'Go to SSL/TLS → Overview → Set to "Full (strict)"',
      'Enable "Always Use HTTPS" under Edge Certificates',
      'Enable "Automatic HTTPS Rewrites"',
      'Set Minimum TLS Version to 1.2',
    ],
  },
  {
    icon: Shield,
    title: '3. Configure DDoS Protection',
    color: 'text-accent',
    items: [
      'DDoS protection is enabled by default on all plans',
      'Go to Security → DDoS → Review managed rules',
      'Enable "Bot Fight Mode" under Security → Bots',
      'Set Security Level to "Medium" under Security → Settings',
    ],
  },
  {
    icon: Zap,
    title: '4. Set Up Rate Limiting',
    color: 'text-yellow-400',
    items: [
      'Go to Security → WAF → Rate limiting rules',
      'Create rule: /api/* → 100 requests per 10 seconds per IP → Block for 60s',
      'Create rule: /api/v1/login → 10 requests per minute per IP → Block for 300s',
      'Create rule: /api/v1/register → 5 requests per minute per IP → Block for 600s',
    ],
  },
  {
    icon: Server,
    title: '5. DNS Records',
    color: 'text-cyan-400',
    items: [
      'Add A record: @ → your server IP (proxied ☁️)',
      'Add CNAME record: www → yourdomain.com (proxied ☁️)',
      'Add A record: api → your server IP (proxied ☁️)',
      'Orange cloud = Cloudflare proxy ON (recommended)',
    ],
  },
  {
    icon: Cloud,
    title: '6. Performance',
    color: 'text-accent',
    items: [
      'Enable Auto Minify for JS, CSS, HTML',
      'Enable Brotli compression',
      'Set Browser Cache TTL to 4 hours',
      'Consider enabling Cloudflare Pages for frontend hosting',
    ],
  },
];

export default async function CloudflarePage() {
  const { owner, apps, selected } = await getPageData();
  if (!isMasterAdmin(owner.email)) redirect('/dashboard');

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Cloudflare Setup" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="w-5 h-5 text-orange-400" />
          <div>
            <h1 className="text-lg font-bold text-white font-display">Cloudflare Setup Guide</h1>
            <p className="text-xs text-gray-500">Protect your FZ AUTH panel with Cloudflare — DDoS, SSL, Rate Limiting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <MotionCard key={i} delay={i * 0.08} className="glass rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-edge/50 section-header flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${step.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                </div>
                <div className="p-5">
                  <ul className="space-y-2.5">
                    {step.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-400">
                        <ArrowRight className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </MotionCard>
            );
          })}
        </div>

        <MotionCard delay={0.5} className="glass rounded-xl p-5 gradient-border">
          <h3 className="text-sm font-bold text-white mb-2 font-display">Environment Variables</h3>
          <p className="text-xs text-gray-400 mb-4">Add these to your .env.local for Cloudflare integration:</p>
          <div className="bg-bg rounded-lg p-4 font-mono text-xs space-y-1">
            <p className="text-gray-500"># Cloudflare Turnstile (CAPTCHA alternative)</p>
            <p className="text-green-400">TURNSTILE_SITE_KEY=your_site_key</p>
            <p className="text-green-400">TURNSTILE_SECRET_KEY=your_secret_key</p>
            <p className="text-gray-500 mt-2"># Cloudflare API (optional — for purge cache)</p>
            <p className="text-green-400">CF_API_TOKEN=your_api_token</p>
            <p className="text-green-400">CF_ZONE_ID=your_zone_id</p>
          </div>
        </MotionCard>
      </main>
    </>
  );
}
