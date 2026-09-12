const crypto = require('crypto');

// ---------- Password hashing (scrypt — built into Node, no native build needed) ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  try {
    const [salt, key] = String(stored).split(':');
    const derived = crypto.scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(key, 'hex');
    if (keyBuf.length !== derived.length) return false;
    return crypto.timingSafeEqual(keyBuf, derived);
  } catch {
    return false;
  }
}

// ---------- Random tokens / secrets ----------
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// ---------- License key generator: XXXXX-XXXXX-XXXXX-XXXXX ----------
function generateLicenseKey(segments = 4, segLen = 5, prefix = '') {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ambiguous chars (0,O,1,I) removed
  const parts = [];
  for (let i = 0; i < segments; i++) {
    const rand = crypto.randomBytes(segLen);
    let s = '';
    for (let j = 0; j < segLen; j++) s += alphabet[rand[j] % alphabet.length];
    parts.push(s);
  }
  const key = parts.join('-');
  return prefix ? `${prefix}-${key}` : key;
}

// ---------- HMAC response signing ----------
// Server signs the exact response body; client recomputes HMAC over the raw
// body bytes and compares against the x-signature header.
function sign(rawBody, secret) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  randomToken,
  generateLicenseKey,
  sign,
};
