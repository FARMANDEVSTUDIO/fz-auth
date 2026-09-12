import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOwnerByEmail } from '@/lib/owners';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owner = await getOwnerByEmail(session.user.email);
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const format = url.searchParams.get('format') || 'json';
  const appId = url.searchParams.get('app_id');

  if (!appId) return NextResponse.json({ error: 'Missing app_id' }, { status: 400 });

  const appCheck = await query('SELECT id FROM apps WHERE id=$1 AND owner_id=$2 LIMIT 1', [appId, owner.id]);
  if (appCheck.rows.length === 0) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  let rows: any[] = [];
  let filename = '';

  switch (type) {
    case 'users': {
      const res = await query(
        'SELECT username, hwid, last_ip, expiry, banned, suspended, last_login, created_at FROM users WHERE app_id=$1 ORDER BY created_at DESC',
        [appId]
      );
      rows = res.rows;
      filename = `users_${appId.slice(0, 8)}`;
      break;
    }
    case 'licenses': {
      const res = await query(
        'SELECT license_key, level, duration_seconds, used, hwid, expires_at, used_at, created_at FROM licenses WHERE app_id=$1 ORDER BY created_at DESC',
        [appId]
      );
      rows = res.rows;
      filename = `licenses_${appId.slice(0, 8)}`;
      break;
    }
    case 'logs': {
      const res = await query(
        'SELECT action, username, ip, detail, created_at FROM logs WHERE app_id=$1 ORDER BY created_at DESC LIMIT 1000',
        [appId]
      );
      rows = res.rows;
      filename = `logs_${appId.slice(0, 8)}`;
      break;
    }
    default:
      return NextResponse.json({ error: 'Invalid type (users/licenses/logs)' }, { status: 400 });
  }

  if (format === 'csv') {
    if (rows.length === 0) {
      return new NextResponse('No data', {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}.csv"` },
      });
    }
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const val = r[h] == null ? '' : String(r[h]);
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(','))
    ];
    return new NextResponse(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  }

  return NextResponse.json(rows, {
    headers: { 'Content-Disposition': `attachment; filename="${filename}.json"` },
  });
}
