import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { fireWebhooks } from '@/lib/webhooks';
import {
  json, error, resolveApp, getSettings, getFunctions, getMessages,
  isBlacklisted, logEvent, getClientIp, generateToken, applyRateLimit,
} from '../helpers';

export async function POST(req: Request) {
  try {
    const rlResponse = await applyRateLimit(req);
    if (rlResponse) return rlResponse;
    const body = await req.json();
    const { app_id, secret, username, password, license_key, hwid } = body;

    if (!app_id || !secret) return error('Missing app_id or secret', 401);
    if (!username || !password || !license_key) return error('Missing username, password, or license_key');

    const app = await resolveApp(app_id, secret);
    if (!app) return error('Invalid application credentials', 401);

    if (app.status !== 'active') {
      const msgs = getMessages(app);
      return error(msgs.app_disabled || 'Application is currently disabled', 403);
    }

    const fns = getFunctions(app);
    if (fns.register === false) return error('Registration is disabled for this application', 403);

    const ip = getClientIp(req);
    const settings = getSettings(app);

    if (fns.blacklist !== false && await isBlacklisted(app.id, hwid, ip)) {
      const msgs = getMessages(app);
      await logEvent(app.id, 'blacklisted', username, ip, 'Blocked during registration');
      return error(msgs.blacklisted || 'You are blacklisted', 403);
    }

    const minUsername = Number(settings.min_username_length) || 3;
    if (username.length < minUsername) {
      return error(`Username must be at least ${minUsername} characters`);
    }

    const dupUser = await query(
      'SELECT 1 FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
      [app.id, username]
    );
    if ((dupUser.rowCount ?? 0) > 0) {
      const msgs = getMessages(app);
      return error(msgs.username_taken || 'Username already taken');
    }

    const licRes = await query(
      'SELECT id, duration_seconds, level, used FROM licenses WHERE app_id=$1 AND license_key=$2 LIMIT 1',
      [app.id, license_key]
    );
    if (licRes.rows.length === 0) {
      const msgs = getMessages(app);
      await logEvent(app.id, 'register_fail', username, ip, 'Invalid license key');
      return error(msgs.invalid_license || 'Invalid license key');
    }

    const lic = licRes.rows[0];
    if (lic.used) {
      const msgs = getMessages(app);
      await logEvent(app.id, 'register_fail', username, ip, 'License already used');
      return error(msgs.license_used || 'License key already used');
    }

    const hash = await bcrypt.hash(password, 10);
    const expiryDate = new Date(Date.now() + Number(lic.duration_seconds) * 1000);

    const userRes = await query(
      `INSERT INTO users (app_id, username, password_hash, hwid, expiry)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [app.id, username, hash, hwid || null, expiryDate]
    );
    const userId = userRes.rows[0].id;

    await query(
      'UPDATE licenses SET used=true, used_by=$1, used_at=now() WHERE id=$2',
      [userId, lic.id]
    );

    const sessionHours = Number(settings.session_hours) || 24;
    const token = generateToken();
    const sessionExpires = new Date(Date.now() + sessionHours * 3600 * 1000);

    await query(
      'INSERT INTO sessions (app_id, user_id, token, hwid, ip, expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [app.id, userId, token, hwid || null, ip, sessionExpires]
    );

    await logEvent(app.id, 'register', username, ip, `Registered with key ${license_key.slice(0, 8)}...`);
    fireWebhooks(app.id, 'user.register', { username, ip, license_key: license_key.slice(0, 8) + '...' });

    return json({
      success: true,
      message: 'Registered successfully',
      token,
      username,
      hwid: hwid || null,
      expiry: expiryDate.toISOString(),
      level: lic.level,
      expires_at: sessionExpires.toISOString(),
    });
  } catch (e: any) {
    return error('Internal server error', 500);
  }
}
