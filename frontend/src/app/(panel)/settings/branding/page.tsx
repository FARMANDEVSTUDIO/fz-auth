import { getPageData } from '@/lib/page-data';
import { updateBranding } from './actions';
import MotionCard from '@/components/MotionCard';
import BrandingPreview from '@/components/BrandingPreview';
import ColorPickerSync from '@/components/ColorPickerSync';
import { Paintbrush, Save } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BrandingPage() {
  const { selected: app } = await getPageData();
  if (!app) return null;

  const s = (app.settings || {}) as Record<string, unknown>;
  const branding = (s.branding || {}) as Record<string, string>;

  return (
    <form action={updateBranding}>
      <input type="hidden" name="app_id" value={app.id} />
      <div className="space-y-6">
        <MotionCard delay={0} className="glass rounded-xl">
          <div className="px-5 py-4 border-b border-edge/50 section-header">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-accent" /> App Branding
            </h3>
            <p className="text-xs text-gray-500 mt-1">Customize how your app appears to end users via the API</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5">
                <span className="w-1 h-1 rounded-full bg-accent/40" />Display Name
              </label>
              <input
                type="text"
                name="app_name"
                defaultValue={branding.app_name || ''}
                placeholder={app.name}
                maxLength={100}
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors input-enhanced"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5">
                <span className="w-1 h-1 rounded-full bg-accent/40" />Accent Color
              </label>
              <ColorPickerSync defaultColor={branding.accent_color || ''} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5">
                <span className="w-1 h-1 rounded-full bg-accent/40" />Logo URL
              </label>
              <input
                type="url"
                name="logo_url"
                defaultValue={branding.logo_url || ''}
                placeholder="https://example.com/logo.png"
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors input-enhanced"
              />
              <p className="text-[10px] text-gray-600 mt-1">Direct URL to an image (PNG, SVG, or JPG recommended)</p>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent/60 font-semibold mb-1.5">
                <span className="w-1 h-1 rounded-full bg-accent/40" />Support URL
              </label>
              <input
                type="url"
                name="support_url"
                defaultValue={branding.support_url || ''}
                placeholder="https://support.example.com"
                className="w-full bg-bg border border-edge/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors input-enhanced"
              />
            </div>
          </div>
        </MotionCard>

        <BrandingPreview
          appName={branding.app_name || app.name}
          accentColor={branding.accent_color || '#8b5cf6'}
          logoUrl={branding.logo_url || ''}
          supportUrl={branding.support_url || ''}
        />

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 btn-gradient text-white rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save className="w-4 h-4" /> Save Branding
        </button>
      </div>
    </form>
  );
}
