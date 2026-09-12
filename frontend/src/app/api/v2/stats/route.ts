import { query } from '@/lib/db';
import { authenticateApp, apiResponse, apiError } from '../helpers';

export async function GET(req: Request) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    const url = new URL(req.url);
    const include = url.searchParams.get('include') || '';

    // Core stats
    const [usersRes, activeUsersRes, licensesRes, sessionsRes, eventsRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1', [app.id]),
      query(
        "SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1 AND last_login > NOW() - INTERVAL '7 days'",
        [app.id]
      ),
      query(
        'SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE used=TRUE)::int AS used FROM licenses WHERE app_id=$1',
        [app.id]
      ),
      query(
        'SELECT COUNT(*)::int AS c FROM sessions WHERE app_id=$1 AND expires_at > NOW()',
        [app.id]
      ),
      query('SELECT COUNT(*)::int AS c FROM logs WHERE app_id=$1', [app.id]),
    ]);

    const stats: Record<string, unknown> = {
      total_users: usersRes.rows[0].c,
      active_users_7d: activeUsersRes.rows[0].c,
      total_licenses: licensesRes.rows[0].total,
      used_licenses: licensesRes.rows[0].used,
      unused_licenses: licensesRes.rows[0].total - licensesRes.rows[0].used,
      active_sessions: sessionsRes.rows[0].c,
      total_events: eventsRes.rows[0].c,
    };

    // Optional charts data for last 30 days
    if (include === 'charts') {
      const [dailyUsers, dailyEvents] = await Promise.all([
        query(
          `SELECT DATE(created_at) AS date, COUNT(*)::int AS count
           FROM users WHERE app_id=$1 AND created_at > NOW() - INTERVAL '30 days'
           GROUP BY DATE(created_at) ORDER BY date`,
          [app.id]
        ),
        query(
          `SELECT DATE(created_at) AS date, COUNT(*)::int AS count
           FROM logs WHERE app_id=$1 AND created_at > NOW() - INTERVAL '30 days'
           GROUP BY DATE(created_at) ORDER BY date`,
          [app.id]
        ),
      ]);

      stats.charts = {
        daily_registrations: dailyUsers.rows.map((r: { date: string; count: number }) => ({
          date: r.date,
          count: r.count,
        })),
        daily_events: dailyEvents.rows.map((r: { date: string; count: number }) => ({
          date: r.date,
          count: r.count,
        })),
      };
    }

    return apiResponse(stats);
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
