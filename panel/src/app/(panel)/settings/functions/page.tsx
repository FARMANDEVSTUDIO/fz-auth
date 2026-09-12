import { requireOwner } from '@/lib/session';
import { getSelectedApp } from '@/lib/apps';
import { updateFunctions } from '../actions';
import ToggleRow from '@/components/ToggleRow';

export const dynamic = 'force-dynamic';

const FUNCTIONS = [
  { key: 'register', label: 'Register', desc: 'Allow new users to register with username + password + license key', defaultOn: true },
  { key: 'login', label: 'Login', desc: 'Allow existing users to log in with username + password', defaultOn: true },
  { key: 'license', label: 'License (Key-Only)', desc: 'Allow license-key-only authentication without creating an account', defaultOn: true },
  { key: 'check_session', label: 'Check Session', desc: 'Allow clients to validate session tokens via /api/check', defaultOn: true },
  { key: 'hwid_lock', label: 'HWID Lock', desc: 'Bind users and license keys to their hardware ID on first use', defaultOn: true },
  { key: 'blacklist', label: 'Blacklist Enforcement', desc: 'Enforce HWID and IP blacklist checks on all requests', defaultOn: true },
  { key: 'logging', label: 'Audit Logging', desc: 'Log all login, register, and license events for review', defaultOn: true },
];

export default async function FunctionsPage() {
  const owner = await requireOwner();
  const app = await getSelectedApp(owner.id);
  if (!app) return null;

  const fns = ((app.settings as Record<string, unknown>)?.functions || {}) as Record<string, boolean>;

  return (
    <form action={updateFunctions}>
      <input type="hidden" name="app_id" value={app.id} />

      <div className="bg-card border border-edge rounded-xl">
        <div className="px-5 py-4 border-b border-edge">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <i className="ri-toggle-line text-accent" /> Functions
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Enable or disable individual API capabilities. Disabled functions will return an error to clients.
          </p>
        </div>
        <div className="divide-y divide-edge">
          {FUNCTIONS.map(item => (
            <ToggleRow
              key={item.key}
              name={`fn_${item.key}`}
              label={item.label}
              description={item.desc}
              defaultChecked={fns[item.key] !== undefined ? fns[item.key] : item.defaultOn}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent2 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        <i className="ri-save-line" /> Save Functions
      </button>
    </form>
  );
}
