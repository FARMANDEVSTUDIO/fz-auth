import { requireOwner } from '@/lib/session';
import { getSelectedApp } from '@/lib/apps';
import { updateSettings } from './actions';
import ToggleRow from '@/components/ToggleRow';

export const dynamic = 'force-dynamic';

export default async function AppConfigPage() {
  const owner = await requireOwner();
  const app = await getSelectedApp(owner.id);
  if (!app) return null;

  const s = (app.settings || {}) as Record<string, unknown>;

  const accessControls = [
    { key: 'app_status', label: 'App Status', desc: 'Enable or disable the entire application for end users', defaultOn: true },
    { key: 'hwid_lock', label: 'HWID Lock', desc: 'Bind users to a single hardware ID on first login', defaultOn: true },
    { key: 'force_hwid', label: 'Force HWID', desc: 'Require HWID on every login/license request', defaultOn: false },
    { key: 'block_vpn', label: 'Block VPNs', desc: 'Block connections from known VPN/proxy IP ranges', defaultOn: false },
    { key: 'hash_check', label: 'Hash Check', desc: 'Verify application integrity hash on init', defaultOn: false },
    { key: 'block_leaked_passwords', label: 'Block Leaked Passwords', desc: 'Reject passwords found in known breach databases', defaultOn: false },
    { key: 'token_validation', label: 'Token Validation', desc: 'Validate session token on every API call', defaultOn: true },
  ];

  const sessionConfig = [
    { key: 'session_hours', label: 'Session Duration (hours)', type: 'number' as const, defaultVal: '24' },
    { key: 'max_sessions', label: 'Max Active Sessions', type: 'number' as const, defaultVal: '0' },
  ];

  const security = [
    { key: 'min_hwid_length', label: 'Min HWID Length', type: 'number' as const, defaultVal: '0' },
    { key: 'hwid_reset_cooldown', label: 'HWID Reset Cooldown (hours)', type: 'number' as const, defaultVal: '0' },
    { key: 'min_username_length', label: 'Min Username Length', type: 'number' as const, defaultVal: '3' },
  ];

  return (
    <form action={updateSettings}>
      <input type="hidden" name="app_id" value={app.id} />

      <div className="space-y-6">
        {/* Access Controls */}
        <div className="bg-card border border-edge rounded-xl">
          <div className="px-5 py-4 border-b border-edge">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <i className="ri-shield-check-line text-accent" /> Access Controls
            </h3>
          </div>
          <div className="divide-y divide-edge">
            {accessControls.map(item => (
              <ToggleRow
                key={item.key}
                name={`toggle_${item.key}`}
                label={item.label}
                description={item.desc}
                defaultChecked={s[item.key] !== undefined ? !!s[item.key] : item.defaultOn}
              />
            ))}
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-card border border-edge rounded-xl">
          <div className="px-5 py-4 border-b border-edge">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <i className="ri-time-line text-accent" /> Session Management
            </h3>
            <p className="text-xs text-gray-500 mt-1">Set 0 for unlimited</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sessionConfig.map(item => (
              <div key={item.key}>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  {item.label}
                </label>
                <input
                  type="number"
                  name={`cfg_${item.key}`}
                  defaultValue={String(s[item.key] ?? item.defaultVal)}
                  min={0}
                  className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-edge rounded-xl">
          <div className="px-5 py-4 border-b border-edge">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <i className="ri-lock-line text-accent" /> Security
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {security.map(item => (
              <div key={item.key}>
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
                  {item.label}
                </label>
                <input
                  type="number"
                  name={`cfg_${item.key}`}
                  defaultValue={String(s[item.key] ?? item.defaultVal)}
                  min={0}
                  className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>
        </div>

        <SaveButton />
      </div>
    </form>
  );
}

function SaveButton() {
  return (
    <button
      type="submit"
      className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent2 text-white rounded-xl text-sm font-semibold transition-colors"
    >
      <i className="ri-save-line" /> Save Changes
    </button>
  );
}
