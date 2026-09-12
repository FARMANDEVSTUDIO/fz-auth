import { query } from '@/lib/db';
import { json, error, resolveApp, getClientIp, logEvent, applyRateLimit } from '../helpers';

export async function POST(req: Request) {
  try {
    const rlResponse = await applyRateLimit(req);
    if (rlResponse) return rlResponse;
    const body = await req.json();
    const { app_id, secret, version } = body;

    if (!app_id || !secret) return error('Missing app_id or secret', 401);

    const app = await resolveApp(app_id, secret);
    if (!app) return error('Invalid application credentials', 401);

    if (app.status !== 'active') {
      const msgs = ((app.settings as Record<string, unknown>)?.messages || {}) as Record<string, string>;
      return error(msgs.app_disabled || 'Application is currently disabled', 403);
    }

    if (version && version !== app.version) {
      return error(`Version mismatch. Expected ${app.version}, got ${version}`, 403);
    }

    const ip = getClientIp(req);
    await logEvent(app.id, 'init', undefined, ip, `App initialized v${app.version}`);

    const [usersRes, sessionsRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1', [app.id]),
      query('SELECT COUNT(*)::int AS c FROM sessions WHERE app_id=$1 AND expires_at > now()', [app.id]),
    ]);

    return json({
      success: true,
      message: 'Initialized',
      app_name: app.name,
      version: app.version,
      user_count: usersRes.rows[0].c,
      active_sessions: sessionsRes.rows[0].c,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return error('Internal server error', 500);
  }
}
