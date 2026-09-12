import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOwnerByEmail } from '@/lib/owners';
import { isMasterAdmin } from '@/lib/plans';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owner = await getOwnerByEmail(session.user.email);
  if (!owner || !isMasterAdmin(owner.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const tables = ['owners', 'apps', 'users', 'licenses', 'sessions', 'logs', 'webhooks', 'variables', 'blacklists', 'notifications', 'ban_appeals', 'site_settings'];
  const backup: Record<string, any[]> = {};

  for (const table of tables) {
    try {
      const res = await query(`SELECT * FROM ${table}`);
      backup[table] = res.rows;
    } catch {
      backup[table] = [];
    }
  }

  const json = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="fz-auth-backup-${date}.json"`,
    },
  });
}
