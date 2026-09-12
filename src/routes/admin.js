const { query, pool } = require('../db');
const { randomToken, generateLicenseKey } = require('../utils/crypto');
const { parseDuration, humanize } = require('../utils/duration');

const ROLE_PERMISSIONS = {
  owner:    { create_keys: true, view_keys: true, view_users: true, ban_users: true, reset_hwid: true, add_time: true, delete_users: true, manage_settings: true, manage_team: true, view_stats: true },
  admin:    { create_keys: true, view_keys: true, view_users: true, ban_users: true, reset_hwid: true, add_time: true, delete_users: true, manage_settings: true, manage_team: false, view_stats: true },
  reseller: { create_keys: true, view_keys: true, view_users: false, ban_users: false, reset_hwid: false, add_time: false, delete_users: false, manage_settings: false, manage_team: false, view_stats: false },
  staff:    { create_keys: false, view_keys: false, view_users: true, ban_users: true, reset_hwid: true, add_time: true, delete_users: false, manage_settings: false, manage_team: false, view_stats: true },
};

function resolvePermissions(role, customPerms) {
  const base = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff;
  if (!customPerms || Object.keys(customPerms).length === 0) return base;
  return { ...base, ...customPerms };
}

// Guard for creating apps — requires the platform MASTER_KEY.
function requireMaster(req, reply) {
  const key = req.headers['x-master-key'];
  if (!key || key !== process.env.MASTER_KEY) {
    reply.code(401).send({ success: false, message: 'Invalid master key' });
    return false;
  }
  return true;
}

// Guard for app-scoped admin actions — requires that app's admin_key.
async function requireAppAdmin(req, reply) {
  const adminKey = req.headers['x-admin-key'];
  const appId = (req.body && req.body.app_id) || req.headers['x-app-id'];
  if (!adminKey || !appId) {
    reply.code(401).send({ success: false, message: 'app_id and x-admin-key header are required' });
    return false;
  }
  const r = await query('SELECT * FROM apps WHERE id=$1 LIMIT 1', [appId]);
  if (r.rowCount === 0) {
    reply.code(404).send({ success: false, message: 'App not found' });
    return false;
  }
  if (r.rows[0].admin_key !== adminKey) {
    reply.code(401).send({ success: false, message: 'Invalid admin key' });
    return false;
  }
  req.appRow = r.rows[0];
  return true;
}

async function routes(fastify) {
  // ---------- Create an app ----------
  fastify.post('/apps', async (req, reply) => {
    if (!requireMaster(req, reply)) return;
    const { name, owner_discord_id, owner_id, version } = req.body || {};
    if (!name) return reply.code(400).send({ success: false, message: 'name is required' });

    const exists = await query('SELECT 1 FROM apps WHERE name=$1 LIMIT 1', [name]);
    if (exists.rowCount > 0) return reply.code(409).send({ success: false, message: 'App name already taken' });

    const secret = randomToken(24);
    const adminKey = randomToken(24);
    const r = await query(
      `INSERT INTO apps (name, owner_discord_id, owner_id, secret, admin_key, version)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, version, created_at`,
      [name, owner_discord_id || null, owner_id || null, secret, adminKey, version || '1.0']
    );
    const a = r.rows[0];
    return {
      success: true,
      message: 'App created. Put "secret" in your client app; keep "admin_key" private (bot/panel uses it).',
      app: { app_id: a.id, name: a.name, version: a.version, secret, admin_key: adminKey },
    };
  });

  // ---------- Create license keys ----------
  fastify.post('/keys', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { amount = 1, duration = '30d', level = 1, created_by, prefix } = req.body || {};
    const seconds = parseDuration(duration);
    if (!seconds) return reply.code(400).send({ success: false, message: 'Invalid duration (use 30d, 12h, 1y, lifetime)' });
    const n = Math.min(Math.max(parseInt(amount, 10) || 1, 1), 100);

    const keys = [];
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < n; i++) {
        const key = generateLicenseKey(4, 5, prefix);
        await client.query(
          `INSERT INTO licenses (app_id, license_key, duration_seconds, level, created_by)
           VALUES ($1,$2,$3,$4,$5)`,
          [req.appRow.id, key, seconds, level, created_by || null]
        );
        keys.push(key);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return { success: true, message: `${n} key(s) created`, duration: humanize(seconds), level, keys };
  });

  // ---------- List users ----------
  fastify.post('/users', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const r = await query(
      `SELECT username, hwid, expiry, banned, ban_reason, last_login, created_at
       FROM users WHERE app_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [req.appRow.id]
    );
    return { success: true, count: r.rowCount, users: r.rows };
  });

  // ---------- User info ----------
  fastify.post('/userinfo', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { username } = req.body || {};
    if (!username) return reply.code(400).send({ success: false, message: 'username is required' });
    const r = await query(
      `SELECT username, hwid, expiry, banned, ban_reason, last_login, last_ip, created_at
       FROM users WHERE app_id=$1 AND username=$2 LIMIT 1`,
      [req.appRow.id, username]
    );
    if (r.rowCount === 0) return { success: false, message: 'User not found' };
    return { success: true, user: r.rows[0] };
  });

  // ---------- Ban / Unban ----------
  fastify.post('/ban', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { username, reason } = req.body || {};
    const r = await query(
      'UPDATE users SET banned=true, ban_reason=$1 WHERE app_id=$2 AND username=$3 RETURNING id',
      [reason || 'no reason', req.appRow.id, username]
    );
    if (r.rowCount === 0) return { success: false, message: 'User not found' };
    await query('DELETE FROM sessions WHERE app_id=$1 AND user_id=$2', [req.appRow.id, r.rows[0].id]);
    return { success: true, message: `${username} banned` };
  });

  fastify.post('/unban', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { username } = req.body || {};
    const r = await query(
      'UPDATE users SET banned=false, ban_reason=NULL WHERE app_id=$1 AND username=$2',
      [req.appRow.id, username]
    );
    if (r.rowCount === 0) return { success: false, message: 'User not found' };
    return { success: true, message: `${username} unbanned` };
  });

  // ---------- Reset HWID ----------
  fastify.post('/resethwid', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { username } = req.body || {};
    const r = await query('UPDATE users SET hwid=NULL WHERE app_id=$1 AND username=$2', [req.appRow.id, username]);
    if (r.rowCount === 0) return { success: false, message: 'User not found' };
    return { success: true, message: `HWID reset for ${username}` };
  });

  // ---------- Add time ----------
  fastify.post('/addtime', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { username, duration } = req.body || {};
    const seconds = parseDuration(duration);
    if (!seconds) return reply.code(400).send({ success: false, message: 'Invalid duration' });
    const u = await query('SELECT expiry FROM users WHERE app_id=$1 AND username=$2 LIMIT 1', [req.appRow.id, username]);
    if (u.rowCount === 0) return { success: false, message: 'User not found' };
    const current = u.rows[0].expiry ? new Date(u.rows[0].expiry) : new Date();
    const base = current > new Date() ? current : new Date();
    const newExpiry = new Date(base.getTime() + seconds * 1000);
    await query('UPDATE users SET expiry=$1 WHERE app_id=$2 AND username=$3', [newExpiry, req.appRow.id, username]);
    return { success: true, message: `Added ${humanize(seconds)} to ${username}`, expiry: newExpiry.toISOString() };
  });

  // ---------- Delete user ----------
  fastify.post('/deluser', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { username } = req.body || {};
    const r = await query('DELETE FROM users WHERE app_id=$1 AND username=$2', [req.appRow.id, username]);
    if (r.rowCount === 0) return { success: false, message: 'User not found' };
    return { success: true, message: `${username} deleted` };
  });

  // ---------- Blacklist ----------
  fastify.post('/blacklist', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { type, value, reason } = req.body || {};
    if (!['hwid', 'ip'].includes(type) || !value) {
      return reply.code(400).send({ success: false, message: 'type must be hwid|ip and value is required' });
    }
    await query(
      `INSERT INTO blacklist (app_id, type, value, reason) VALUES ($1,$2,$3,$4)
       ON CONFLICT (app_id, type, value) DO NOTHING`,
      [req.appRow.id, type, value, reason || null]
    );
    return { success: true, message: `${type} blacklisted` };
  });

  // ---------- List licenses ----------
  fastify.post('/licenses', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const r = await query(
      `SELECT license_key, duration_seconds, level, used, used_by, hwid, expires_at, created_by, created_at
       FROM licenses WHERE app_id=$1 ORDER BY created_at DESC LIMIT 200`,
      [req.appRow.id]
    );
    return { success: true, count: r.rowCount, licenses: r.rows };
  });

  // ---------- Delete license ----------
  fastify.post('/delkey', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { license_key } = req.body || {};
    if (!license_key) return reply.code(400).send({ success: false, message: 'license_key is required' });
    const r = await query('DELETE FROM licenses WHERE app_id=$1 AND license_key=$2', [req.appRow.id, license_key]);
    if (r.rowCount === 0) return { success: false, message: 'Key not found' };
    return { success: true, message: 'License key deleted' };
  });

  // ---------- List blacklist entries ----------
  fastify.post('/blacklists', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const r = await query(
      `SELECT id, type, value, reason, created_at
       FROM blacklist WHERE app_id=$1 ORDER BY created_at DESC`,
      [req.appRow.id]
    );
    return { success: true, count: r.rowCount, entries: r.rows };
  });

  // ---------- Remove blacklist entry ----------
  fastify.post('/unblacklist', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { id } = req.body || {};
    if (!id) return reply.code(400).send({ success: false, message: 'id is required' });
    const r = await query('DELETE FROM blacklist WHERE app_id=$1 AND id=$2', [req.appRow.id, id]);
    if (r.rowCount === 0) return { success: false, message: 'Entry not found' };
    return { success: true, message: 'Blacklist entry removed' };
  });

  // ---------- Logs ----------
  fastify.post('/logs', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const r = await query(
      `SELECT action, username, ip, detail, created_at
       FROM logs WHERE app_id=$1 ORDER BY created_at DESC LIMIT 200`,
      [req.appRow.id]
    );
    return { success: true, count: r.rowCount, logs: r.rows };
  });

  // ---------- Stats ----------
  fastify.post('/stats', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const id = req.appRow.id;
    const [users, active, keys, unused, sessions] = await Promise.all([
      query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1', [id]),
      query('SELECT COUNT(*)::int AS c FROM users WHERE app_id=$1 AND (expiry IS NULL OR expiry > now()) AND banned=false', [id]),
      query('SELECT COUNT(*)::int AS c FROM licenses WHERE app_id=$1', [id]),
      query('SELECT COUNT(*)::int AS c FROM licenses WHERE app_id=$1 AND used=false', [id]),
      query('SELECT COUNT(*)::int AS c FROM sessions WHERE app_id=$1 AND expires_at > now()', [id]),
    ]);
    return {
      success: true,
      stats: {
        total_users: users.rows[0].c,
        active_users: active.rows[0].c,
        total_keys: keys.rows[0].c,
        unused_keys: unused.rows[0].c,
        active_sessions: sessions.rows[0].c,
      },
    };
  });

  // ========== TEAM / RBAC ==========

  // Lookup member by discord_id (bot calls this before each command).
  fastify.post('/member', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { discord_id } = req.body || {};
    if (!discord_id) return reply.code(400).send({ success: false, message: 'discord_id is required' });

    const link = await query('SELECT account_id FROM discord_links WHERE discord_id=$1 LIMIT 1', [discord_id]);
    if (link.rowCount === 0) return { success: false, message: 'Discord not linked to any account' };

    const accountId = link.rows[0].account_id;

    if (req.appRow.owner_id === accountId) {
      return { success: true, account_id: accountId, role: 'owner', permissions: ROLE_PERMISSIONS.owner };
    }

    const m = await query('SELECT role, permissions FROM app_members WHERE app_id=$1 AND account_id=$2 LIMIT 1', [req.appRow.id, accountId]);
    if (m.rowCount === 0) return { success: false, message: 'Not a member of this app' };

    const row = m.rows[0];
    return { success: true, account_id: accountId, role: row.role, permissions: resolvePermissions(row.role, row.permissions) };
  });

  // List team members for an app.
  fastify.post('/team/list', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const r = await query(
      `SELECT m.id, m.account_id, m.role, m.permissions, m.created_at,
              o.email, o.name, o.avatar_url,
              d.discord_id
       FROM app_members m
       JOIN owners o ON o.id = m.account_id
       LEFT JOIN discord_links d ON d.account_id = m.account_id
       WHERE m.app_id = $1
       ORDER BY m.created_at ASC`,
      [req.appRow.id]
    );
    return { success: true, count: r.rowCount, members: r.rows };
  });

  // Invite a member (by email). Creates the member row; the person must have an account.
  fastify.post('/team/invite', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { email, role } = req.body || {};
    if (!email) return reply.code(400).send({ success: false, message: 'email is required' });
    const validRoles = ['admin', 'reseller', 'staff'];
    const finalRole = validRoles.includes(role) ? role : 'staff';

    const acc = await query('SELECT id FROM owners WHERE email=$1 LIMIT 1', [email]);
    if (acc.rowCount === 0) return reply.code(404).send({ success: false, message: 'No account found with that email. They must sign in first.' });

    const accountId = acc.rows[0].id;
    if (accountId === req.appRow.owner_id) return reply.code(400).send({ success: false, message: 'Cannot add the app owner as a member' });

    const r = await query(
      `INSERT INTO app_members (app_id, account_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (app_id, account_id) DO NOTHING
       RETURNING id`,
      [req.appRow.id, accountId, finalRole]
    );
    if (r.rowCount === 0) return reply.code(409).send({ success: false, message: 'Already a member' });
    return { success: true, message: `${email} added as ${finalRole}` };
  });

  // Change a member's role (and optionally custom permissions).
  fastify.post('/team/role', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { account_id, role, permissions } = req.body || {};
    if (!account_id || !role) return reply.code(400).send({ success: false, message: 'account_id and role are required' });
    const validRoles = ['admin', 'reseller', 'staff'];
    if (!validRoles.includes(role)) return reply.code(400).send({ success: false, message: 'Invalid role' });

    const perms = permissions && typeof permissions === 'object' ? permissions : {};
    const r = await query(
      'UPDATE app_members SET role=$1, permissions=$2 WHERE app_id=$3 AND account_id=$4',
      [role, JSON.stringify(perms), req.appRow.id, account_id]
    );
    if (r.rowCount === 0) return { success: false, message: 'Member not found' };
    return { success: true, message: `Role updated to ${role}` };
  });

  // Remove a member from the app.
  fastify.post('/team/remove', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { account_id } = req.body || {};
    if (!account_id) return reply.code(400).send({ success: false, message: 'account_id is required' });
    const r = await query('DELETE FROM app_members WHERE app_id=$1 AND account_id=$2', [req.appRow.id, account_id]);
    if (r.rowCount === 0) return { success: false, message: 'Member not found' };
    return { success: true, message: 'Member removed' };
  });

  // ========== DISCORD LINKING ==========

  // Start linking: website generates a one-time code for the logged-in user.
  fastify.post('/link/start', async (req, reply) => {
    if (!requireMaster(req, reply)) return;
    const { account_id } = req.body || {};
    if (!account_id) return reply.code(400).send({ success: false, message: 'account_id is required' });

    await query('DELETE FROM link_codes WHERE account_id=$1', [account_id]);

    const code = randomToken(4).toUpperCase().slice(0, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await query(
      'INSERT INTO link_codes (account_id, code, expires_at) VALUES ($1, $2, $3)',
      [account_id, code, expiresAt]
    );
    return { success: true, code, expires_in: '10 minutes' };
  });

  // Complete linking: bot sends the code + discord_id to bind them.
  fastify.post('/link/complete', async (req, reply) => {
    if (!requireMaster(req, reply)) return;
    const { code, discord_id } = req.body || {};
    if (!code || !discord_id) return reply.code(400).send({ success: false, message: 'code and discord_id are required' });

    const r = await query(
      'SELECT account_id FROM link_codes WHERE code=$1 AND expires_at > now() LIMIT 1',
      [code.toUpperCase()]
    );
    if (r.rowCount === 0) return reply.code(404).send({ success: false, message: 'Invalid or expired code' });

    const accountId = r.rows[0].account_id;

    await query(
      `INSERT INTO discord_links (account_id, discord_id)
       VALUES ($1, $2)
       ON CONFLICT (discord_id) DO UPDATE SET account_id = EXCLUDED.account_id`,
      [accountId, discord_id]
    );
    await query('DELETE FROM link_codes WHERE account_id=$1', [accountId]);

    return { success: true, message: 'Discord linked successfully', account_id: accountId };
  });

  // Unlink discord from account.
  fastify.post('/link/remove', async (req, reply) => {
    if (!requireMaster(req, reply)) return;
    const { account_id } = req.body || {};
    if (!account_id) return reply.code(400).send({ success: false, message: 'account_id is required' });
    await query('DELETE FROM discord_links WHERE account_id=$1', [account_id]);
    return { success: true, message: 'Discord unlinked' };
  });

  // Update app settings (JSONB).
  fastify.post('/settings', async (req, reply) => {
    if (!(await requireAppAdmin(req, reply))) return;
    const { settings } = req.body || {};
    if (!settings || typeof settings !== 'object') return reply.code(400).send({ success: false, message: 'settings object is required' });
    await query(
      `UPDATE apps SET settings = settings || $1::jsonb WHERE id = $2`,
      [JSON.stringify(settings), req.appRow.id]
    );
    return { success: true, message: 'Settings updated' };
  });
}

module.exports = routes;
