import Topbar from '@/components/Topbar';
import CopyButton from '@/components/CopyButton';
import ConfirmSubmit from '@/components/ConfirmSubmit';
import { requireOwner } from '@/lib/session';
import { getAppsForOwner, getSelectedApp } from '@/lib/apps';
import { query } from '@/lib/db';
import { generateKeys, deleteKey } from './actions';

export const dynamic = 'force-dynamic';

interface LicenseRow {
  license_key: string;
  duration_seconds: string;
  level: number;
  used: boolean;
  used_by_name: string | null;
  expires_at: string | null;
  created_at: string;
}

const LIFETIME = 100 * 365 * 24 * 3600;

function fmtDuration(s: number) {
  if (s >= LIFETIME - 1) return 'Lifetime';
  const units: [string, number][] = [['y', 31536000], ['d', 86400], ['h', 3600], ['m', 60], ['s', 1]];
  const parts: string[] = [];
  let rem = Math.floor(s);
  for (const [label, size] of units) {
    if (rem >= size) { const v = Math.floor(rem / size); rem -= v * size; parts.push(`${v}${label}`); }
  }
  return parts.join(' ') || '0s';
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function LicensesPage() {
  const owner = await requireOwner();
  const apps = await getAppsForOwner(owner.id);
  const selected = await getSelectedApp(owner.id);

  let licenses: LicenseRow[] = [];
  if (selected) {
    const r = await query(
      `SELECT l.license_key, l.duration_seconds, l.level, l.used, l.expires_at, l.created_at,
              u.username AS used_by_name
       FROM licenses l
       LEFT JOIN users u ON u.id = l.used_by
       WHERE l.app_id = $1
       ORDER BY l.created_at DESC
       LIMIT 200`,
      [selected.id]
    );
    licenses = r.rows;
  }

  return (
    <>
      <Topbar owner={owner} apps={apps} selectedApp={selected} breadcrumb="Licenses" />

      <main className="flex-1 p-6 space-y-6">
        {!selected ? (
          <div className="bg-card border border-edge rounded-xl p-10 text-center text-gray-500">
            <i className="ri-apps-2-line text-3xl mb-3 block" />
            Create an application first on the{' '}
            <a href="/dashboard" className="text-accent hover:underline">Manage Apps</a> page.
          </div>
        ) : (
          <>
            {/* Generate keys */}
            <div className="bg-card border border-edge rounded-xl">
              <div className="px-5 py-4 border-b border-edge">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <i className="ri-add-circle-line text-accent" /> Generate Keys
                </h3>
              </div>
              <form action={generateKeys} className="p-5 flex flex-wrap gap-3 items-end">
                <input type="hidden" name="app_id" value={selected.id} />
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Amount</label>
                  <input type="number" name="amount" min={1} max={100} defaultValue={1}
                    className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Duration</label>
                  <input type="text" name="duration" defaultValue="30d" placeholder="30d, 1y, lifetime"
                    className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Level</label>
                  <input type="number" name="level" min={1} defaultValue={1}
                    className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Prefix (optional)</label>
                  <input type="text" name="prefix" placeholder="FZ"
                    className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent" />
                </div>
                <button type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent2 text-white rounded-lg text-sm font-semibold transition-colors">
                  <i className="ri-key-2-line" /> Generate
                </button>
              </form>
            </div>

            {/* Keys table */}
            <div className="bg-card border border-edge rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-edge">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <i className="ri-key-2-line text-accent" /> License Keys
                  <span className="text-gray-500 font-normal">({licenses.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge bg-[#101014]">
                      {['Key', 'Duration', 'Level', 'Status', 'Used By', 'Created', ''].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500 italic">No license keys yet</td></tr>
                    ) : licenses.map(l => (
                      <tr key={l.license_key} className="border-b border-edge hover:bg-card2 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-accent text-xs">{l.license_key}</code>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{fmtDuration(Number(l.duration_seconds))}</td>
                        <td className="px-4 py-3 text-gray-400">{l.level}</td>
                        <td className="px-4 py-3">
                          {l.used ? (
                            l.expires_at && new Date(l.expires_at) < new Date()
                              ? <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-yellow-500/15 text-yellow-500">EXPIRED</span>
                              : <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-500/15 text-gray-400">USED</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/15 text-green-500">UNUSED</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{l.used_by_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(l.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            <CopyButton text={l.license_key} />
                            <form action={deleteKey}>
                              <input type="hidden" name="app_id" value={selected.id} />
                              <input type="hidden" name="license_key" value={l.license_key} />
                              <ConfirmSubmit
                                message={`Delete key ${l.license_key}?`}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-edge text-gray-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors"
                              >
                                <i className="ri-delete-bin-line" />
                              </ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
