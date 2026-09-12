import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CleanupResult {
  category: string;
  count: number;
  status: 'success' | 'skipped' | 'error';
  detail?: string;
}

async function safeCleanup(
  label: string,
  sql: string,
  params?: unknown[],
  dryRun = false
): Promise<CleanupResult> {
  try {
    if (dryRun) {
      // Convert DELETE to SELECT COUNT for dry run
      const countSql = sql
        .replace(/^DELETE FROM/i, 'SELECT COUNT(*)::int AS c FROM')
        .replace(/\s+RETURNING\s+.*/i, '');
      const res = await query(countSql, params);
      return { category: label, count: res.rows[0]?.c ?? 0, status: 'success', detail: 'dry run' };
    }
    const res = await query(sql, params);
    return { category: label, count: res.rowCount ?? 0, status: 'success' };
  } catch (e: any) {
    // Table might not exist — skip gracefully
    if (e?.code === '42P01') {
      return { category: label, count: 0, status: 'skipped', detail: 'table does not exist' };
    }
    return { category: label, count: 0, status: 'error', detail: e?.message || 'Unknown error' };
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'fz-cron-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === 'true';

  const results: CleanupResult[] = [];

  // 1. Expired sessions
  results.push(
    await safeCleanup('expired_sessions', 'DELETE FROM sessions WHERE expires_at < NOW()', [], dryRun)
  );

  // 2. Expired/used password resets
  results.push(
    await safeCleanup('expired_resets', 'DELETE FROM password_resets WHERE expires_at < NOW() OR used=TRUE', [], dryRun)
  );

  // 3. Expired OTPs
  results.push(
    await safeCleanup('expired_otps', 'DELETE FROM email_otps WHERE expires_at < NOW()', [], dryRun)
  );

  // 4. Old logs (90 days)
  results.push(
    await safeCleanup('old_logs', "DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days'", [], dryRun)
  );

  // 5. Old notifications (30 days)
  results.push(
    await safeCleanup('old_notifications', "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'", [], dryRun)
  );

  // 6. Expired licenses (used ones only — keep unused even if expired)
  results.push(
    await safeCleanup(
      'expired_licenses',
      "DELETE FROM licenses WHERE expiry < NOW() AND used_at IS NOT NULL",
      [],
      dryRun
    )
  );

  // 7. Old webhook_logs (14 days) — table may not exist
  results.push(
    await safeCleanup('old_webhook_logs', "DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '14 days'", [], dryRun)
  );

  // 8. Old login_history (90 days) — table may not exist
  results.push(
    await safeCleanup('old_login_history', "DELETE FROM login_history WHERE created_at < NOW() - INTERVAL '90 days'", [], dryRun)
  );

  // 9. Expired admin IP rules
  results.push(
    await safeCleanup(
      'expired_ip_rules',
      'DELETE FROM admin_ip_rules WHERE expires_at IS NOT NULL AND expires_at < NOW()',
      [],
      dryRun
    )
  );

  const totalCleaned = results.reduce((sum, r) => sum + r.count, 0);

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    total_cleaned: totalCleaned,
    results,
    timestamp: new Date().toISOString(),
  });
}
