import crypto from 'crypto';
import { query } from './db';

async function ensureWebhookLogsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id SERIAL PRIMARY KEY,
      webhook_id TEXT,
      webhook_url TEXT NOT NULL,
      app_id TEXT NOT NULL,
      event TEXT NOT NULL,
      request_body TEXT,
      status_code INT,
      response_body TEXT,
      error_message TEXT,
      success BOOLEAN NOT NULL DEFAULT FALSE,
      duration_ms INT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_webhook_logs_app ON webhook_logs (app_id)`);
}

async function logWebhookDelivery(params: {
  webhookId?: string;
  webhookUrl: string;
  appId: string;
  event: string;
  requestBody: string;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  success: boolean;
  durationMs: number;
}) {
  try {
    await ensureWebhookLogsTable();
    await query(
      `INSERT INTO webhook_logs (webhook_id, webhook_url, app_id, event, request_body, status_code, response_body, error_message, success, duration_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        params.webhookId || null,
        params.webhookUrl,
        params.appId,
        params.event,
        params.requestBody.slice(0, 2000),
        params.statusCode || null,
        params.responseBody ? params.responseBody.slice(0, 500) : null,
        params.errorMessage || null,
        params.success,
        params.durationMs,
      ]
    );
  } catch (e) {
    console.error('Failed to log webhook delivery:', e);
  }
}

export async function fireWebhooks(appId: string, event: string, payload: Record<string, any>) {
  try {
    const res = await query(
      'SELECT id, url, secret FROM webhooks WHERE app_id=$1 AND active=TRUE AND $2 = ANY(events)',
      [appId, event]
    );

    if (res.rows.length === 0) return;

    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });

    const promises = res.rows.map(async (hook: { id: string; url: string; secret: string }) => {
      const start = Date.now();
      try {
        const signature = crypto
          .createHmac('sha256', hook.secret)
          .update(body)
          .digest('hex');

        const response = await fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-FZAuth-Signature': signature,
            'X-FZAuth-Event': event,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });

        const durationMs = Date.now() - start;
        let responseBody = '';
        try {
          responseBody = await response.text();
        } catch {
          // ignore
        }

        await logWebhookDelivery({
          webhookId: hook.id,
          webhookUrl: hook.url,
          appId,
          event,
          requestBody: body,
          statusCode: response.status,
          responseBody,
          success: response.ok,
          durationMs,
        });
      } catch (err: any) {
        const durationMs = Date.now() - start;
        await logWebhookDelivery({
          webhookId: hook.id,
          webhookUrl: hook.url,
          appId,
          event,
          requestBody: body,
          errorMessage: err?.message || 'Unknown error',
          success: false,
          durationMs,
        });
      }
    });

    await Promise.allSettled(promises);
  } catch {
    // never let webhook failures break the main flow
  }
}

export async function getWebhookLogs(appId: string, limit: number = 50) {
  await ensureWebhookLogsTable();
  const res = await query(
    'SELECT * FROM webhook_logs WHERE app_id=$1 ORDER BY created_at DESC LIMIT $2',
    [appId, limit]
  );
  return res.rows as WebhookLog[];
}

export async function getWebhookLogById(logId: number) {
  await ensureWebhookLogsTable();
  const res = await query('SELECT * FROM webhook_logs WHERE id=$1', [logId]);
  return res.rows[0] as WebhookLog | undefined;
}

export interface WebhookLog {
  id: number;
  webhook_id: string | null;
  webhook_url: string;
  app_id: string;
  event: string;
  request_body: string | null;
  status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  success: boolean;
  duration_ms: number;
  created_at: string;
}

export async function retryWebhookDelivery(logId: number): Promise<{ ok: boolean; message: string }> {
  await ensureWebhookLogsTable();

  const logRes = await query('SELECT * FROM webhook_logs WHERE id=$1', [logId]);
  const log = logRes.rows[0] as WebhookLog | undefined;
  if (!log) return { ok: false, message: 'Log entry not found' };

  if (!log.request_body) return { ok: false, message: 'No request body to retry' };

  // Find the webhook to get the secret
  let secret = '';
  if (log.webhook_id) {
    const hookRes = await query('SELECT secret FROM webhooks WHERE id=$1', [log.webhook_id]);
    if (hookRes.rows[0]) {
      secret = hookRes.rows[0].secret;
    }
  }

  const start = Date.now();
  try {
    const signature = secret
      ? crypto.createHmac('sha256', secret).update(log.request_body).digest('hex')
      : '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-FZAuth-Event': log.event,
    };
    if (signature) headers['X-FZAuth-Signature'] = signature;

    const response = await fetch(log.webhook_url, {
      method: 'POST',
      headers,
      body: log.request_body,
      signal: AbortSignal.timeout(5000),
    });

    const durationMs = Date.now() - start;
    let responseBody = '';
    try {
      responseBody = await response.text();
    } catch {
      // ignore
    }

    await logWebhookDelivery({
      webhookId: log.webhook_id || undefined,
      webhookUrl: log.webhook_url,
      appId: log.app_id,
      event: log.event,
      requestBody: log.request_body,
      statusCode: response.status,
      responseBody,
      success: response.ok,
      durationMs,
    });

    return {
      ok: response.ok,
      message: response.ok ? 'Webhook retried successfully' : `Retry failed with status ${response.status}`,
    };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    await logWebhookDelivery({
      webhookId: log.webhook_id || undefined,
      webhookUrl: log.webhook_url,
      appId: log.app_id,
      event: log.event,
      requestBody: log.request_body,
      errorMessage: err?.message || 'Unknown error',
      success: false,
      durationMs,
    });

    return { ok: false, message: err?.message || 'Retry failed' };
  }
}
