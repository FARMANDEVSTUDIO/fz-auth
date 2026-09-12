import { NextResponse } from 'next/server';
import os from 'os';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor(process.uptime());

  const totalMem = os.totalmem();
  const usedMem = totalMem - os.freemem();
  const memPercent = Math.round((usedMem / totalMem) * 100);

  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch {
    // database unreachable
  }

  let status: 'healthy' | 'degraded' | 'down' = 'healthy';
  if (!dbOk) status = 'down';
  else if (memPercent > 90) status = 'degraded';

  return NextResponse.json(
    {
      status,
      checks: {
        database: dbOk,
        memory: {
          used: usedMem,
          total: totalMem,
          percent: memPercent,
        },
        uptime_seconds: uptimeSeconds,
      },
      version: '1.0.0',
      timestamp,
    },
    {
      status: status === 'down' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
