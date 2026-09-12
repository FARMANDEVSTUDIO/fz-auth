'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { query } from '@/lib/db';

export async function addVariable(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const key = String(formData.get('key') || '').trim();
  const value = String(formData.get('value') || '').trim();
  if (!key) return;

  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;

  await query(
    `INSERT INTO app_variables (app_id, var_key, var_value) VALUES ($1,$2,$3) ON CONFLICT (app_id, var_key) DO UPDATE SET var_value = EXCLUDED.var_value`,
    [appId, key, value]
  );
  revalidatePath('/variables');
}

export async function deleteVariable(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const varId = String(formData.get('var_id') || '');

  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;

  await query('DELETE FROM app_variables WHERE id=$1 AND app_id=$2', [varId, appId]);
  revalidatePath('/variables');
}
