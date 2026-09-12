'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getOwnedApp } from '@/lib/apps';
import { callAdmin } from '@/lib/fzapi';
import { query } from '@/lib/db';

const API_URL = process.env.FZAUTH_API_URL || 'http://localhost:3000';

export async function inviteMember(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const email = String(formData.get('email') || '').trim();
  const role = String(formData.get('role') || 'staff');
  if (!email) return;

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await callAdmin(app.admin_key, app.id, 'team/invite', { email, role });
  revalidatePath('/team');
}

export async function changeRole(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const accountId = String(formData.get('account_id') || '');
  const role = String(formData.get('role') || 'staff');

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await callAdmin(app.admin_key, app.id, 'team/role', { account_id: accountId, role });
  revalidatePath('/team');
}

export async function removeMember(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const accountId = String(formData.get('account_id') || '');

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await callAdmin(app.admin_key, app.id, 'team/remove', { account_id: accountId });
  revalidatePath('/team');
}

export async function generateLinkCode() {
  const owner = await requireOwner();

  const res = await fetch(`${API_URL}/admin/link/start`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-master-key': process.env.MASTER_KEY || '',
    },
    body: JSON.stringify({ account_id: owner.id }),
    cache: 'no-store',
  });
  const data = await res.json();
  return data.code || null;
}

export async function unlinkDiscord() {
  const owner = await requireOwner();

  await fetch(`${API_URL}/admin/link/remove`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-master-key': process.env.MASTER_KEY || '',
    },
    body: JSON.stringify({ account_id: owner.id }),
    cache: 'no-store',
  });
  revalidatePath('/team');
}
