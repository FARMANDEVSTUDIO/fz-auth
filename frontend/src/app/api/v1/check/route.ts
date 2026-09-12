import { query } from '@/lib/db';
import { json, error, resolveApp, getFunctions, applyRateLimit } from '../helpers';

export async function POST(req: Request) {
  try {
    const rlResponse = await applyRateLimit(req);
    if (rlResponse) return rlResponse;
    const body = await req.json();
    const { app_id, secret, token } = body;

    if (!app_id || !secret) return error('Missing app_id or secret', 401);
    if (!token) return error('Missing token');

    const app = await resolveApp(app_id, secret);
    if (!app) return error('Invalid application credentials', 401);

    const fns = getFunctions(app);
    if (fns.check_session === false) return error('Session checking is disabled', 403);

    const sessRes = await query(
      `SELECT s.id, s.user_id, s.hwid, s.ip, s.expires_at, u.username, u.expiry, u.banned
       FROM sessions s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.app_id=$1 AND s.token=$2 LIMIT 1`,
      [app.id, token]
    );

    if (sessRes.rows.length === 0) {
      return error('Invalid or expired session token', 401);
    }

    const sess = sessRes.rows[0];

    if (new Date(sess.expires_at) < new Date()) {
      return error('Session has expired', 401);
    }

    if (sess.banned) {
      return error('User is banned', 403);
    }

    if (sess.expiry && new Date(sess.expiry) < new Date()) {
      return error('User subscription has expired', 403);
    }

    return json({
      success: true,
      message: 'Session is valid',
      username: sess.username || null,
      hwid: sess.hwid || null,
      expiry: sess.expiry || null,
      session_expires: sess.expires_at,
    });
  } catch (e: any) {
    return error('Internal server error', 500);
  }
}
