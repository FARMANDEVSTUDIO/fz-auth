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
    const { app_id, secret, username, password, hwid } = body;

    if (!app_id || !secret) return error('Missing app_id or secret', 401);
    if (!username || !password) return error('Missing username or password');

    const app = await resolveApp(app_id, secret);
    if (!app) return error('Invalid application credentials', 401);

    if (app.status !== 'active') {
      const msgs = getMessages(app);
      return error(msgs.app_disabled || 'Application is currently disabled', 403);
    }

    const fns = getFunctions(app);
    if (fns.login === false) return error('Login is disabled for this application', 403);

    const ip = getClientIp(req);
    const settings = getSettings(app);

    if (fns.blacklist !== false && await isBlacklisted(app.id, hwid, ip)) {
      const msgs = getMessages(app);
      await logEvent(app.id, 'blacklisted', username, ip, 'Blocked by blacklist');
      return error(msgs.blacklisted || 'You are blacklisted', 403);
    }

    const userRes = await query(
      'SELECT id, username, password_hash, hwid, hwid_locked, expiry, banned, ban_reason, suspended FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
      [app.id, username]
    );
    if (userRes.rows.length === 0) {
      await logEvent(app.id, 'login_fail', username, ip, 'User not found');
      return error('Invalid username or password');
    }

    const user = userRes.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await logEvent(app.id, 'login_fail', username, ip, 'Wrong password');
      return error('Invalid username or password');
    }

    if (user.banned) {
      const msgs = getMessages(app);
      const msg = (msgs.banned || 'Banned: {reason}').replace('{reason}', user.ban_reason || 'No reason');
      await logEvent(app.id, 'login_fail', username, ip, 'Banned user');
      return error(msg, 403);
    }

    if (user.suspended) {
      await logEvent(app.id, 'login_fail', username, ip, 'Suspended user');
      return error('Your account is temporarily suspended. Contact support.', 403);
    }

    if (user.expiry && new Date(user.expiry) < new Date()) {
      await logEvent(app.id, 'login_fail', username, ip, 'Subscription expired');
      return error('Your subscription has expired');
    }

    // HWID lock: app-level setting AND per-user hwid_locked flag must both allow it
    const userHwidLocked = user.hwid_locked !== false;
    if (settings.hwid_lock !== false && userHwidLocked && hwid) {
      if (user.hwid && user.hwid !== hwid) {
        const msgs = getMessages(app);
        await logEvent(app.id, 'hwid_mismatch', username, ip, `Expected ${user.hwid}, got ${hwid}`);
        return error(msgs.hwid_mismatch || 'HWID mismatch. Contact support to reset.', 403);
      }
      if (!user.hwid) {
        await query('UPDATE users SET hwid=$1 WHERE id=$2', [hwid, user.id]);
      }
    }

    if (settings.force_hwid && !hwid) {
      return error('HWID is required', 400);
    }

    const sessionHours = Number(settings.session_hours) || 24;
    const maxSessions = Number(settings.max_sessions) || 0;

    if (maxSessions > 0) {
      const activeRes = await query(
        'SELECT COUNT(*)::int AS c FROM sessions WHERE app_id=$1 AND user_id=$2 AND expires_at > now()',
        [app.id, user.id]
      );
      if (activeRes.rows[0].c >= maxSessions) {
        await query(
          `DELETE FROM sessions WHERE id IN (
            SELECT id FROM sessions WHERE app_id=$1 AND user_id=$2 AND expires_at > now()
            ORDER BY created_at ASC LIMIT 1
          )`,
          [app.id, user.id]
        );
      }
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + sessionHours * 3600 * 1000);

    await query(
      'INSERT INTO sessions (app_id, user_id, token, hwid, ip, expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [app.id, user.id, token, hwid || null, ip, expiresAt]
    );

    await query('UPDATE users SET last_login=now(), last_ip=$1 WHERE id=$2', [ip, user.id]);
    await logEvent(app.id, 'login', username, ip, 'Login successful');
    fireWebhooks(app.id, 'user.login', { username, ip, hwid: user.hwid || hwid });

    // Include branding info if configured
    const brandingData = settings.branding as Record<string, string> | undefined;
    const branding = brandingData ? {
      ...(brandingData.app_name ? { app_name: brandingData.app_name } : {}),
      ...(brandingData.accent_color ? { accent_color: brandingData.accent_color } : {}),
      ...(brandingData.logo_url ? { logo_url: brandingData.logo_url } : {}),
      ...(brandingData.support_url ? { support_url: brandingData.support_url } : {}),
    } : undefined;

    return json({
      success: true,
      message: 'Logged in successfully',
      token,
      username: user.username,
      hwid: user.hwid || hwid || null,
      expiry: user.expiry,
      level: 1,
      expires_at: expiresAt.toISOString(),
      ...(branding && Object.keys(branding).length > 0 ? { branding } : {}),
    });
  } catch (e: any) {
    return error('Internal server error', 500);
  }
}
