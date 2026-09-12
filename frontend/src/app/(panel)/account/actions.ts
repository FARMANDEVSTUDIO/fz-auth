'use server';

import { revalidatePath } from 'next/cache';
import { signOut } from '@/auth';
import { requireOwner } from '@/lib/session';
import { updateOwnerPassword, deleteOwner } from '@/lib/owners';
import { query } from '@/lib/db';
import { generateSecret, generateBackupCodes, getTotpUri, verifyTotp } from '@/lib/totp';
import { twoFAEnabledEmail } from '@/lib/email-templates';
import { sendMail } from '@/lib/mailer';

export async function updateProfile(formData: FormData) {
  const owner = await requireOwner();
  const name = String(formData.get('name') || '').trim();
  const avatarUrl = String(formData.get('avatar_url') || '').trim();

  if (!name) return;

  await query(
    'UPDATE owners SET name=$1, avatar_url=$2 WHERE id=$3',
    [name, avatarUrl || null, owner.id]
  );
  revalidatePath('/account');
}

export async function changePassword(formData: FormData) {
  const owner = await requireOwner();
  const password = String(formData.get('password') || '');
  const confirm = String(formData.get('confirm') || '');

  if (!password || password.length < 6) return;
  if (password !== confirm) return;

  await updateOwnerPassword(owner.id, password);
  revalidatePath('/account');
}

export async function deleteAccount() {
  const owner = await requireOwner();
  await deleteOwner(owner.id);
  await signOut({ redirectTo: '/login' });
}

export async function setup2FA(): Promise<{ secret: string; uri: string; backupCodes: string[] }> {
  const owner = await requireOwner();
  const secret = generateSecret();
  const backupCodes = generateBackupCodes();
  const uri = getTotpUri(secret, owner.email);

  await query(
    'UPDATE owners SET totp_secret=$1, totp_backup_codes=$2 WHERE id=$3',
    [secret, JSON.stringify(backupCodes), owner.id]
  );

  return { secret, uri, backupCodes };
}

export async function verify2FASetup(code: string): Promise<{ ok: boolean; message: string }> {
  const owner = await requireOwner();
  const res = await query('SELECT totp_secret FROM owners WHERE id=$1', [owner.id]);
  const secret = res.rows[0]?.totp_secret;
  if (!secret) return { ok: false, message: 'No 2FA setup in progress' };

  if (!verifyTotp(secret, code)) {
    return { ok: false, message: 'Invalid code. Please try again.' };
  }

  await query('UPDATE owners SET totp_enabled=true WHERE id=$1', [owner.id]);

  // Send 2FA enabled confirmation email (non-blocking)
  try {
    const template = twoFAEnabledEmail();
    sendMail({ to: owner.email, subject: template.subject, html: template.html })
      .catch((err: unknown) => console.error('Failed to send 2FA email:', err));
  } catch {
    // Don't block 2FA setup if email fails
  }

  revalidatePath('/account');
  return { ok: true, message: '2FA enabled successfully!' };
}

export async function disable2FA(code: string): Promise<{ ok: boolean; message: string }> {
  const owner = await requireOwner();
  const res = await query('SELECT totp_secret, totp_enabled FROM owners WHERE id=$1', [owner.id]);
  const row = res.rows[0];
  if (!row?.totp_enabled) return { ok: false, message: '2FA is not enabled' };

  if (!verifyTotp(row.totp_secret, code)) {
    return { ok: false, message: 'Invalid code' };
  }

  await query(
    'UPDATE owners SET totp_enabled=false, totp_secret=NULL, totp_backup_codes=NULL WHERE id=$1',
    [owner.id]
  );
  revalidatePath('/account');
  return { ok: true, message: '2FA disabled' };
}
