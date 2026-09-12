'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { callAdmin } from '@/lib/fzapi';

// Generated keys are passed back to the page via a cookie-less approach:
// we stash them in a short-lived in-memory map keyed by owner id. For Phase A
// simplicity we instead return them via redirect with revalidation — the
// generated keys also appear at the top of the list (newest first).
export async function generateKeys(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;

  const amount = Math.min(Math.max(parseInt(String(formData.get('amount') || '1'), 10) || 1, 1), 100);
  const duration = String(formData.get('duration') || '30d').trim();
  const level = parseInt(String(formData.get('level') || '1'), 10) || 1;
  const prefix = String(formData.get('prefix') || '').trim();

  await callAdmin(app.admin_key, app.id, 'keys', {
    amount,
    duration,
    level,
    prefix: prefix || undefined,
    created_by: owner.email,
  });
  revalidatePath('/licenses');
}

export async function deleteKey(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const licenseKey = String(formData.get('license_key') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !licenseKey) return;

  await callAdmin(app.admin_key, app.id, 'delkey', { license_key: licenseKey });
  revalidatePath('/licenses');
}
