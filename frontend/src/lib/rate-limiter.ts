const store = new Map<string, { count: number; resetAt: number; lockedUntil?: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt && (!val.lockedUntil || now > val.lockedUntil)) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs: number;
}

const DEFAULTS: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
};

export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const { maxAttempts, windowMs, lockoutMs } = { ...DEFAULTS, ...config };
  const now = Date.now();
  const entry = store.get(key);

  if (entry?.lockedUntil && now < entry.lockedUntil) {
    const retryAfterSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    entry.lockedUntil = now + lockoutMs;
    const retryAfterSeconds = Math.ceil(lockoutMs / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: maxAttempts - entry.count };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

const apiStore = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of apiStore) {
    if (now > val.resetAt) apiStore.delete(key);
  }
}, 30_000);

export function checkApiRateLimit(
  ip: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = apiStore.get(ip);

  if (!entry || now > entry.resetAt) {
    apiStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: maxRequests - entry.count };
}
