'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { query } from '@/lib/db';

function parseDuration(str: string): number | null {
  if (str.toLowerCase() === 'lifetime') return 315360000;
  const m = str.match(/^(\d+)\s*(m|h|d|w|y)$/i);
  if (!m) return null;
  const n = parseInt(m[1]);
  const map: Record<string, number> = { m: 60, h: 3600, d: 86400, w: 604800, y: 31536000 };
  return n * (map[m[2].toLowerCase()] || 86400);
}

export type ActionResult = { ok: boolean; message: string };

export async function generateKeys(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return { ok: false, message: 'Application not found' };

  const amount = Math.min(Math.max(parseInt(String(formData.get('amount') || '1'), 10) || 1, 1), 100);
  const durationStr = String(formData.get('duration') || '30d').trim();
  const level = parseInt(String(formData.get('level') || '1'), 10) || 1;
  const prefix = String(formData.get('prefix') || '').trim();

  const durationSeconds = parseDuration(durationStr) || 30 * 86400;

  const values: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (let i = 0; i < amount; i++) {
    const key = (prefix ? prefix + '-' : '') + crypto.randomBytes(16).toString('hex').toUpperCase();
    values.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3})`);
    params.push(appId, key, durationSeconds, level);
    idx += 4;
  }

  await query(
    `INSERT INTO licenses (app_id, license_key, duration_seconds, level) VALUES ${values.join(', ')}`,
    params
  );
  revalidatePath('/licenses');
  return { ok: true, message: `${amount} license key${amount > 1 ? 's' : ''} generated` };
}

export async function deleteKey(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const licenseKey = String(formData.get('license_key') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !licenseKey) return;

  await query('DELETE FROM licenses WHERE app_id=$1 AND license_key=$2', [appId, licenseKey]);
  revalidatePath('/licenses');
}
