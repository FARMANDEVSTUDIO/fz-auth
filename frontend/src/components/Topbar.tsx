import Link from 'next/link';
import { selectApp, logOut } from '@/app/(panel)/actions';
import type { App } from '@/lib/apps';
import type { Owner } from '@/lib/owners';
import { getUnreadCount } from '@/lib/notifications';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { ChevronRight, ArrowLeftRight, Coins, LogOut, UserCog, CreditCard } from 'lucide-react';

export default async function Topbar({
  owner,
  apps,
  selectedApp,
  breadcrumb,
}: {
  owner: Owner;
  apps: App[];
  selectedApp: App | null;
  breadcrumb: string;
}) {
  const unreadCount = await getUnreadCount(owner.id);

  return (
    <header className="h-14 border-b border-edge/50 glass-strong flex items-center justify-between ps-14 pe-3 lg:ps-6 lg:pe-6 sticky top-0 z-20 gap-2 border-beam-open">
      <div className="flex items-center gap-2 text-sm min-w-0">
        <span className="text-gray-500 hidden sm:inline font-display tracking-wider text-xs">FZ AUTH</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-600 hidden sm:block" />
        <span className="text-white font-medium truncate">{breadcrumb}</span>
        {selectedApp && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            <span className="text-accent truncate font-medium">{selectedApp.name}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        {/* Credits */}
        <Link
          href="/earn"
          title="Earn Credits"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/20 hover:bg-amber-500/15 hover:shadow-[0_0_10px_rgba(245,158,11,0.1)] transition-all"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">{owner.credits ?? 0}</span>
        </Link>

        <LanguageToggle />

        <ThemeToggle />

        <NotificationBell initialCount={unreadCount} />

        {/* App switcher */}
        {apps.length > 0 && (
          <form action={selectApp} className="flex items-center">
            <select
              name="app_id"
              defaultValue={selectedApp?.id}
              className="bg-card border border-edge/60 rounded-lg px-2 lg:px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent cursor-pointer max-w-[110px] sm:max-w-none input-enhanced"
            >
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="ms-2 p-1.5 text-gray-400 border border-edge/60 rounded-lg hover:text-accent hover:bg-accent/10 hover:border-accent/30 transition-all"
              title="Switch app"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Owner dropdown */}
        <details className="relative">
          <summary className="list-none flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors [&::-webkit-details-marker]:hidden">
            {owner.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={owner.avatar_url} alt="" className="w-7 h-7 rounded-full ring-2 ring-accent/20" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold ring-2 ring-accent/20">
                {(owner.name || owner.email)[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-300 max-w-[120px] truncate hidden sm:block">
              {owner.name || owner.email}
            </span>
          </summary>
          <div className="absolute end-0 mt-2 w-52 glass-strong rounded-xl shadow-2xl overflow-hidden z-30 border border-accent/10">
            <div className="px-4 py-3 border-b border-edge/50 bg-accent/[0.03]">
              <p className="text-sm text-white font-medium truncate">{owner.name || '—'}</p>
              <p className="text-xs text-gray-500 truncate">{owner.email}</p>
            </div>
            <div className="p-1.5">
              <Link href="/account" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-300 hover:bg-accent/[0.06] hover:text-white transition-colors">
                <UserCog className="w-4 h-4" /> Account Settings
              </Link>
              <Link href="/shop" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-300 hover:bg-accent/[0.06] hover:text-white transition-colors">
                <CreditCard className="w-4 h-4" /> Billing
              </Link>
              <form action={logOut}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </form>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
