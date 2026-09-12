import { query } from '@/lib/db';
import { authenticateApp, apiResponse, apiError, getClientIp, logEvent } from '../../helpers';

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    const userRes = await query(
      `SELECT id, username, hwid, hwid_locked, expiry, banned, ban_reason, suspended,
              created_at, last_login, last_ip
       FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1`,
      [app.id, params.username]
    );

    if (userRes.rows.length === 0) {
      return apiError('User not found', 'USER_NOT_FOUND', 404);
    }

    const user = userRes.rows[0];

    // Get active sessions count
    const sessionsRes = await query(
      'SELECT COUNT(*)::int AS c FROM sessions WHERE app_id=$1 AND user_id=$2 AND expires_at > NOW()',
      [app.id, user.id]
    );

    return apiResponse({
      ...user,
      password_hash: undefined,
      active_sessions: sessionsRes.rows[0].c,
    });
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    const userRes = await query(
      'SELECT id, username, hwid, expiry, banned FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
      [app.id, params.username]
    );

    if (userRes.rows.length === 0) {
      return apiError('User not found', 'USER_NOT_FOUND', 404);
    }

    const user = userRes.rows[0];
    const body = await req.json();
    const ip = getClientIp(req);

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    // Ban / unban
    if (typeof body.banned === 'boolean') {
      updates.push(`banned=$${idx}`);
      values.push(body.banned);
      idx++;

      if (body.banned && body.ban_reason) {
        updates.push(`ban_reason=$${idx}`);
        values.push(String(body.ban_reason));
        idx++;
      } else if (!body.banned) {
        updates.push(`ban_reason=NULL`);
      }

      await logEvent(app.id, body.banned ? 'ban' : 'unban', user.username, ip, `API v2 ${body.banned ? 'ban' : 'unban'}`);
    }

    // Suspend / unsuspend
    if (typeof body.suspended === 'boolean') {
      updates.push(`suspended=$${idx}`);
      values.push(body.suspended);
      idx++;
      await logEvent(app.id, body.suspended ? 'suspend' : 'unsuspend', user.username, ip, 'API v2');
    }

    // Add time (in seconds)
    if (typeof body.add_time === 'number' && body.add_time > 0) {
      const currentExpiry = user.expiry ? new Date(user.expiry) : new Date();
      const base = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiry = new Date(base.getTime() + body.add_time * 1000);
      updates.push(`expiry=$${idx}`);
      values.push(newExpiry);
      idx++;
      await logEvent(app.id, 'add_time', user.username, ip, `+${body.add_time}s via API v2`);
    }

    // Set expiry directly
    if (body.expiry) {
      const d = new Date(body.expiry);
      if (!isNaN(d.getTime())) {
        updates.push(`expiry=$${idx}`);
        values.push(d);
        idx++;
      }
    }

    // Reset HWID
    if (body.reset_hwid === true) {
      updates.push(`hwid=NULL`);
      await logEvent(app.id, 'hwid_reset', user.username, ip, 'API v2 HWID reset');
    }

    // HWID lock toggle
    if (typeof body.hwid_locked === 'boolean') {
      updates.push(`hwid_locked=$${idx}`);
      values.push(body.hwid_locked);
      idx++;
    }

    if (updates.length === 0) {
      return apiError('No valid fields to update', 'VALIDATION_ERROR', 400);
    }

    values.push(user.id);
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id=$${idx}`,
      values
    );

    // Fetch updated user
    const updated = await query(
      'SELECT id, username, hwid, hwid_locked, expiry, banned, ban_reason, suspended, created_at, last_login FROM users WHERE id=$1',
      [user.id]
    );

    return apiResponse(updated.rows[0]);
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { error, app } = await authenticateApp(req);
    if (error) return error;

    const userRes = await query(
      'SELECT id, username FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
      [app.id, params.username]
    );

    if (userRes.rows.length === 0) {
      return apiError('User not found', 'USER_NOT_FOUND', 404);
    }

    const user = userRes.rows[0];
    const ip = getClientIp(req);

    // Delete sessions first
    await query('DELETE FROM sessions WHERE app_id=$1 AND user_id=$2', [app.id, user.id]);
    // Delete user
    await query('DELETE FROM users WHERE id=$1', [user.id]);

    await logEvent(app.id, 'delete_user', user.username, ip, 'Deleted via API v2');

    return apiResponse({ deleted: true, username: user.username });
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
