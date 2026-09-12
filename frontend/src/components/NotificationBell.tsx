'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, X } from 'lucide-react';

type Notif = { id: string; title: string; message: string; read: boolean; created_at: string };

export default function NotificationBell({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [count, setCount] = useState(initialCount);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Listen for SSE count updates
  useEffect(() => {
    function handleCountUpdate(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (typeof detail?.count === 'number') {
        setCount(detail.count);
        // Reset loaded so next open re-fetches
        setLoaded(false);
      }
    }
    window.addEventListener('fz:notification-count', handleCountUpdate);
    return () => window.removeEventListener('fz:notification-count', handleCountUpdate);
  }, []);

  const loadNotifs = async () => {
    if (loaded) return;
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setNotifs(data);
      setLoaded(true);
    }
  };

  const toggle = () => {
    if (!open) loadNotifs();
    setOpen(!open);
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read_all' }),
    });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setCount(0);
  };

  const clearAll = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' }),
    });
    setNotifs([]);
    setCount(0);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
        <Bell className="w-4.5 h-4.5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 top-full mt-2 w-80 glass-strong rounded-xl border border-edge/50 shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-edge/50 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <div className="flex items-center gap-1">
                {count > 0 && (
                  <button onClick={markAllRead} className="p-1 text-gray-500 hover:text-accent transition-colors" title="Mark all read">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifs.length > 0 && (
                  <button onClick={clearAll} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Clear all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 text-gray-500 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-gray-600">No notifications yet</p>
              ) : (
                notifs.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-edge/30 hover:bg-white/[0.02] transition-colors ${!n.read ? 'bg-accent/[0.03]' : ''}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
