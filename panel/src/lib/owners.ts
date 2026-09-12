import { query } from './db';

export interface Owner {
  id: string;
  provider: string;
  provider_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

// Create the owner row on first login, refresh profile fields after.
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
       SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
     RETURNING *`,
    [o.provider, o.providerId, o.email, o.name || null, o.avatarUrl || null]
  );
  return r.rows[0];
}

export async function getOwnerByEmail(email: string): Promise<Owner | null> {
  const r = await query('SELECT * FROM owners WHERE email=$1 LIMIT 1', [email]);
  return r.rows[0] || null;
}
