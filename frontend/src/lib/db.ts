import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { _pgPool?: Pool };

export const pool =
  globalForPg._pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
  });

if (process.env.NODE_ENV !== 'production') globalForPg._pgPool = pool;

export function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
