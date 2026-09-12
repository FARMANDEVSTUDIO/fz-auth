'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getOwnedApp } from '@/lib/apps';
import { query } from '@/lib/db';

function parseDuration(str: string): number {
  const m = str.match(/^(\d+)\s*(m|h|d|w|y|lifetime)$/i);
  if (!m) return 0;
  const n = parseInt(m[1]);
  const unit = m[2].toLowerCase();
  const map: Record<string, number> = { m: 60, h: 3600, d: 86400, w: 604800, y: 31536000, lifetime: 315360000 };
  return n * (map[unit] || 0);
}

export async function addSubscription(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const name = String(formData.get('name') || '').trim();
  const level = parseInt(String(formData.get('level') || '1')) || 1;
  const duration = String(formData.get('duration') || '30d');
  const price = parseInt(String(formData.get('price') || '0')) || 0;
  if (!name) return;

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  const seconds = parseDuration(duration);

  await query(
    `INSERT INTO subscriptions (app_id, name, level, duration_seconds, price_credits) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (app_id, name) DO UPDATE SET level = EXCLUDED.level, duration_seconds = EXCLUDED.duration_seconds, price_credits = EXCLUDED.price_credits`,
    [appId, name, level, seconds, price]
  );
  revalidatePath('/subscriptions');
}

export async function deleteSubscription(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const subId = String(formData.get('sub_id') || '');

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await query('DELETE FROM subscriptions WHERE id=$1 AND app_id=$2', [subId, appId]);
  revalidatePath('/subscriptions');
}
