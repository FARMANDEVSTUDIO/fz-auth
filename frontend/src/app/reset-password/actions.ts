'use server';

import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function validateToken(token: string): Promise<{ valid: boolean; email?: string }> {
  if (!token || token.length !== 64) return { valid: false };

  const res = await query(
    'SELECT email, expires_at, used FROM password_resets WHERE token=$1 LIMIT 1',
    [token]
  );

  if (res.rows.length === 0) return { valid: false };

  const row = res.rows[0];
  if (row.used) return { valid: false };
  if (new Date(row.expires_at) < new Date()) return { valid: false };

  return { valid: true, email: row.email };
}

export async function resetPassword(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  if (!token) return { ok: false, message: 'Invalid reset token' };
  if (!password || password.length < 8) return { ok: false, message: 'Password must be at least 8 characters' };
  if (password !== confirm) return { ok: false, message: 'Passwords do not match' };

  const { valid, email } = await validateToken(token);
  if (!valid || !email) return { ok: false, message: 'Invalid or expired reset link. Please request a new one.' };

  const hash = await bcrypt.hash(password, 12);

  await query(
    'UPDATE owners SET password_hash=$1 WHERE email=$2 AND deleted_at IS NULL',
    [hash, email]
  );

  await query('UPDATE password_resets SET used=TRUE WHERE token=$1', [token]);

  return { ok: true, message: 'Password reset successfully! You can now login.' };
}
