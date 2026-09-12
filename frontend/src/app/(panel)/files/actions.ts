'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getOwnedApp } from '@/lib/apps';
import { query } from '@/lib/db';

export async function addFile(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const filename = String(formData.get('filename') || '').trim();
  const url = String(formData.get('url') || '').trim();
  if (!filename) return;

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await query(
    `INSERT INTO app_files (app_id, filename, url) VALUES ($1,$2,$3)
     ON CONFLICT (app_id, filename) DO UPDATE SET url = EXCLUDED.url`,
    [appId, filename, url || null]
  );
  revalidatePath('/files');
}

export async function deleteFile(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const fileId = String(formData.get('file_id') || '');

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await query('DELETE FROM app_files WHERE id=$1 AND app_id=$2', [fileId, appId]);
  revalidatePath('/files');
}
