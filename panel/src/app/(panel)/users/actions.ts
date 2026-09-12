'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { callAdmin } from '@/lib/fzapi';

async function userAction(
  formData: FormData,
  path: string,
  extra: (fd: FormData) => Record<string, unknown> = () => ({})
) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app || !username) return;

  await callAdmin(app.admin_key, app.id, path, { username, ...extra(formData) });
  revalidatePath('/users');
}

export async function banUser(formData: FormData) {
  await userAction(formData, 'ban', fd => ({
    reason: String(fd.get('reason') || 'Banned from panel'),
  }));
}

export async function unbanUser(formData: FormData) {
  await userAction(formData, 'unban');
}

export async function resetHwid(formData: FormData) {
  await userAction(formData, 'resethwid');
}

export async function addTime(formData: FormData) {
  await userAction(formData, 'addtime', fd => ({
    duration: String(fd.get('duration') || '30d'),
  }));
}

export async function deleteUser(formData: FormData) {
  await userAction(formData, 'deluser');
}
