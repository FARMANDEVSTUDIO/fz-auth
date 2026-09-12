'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default function NotificationStream() {
  const retryRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let mounted = true;

    function connect() {
      if (!mounted) return;

      const es = new EventSource('/api/notifications/stream');
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Update the notification bell count via custom event
          if (typeof data.unread_count === 'number') {
            window.dispatchEvent(
              new CustomEvent('fz:notification-count', {
                detail: { count: data.unread_count },
              })
            );
          }

          // Show toast for new notifications
          if (data.type === 'update' && data.latest) {
            toast(data.latest.title, {
              description: data.latest.message,
              duration: 5000,
            });
          }

          // Reset retry counter on successful message
          retryRef.current = 0;
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        if (!mounted) return;

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
        retryRef.current++;

        setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      mounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return null;
}
