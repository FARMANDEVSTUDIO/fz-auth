import { query } from './db';
import bcrypt from 'bcryptjs';

export interface Owner {
  id: string;
  provider: string;
  provider_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  credits: number;
  password_hash: string | null;
  referral_code: string | null;
  referral_count: number;
  referred_by: string | null;
  totp_enabled?: boolean;
  totp_secret?: string | null;
  plan_type?: string | null;
  plan_expires_at?: string | null;
}

export async function upsertOwner(o: {
  provider: string;
  providerId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<Owner> {
  const r = await query(
    `INSERT INTO owners (provider, provider_id, email, name, avatar_url)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, deleted_at = NULL
     RETURNING *`,
    [o.provider, o.providerId, o.email, o.name || null, o.avatarUrl || null]
  );
  return r.rows[0];
}

export async function registerOwner(email: string, password: string, name?: string): Promise<Owner | null> {
  const exists = await query('SELECT 1 FROM owners WHERE email=$1 AND deleted_at IS NULL LIMIT 1', [email]);
  if ((exists.rowCount ?? 0) > 0) return null;

  const deleted = await query('SELECT id FROM owners WHERE email=$1 AND deleted_at IS NOT NULL LIMIT 1', [email]);
  if ((deleted.rowCount ?? 0) > 0) return null;

  const hash = await bcrypt.hash(password, 12);
  const r = await query(
    `INSERT INTO owners (provider, provider_id, email, name, password_hash)
     VALUES ('credentials', $1, $1, $2, $3)
     RETURNING *`,
    [email, name || email.split('@')[0], hash]
  );
  return r.rows[0];
}

export async function verifyOwner(email: string, password: string): Promise<Owner | null> {
  const r = await query('SELECT * FROM owners WHERE email=$1 AND deleted_at IS NULL LIMIT 1', [email]);
  if (r.rowCount === 0) return null;
  const owner = r.rows[0] as Owner;
  if (!owner.password_hash) return null;
  const valid = await bcrypt.compare(password, owner.password_hash);
  return valid ? owner : null;
}

export async function getOwnerByEmail(email: string): Promise<Owner | null> {
  const r = await query('SELECT * FROM owners WHERE email=$1 AND deleted_at IS NULL LIMIT 1', [email]);
  return r.rows[0] || null;
}

export async function updateOwnerPassword(ownerId: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE owners SET password_hash=$1 WHERE id=$2', [hash, ownerId]);
}

export async function deleteOwner(ownerId: string): Promise<void> {
  await query('UPDATE owners SET deleted_at=NOW() WHERE id=$1', [ownerId]);
}
