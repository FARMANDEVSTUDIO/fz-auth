'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getOwnedApp } from '@/lib/apps';
import { query } from '@/lib/db';

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const URL_RE = /^https?:\/\/.+/;

export async function updateBranding(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  const logoUrl = String(formData.get('logo_url') || '').trim();
  const accentColor = String(formData.get('accent_color') || '').trim();
  const appName = String(formData.get('app_name') || '').trim();
  const supportUrl = String(formData.get('support_url') || '').trim();

  // Validate
  if (accentColor && !HEX_COLOR_RE.test(accentColor)) {
    return;
  }
  if (logoUrl && !URL_RE.test(logoUrl)) {
    return;
  }
  if (supportUrl && !URL_RE.test(supportUrl)) {
    return;
  }

  const branding: Record<string, string> = {};
  if (logoUrl) branding.logo_url = logoUrl;
  if (accentColor) branding.accent_color = accentColor;
  if (appName) branding.app_name = appName;
  if (supportUrl) branding.support_url = supportUrl;

  await query(
    `UPDATE apps SET settings = jsonb_set(COALESCE(settings, '{}'), '{branding}', $1::jsonb) WHERE id = $2 AND owner_id = $3`,
    [JSON.stringify(branding), appId, owner.id]
  );

  revalidatePath('/settings/branding');
}
