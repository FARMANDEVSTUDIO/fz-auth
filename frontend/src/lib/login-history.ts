import { query } from './db';
import { getGeoInfo } from './geoip';

export async function ensureLoginHistoryTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS login_history (
      id SERIAL PRIMARY KEY,
      owner_id TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      browser TEXT,
      os TEXT,
      location TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_login_history_owner ON login_history (owner_id)`);
}

function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (/Edg\//i.test(ua)) {
    const m = ua.match(/Edg\/([\d.]+)/);
    browser = `Edge ${m ? m[1].split('.')[0] : ''}`.trim();
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    const m = ua.match(/OPR\/([\d.]+)/);
    browser = `Opera ${m ? m[1].split('.')[0] : ''}`.trim();
  } else if (/Firefox\//i.test(ua)) {
    const m = ua.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${m ? m[1].split('.')[0] : ''}`.trim();
  } else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    const m = ua.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${m ? m[1].split('.')[0] : ''}`.trim();
  } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    const m = ua.match(/Version\/([\d.]+)/);
    browser = `Safari ${m ? m[1].split('.')[0] : ''}`.trim();
  } else if (/curl\//i.test(ua)) {
    browser = 'cURL';
  } else if (/PostmanRuntime/i.test(ua)) {
    browser = 'Postman';
  }

  // OS detection
  if (/Windows NT 10/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/Windows NT 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/Windows NT 6\.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Mac OS X/i.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    os = `macOS ${m ? m[1].replace(/_/g, '.') : ''}`.trim();
  } else if (/Android ([\d.]+)/i.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/);
    os = `Android ${m ? m[1] : ''}`.trim();
  } else if (/iPhone|iPad/i.test(ua)) {
    const m = ua.match(/OS ([\d_]+)/);
    os = `iOS ${m ? m[1].replace(/_/g, '.') : ''}`.trim();
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  return { browser, os };
}

export async function recordLogin(ownerId: string, ip: string, userAgent: string): Promise<void> {
  await ensureLoginHistoryTable();

  const { browser, os } = parseUserAgent(userAgent);

  let location: string | null = null;
  try {
    location = await getGeoInfo(ip);
  } catch {
    // silent fail
  }

  await query(
    `INSERT INTO login_history (owner_id, ip, user_agent, browser, os, location) VALUES ($1,$2,$3,$4,$5,$6)`,
    [ownerId, ip, userAgent, browser, os, location || 'Unknown']
  );
}

export interface LoginHistoryEntry {
  id: number;
  owner_id: string;
  ip: string;
  user_agent: string;
  browser: string;
  os: string;
  location: string;
  created_at: string;
}

export async function getLoginHistory(ownerId: string, limit: number = 20): Promise<LoginHistoryEntry[]> {
  await ensureLoginHistoryTable();
  const res = await query(
    `SELECT * FROM login_history WHERE owner_id=$1 ORDER BY created_at DESC LIMIT $2`,
    [ownerId, limit]
  );
  return res.rows;
}
