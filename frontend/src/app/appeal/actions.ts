'use server';

import { query } from '@/lib/db';
import { verifyTurnstile } from '@/lib/turnstile';

export async function submitAppeal(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const appId = (formData.get('app_id') as string)?.trim();
  const username = (formData.get('username') as string)?.trim();
  const reason = (formData.get('reason') as string)?.trim();
  const cfToken = (formData.get('cf_token') as string) || '';

  if (!appId || !username || !reason) return { ok: false, message: 'All fields are required' };

  const cfOk = await verifyTurnstile(cfToken);
  if (!cfOk) return { ok: false, message: 'CAPTCHA verification failed. Please try again.' };
  if (reason.length < 10) return { ok: false, message: 'Please provide more detail (at least 10 characters)' };

  const appCheck = await query('SELECT id FROM apps WHERE id=$1 LIMIT 1', [appId]);
  if (appCheck.rows.length === 0) return { ok: false, message: 'Invalid Application ID' };

  const userCheck = await query(
    'SELECT banned FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
    [appId, username]
  );
  if (userCheck.rows.length === 0) return { ok: false, message: 'User not found in this application' };
  if (!userCheck.rows[0].banned) return { ok: false, message: 'This user is not banned' };

  const existing = await query(
    "SELECT id FROM ban_appeals WHERE app_id=$1 AND LOWER(username)=LOWER($2) AND status='pending' LIMIT 1",
    [appId, username]
  );
  if (existing.rows.length > 0) return { ok: false, message: 'You already have a pending appeal' };

  await query(
    'INSERT INTO ban_appeals (app_id, username, reason) VALUES ($1, $2, $3)',
    [appId, username, reason]
  );

  return { ok: true, message: 'Appeal submitted successfully' };
}
