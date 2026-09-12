'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/session';
import { getOwnedApp } from '@/lib/apps';
import { query } from '@/lib/db';

export async function inviteMember(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const email = String(formData.get('email') || '').trim();
  const role = String(formData.get('role') || 'staff');
  if (!email) return;

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  const memberRes = await query('SELECT id FROM owners WHERE email=$1 LIMIT 1', [email]);
  if (memberRes.rowCount === 0) return;

  const accountId = memberRes.rows[0].id;
  await query(
    `INSERT INTO app_members (app_id, account_id, role) VALUES ($1,$2,$3)
     ON CONFLICT (app_id, account_id) DO UPDATE SET role = EXCLUDED.role`,
    [appId, accountId, role]
  );
  revalidatePath('/team');
}

export async function changeRole(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const accountId = String(formData.get('account_id') || '');
  const role = String(formData.get('role') || 'staff');

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await query(
    'UPDATE app_members SET role=$1 WHERE app_id=$2 AND account_id=$3',
    [role, appId, accountId]
  );
  revalidatePath('/team');
}

export async function removeMember(formData: FormData) {
  const owner = await requireOwner();
  const appId = String(formData.get('app_id') || '');
  const accountId = String(formData.get('account_id') || '');

  const app = await getOwnedApp(owner.id, appId);
  if (!app) return;

  await query('DELETE FROM app_members WHERE app_id=$1 AND account_id=$2', [appId, accountId]);
  revalidatePath('/team');
}

export async function generateLinkCode(): Promise<string | null> {
  try {
    const owner = await requireOwner();
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query('DELETE FROM link_codes WHERE account_id=$1', [owner.id]);
    await query(
      'INSERT INTO link_codes (account_id, code, expires_at) VALUES ($1,$2,$3)',
      [owner.id, code, expiresAt]
    );
    return code;
  } catch {
    return null;
  }
}

export async function unlinkDiscord(): Promise<void> {
  const owner = await requireOwner();
  await query('DELETE FROM discord_links WHERE account_id=$1', [owner.id]);
  revalidatePath('/team');
}
