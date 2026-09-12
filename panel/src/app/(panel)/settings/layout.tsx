import Topbar from '@/components/Topbar';
import SettingsTabs from '@/components/SettingsTabs';
import { requireOwner } from '@/lib/session';
import { getAppsForOwner, getSelectedApp } from '@/lib/apps';

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();
  const apps = await getAppsForOwner(owner.id);
  const selected = await getSelectedApp(owner.id);

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Settings" />
      <main className="flex-1 p-6 space-y-6">
        {!selected ? (
          <div className="bg-card border border-edge rounded-xl p-10 text-center text-gray-500">
            <i className="ri-apps-2-line text-3xl mb-3 block" />
            Create an application first on the{' '}
            <a href="/dashboard" className="text-accent hover:underline">Manage Apps</a> page.
          </div>
        ) : (
          <>
            <SettingsTabs />
            {children}
          </>
        )}
      </main>
    </>
  );
}
