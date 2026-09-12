import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkApiRateLimit } from '@/lib/rate-limiter';
import { checkIpAllowed } from '@/lib/ip-rules';

export function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveApp(appId: string, secret: string) {
  if (!appId || !secret) return null;
  if (!UUID_RE.test(appId)) return null;
  const r = await query(
    'SELECT id, name, owner_id, version, status, settings FROM apps WHERE id=$1 AND secret=$2 LIMIT 1',
    [appId, secret]
  );
  return r.rows[0] || null;
}

export function getSettings(app: { settings?: Record<string, unknown> | null }) {
  return (app.settings || {}) as Record<string, unknown>;
}

export function getFunctions(app: { settings?: Record<string, unknown> | null }) {
  const s = getSettings(app);
  return (s.functions || {}) as Record<string, boolean>;
}

export function getMessages(app: { settings?: Record<string, unknown> | null }) {
  const s = getSettings(app);
  return (s.messages || {}) as Record<string, string>;
}

export async function isBlacklisted(appId: string, hwid?: string, ip?: string) {
  if (!hwid && !ip) return false;
  const conditions: string[] = [];
  const params: unknown[] = [appId];
  let idx = 2;
  if (hwid) { conditions.push(`(type='hwid' AND value=$${idx})`); params.push(hwid); idx++; }
  if (ip) { conditions.push(`(type='ip' AND value=$${idx})`); params.push(ip); idx++; }
  const r = await query(
    `SELECT 1 FROM blacklist WHERE app_id=$1 AND (${conditions.join(' OR ')}) LIMIT 1`,
    params
  );
  return (r.rowCount ?? 0) > 0;
}

export async function logEvent(appId: string, action: string, username?: string, ip?: string, detail?: string) {
  await query(
    'INSERT INTO logs (app_id, action, username, ip, detail) VALUES ($1,$2,$3,$4,$5)',
    [appId, action, username || null, ip || null, detail || null]
  );
}

export function getClientIp(req: Request) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function applyRateLimit(req: Request) {
  const ip = getClientIp(req);

  // Check admin IP rules
  try {
    const ipCheck = await checkIpAllowed(ip);
    if (!ipCheck.allowed) {
      return error(ipCheck.reason || 'Access denied', 403);
    }
  } catch {
    // If IP rules check fails, don't block — fail open
  }

  const rl = checkApiRateLimit(ip, 60, 60_000);
  if (!rl.allowed) {
    return error(`Rate limit exceeded. Try again in ${rl.retryAfterSeconds}s.`, 429);
  }
  return null;
}

export function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
