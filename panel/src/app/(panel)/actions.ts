'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { signOut } from '@/auth';
import { requireOwner } from '@/lib/session';
import { query } from '@/lib/db';
import { getOwnedApp, SELECTED_APP_COOKIE } from '@/lib/apps';
import { createAppViaApi } from '@/lib/fzapi';

export async function selectApp(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getOwnedApp(owner.id, appId);
  if (app) {
    cookies().set(SELECTED_APP_COOKIE, app.id, { httpOnly: true, sameSite: 'lax' });
  }
  revalidatePath('/', 'layout');
}

export async function createApp(formData: FormData) {
  const owner = await requireOwner();
  const name = String(formData.get('name') || '').trim();
  if (!name) return;
  const res = await createAppViaApi(name, owner.id);
  if (res?.success && res.app?.app_id) {
    cookies().set(SELECTED_APP_COOKIE, res.app.app_id, { httpOnly: true, sameSite: 'lax' });
  }
  revalidatePath('/', 'layout');
}

export async function renameApp(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const name = String(formData.get('name') || '').trim();
  if (!name) return;
  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;
  await query('UPDATE apps SET name=$1 WHERE id=$2 AND owner_id=$3', [name, appId, owner.id]);
  revalidatePath('/', 'layout');
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

export async function logOut() {
  await signOut({ redirectTo: '/login' });
}

export async function goTo(path: string) {
  redirect(path);
}
