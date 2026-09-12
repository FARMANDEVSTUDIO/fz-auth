'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { signOut } from '@/auth';
import { requireOwner } from '@/lib/session';
import { query } from '@/lib/db';
import { getOwnedApp, SELECTED_APP_COOKIE } from '@/lib/apps';
import { getOwnerPlan, canCreateApp } from '@/lib/plans';

export async function selectApp(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (app) {
    cookies().set(SELECTED_APP_COOKIE, app.id, { httpOnly: true, sameSite: 'lax' });
  }
  revalidatePath('/', 'layout');
}

export type ActionResult = { ok: boolean; message: string };

export async function createApp(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const name = String(formData.get('name') || '').trim();
  if (!name) return { ok: false, message: 'Application name is required' };

  const plan = getOwnerPlan(owner);
  const countRes = await query('SELECT COUNT(*)::int AS c FROM apps WHERE owner_id=$1', [owner.id]);
  const appCount = countRes.rows[0].c;
  if (!canCreateApp(appCount, plan)) {
    return { ok: false, message: 'App limit reached for your plan. Upgrade to create more apps.' };
  }

  const nameExists = await query(
    'SELECT 1 FROM apps WHERE owner_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1',
    [owner.id, name]
  );
  if ((nameExists.rowCount ?? 0) > 0) {
    return { ok: false, message: `Application "${name}" already exists` };
  }

  const secret = crypto.randomBytes(24).toString('hex');
  const adminKey = crypto.randomBytes(24).toString('hex');

  try {
    const r = await query(
      `INSERT INTO apps (name, owner_id, secret, admin_key, version) VALUES ($1,$2,$3,$4,'1.0') RETURNING id`,
      [name, owner.id, secret, adminKey]
    );
    if (r.rows[0]) {
      cookies().set(SELECTED_APP_COOKIE, r.rows[0].id, { httpOnly: true, sameSite: 'lax' });
    }
  } catch {
    return { ok: false, message: `Application "${name}" already exists` };
  }
  revalidatePath('/', 'layout');
  return { ok: true, message: `Application "${name}" created successfully` };
}

export async function renameApp(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const name = String(formData.get('name') || '').trim();
  if (!name) return { ok: false, message: 'Name is required' };
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return { ok: false, message: 'Application not found' };

  const dup = await query(
    'SELECT 1 FROM apps WHERE owner_id=$1 AND LOWER(name)=LOWER($2) AND id!=$3 LIMIT 1',
    [owner.id, name, appId]
  );
  if ((dup.rowCount ?? 0) > 0) {
    return { ok: false, message: `Application "${name}" already exists` };
  }

  try {
    await query('UPDATE apps SET name=$1 WHERE id=$2 AND owner_id=$3', [name, appId, owner.id]);
  } catch {
    return { ok: false, message: `Application "${name}" already exists` };
  }
  revalidatePath('/', 'layout');
  return { ok: true, message: `Renamed to "${name}"` };
}

export async function toggleAppStatus(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;
  const next = app.status === 'active' ? 'paused' : 'active';
  await query('UPDATE apps SET status=$1 WHERE id=$2 AND owner_id=$3', [next, appId, owner.id]);
  revalidatePath('/', 'layout');
}

export async function deleteApp(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;
  await query('DELETE FROM apps WHERE id=$1 AND owner_id=$2', [appId, owner.id]);
  if (cookies().get(SELECTED_APP_COOKIE)?.value === appId) {
    cookies().delete(SELECTED_APP_COOKIE);
  }
  revalidatePath('/', 'layout');
}

export async function refreshSecret(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;
  const secret = crypto.randomBytes(24).toString('hex');
  await query('UPDATE apps SET secret=$1 WHERE id=$2 AND owner_id=$3', [secret, appId, owner.id]);
  revalidatePath('/dashboard');
}

export async function updateVersion(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const version = String(formData.get('version') || '').trim();
  if (!version) return;
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;
  await query('UPDATE apps SET version=$1 WHERE id=$2 AND owner_id=$3', [version, appId, owner.id]);
  revalidatePath('/dashboard');
}

export async function clearExpired(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;
  await query('DELETE FROM users WHERE app_id=$1 AND expiry < now() AND banned=false', [appId]);
  await query('DELETE FROM licenses WHERE app_id=$1 AND used=true AND expires_at < now()', [appId]);
  await query('DELETE FROM sessions WHERE app_id=$1 AND expires_at < now()', [appId]);
  revalidatePath('/dashboard');
}

export async function logOut() {
  await signOut({ redirectTo: '/login' });
}
