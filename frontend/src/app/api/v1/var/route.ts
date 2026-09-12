import { query } from '@/lib/db';
import { json, error, resolveApp, applyRateLimit } from '../helpers';

export async function POST(req: Request) {
  try {
    const rlResponse = await applyRateLimit(req);
    if (rlResponse) return rlResponse;
    const body = await req.json();
    const { app_id, secret, key } = body;

    if (!app_id || !secret) return error('Missing app_id or secret', 401);

    const app = await resolveApp(app_id, secret);
    if (!app) return error('Invalid application credentials', 401);

    if (key) {
      const r = await query(
        'SELECT var_key, var_value FROM app_variables WHERE app_id=$1 AND var_key=$2 LIMIT 1',
        [app.id, key]
      );
      if (r.rows.length === 0) return error('Variable not found', 404);
      return json({ success: true, variable: { key: r.rows[0].var_key, value: r.rows[0].var_value } });
    }

    const r = await query(
      'SELECT var_key, var_value FROM app_variables WHERE app_id=$1 ORDER BY var_key ASC',
      [app.id]
    );

    const variables: Record<string, string> = {};
    for (const row of r.rows) {
      variables[row.var_key] = row.var_value;
    }

    return json({ success: true, variables });
  } catch (e: any) {
    return error('Internal server error', 500);
  }
}
