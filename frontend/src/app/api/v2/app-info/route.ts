import { query } from '@/lib/db';
import { authenticateApp, apiResponse, apiError, getSettings } from '../helpers';

export async function GET(req: Request) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    const settings = getSettings(app);
    const branding = (settings.branding || {}) as Record<string, string>;

    // Get counts
    const [usersRes, licensesRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1', [app.id]),
      query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE used=TRUE)::int AS used FROM licenses WHERE app_id=$1', [app.id]),
    ]);

    const userCount = usersRes.rows[0].c;
    const totalLicenses = licensesRes.rows[0].total;
    const usedLicenses = licensesRes.rows[0].used;

    return apiResponse({
      app_id: app.id,
      name: app.name,
      version: app.version,
      status: app.status,
      branding: Object.keys(branding).length > 0 ? branding : null,
      stats: {
        user_count: userCount,
        license_count: totalLicenses,
        used_licenses: usedLicenses,
        unused_licenses: totalLicenses - usedLicenses,
      },
    });
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
