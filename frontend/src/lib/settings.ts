import { query } from './db';

export async function getSetting(key: string): Promise<string | null> {
  const res = await query('SELECT value FROM site_settings WHERE key=$1 LIMIT 1', [key]);
  return res.rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
    [key, value]
  );
}

export async function isMaintenanceMode(): Promise<boolean> {
  const val = await getSetting('maintenance_mode');
  return val === 'true';
}
