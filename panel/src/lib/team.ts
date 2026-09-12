import { query } from './db';
import { resolvePermissions, type Permission } from './permissions';

export interface TeamMember {
  id: string;
  account_id: string;
  role: string;
  permissions: Record<string, boolean>;
  created_at: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  discord_id: string | null;
}

export async function getTeamMembers(appId: string): Promise<TeamMember[]> {
  const r = await query(
    `SELECT m.id, m.account_id, m.role, m.permissions, m.created_at,
            o.email, o.name, o.avatar_url,
            d.discord_id
     FROM app_members m
     JOIN owners o ON o.id = m.account_id
     LEFT JOIN discord_links d ON d.account_id = m.account_id
     WHERE m.app_id = $1
     ORDER BY m.created_at ASC`,
    [appId]
  );
  return r.rows;
}

export async function getMemberRole(appId: string, accountId: string, ownerId: string | null): Promise<{ role: string; permissions: Record<Permission, boolean> } | null> {
  if (ownerId === accountId) {
    return { role: 'owner', permissions: resolvePermissions('owner') };
  }
  const r = await query(
    'SELECT role, permissions FROM app_members WHERE app_id=$1 AND account_id=$2 LIMIT 1',
    [appId, accountId]
  );
  if (r.rowCount === 0) return null;
  const row = r.rows[0];
  return { role: row.role, permissions: resolvePermissions(row.role, row.permissions) };
}

export async function getDiscordLink(accountId: string): Promise<string | null> {
  const r = await query('SELECT discord_id FROM discord_links WHERE account_id=$1 LIMIT 1', [accountId]);
  return r.rows[0]?.discord_id || null;
}
