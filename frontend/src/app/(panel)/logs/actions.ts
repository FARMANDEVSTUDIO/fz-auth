'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { query } from '@/lib/db';

export async function clearLogs(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;
  await query('DELETE FROM logs WHERE app_id=$1', [appId]);
  revalidatePath('/logs');
}
