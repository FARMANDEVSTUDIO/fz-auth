const { query, pool } = require('../db');
const { hashPassword, verifyPassword, randomToken, sign } = require('../utils/crypto');

const SESSION_HOURS = 24;

// Send a JSON response signed with the app's secret (client verifies via x-signature).
function sendSigned(reply, secret, payload) {
  const body = JSON.stringify(payload);
  const signature = sign(body, secret);
  return reply
    .header('content-type', 'application/json; charset=utf-8')
    .header('x-signature', signature)
    .send(body);
}

function getIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip;
}

async function log(appId, action, username, ip, detail) {
  try {
    await query(
      'INSERT INTO logs (app_id, action, username, ip, detail) VALUES ($1,$2,$3,$4,$5)',
      [appId, action, username || null, ip || null, detail || null]
    );
  } catch { /* logging must never break a request */ }
}

async function isBlacklisted(appId, type, value) {
  if (!value) return false;
  const r = await query(
    'SELECT 1 FROM blacklist WHERE app_id=$1 AND type=$2 AND value=$3 LIMIT 1',
    [appId, type, value]
  );
  return r.rowCount > 0;
}

// Custom alert message from the app's settings JSONB (panel "Messages" tab),
// falling back to the built-in default.
function msg(appRow, key, fallback) {
  const messages = (appRow.settings && appRow.settings.messages) || {};
  return messages[key] || fallback;
}

async function routes(fastify) {
  // Resolve + validate the app for every /api request.
  fastify.addHook('preHandler', async (req, reply) => {
    const appId = (req.body && req.body.app_id) || req.headers['x-app-id'];
    if (!appId) {
      return reply.code(400).send({ success: false, message: 'Missing app_id' });
    }
    const r = await query('SELECT * FROM apps WHERE id=$1 LIMIT 1', [appId]);
    if (r.rowCount === 0) {
      return reply.code(404).send({ success: false, message: 'App not found' });
    }
    const appRow = r.rows[0];
    const settings = appRow.settings || {};
    if (appRow.status !== 'active' || settings.app_status === false) {
      return sendSigned(reply.code(403), appRow.secret, {
        success: false,
        message: msg(appRow, 'app_disabled', 'App is paused'),
      });
    }
    req.appRow = appRow;
  });

  // ---------- INIT ----------
  fastify.post('/init', async (req, reply) => {
    const appRow = req.appRow;
    const { version } = req.body || {};
    if (version && appRow.version && version !== appRow.version) {
      return sendSigned(reply, appRow.secret, {
        success: false,
        message: 'Outdated version. Please update.',
        required_version: appRow.version,
      });
    }
    return sendSigned(reply, appRow.secret, {
      success: true,
      message: 'Initialized',
      app_name: appRow.name,
      version: appRow.version,
      server_time: new Date().toISOString(),
    });
  });

  // ---------- REGISTER (username + password, consumes a key) ----------
  fastify.post('/register', async (req, reply) => {
    const appRow = req.appRow;
    const ip = getIp(req);
    const { username, password, key, hwid } = req.body || {};
    if (!username || !password || !key) {
      return sendSigned(reply, appRow.secret, { success: false, message: 'username, password and key are required' });
    }
    if ((await isBlacklisted(appRow.id, 'hwid', hwid)) || (await isBlacklisted(appRow.id, 'ip', ip))) {
      await log(appRow.id, 'register_blocked', username, ip, 'blacklisted');
      return sendSigned(reply, appRow.secret, { success: false, message: msg(appRow, 'blacklisted', 'You are blacklisted') });
    }

    const lic = await query('SELECT * FROM licenses WHERE app_id=$1 AND license_key=$2 LIMIT 1', [appRow.id, key]);
    if (lic.rowCount === 0) {
      return sendSigned(reply, appRow.secret, { success: false, message: msg(appRow, 'invalid_license', 'Invalid license key') });
    }
    const license = lic.rows[0];
    if (license.used) {
      return sendSigned(reply, appRow.secret, { success: false, message: msg(appRow, 'license_used', 'License key already used') });
    }

    const exists = await query('SELECT 1 FROM users WHERE app_id=$1 AND username=$2 LIMIT 1', [appRow.id, username]);
    if (exists.rowCount > 0) {
      return sendSigned(reply, appRow.secret, { success: false, message: msg(appRow, 'username_taken', 'Username already taken') });
    }

    const expiry = new Date(Date.now() + Number(license.duration_seconds) * 1000);
    const pwHash = hashPassword(password);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ins = await client.query(
        `INSERT INTO users (app_id, username, password_hash, hwid, expiry, last_ip)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [appRow.id, username, pwHash, hwid || null, expiry, ip]
      );
      await client.query(
        'UPDATE licenses SET used=true, used_by=$1, used_at=now() WHERE id=$2',
        [ins.rows[0].id, license.id]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    await log(appRow.id, 'register', username, ip, `level ${license.level}`);
    return sendSigned(reply, appRow.secret, {
      success: true,
      message: 'Registered successfully',
      expiry: expiry.toISOString(),
      level: license.level,
    });
  });

  // ---------- LOGIN (username + password) ----------
  fastify.post('/login', async (req, reply) => {
    const appRow = req.appRow;
    const ip = getIp(req);
    const { username, password, hwid } = req.body || {};
    if (!username || !password) {
      return sendSigned(reply, appRow.secret, { success: false, message: 'username and password are required' });
    }
    if ((await isBlacklisted(appRow.id, 'hwid', hwid)) || (await isBlacklisted(appRow.id, 'ip', ip))) {
      await log(appRow.id, 'login_blocked', username, ip, 'blacklisted');
      return sendSigned(reply, appRow.secret, { success: false, message: msg(appRow, 'blacklisted', 'You are blacklisted') });
    }

    const r = await query('SELECT * FROM users WHERE app_id=$1 AND username=$2 LIMIT 1', [appRow.id, username]);
    if (r.rowCount === 0) {
      return sendSigned(reply, appRow.secret, { success: false, message: 'Invalid username or password' });
    }
    const user = r.rows[0];

    if (user.banned) {
      await log(appRow.id, 'login_banned', username, ip, user.ban_reason);
      return sendSigned(reply, appRow.secret, { success: false, message: msg(appRow, 'banned', `Banned: ${user.ban_reason || 'no reason'}`) });
    }
    if (!verifyPassword(password, user.password_hash)) {
      await log(appRow.id, 'login_fail', username, ip, 'bad password');
      return sendSigned(reply, appRow.secret, { success: false, message: 'Invalid username or password' });
    }
    if (user.expiry && new Date(user.expiry) < new Date()) {
      return sendSigned(reply, appRow.secret, { success: false, message: 'Subscription expired', expiry: user.expiry });
    }

    // HWID lock: bind on first login, then enforce.
    if (hwid) {
      if (!user.hwid) {
        await query('UPDATE users SET hwid=$1 WHERE id=$2', [hwid, user.id]);
      } else if (user.hwid !== hwid) {
        await log(appRow.id, 'login_hwid_mismatch', username, ip, hwid);
        return sendSigned(reply, appRow.secret, { success: false, message: msg(appRow, 'hwid_mismatch', 'HWID mismatch. Contact support to reset.') });
      }
    }

    const token = randomToken(32);
    const sessionExpiry = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
    await query(
      'INSERT INTO sessions (app_id, user_id, token, hwid, ip, expires_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [appRow.id, user.id, token, hwid || null, ip, sessionExpiry]
    );
    await query('UPDATE users SET last_login=now(), last_ip=$1 WHERE id=$2', [ip, user.id]);

    await log(appRow.id, 'login', username, ip, 'ok');
    return sendSigned(reply, appRow.secret, {
      success: true,
      message: 'Login successful',
      token,
      expiry: user.expiry,
      session_expiry: sessionExpiry.toISOString(),
    });
  });

  // ---------- LICENSE (key-only auth, no account) ----------
  fastify.post('/license', async (req, reply) => {
    const appRow = req.appRow;
    const ip = getIp(req);
    const { key, hwid } = req.body || {};
    if (!key) {
      return sendSigned(reply, appRow.secret, { success: false, message: 'key is required' });
    }
    if ((await isBlacklisted(appRow.id, 'hwid', hwid)) || (await isBlacklisted(appRow.id, 'ip', ip))) {
      return sendSigned(reply, appRow.secret, { success: false, message: 'You are blacklisted' });
    }

    const lic = await query('SELECT * FROM licenses WHERE app_id=$1 AND license_key=$2 LIMIT 1', [appRow.id, key]);
    if (lic.rowCount === 0) {
      return sendSigned(reply, appRow.secret, { success: false, message: 'Invalid license key' });
    }
    const license = lic.rows[0];

    if (!license.expires_at) {
      // First activation: bind hwid + start the clock.
      const expiresAt = new Date(Date.now() + Number(license.duration_seconds) * 1000);
      await query(
        'UPDATE licenses SET hwid=$1, expires_at=$2, used=true, used_at=now() WHERE id=$3',
        [hwid || null, expiresAt, license.id]
      );
      license.expires_at = expiresAt;
      license.hwid = hwid || null;
    } else {
      if (license.hwid && hwid && license.hwid !== hwid) {
        return sendSigned(reply, appRow.secret, { success: false, message: 'HWID mismatch for this key' });
      }
      if (new Date(license.expires_at) < new Date()) {
        return sendSigned(reply, appRow.secret, { success: false, message: 'License expired', expiry: license.expires_at });
      }
    }

    const token = randomToken(32);
    const sessionExpiry = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
    await query(
      'INSERT INTO sessions (app_id, user_id, token, hwid, ip, expires_at) VALUES ($1,NULL,$2,$3,$4,$5)',
      [appRow.id, token, hwid || null, ip, sessionExpiry]
    );

    await log(appRow.id, 'license', key, ip, 'ok');
    return sendSigned(reply, appRow.secret, {
      success: true,
      message: 'License valid',
      token,
      expiry: license.expires_at,
      level: license.level,
    });
  });

  // ---------- CHECK (validate an existing session token) ----------
  fastify.post('/check', async (req, reply) => {
    const appRow = req.appRow;
    const { token, hwid } = req.body || {};
    if (!token) {
      return sendSigned(reply, appRow.secret, { success: false, valid: false, message: 'token is required' });
    }
    const r = await query('SELECT * FROM sessions WHERE app_id=$1 AND token=$2 LIMIT 1', [appRow.id, token]);
    if (r.rowCount === 0) {
      return sendSigned(reply, appRow.secret, { success: true, valid: false, message: 'Invalid session' });
    }
    const session = r.rows[0];
    if (new Date(session.expires_at) < new Date()) {
      return sendSigned(reply, appRow.secret, { success: true, valid: false, message: 'Session expired' });
    }
    if (session.hwid && hwid && session.hwid !== hwid) {
      return sendSigned(reply, appRow.secret, { success: true, valid: false, message: 'HWID mismatch' });
    }
    return sendSigned(reply, appRow.secret, { success: true, valid: true, expiry: session.expires_at });
  });
}

module.exports = routes;
