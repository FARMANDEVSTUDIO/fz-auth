import { cache } from 'react';
import { cookies } from 'next/headers';
import { query } from './db';

export interface App {
  id: string;
  name: string;
  owner_id: string | null;
  secret: string;
  admin_key: string;
  version: string;
  status: string;
  settings: Record<string, unknown>;
  created_at: string;
}

const SELECTED_APP_COOKIE = 'fz_selected_app';

export const getAppsForOwner = cache(async (ownerId: string): Promise<App[]> => {
  const r = await query(
    `SELECT DISTINCT a.* FROM apps a
     LEFT JOIN app_members m ON m.app_id = a.id AND m.account_id = $1
     WHERE a.owner_id = $1 OR m.account_id IS NOT NULL
     ORDER BY a.created_at ASC`,
    [ownerId]
  );
  return r.rows;
});

export async function getOwnedApp(ownerId: string, appId: string): Promise<App | null> {
  const r = await query('SELECT * FROM apps WHERE id=$1 AND owner_id=$2 LIMIT 1', [appId, ownerId]);
  return r.rows[0] || null;
}

export async function getAccessibleApp(accountId: string, appId: string): Promise<App | null> {
  const r = await query(
    `SELECT a.* FROM apps a
     LEFT JOIN app_members m ON m.app_id = a.id AND m.account_id = $2
     WHERE a.id = $1 AND (a.owner_id = $2 OR m.account_id IS NOT NULL)
     LIMIT 1`,
    [appId, accountId]
  );
  return r.rows[0] || null;
}

export async function getSelectedApp(ownerId: string): Promise<App | null> {
  const apps = await getAppsForOwner(ownerId);
  if (apps.length === 0) return null;
  const cookieId = cookies().get(SELECTED_APP_COOKIE)?.value;
  return apps.find(a => a.id === cookieId) || apps[0];
}

export { SELECTED_APP_COOKIE };
