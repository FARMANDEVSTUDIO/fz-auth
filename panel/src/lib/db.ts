import { Pool } from 'pg';

// Shares the same PostgreSQL database as the Fastify API.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

export function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
