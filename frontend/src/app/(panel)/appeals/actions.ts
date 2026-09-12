'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { query } from '@/lib/db';

export async function approveAppeal(formData: FormData) {
  const owner = await requireOwner();
  const appealId = String(formData.get('appeal_id') || '');
  const appId = String(formData.get('app_id') || '');
  const username = String(formData.get('username') || '');
  if (!appealId || !appId || !username) return;

  const app = await getAccessibleApp(owner.id, appId);
  if (!app) return;

  await query(
    "UPDATE ban_appeals SET status='approved', resolved_at=NOW() WHERE id=$1",
    [appealId]
  );
  await query(
    'UPDATE users SET banned=false, ban_reason=NULL WHERE app_id=$1 AND LOWER(username)=LOWER($2)',
    [appId, username]
  );
  revalidatePath('/appeals');
}

export async function denyAppeal(formData: FormData) {
  const owner = await requireOwner();
  const appealId = String(formData.get('appeal_id') || '');
  if (!appealId) return;

  await query(
    "UPDATE ban_appeals SET status='denied', resolved_at=NOW() WHERE id=$1",
    [appealId]
  );
  revalidatePath('/appeals');
}
