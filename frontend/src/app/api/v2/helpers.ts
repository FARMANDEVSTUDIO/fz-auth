import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { checkApiRateLimit } from '@/lib/rate-limiter';
import crypto from 'crypto';

const API_VERSION = '2.0';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ApiMeta {
  api_version: string;
  timestamp: string;
  request_id: string;
}

interface ErrorDetail {
  code: string;
  message: string;
  field?: string;
}

function generateRequestId(): string {
  return crypto.randomUUID();
}

function baseMeta(): ApiMeta {
  return {
    api_version: API_VERSION,
    timestamp: new Date().toISOString(),
    request_id: generateRequestId(),
  };
}

export function apiResponse(data: Record<string, unknown>, status = 200, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: { ...baseMeta(), ...extra },
    },
    {
      status,
      headers: { 'X-API-Version': API_VERSION },
    }
  );
}

export function apiError(message: string, code: string, status = 400, errors?: ErrorDetail[]) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(errors ? { details: errors } : {}) },
      meta: baseMeta(),
    },
    {
      status,
      headers: { 'X-API-Version': API_VERSION },
    }
  );
}

export function paginatedResponse(
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
      meta: { ...baseMeta(), ...extra },
    },
    {
      status: 200,
      headers: { 'X-API-Version': API_VERSION },
    }
  );
}

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

export function getClientIp(req: Request) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export function applyRateLimit(req: Request) {
  const ip = getClientIp(req);
  const rl = checkApiRateLimit(ip, 120, 60_000); // v2 gets higher limit
  if (!rl.allowed) {
    return apiError(
      `Rate limit exceeded. Try again in ${rl.retryAfterSeconds}s.`,
      'RATE_LIMITED',
      429
    );
  }
  return null;
}

export async function authenticateApp(req: Request) {
  const rlResponse = applyRateLimit(req);
  if (rlResponse) return { error: rlResponse, app: null };

  // Support both header and query param auth
  const url = new URL(req.url);
  const appId = req.headers.get('x-app-id') || url.searchParams.get('app_id') || '';
  const secret = req.headers.get('x-app-secret') || url.searchParams.get('secret') || '';

  if (!appId || !secret) {
    return {
      error: apiError('Missing app_id or secret. Provide via headers (X-App-Id, X-App-Secret) or query params.', 'AUTH_MISSING', 401),
      app: null,
    };
  }

  const app = await resolveApp(appId, secret);
  if (!app) {
    return {
      error: apiError('Invalid application credentials', 'AUTH_INVALID', 401),
      app: null,
    };
  }

  return { error: null, app };
}

export async function logEvent(appId: string, action: string, username?: string, ip?: string, detail?: string) {
  await query(
    'INSERT INTO logs (app_id, action, username, ip, detail) VALUES ($1,$2,$3,$4,$5)',
    [appId, action, username || null, ip || null, detail || null]
  );
}

export function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export function parsePagination(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20') || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
