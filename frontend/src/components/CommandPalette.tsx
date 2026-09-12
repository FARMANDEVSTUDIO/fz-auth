'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, Key, Users, UserPlus, Settings,
  Radio, Zap, CreditCard, Variable, Webhook, FolderOpen,
  ShieldCheck, FileText, Download, Coins, ShoppingBag,
  UserCircle, ShieldAlert, Command, BarChart3, MessageSquare,
  History, BookOpen,
} from 'lucide-react';

const commands = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: 'home manage apps' },
  { label: 'Licenses', href: '/licenses', icon: Key, keywords: 'keys generate' },
  { label: 'Users', href: '/users', icon: Users, keywords: 'list ban delete' },
  { label: 'Team', href: '/team', icon: UserPlus, keywords: 'members invite' },
  { label: 'Settings', href: '/settings', icon: Settings, keywords: 'config options' },
  { label: 'Account', href: '/account', icon: UserCircle, keywords: 'profile password' },
  { label: 'Sessions', href: '/sessions', icon: Radio, keywords: 'active online' },
  { label: 'Tokens', href: '/tokens', icon: Zap, keywords: 'api auth' },
  { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard, keywords: 'plans billing' },
  { label: 'Variables', href: '/variables', icon: Variable, keywords: 'data store' },
  { label: 'Webhooks', href: '/webhooks', icon: Webhook, keywords: 'events hooks' },
  { label: 'Files', href: '/files', icon: FolderOpen, keywords: 'upload download' },
  { label: 'Blacklist', href: '/rules', icon: ShieldCheck, keywords: 'ban block ip hwid' },
  { label: 'Logs', href: '/logs', icon: FileText, keywords: 'activity history events' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, keywords: 'charts graphs stats' },
  { label: 'Downloads', href: '/downloads', icon: Download, keywords: 'releases' },
  { label: 'Earn', href: '/earn', icon: Coins, keywords: 'credits rewards referral daily' },
  { label: 'Shop', href: '/shop', icon: ShoppingBag, keywords: 'buy upgrade premium' },
  { label: 'Appeals', href: '/appeals', icon: MessageSquare, keywords: 'ban appeal review' },
  { label: 'Changelog', href: '/changelog', icon: History, keywords: 'updates version history' },
  { label: 'API Docs', href: '/docs', icon: BookOpen, keywords: 'api documentation endpoints' },
  { label: 'Admin Panel', href: '/admin', icon: ShieldAlert, keywords: 'admin master owners' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = commands.filter(c => {
    const q = search.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.keywords.includes(q);
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(prev => !prev);
      setSearch('');
      setSelected(0);
    }
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => { setSelected(0); }, [search]);

  const navigate = (href: string) => {
    setOpen(false);
    setSearch('');
    router.push(href);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      navigate(filtered[selected].href);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]"
          >
            <div className="glass-strong rounded-2xl shadow-2xl border border-edge/50 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-edge/50">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search pages..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                />
                <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 border border-edge rounded text-[10px] text-gray-500 font-mono">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[320px] overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-gray-500">No results found</p>
                ) : (
                  filtered.map((cmd, i) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.href}
                        onClick={() => navigate(cmd.href)}
                        onMouseEnter={() => setSelected(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          i === selected ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{cmd.label}</span>
                        {i === selected && (
                          <span className="ms-auto text-[10px] text-gray-600">Enter to open</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2 border-t border-edge/50 flex items-center gap-4 text-[10px] text-gray-600">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/5 border border-edge rounded font-mono">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/5 border border-edge rounded font-mono">↵</kbd> Open</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white/5 border border-edge rounded font-mono">Esc</kbd> Close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
