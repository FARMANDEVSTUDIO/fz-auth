'use server';

import crypto from 'crypto';
import { query } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { resetEmail } from '@/lib/email-templates';

const RESET_EXPIRY_MINUTES = 60;

export async function sendResetLink(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return { ok: false, message: 'Email is required' };

  const owner = await query(
    'SELECT id FROM owners WHERE email=$1 AND deleted_at IS NULL AND password_hash IS NOT NULL LIMIT 1',
    [email]
  );

  if ((owner.rowCount ?? 0) === 0) {
    return { ok: true, message: 'If an account exists with that email, a reset link has been sent.' };
  }

  const recent = await query(
    `SELECT COUNT(*) as cnt FROM password_resets WHERE email=$1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [email]
  );
  if (parseInt(recent.rows[0].cnt) >= 3) {
    return { ok: false, message: 'Too many reset attempts. Try again in 1 hour.' };
  }

  await query('DELETE FROM password_resets WHERE email=$1 AND used=FALSE', [email]);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await query(
    'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
    [email, token, expiresAt]
  );

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const template = resetEmail(resetUrl, RESET_EXPIRY_MINUTES);

  try {
    await sendMail({ to: email, subject: template.subject, html: template.html });
  } catch (e) {
    console.error('Failed to send reset email:', e);
    return { ok: false, message: 'Failed to send email. Please try again.' };
  }

  return { ok: true, message: 'If an account exists with that email, a reset link has been sent.' };
}
