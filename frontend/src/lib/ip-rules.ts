import { query } from './db';

export async function ensureIpRulesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_ip_rules (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('allow', 'block')),
      value TEXT NOT NULL,
      reason TEXT,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_ip_rules_type ON admin_ip_rules (type)`);
}

/**
 * Parse an IPv4 address into a 32-bit number.
 */
function ipToNum(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    num = (num << 8) | n;
  }
  return num >>> 0; // unsigned
}

/**
 * Check if an IP matches a CIDR range (e.g. "192.168.1.0/24") or exact IP.
 */
function ipMatchesCidr(ip: string, cidr: string): boolean {
  // Exact match
  if (ip === cidr) return true;

  const [rangeIp, prefixStr] = cidr.split('/');
  if (!prefixStr) {
    // No CIDR suffix — exact match only
    return ip === rangeIp;
  }

  const prefix = parseInt(prefixStr, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  const ipNum = ipToNum(ip);
  const rangeNum = ipToNum(rangeIp);
  if (ipNum === null || rangeNum === null) return false;

  if (prefix === 0) return true;
  const mask = (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

export interface IpRule {
  id: number;
  type: 'allow' | 'block';
  value: string;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
}

export async function getIpRules(): Promise<IpRule[]> {
  await ensureIpRulesTable();
  const res = await query('SELECT * FROM admin_ip_rules ORDER BY created_at DESC');
  return res.rows;
}

export async function checkIpAllowed(ip: string): Promise<{ allowed: boolean; reason?: string }> {
  await ensureIpRulesTable();

  // Remove expired rules
  await query('DELETE FROM admin_ip_rules WHERE expires_at IS NOT NULL AND expires_at < NOW()');

  const res = await query('SELECT type, value, reason FROM admin_ip_rules');
  const rules = res.rows as Array<{ type: string; value: string; reason: string | null }>;

  if (rules.length === 0) {
    return { allowed: true };
  }

  const allowRules = rules.filter(r => r.type === 'allow');
  const blockRules = rules.filter(r => r.type === 'block');

  // Check blacklist first — always takes priority
  for (const rule of blockRules) {
    if (ipMatchesCidr(ip, rule.value)) {
      return { allowed: false, reason: rule.reason || `IP ${ip} is blocked` };
    }
  }

  // If there are allow rules, only whitelisted IPs are allowed
  if (allowRules.length > 0) {
    for (const rule of allowRules) {
      if (ipMatchesCidr(ip, rule.value)) {
        return { allowed: true };
      }
    }
    return { allowed: false, reason: `IP ${ip} is not in the whitelist` };
  }

  return { allowed: true };
}

export async function addIpRule(type: 'allow' | 'block', value: string, reason?: string, expiresAt?: Date): Promise<void> {
  await ensureIpRulesTable();
  await query(
    'INSERT INTO admin_ip_rules (type, value, reason, expires_at) VALUES ($1, $2, $3, $4)',
    [type, value.trim(), reason || null, expiresAt || null]
  );
}

export async function deleteIpRule(id: number): Promise<void> {
  await query('DELETE FROM admin_ip_rules WHERE id=$1', [id]);
}
