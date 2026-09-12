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
    const { app_id, secret, license_key, hwid } = body;

    if (!app_id || !secret) return error('Missing app_id or secret', 401);
    if (!license_key) return error('Missing license_key');

    const app = await resolveApp(app_id, secret);
    if (!app) return error('Invalid application credentials', 401);

    if (app.status !== 'active') {
      const msgs = getMessages(app);
      return error(msgs.app_disabled || 'Application is currently disabled', 403);
    }

    const fns = getFunctions(app);
    if (fns.license === false) return error('License authentication is disabled', 403);

    const ip = getClientIp(req);
    const settings = getSettings(app);

    if (fns.blacklist !== false && await isBlacklisted(app.id, hwid, ip)) {
      const msgs = getMessages(app);
      await logEvent(app.id, 'blacklisted', undefined, ip, 'Blocked during license auth');
      return error(msgs.blacklisted || 'You are blacklisted', 403);
    }

    const licRes = await query(
      'SELECT id, license_key, duration_seconds, level, used, hwid, expires_at FROM licenses WHERE app_id=$1 AND license_key=$2 LIMIT 1',
      [app.id, license_key]
    );
    if (licRes.rows.length === 0) {
      const msgs = getMessages(app);
      await logEvent(app.id, 'license_fail', undefined, ip, `Invalid key: ${license_key.slice(0, 8)}...`);
      return error(msgs.invalid_license || 'Invalid license key');
    }

    const lic = licRes.rows[0];

    if (lic.used && lic.hwid) {
      if (settings.hwid_lock !== false && hwid && lic.hwid !== hwid) {
        const msgs = getMessages(app);
        await logEvent(app.id, 'hwid_mismatch', undefined, ip, `License HWID mismatch`);
        return error(msgs.hwid_mismatch || 'HWID mismatch. This key is bound to another device.', 403);
      }

      if (lic.expires_at && new Date(lic.expires_at) < new Date()) {
        await logEvent(app.id, 'license_fail', undefined, ip, 'License expired');
        return error('License has expired');
      }
    }

    if (!lic.used) {
      const expiresAt = new Date(Date.now() + Number(lic.duration_seconds) * 1000);
      await query(
        'UPDATE licenses SET used=true, hwid=$1, expires_at=$2, used_at=now() WHERE id=$3',
        [hwid || null, expiresAt, lic.id]
      );
      lic.hwid = hwid || null;
      lic.expires_at = expiresAt.toISOString();
    }

    const sessionHours = Number(settings.session_hours) || 24;
    const token = generateToken();
    const sessionExpires = new Date(Date.now() + sessionHours * 3600 * 1000);

    await query(
      'INSERT INTO sessions (app_id, token, hwid, ip, expires_at) VALUES ($1,$2,$3,$4,$5)',
      [app.id, token, hwid || null, ip, sessionExpires]
    );

    await logEvent(app.id, 'license', undefined, ip, `License auth: ${license_key.slice(0, 8)}...`);
    fireWebhooks(app.id, 'license.auth', { license_key: license_key.slice(0, 8) + '...', ip, level: lic.level });

    return json({
      success: true,
      message: 'License authenticated',
      token,
      license_key: lic.license_key,
      hwid: lic.hwid || null,
      level: lic.level,
      expiry: lic.expires_at,
      expires_at: sessionExpires.toISOString(),
    });
  } catch (e: any) {
    return error('Internal server error', 500);
  }
}
