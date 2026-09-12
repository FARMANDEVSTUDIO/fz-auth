import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import {
  authenticateApp, apiResponse, apiError, paginatedResponse,
  parsePagination, getClientIp, logEvent, generateToken, getSettings,
} from '../helpers';

export async function GET(req: Request) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    const { page, limit, offset } = parsePagination(req);
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';

    let whereClause = 'WHERE app_id=$1';
    const params: unknown[] = [app.id];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (LOWER(username) LIKE LOWER($${params.length}))`;
    }

    const [countRes, usersRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM users ${whereClause}`, params),
      query(
        `SELECT id, username, hwid, expiry, banned, suspended, created_at, last_login, last_ip
         FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    const total = countRes.rows[0].c;

    return paginatedResponse(usersRes.rows, total, page, limit);
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: Request) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    if (app.status !== 'active') {
      return apiError('Application is currently disabled', 'APP_DISABLED', 403);
    }

    const body = await req.json();
    const { username, password, license_key, hwid } = body;

    if (!username || !password || !license_key) {
      return apiError('Missing required fields', 'VALIDATION_ERROR', 400, [
        ...(!username ? [{ code: 'REQUIRED', message: 'Username is required', field: 'username' }] : []),
        ...(!password ? [{ code: 'REQUIRED', message: 'Password is required', field: 'password' }] : []),
        ...(!license_key ? [{ code: 'REQUIRED', message: 'License key is required', field: 'license_key' }] : []),
      ]);
    }

    const settings = getSettings(app);
    const ip = getClientIp(req);
    const minUsername = Number(settings.min_username_length) || 3;

    if (username.length < minUsername) {
      return apiError(`Username must be at least ${minUsername} characters`, 'VALIDATION_ERROR', 400);
    }

    // Check duplicate
    const dupRes = await query(
      'SELECT 1 FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
      [app.id, username]
    );
    if ((dupRes.rowCount ?? 0) > 0) {
      return apiError('Username already taken', 'USERNAME_TAKEN', 409);
    }

    // Validate license
    const licRes = await query(
      'SELECT id, duration_seconds, level, used FROM licenses WHERE app_id=$1 AND license_key=$2 LIMIT 1',
      [app.id, license_key]
    );
    if (licRes.rows.length === 0) {
      return apiError('Invalid license key', 'INVALID_LICENSE', 400);
    }

    const lic = licRes.rows[0];
    if (lic.used) {
      return apiError('License key already used', 'LICENSE_USED', 400);
    }

    const hash = await bcrypt.hash(password, 10);
    const expiryDate = new Date(Date.now() + Number(lic.duration_seconds) * 1000);

    const userRes = await query(
      'INSERT INTO users (app_id, username, password_hash, hwid, expiry) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [app.id, username, hash, hwid || null, expiryDate]
    );
    const userId = userRes.rows[0].id;

    await query('UPDATE licenses SET used=true, used_by=$1, used_at=now() WHERE id=$2', [userId, lic.id]);

    const sessionHours = Number(settings.session_hours) || 24;
    const token = generateToken();
    const sessionExpires = new Date(Date.now() + sessionHours * 3600 * 1000);

    await query(
      'INSERT INTO sessions (app_id, user_id, token, hwid, ip, expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [app.id, userId, token, hwid || null, ip, sessionExpires]
    );

    await logEvent(app.id, 'register', username, ip, `API v2 registration with key ${license_key.slice(0, 8)}...`);

    return apiResponse({
      user_id: userId,
      username,
      token,
      hwid: hwid || null,
      expiry: expiryDate.toISOString(),
      level: lic.level,
      session_expires_at: sessionExpires.toISOString(),
    }, 201);
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
