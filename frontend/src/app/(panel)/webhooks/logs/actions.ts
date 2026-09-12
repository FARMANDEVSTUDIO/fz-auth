'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getAccessibleApp } from '@/lib/apps';
import { retryWebhookDelivery, getWebhookLogById } from '@/lib/webhooks';

export async function retryWebhook(formData: FormData) {
  const owner = await requireOwner();
  const logId = parseInt(String(formData.get('log_id') || ''), 10);
  if (isNaN(logId)) return;

  // Verify the log belongs to an app the user owns
  const log = await getWebhookLogById(logId);
  if (!log) return;

  const app = await getAccessibleApp(owner.id, log.app_id);
  if (!app) return;

  await retryWebhookDelivery(logId);
  revalidatePath('/webhooks/logs');
}
