import { auth } from '@/auth';
import { getOwnerByEmail } from '@/lib/owners';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const owner = await getOwnerByEmail(session.user.email);
  if (!owner) {
    return new Response('Unauthorized', { status: 401 });
  }

  const ownerId = owner.id;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial heartbeat
      send({ type: 'connected', timestamp: new Date().toISOString() });

      // Track the last notification id we've seen
      let lastSeenId: string | null = null;

      const poll = async () => {
        if (closed) return;

        try {
          // Get unread count
          const countRes = await query(
            'SELECT COUNT(*)::int AS c FROM notifications WHERE owner_id=$1 AND read=FALSE',
            [ownerId]
          );
          const unreadCount = countRes.rows[0].c;

          // Get latest notification
          const latestRes = await query(
            'SELECT id, title, message, created_at FROM notifications WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 1',
            [ownerId]
          );

          const latest = latestRes.rows[0] || null;
          const latestId = latest?.id || null;

          if (latestId && latestId !== lastSeenId) {
            const isNew = lastSeenId !== null; // Don't toast the very first poll
            lastSeenId = latestId;

            send({
              type: 'update',
              unread_count: unreadCount,
              latest: isNew ? latest : null,
              timestamp: new Date().toISOString(),
            });
          } else {
            // Still send count updates even without new notifications
            send({
              type: 'heartbeat',
              unread_count: unreadCount,
              timestamp: new Date().toISOString(),
            });
          }
        } catch {
          // DB error — send heartbeat anyway
          send({ type: 'heartbeat', timestamp: new Date().toISOString() });
        }
      };

      // Initial poll
      await poll();

      // Poll every 5 seconds
      const interval = setInterval(poll, 5000);

      // Cleanup when the connection closes
      const cleanup = () => {
        closed = true;
        clearInterval(interval);
      };

      // Store cleanup for cancel
      (controller as any)._cleanup = cleanup;
    },
    cancel(controller) {
      closed = true;
      if ((controller as any)._cleanup) {
        (controller as any)._cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
