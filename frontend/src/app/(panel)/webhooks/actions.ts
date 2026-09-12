'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getOwnedApp } from '@/lib/apps';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function addWebhook(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const url = String(formData.get('url') || '').trim();
  const eventsRaw = String(formData.get('events') || '').trim();
  if (!url) return;

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  const events = eventsRaw.split(',').map(e => e.trim()).filter(Boolean);
  const secret = crypto.randomBytes(16).toString('hex');

  await query(
    `INSERT INTO webhooks (app_id, url, events, secret) VALUES ($1,$2,$3,$4)`,
    [appId, url, events, secret]
  );
  revalidatePath('/webhooks');
}

export async function toggleWebhook(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const webhookId = String(formData.get('webhook_id') || '');

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await query(
    'UPDATE webhooks SET active = NOT active WHERE id=$1 AND app_id=$2',
    [webhookId, appId]
  );
  revalidatePath('/webhooks');
}

export async function deleteWebhook(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const webhookId = String(formData.get('webhook_id') || '');

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await query('DELETE FROM webhooks WHERE id=$1 AND app_id=$2', [webhookId, appId]);
  revalidatePath('/webhooks');
}
