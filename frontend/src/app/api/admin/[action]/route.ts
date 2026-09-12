import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}
function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function parseDuration(d: string): number | null {
  if (d === 'lifetime') return 100 * 365 * 24 * 3600;
  const m = d.match(/^(\d+)(h|d|w|m|y)$/);
  if (!m) return null;
  const n = parseInt(m[1]);
  const unit = m[2];
  const multipliers: Record<string, number> = { h: 3600, d: 86400, w: 604800, m: 2592000, y: 31536000 };
  return n * (multipliers[unit] || 86400);
}

function generateKey(prefix: string): string {
  const seg = () => crypto.randomBytes(4).toString('hex').toUpperCase();
  const key = `${seg()}-${seg()}-${seg()}-${seg()}`;
  return prefix ? `${prefix}-${key}` : key;
}

export async function POST(req: Request, { params }: { params: { action: string } }) {
  try {
    const adminKey = req.headers.get('x-admin-key') || '';
    const masterKey = req.headers.get('x-master-key') || '';
    const body = await req.json().catch(() => ({}));
    const appId = body.app_id;

    // Auth: either admin key for an app, or master key
    let app: any = null;

    if (params.action === 'link-complete') {
      if (masterKey !== process.env.MASTER_KEY) return fail('Invalid master key', 401);
    } else if (params.action === 'member') {
      if (masterKey !== process.env.MASTER_KEY && adminKey) {
        if (!appId) return fail('Missing app_id', 400);
        const r = await query('SELECT id FROM apps WHERE id=$1 AND admin_key=$2 LIMIT 1', [appId, adminKey]);
        if (r.rows.length === 0) return fail('Invalid admin key', 401);
        app = r.rows[0];
      } else if (masterKey !== process.env.MASTER_KEY) {
        return fail('Invalid credentials', 401);
      }
    } else {
      if (!appId || !adminKey) return fail('Missing app_id or admin key', 401);
      const r = await query('SELECT id, name, owner_id, settings FROM apps WHERE id=$1 AND admin_key=$2 LIMIT 1', [appId, adminKey]);
      if (r.rows.length === 0) return fail('Invalid app_id or admin key', 401);
      app = r.rows[0];
    }

    const action = params.action;

    // ─── stats ───
    if (action === 'stats') {
      const [users, activeUsers, keys, unusedKeys, sessions] = await Promise.all([
        query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1', [appId]),
        query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1 AND banned=false AND (expiry IS NULL OR expiry > NOW())', [appId]),
        query('SELECT COUNT(*)::int AS c FROM licenses WHERE app_id=$1', [appId]),
        query('SELECT COUNT(*)::int AS c FROM licenses WHERE app_id=$1 AND used=false', [appId]),
        query('SELECT COUNT(*)::int AS c FROM sessions WHERE app_id=$1 AND expires_at > NOW()', [appId]),
      ]);
      return json({
        success: true,
        stats: {
          total_users: users.rows[0].c,
          active_users: activeUsers.rows[0].c,
          total_keys: keys.rows[0].c,
          unused_keys: unusedKeys.rows[0].c,
          active_sessions: sessions.rows[0].c,
        },
      });
    }

    // ─── keys ───
    if (action === 'keys') {
      const { duration, amount = 1, level = 1, prefix = '' } = body;
      if (!duration) return fail('Missing duration');
      const seconds = parseDuration(duration);
      if (!seconds) return fail('Invalid duration format');
      const count = Math.min(Math.max(1, Number(amount)), 100);

      const generatedKeys: string[] = [];
      for (let i = 0; i < count; i++) {
        const key = generateKey(prefix);
        await query(
          'INSERT INTO licenses (app_id, license_key, duration_seconds, level) VALUES ($1,$2,$3,$4)',
          [appId, key, seconds, level]
        );
        generatedKeys.push(key);
      }

      return json({ success: true, keys: generatedKeys, duration, count });
    }

    // ─── userinfo ───
    if (action === 'userinfo') {
      const { username } = body;
      if (!username) return fail('Missing username');
      const r = await query(
        'SELECT username, hwid, expiry, banned, ban_reason, last_login, last_ip, created_at FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
        [appId, username]
      );
      if (r.rows.length === 0) return fail('User not found');
      return json({ success: true, user: r.rows[0] });
    }

    // ─── users ───
    if (action === 'users') {
      const r = await query(
        'SELECT username, banned, expiry, created_at FROM users WHERE app_id=$1 ORDER BY created_at DESC LIMIT 100',
        [appId]
      );
      return json({ success: true, users: r.rows, count: r.rows.length });
    }

    // ─── ban ───
    if (action === 'ban') {
      const { username, reason } = body;
      if (!username) return fail('Missing username');
      const r = await query(
        'UPDATE users SET banned=true, ban_reason=$1 WHERE app_id=$2 AND LOWER(username)=LOWER($3) RETURNING id',
        [reason || null, appId, username]
      );
      if (r.rows.length === 0) return fail('User not found');
      return json({ success: true, message: `${username} banned` });
    }

    // ─── unban ───
    if (action === 'unban') {
      const { username } = body;
      if (!username) return fail('Missing username');
      const r = await query(
        'UPDATE users SET banned=false, ban_reason=NULL WHERE app_id=$1 AND LOWER(username)=LOWER($2) RETURNING id',
        [appId, username]
      );
      if (r.rows.length === 0) return fail('User not found');
      return json({ success: true, message: `${username} unbanned` });
    }

    // ─── resethwid ───
    if (action === 'resethwid') {
      const { username } = body;
      if (!username) return fail('Missing username');
      const r = await query(
        'UPDATE users SET hwid=NULL WHERE app_id=$1 AND LOWER(username)=LOWER($2) RETURNING id',
        [appId, username]
      );
      if (r.rows.length === 0) return fail('User not found');
      return json({ success: true, message: `HWID reset for ${username}` });
    }

    // ─── addtime ───
    if (action === 'addtime') {
      const { username, duration } = body;
      if (!username || !duration) return fail('Missing username or duration');
      const seconds = parseDuration(duration);
      if (!seconds) return fail('Invalid duration format');

      const r = await query(
        'SELECT id, expiry FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) LIMIT 1',
        [appId, username]
      );
      if (r.rows.length === 0) return fail('User not found');

      const user = r.rows[0];
      const base = user.expiry && new Date(user.expiry) > new Date() ? new Date(user.expiry) : new Date();
      const newExpiry = new Date(base.getTime() + seconds * 1000);

      await query('UPDATE users SET expiry=$1 WHERE id=$2', [newExpiry, user.id]);
      return json({ success: true, message: `Added ${duration} to ${username}`, expiry: newExpiry.toISOString() });
    }

    // ─── deluser ───
    if (action === 'deluser') {
      const { username } = body;
      if (!username) return fail('Missing username');
      const r = await query(
        'DELETE FROM users WHERE app_id=$1 AND LOWER(username)=LOWER($2) RETURNING id',
        [appId, username]
      );
      if (r.rows.length === 0) return fail('User not found');
      await query('DELETE FROM sessions WHERE user_id=$1', [r.rows[0].id]);
      return json({ success: true, message: `${username} deleted` });
    }

    // ─── blacklist ───
    if (action === 'blacklist') {
      const { type, value, reason } = body;
      if (!type || !value) return fail('Missing type or value');
      if (!['hwid', 'ip'].includes(type)) return fail('Type must be hwid or ip');
      await query(
        'INSERT INTO blacklist (app_id, type, value, reason) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [appId, type, value, reason || null]
      );
      return json({ success: true, message: `${type} blacklisted` });
    }

    // ─── member (check Discord-linked permissions) ───
    if (action === 'member') {
      const { discord_id } = body;
      if (!discord_id) return fail('Missing discord_id');
      const r = await query(
        `SELECT o.id, o.email, m.role
         FROM owners o
         JOIN discord_links d ON d.account_id = o.id
         LEFT JOIN app_members m ON m.account_id = o.id AND m.app_id = $2
         WHERE d.discord_id = $1 LIMIT 1`,
        [discord_id, appId || '']
      );
      if (r.rows.length === 0) return fail('Discord account not linked');
      const member = r.rows[0];
      const role = member.role || 'member';
      const allPerms = role === 'admin';
      return json({
        success: true,
        role,
        permissions: {
          create_keys: allPerms, view_users: allPerms, ban_users: allPerms,
          reset_hwid: allPerms, add_time: allPerms, delete_users: allPerms,
          view_stats: allPerms || role === 'moderator',
        },
      });
    }

    // ─── link-complete (Discord link) ───
    if (action === 'link-complete') {
      const { code, discord_id } = body;
      if (!code || !discord_id) return fail('Missing code or discord_id');

      const r = await query(
        'SELECT account_id FROM link_codes WHERE code=$1 AND expires_at > NOW() LIMIT 1',
        [code.toUpperCase()]
      );
      if (r.rows.length === 0) return fail('Invalid or expired link code');

      const accountId = r.rows[0].account_id;

      await query('DELETE FROM discord_links WHERE account_id=$1', [accountId]);
      await query(
        'INSERT INTO discord_links (account_id, discord_id) VALUES ($1,$2)',
        [accountId, discord_id]
      );
      await query('DELETE FROM link_codes WHERE account_id=$1', [accountId]);

      return json({ success: true, message: 'Discord linked successfully' });
    }

    return fail('Unknown action: ' + action, 404);
  } catch (e: any) {
    console.error('Admin API error:', e);
    return fail('Internal server error', 500);
  }
}
