import { getPageData } from '@/lib/page-data';
import { updateSettings } from './actions';
import ToggleRow from '@/components/ToggleRow';
import MotionCard from '@/components/MotionCard';
import { ShieldCheck, Clock, Lock, Save, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AppConfigPage() {
  const { owner, selected: app } = await getPageData();
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
    { key: 'session_hours', label: 'Session Duration (hours)', defaultVal: '24' },
    { key: 'max_sessions', label: 'Max Active Sessions', defaultVal: '0' },
  ];

  const security = [
    { key: 'min_hwid_length', label: 'Min HWID Length', defaultVal: '0' },
    { key: 'hwid_reset_cooldown', label: 'HWID Reset Cooldown (hours)', defaultVal: '0' },
    { key: 'min_username_length', label: 'Min Username Length', defaultVal: '3' },
  ];

  return (
    <form action={updateSettings}>
      <input type="hidden" name="app_id" value={app.id} />
      <div className="space-y-6">
        <MotionCard delay={0} className="glass rounded-xl">
          <div className="px-5 py-4 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" /> Access Controls
            </h3>
            <p className="text-xs text-gray-500 mt-1">Configure how users can access your application</p>
          </div>
          <div className="divide-y divide-edge/20">
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
        </MotionCard>

        <MotionCard delay={0.1} className="glass rounded-xl">
          <div className="px-5 py-4 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Session Management
            </h3>
            <p className="text-xs text-gray-500 mt-1">Set 0 for unlimited</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sessionConfig.map(item => (
              <div key={item.key}>
                <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-accent/40" />
                  {item.label}
                </label>
                <input
                  type="number"
                  name={`cfg_${item.key}`}
                  defaultValue={String(s[item.key] ?? item.defaultVal)}
                  min={0}
                  className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors input-enhanced"
                />
              </div>
            ))}
          </div>
        </MotionCard>

        <MotionCard delay={0.2} className="glass rounded-xl">
          <div className="px-5 py-4 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" /> Security
            </h3>
            <p className="text-xs text-gray-500 mt-1">Configure security thresholds and constraints</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {security.map(item => (
              <div key={item.key}>
                <label className="block text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-accent/40" />
                  {item.label}
                </label>
                <input
                  type="number"
                  name={`cfg_${item.key}`}
                  defaultValue={String(s[item.key] ?? item.defaultVal)}
                  min={0}
                  className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors input-enhanced"
                />
              </div>
            ))}
          </div>
        </MotionCard>

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold"
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>
    </form>
  );
}
