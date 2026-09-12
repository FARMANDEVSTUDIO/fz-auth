import { selectApp, logOut } from '@/app/(panel)/actions';
import type { App } from '@/lib/apps';
import type { Owner } from '@/lib/owners';

export default function Topbar({
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
  return (
    <header className="h-14 border-b border-edge bg-[#0e0e11] flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">FZ KeyAuth</span>
        <i className="ri-arrow-right-s-line text-gray-600" />
        <span className="text-white font-medium">{breadcrumb}</span>
        {selectedApp && (
          <>
            <i className="ri-arrow-right-s-line text-gray-600" />
            <span className="text-accent">{selectedApp.name}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* App switcher */}
        {apps.length > 0 && (
          <form action={selectApp}>
            <select
              name="app_id"
              defaultValue={selectedApp?.id}
              className="bg-card border border-edge rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-accent cursor-pointer"
            >
              {apps.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="ml-2 px-2.5 py-1.5 text-xs text-gray-400 border border-edge rounded-lg hover:text-white hover:bg-card transition-colors"
              title="Switch app"
            >
              <i className="ri-arrow-left-right-line" />
            </button>
          </form>
        )}

        {/* Owner dropdown */}
        <details className="relative">
          <summary className="list-none flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-card transition-colors [&::-webkit-details-marker]:hidden">
            {owner.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={owner.avatar_url} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
                {(owner.name || owner.email)[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-300 max-w-[140px] truncate">
              {owner.name || owner.email}
            </span>
            <i className="ri-arrow-down-s-line text-gray-500" />
          </summary>
          <div className="absolute right-0 mt-2 w-52 bg-card border border-edge rounded-xl shadow-2xl overflow-hidden z-30">
            <div className="px-4 py-3 border-b border-edge">
              <p className="text-sm text-white font-medium truncate">{owner.name || '—'}</p>
              <p className="text-xs text-gray-500 truncate">{owner.email}</p>
            </div>
            <div className="p-1.5">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 cursor-not-allowed" title="Coming soon">
                <i className="ri-user-settings-line" /> Account Settings
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 cursor-not-allowed" title="Coming soon">
                <i className="ri-bank-card-line" /> Billing
              </div>
              <form action={logOut}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <i className="ri-logout-box-r-line" /> Log Out
                </button>
              </form>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
