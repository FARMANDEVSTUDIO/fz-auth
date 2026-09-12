'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { query } from '@/lib/db';
import { fireWebhooks } from '@/lib/webhooks';
import bcrypt from 'bcryptjs';

export async function banUser(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  const reason = String(formData.get('reason') || 'Banned from panel');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !username) return;

  await query(
    'UPDATE users SET banned=true, ban_reason=$1 WHERE app_id=$2 AND username=$3',
    [reason, appId, username]
  );
  fireWebhooks(appId, 'user.ban', { username, reason });
  revalidatePath('/users');
}

export async function unbanUser(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !username) return;

  await query(
    'UPDATE users SET banned=false, ban_reason=NULL WHERE app_id=$1 AND username=$2',
    [appId, username]
  );
  fireWebhooks(appId, 'user.unban', { username });
  revalidatePath('/users');
}

export async function resetHwid(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !username) return;

  await query(
    'UPDATE users SET hwid=NULL WHERE app_id=$1 AND username=$2',
    [appId, username]
  );
  revalidatePath('/users');
}

export async function addTime(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  const durationStr = String(formData.get('duration') || '30d');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !username) return;

  const seconds = parseDuration(durationStr);
  await query(
    `UPDATE users SET expiry = GREATEST(expiry, now()) + ($1 || ' seconds')::interval
     WHERE app_id=$2 AND username=$3`,
    [seconds, appId, username]
  );
  revalidatePath('/users');
}

export async function deleteUser(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !username) return;

  await query('DELETE FROM users WHERE app_id=$1 AND username=$2', [appId, username]);
  revalidatePath('/users');
}

function parseDuration(str: string): number {
  if (str.toLowerCase() === 'lifetime') return 315360000;
  const m = str.match(/^(\d+)\s*(m|h|d|w|y)$/i);
  if (!m) return 30 * 86400;
  const n = parseInt(m[1]);
  const unit = m[2].toLowerCase();
  const map: Record<string, number> = { m: 60, h: 3600, d: 86400, w: 604800, y: 31536000 };
  return n * (map[unit] || 86400);
}

export type ActionResult = { ok: boolean; message: string };

export async function createUser(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  const expiryStr = String(formData.get('expiry') || '30d');
  const hwidLocked = formData.get('hwid_lock') === 'on';
  if (!username || !password) return { ok: false, message: 'Username and password are required' };

  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return { ok: false, message: 'Application not found' };

  const dup = await query(
    'SELECT 1 FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
    [appId, username]
  );
  if ((dup.rowCount ?? 0) > 0) {
    return { ok: false, message: `Username "${username}" already exists in this app` };
  }

  const hash = await bcrypt.hash(password, 10);
  const isLifetime = expiryStr.toLowerCase() === 'lifetime';
  const seconds = parseDuration(expiryStr);
  const expiry = isLifetime ? null : new Date(Date.now() + seconds * 1000);

  try {
    await query(
      'INSERT INTO users (app_id, username, password_hash, expiry, hwid_locked) VALUES ($1,$2,$3,$4,$5)',
      [appId, username, hash, expiry, hwidLocked]
    );
  } catch {
    return { ok: false, message: `Username "${username}" already exists in this app` };
  }
  revalidatePath('/users');
  return { ok: true, message: `User "${username}" created successfully` };
}

export async function toggleSuspend(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !username) return;

  await query(
    'UPDATE users SET suspended = NOT COALESCE(suspended, false) WHERE app_id=$1 AND username=$2',
    [appId, username]
  );
  revalidatePath('/users');
}

export async function toggleHwidLock(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !username) return;

  await query(
    'UPDATE users SET hwid_locked = NOT COALESCE(hwid_locked, true) WHERE app_id=$1 AND username=$2',
    [appId, username]
  );
  revalidatePath('/users');
}
