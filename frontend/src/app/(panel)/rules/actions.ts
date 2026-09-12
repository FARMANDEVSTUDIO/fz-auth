'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { query } from '@/lib/db';

export async function addBlacklist(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const type = String(formData.get('type') || 'hwid');
  const value = String(formData.get('value') || '').trim();
  const reason = String(formData.get('reason') || '').trim();
  if (!value) return;

  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;

  await query(
    `INSERT INTO blacklist (app_id, type, value, reason) VALUES ($1,$2,$3,$4) ON CONFLICT (app_id, type, value) DO NOTHING`,
    [appId, type, value, reason || null]
  );
  revalidatePath('/rules');
}

export async function removeBlacklist(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const entryId = String(formData.get('entry_id') || '');

  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;

  await query('DELETE FROM blacklist WHERE id=$1 AND app_id=$2', [entryId, appId]);
  revalidatePath('/rules');
}
