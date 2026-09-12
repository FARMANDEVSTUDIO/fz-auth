import crypto from 'crypto';
import { query } from '@/lib/db';
import { authenticateApp, apiResponse, apiError, paginatedResponse, parsePagination, getClientIp, logEvent } from '../helpers';

export async function GET(req: Request) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    const { page, limit, offset } = parsePagination(req);
    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // 'used' | 'unused'
    const level = url.searchParams.get('level');

    let whereClause = 'WHERE app_id=$1';
    const params: unknown[] = [app.id];

    if (status === 'used') {
      whereClause += ' AND used=TRUE';
    } else if (status === 'unused') {
      whereClause += ' AND used=FALSE';
    }

    if (level) {
      params.push(parseInt(level));
      whereClause += ` AND level=$${params.length}`;
    }

    const [countRes, licensesRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM licenses ${whereClause}`, params),
      query(
        `SELECT id, license_key, level, duration_seconds, used, used_by, used_at, created_at, expiry
         FROM licenses ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    const total = countRes.rows[0].c;

    return paginatedResponse(licensesRes.rows, total, page, limit);
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: Request) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    const body = await req.json();
    const {
      amount = 1,
      duration = 2592000, // default 30 days in seconds
      prefix = '',
      level = 1,
    } = body;

    const count = Math.min(100, Math.max(1, parseInt(amount) || 1));
    const durationSecs = Math.max(60, parseInt(duration) || 2592000);
    const licLevel = Math.max(1, parseInt(level) || 1);
    const licPrefix = String(prefix || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 10);

    const ip = getClientIp(req);
    const licenses: string[] = [];

    for (let i = 0; i < count; i++) {
      const segments = [
        licPrefix || 'FZ',
        crypto.randomBytes(4).toString('hex').toUpperCase(),
        crypto.randomBytes(4).toString('hex').toUpperCase(),
        crypto.randomBytes(4).toString('hex').toUpperCase(),
      ];
      const key = segments.join('-');
      licenses.push(key);

      await query(
        'INSERT INTO licenses (app_id, license_key, duration_seconds, level) VALUES ($1,$2,$3,$4)',
        [app.id, key, durationSecs, licLevel]
      );
    }

    await logEvent(app.id, 'generate_licenses', undefined, ip, `Generated ${count} licenses via API v2`);

    return apiResponse({
      generated: count,
      duration_seconds: durationSecs,
      level: licLevel,
      prefix: licPrefix || 'FZ',
      licenses,
    }, 201);
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
