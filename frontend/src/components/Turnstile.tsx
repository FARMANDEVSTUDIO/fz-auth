'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export default function Turnstile({
  onToken,
  siteKey,
}: {
  onToken: (token: string) => void;
  siteKey?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const key = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!key || !containerRef.current || !window.turnstile) return;
    if (widgetId.current) return;

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: key,
      callback: (token: string) => onToken(token),
      theme: 'auto',
      size: 'flexible',
    });
  }, [key, onToken]);

  useEffect(() => {
    if (!key) return;

    if (window.turnstile) {
      renderWidget();
      return;
    }

    window.onTurnstileLoad = renderWidget;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [key, renderWidget]);

  if (!key) return null;

  return <div ref={containerRef} className="my-3" />;
}
