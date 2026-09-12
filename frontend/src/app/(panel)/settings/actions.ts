'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getOwnedApp } from '@/lib/apps';
import { query } from '@/lib/db';

export async function updateSettings(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  const patch: Record<string, unknown> = {};
  const allKeys = Array.from(formData.keys());
  const toggleKeys = new Set(allKeys.filter(k => k.startsWith('toggle_')));

  for (const key of allKeys) {
    if (key.startsWith('cfg_')) {
      patch[key.slice(4)] = Number(formData.get(key)) || 0;
    }
  }
  for (const key of Array.from(toggleKeys)) {
    const vals = formData.getAll(key);
    patch[key.slice(7)] = vals.includes('on');
  }

  if (Object.keys(patch).length === 0) return;

  await query(
    `UPDATE apps SET settings = settings || $1::jsonb WHERE id = $2 AND owner_id = $3`,
    [JSON.stringify(patch), appId, owner.id]
  );
  revalidatePath('/settings', 'layout');
}

export async function updateMessages(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  const messages: Record<string, string> = {};
  const keys = [
    'app_disabled', 'blacklisted', 'invalid_license', 'license_used',
    'username_taken', 'banned', 'hwid_mismatch',
  ];
  for (const key of keys) {
    const val = formData.get(`msg_${key}`);
    if (val !== null) messages[key] = String(val);
  }

  await query(
    `UPDATE apps SET settings = jsonb_set(COALESCE(settings, '{}'), '{messages}', $1::jsonb) WHERE id = $2 AND owner_id = $3`,
    [JSON.stringify(messages), appId, owner.id]
  );
  revalidatePath('/settings/messages');
}

export async function updateFunctions(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  const functions: Record<string, boolean> = {};
  const keys = [
    'register', 'login', 'license', 'check_session',
    'hwid_lock', 'blacklist', 'logging',
  ];
  for (const key of keys) {
    const vals = formData.getAll(`fn_${key}`);
    functions[key] = vals.includes('on');
  }

  await query(
    `UPDATE apps SET settings = jsonb_set(COALESCE(settings, '{}'), '{functions}', $1::jsonb) WHERE id = $2 AND owner_id = $3`,
    [JSON.stringify(functions), appId, owner.id]
  );
  revalidatePath('/settings/functions');
}
