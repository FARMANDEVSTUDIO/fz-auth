import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PageTransition from '@/components/PageTransition';
import CommandPalette from '@/components/CommandPalette';
import LanguageRecommend from '@/components/LanguageRecommend';
import NotificationStream from '@/components/NotificationStream';
import { requireOwner } from '@/lib/session';
import { getOwnerPlan, isMasterAdmin } from '@/lib/plans';
import { isMaintenanceMode } from '@/lib/settings';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  const plan = getOwnerPlan(owner);
  const isAdmin = isMasterAdmin(owner.email);

  if (!isAdmin && await isMaintenanceMode()) redirect('/maintenance');

  return (
    <div className="flex min-h-screen relative z-10">
      <CommandPalette />
      <LanguageRecommend />
      <NotificationStream />
      <Sidebar plan={plan} isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col min-w-0 lg:ms-[64px]">
        <PageTransition>
          {children}
        </PageTransition>
        <footer className="px-6 py-4 border-t border-edge/30 mt-auto">
          <p className="text-xs text-gray-600 text-center">Developed by FZ</p>
        </footer>
      </div>
    </div>
  );
}
