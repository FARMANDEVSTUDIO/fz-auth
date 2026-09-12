import Topbar from '@/components/Topbar';
import SettingsTabs from '@/components/SettingsTabs';
import { getPageData } from '@/lib/page-data';

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { owner, apps, selected } = await getPageData();

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Settings" />
      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {!selected ? (
          <div className="glass rounded-xl p-10 text-center text-gray-500">
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
