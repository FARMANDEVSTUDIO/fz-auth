import { requireOwner } from '@/lib/session';
import { getSelectedApp } from '@/lib/apps';
import { updateMessages } from '../actions';

export const dynamic = 'force-dynamic';

const MESSAGE_KEYS = [
  { key: 'app_disabled', label: 'App Disabled', placeholder: 'App is paused', desc: 'Shown when the app is disabled/paused' },
  { key: 'blacklisted', label: 'Blacklisted', placeholder: 'You are blacklisted', desc: 'Shown when HWID or IP is blacklisted' },
  { key: 'invalid_license', label: 'Invalid License', placeholder: 'Invalid license key', desc: 'Shown when an invalid key is entered' },
  { key: 'license_used', label: 'License Used', placeholder: 'License key already used', desc: 'Shown when a used key is entered' },
  { key: 'username_taken', label: 'Username Taken', placeholder: 'Username already taken', desc: 'Shown during registration if username exists' },
  { key: 'banned', label: 'Banned', placeholder: 'Banned: {reason}', desc: 'Shown when a banned user tries to login' },
  { key: 'hwid_mismatch', label: 'HWID Mismatch', placeholder: 'HWID mismatch. Contact support to reset.', desc: 'Shown when hardware ID doesn\'t match' },
];

export default async function MessagesPage() {
  const owner = await requireOwner();
  const app = await getSelectedApp(owner.id);
  if (!app) return null;

  const messages = ((app.settings as Record<string, unknown>)?.messages || {}) as Record<string, string>;

  return (
    <form action={updateMessages}>
      <input type="hidden" name="app_id" value={app.id} />

      <div className="bg-card border border-edge rounded-xl">
        <div className="px-5 py-4 border-b border-edge">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <i className="ri-chat-settings-line text-accent" /> Custom Messages
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Customize the error messages your application returns. Leave blank to use defaults.
          </p>
        </div>
        <div className="p-5 space-y-5">
          {MESSAGE_KEYS.map(item => (
            <div key={item.key}>
              <label className="block text-xs font-semibold text-white mb-1">
                {item.label}
              </label>
              <p className="text-[11px] text-gray-500 mb-2">{item.desc}</p>
              <input
                type="text"
                name={`msg_${item.key}`}
                defaultValue={messages[item.key] || ''}
                placeholder={item.placeholder}
                className="w-full bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent2 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        <i className="ri-save-line" /> Save Messages
      </button>
    </form>
  );
}
