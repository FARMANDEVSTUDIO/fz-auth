'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Key, Users, UserPlus, Settings, Shield,
  Download, ShoppingBag, Zap, CreditCard, Radio,
  Webhook, FolderOpen, Variable, ShieldCheck, FileText, UserCircle,
  Loader2, Lock, Crown, ShieldAlert, Menu, X, Coins, BarChart3, MessageSquare,
  History, BookOpen, LogOut,
} from 'lucide-react';
import type { PlanKey } from '@/lib/plans';
import { useLanguage } from './LanguageProvider';
import { logOut } from '@/app/(panel)/actions';

const FREE_LOCKED = ['/team', '/webhooks', '/files', '/subscriptions', '/downloads'];

const mainNav = [
  { href: '/dashboard', tKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/licenses', tKey: 'nav.licenses', icon: Key },
  { href: '/users', tKey: 'nav.users', icon: Users },
  { href: '/team', tKey: 'nav.team', icon: UserPlus },
  { href: '/settings', tKey: 'nav.settings', icon: Settings },
  { href: '/account', tKey: 'nav.account', icon: UserCircle },
];

const moreNav = [
  { href: '/sessions', tKey: 'nav.sessions', icon: Radio },
  { href: '/tokens', tKey: 'nav.tokens', icon: Zap },
  { href: '/subscriptions', tKey: 'nav.subs', icon: CreditCard },
  { href: '/variables', tKey: 'nav.variables', icon: Variable },
  { href: '/webhooks', tKey: 'nav.webhooks', icon: Webhook },
  { href: '/files', tKey: 'nav.files', icon: FolderOpen },
  { href: '/rules', tKey: 'nav.blacklist', icon: ShieldCheck },
  { href: '/logs', tKey: 'nav.logs', icon: FileText },
  { href: '/analytics', tKey: 'nav.analytics', icon: BarChart3 },
  { href: '/appeals', tKey: 'nav.appeals', icon: MessageSquare },
  { href: '/downloads', tKey: 'nav.downloads', icon: Download },
  { href: '/earn', tKey: 'nav.earn', icon: Coins },
  { href: '/shop', tKey: 'nav.shop', icon: ShoppingBag },
  { href: '/changelog', tKey: 'nav.changelog', icon: History },
];

export default function Sidebar({ plan, isAdmin = false }: { plan: PlanKey; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const navigate = (href: string) => {
    setMobileOpen(false);
    startTransition(() => {
      router.push(href);
    });
  };

  const isLocked = (href: string) => plan === 'free' && FREE_LOCKED.includes(href);

  const renderNavItem = (item: { href: string; tKey: string; icon: React.ComponentType<{ className?: string }> }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + '/');
    const locked = isLocked(item.href);
    const Icon = item.icon;
    const label = t(item.tKey);

    if (locked) {
      return (
        <button
          key={item.href}
          onClick={() => navigate('/shop')}
          className="w-full text-start"
          title={label}
        >
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-600 hover:text-gray-500 hover:bg-white/[0.02] transition-colors relative group">
            <Icon className="w-4 h-4 opacity-40 flex-shrink-0" />
            <span className={`opacity-50 whitespace-nowrap transition-all duration-300 ${expanded || mobileOpen ? 'opacity-50 w-auto' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
              {label}
            </span>
            <Lock className={`w-3 h-3 text-amber-500/60 group-hover:text-amber-500 flex-shrink-0 transition-all duration-300 ${expanded || mobileOpen ? 'ms-auto' : 'lg:hidden'}`} />
          </div>
        </button>
      );
    }

    return (
      <button
        key={item.href}
        onClick={() => navigate(item.href)}
        className="w-full text-start group"
        title={label}
      >
        <motion.div
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors relative overflow-hidden ${
            active
              ? 'text-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {/* Active indicator bar */}
          {active && (
            <motion.div
              layoutId="activeNav"
              className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-accent"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          {/* Slide-in hover fill */}
          <span className={`absolute inset-0 rounded-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-left ${
            active
              ? 'bg-accent/15 scale-x-100'
              : 'bg-gradient-to-r from-accent/20 via-accent/10 to-transparent scale-x-0 group-hover:scale-x-100'
          }`} />
          {/* Hover glow edge */}
          <span className={`absolute start-0 top-[15%] bottom-[15%] w-[2.5px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            active
              ? 'bg-accent scale-y-100 shadow-[0_0_8px_rgba(var(--rgb-accent)/0.6)]'
              : 'bg-accent scale-y-0 group-hover:scale-y-100 group-hover:shadow-[0_0_8px_rgba(var(--rgb-accent)/0.5)]'
          }`} />
          {/* Subtle glow behind on hover */}
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 shadow-[inset_0_0_20px_rgba(var(--rgb-accent)/0.06)]" />
          <Icon className="w-4 h-4 flex-shrink-0 relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:text-accent" />
          <span className={`whitespace-nowrap relative z-10 transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
            {label}
          </span>
        </motion.div>
      </button>
    );
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 start-3 z-[60] w-9 h-9 flex items-center justify-center rounded-xl glass-strong text-gray-300 hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`
          glass-strong flex flex-col flex-shrink-0 h-screen fixed top-0 start-0 z-50 lg:z-30
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'w-[240px] translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${expanded ? 'lg:w-[220px]' : 'lg:w-[64px]'}
        `}
      >
        {/* Logo */}
        <div className={`px-3 py-4 border-b border-edge/50 flex items-center gap-2.5 ${expanded || mobileOpen ? '' : 'lg:justify-center'}`}>
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 border border-accent/20 glow-pulse"
          >
            <Shield className="w-5 h-5" />
          </motion.div>
          <span className={`font-bold text-white text-[15px] tracking-tight whitespace-nowrap transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
            FZ <span className="text-accent">AUTH</span>
          </span>
          {isPending && (
            <Loader2 className={`w-3.5 h-3.5 text-accent animate-spin flex-shrink-0 transition-all duration-300 ${expanded || mobileOpen ? 'ms-auto' : 'lg:hidden'}`} />
          )}
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ms-auto w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden">
          <p className={`px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-gray-600 font-semibold whitespace-nowrap transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100' : 'lg:opacity-0 lg:text-center'}`}>
            {expanded || mobileOpen ? t('nav.general') : ' '}
          </p>
          <div className="space-y-0.5">
            {mainNav.map(renderNavItem)}
          </div>

          <div className={`my-2 mx-3 border-t border-edge/30 transition-all duration-300 ${expanded || mobileOpen ? '' : 'lg:mx-1'}`} />

          <p className={`px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-gray-600 font-semibold whitespace-nowrap transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100' : 'lg:opacity-0 lg:text-center'}`}>
            {expanded || mobileOpen ? t('nav.more') : ' '}
          </p>
          <div className="space-y-0.5">
            {moreNav.map(renderNavItem)}
          </div>

          {/* Private Admin */}
          {isAdmin && (
            <>
              <div className={`my-2 mx-3 border-t border-red-500/20 transition-all duration-300 ${expanded || mobileOpen ? '' : 'lg:mx-1'}`} />
              <div className="space-y-0.5">
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full text-start group"
                  title={t('nav.admin')}
                >
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors relative overflow-hidden ${
                      pathname.startsWith('/admin')
                        ? 'text-red-400'
                        : 'text-red-400/70 hover:text-red-400'
                    }`}
                  >
                    {pathname.startsWith('/admin') && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-red-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className={`absolute inset-0 rounded-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-left ${
                      pathname.startsWith('/admin')
                        ? 'bg-red-500/15 scale-x-100'
                        : 'bg-gradient-to-r from-red-500/20 via-red-500/10 to-transparent scale-x-0 group-hover:scale-x-100'
                    }`} />
                    <span className={`absolute start-0 top-[15%] bottom-[15%] w-[2.5px] rounded-full bg-red-500 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      pathname.startsWith('/admin') ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'
                    }`} />
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 relative z-10 transition-all duration-500 group-hover:scale-110" />
                    <span className={`whitespace-nowrap relative z-10 transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                      {t('nav.admin')}
                    </span>
                  </motion.div>
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Plan badge */}
        <div className={`px-2 py-2 border-t border-edge/50 ${expanded || mobileOpen ? '' : 'lg:flex lg:justify-center'}`}>
          {isAdmin ? (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20 ${expanded || mobileOpen ? '' : 'lg:justify-center lg:px-2'}`}>
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className={`text-xs text-red-400 font-semibold whitespace-nowrap transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                Master Admin
              </span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/shop')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors ${expanded || mobileOpen ? '' : 'lg:justify-center lg:px-2'}`}
            >
              <Crown className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className={`text-xs text-accent font-semibold whitespace-nowrap transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                {plan === 'free' ? 'Free Plan' : plan === 'pro' ? 'Pro Plan' : 'Enterprise'}
              </span>
              {plan === 'free' && (
                <span className={`text-[10px] text-accent ms-auto flex-shrink-0 transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'}`}>
                  Upgrade
                </span>
              )}
            </button>
          )}
        </div>

        {/* Logout */}
        <div className={`px-2 pb-2 ${expanded || mobileOpen ? '' : 'lg:flex lg:justify-center'}`}>
          <form action={logOut} className="w-full">
            <button
              type="submit"
              title={t('auth.logout')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-colors ${expanded || mobileOpen ? '' : 'lg:justify-center lg:px-2'}`}
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              <span className={`text-xs font-semibold whitespace-nowrap transition-all duration-300 ${expanded || mobileOpen ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                {t('auth.logout')}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className={`px-3 py-2 border-t border-edge/50 transition-all duration-300 ${expanded || mobileOpen ? '' : 'lg:hidden'}`}>
          <p className="text-[10px] text-gray-600 text-center">Developed by FZ</p>
        </div>
      </aside>
    </>
  );
}
