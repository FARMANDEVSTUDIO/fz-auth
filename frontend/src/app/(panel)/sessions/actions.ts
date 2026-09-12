'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { query } from '@/lib/db';

export async function killSession(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const sessionId = String(formData.get('session_id') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;
  await query('DELETE FROM sessions WHERE id=$1 AND app_id=$2', [sessionId, appId]);
  revalidatePath('/sessions');
}

export async function killAllSessions(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;
  await query('DELETE FROM sessions WHERE app_id=$1', [appId]);
  revalidatePath('/sessions');
}
