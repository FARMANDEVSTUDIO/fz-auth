'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { auth, login } = useAuth();
  const router = useRouter();
  const [apiUrl, setApiUrl] = useState('http://localhost:3000');
  const [appId, setAppId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (auth) {
    router.push('/dashboard');
    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!appId.trim() || !adminKey.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ apiUrl, adminKey, appId, path: 'stats', body: {} }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      login(apiUrl, appId, adminKey);
      router.push('/dashboard');
    } catch {
      setError('Cannot connect to API. Is the server running?');
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'var(--color-primary)', top: '-150px', left: '-100px', animation: 'orb-float 18s ease-in-out infinite' }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[120px]"
          style={{ background: 'var(--color-purple)', bottom: '-100px', right: '-80px', animation: 'orb-float 18s ease-in-out infinite', animationDelay: '-6s' }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'var(--color-cyan)', top: '40%', left: '50%', animation: 'orb-float 18s ease-in-out infinite', animationDelay: '-12s' }}
        />
      </div>

      {/* Login card */}
      <div className="animate-card-enter relative w-full max-w-[420px] mx-4">
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-10 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-purple)] text-white text-2xl mb-4 shadow-lg" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
              <i className="ri-shield-keyhole-fill" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              FZ Auth
            </h1>
            <p className="text-[var(--color-muted)] text-sm mt-1">Admin Panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* API URL */}
            <div className="relative">
              <i className="ri-server-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-base" />
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] text-sm
                  focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)] transition-all"
                placeholder="API URL"
              />
            </div>

            {/* App ID */}
            <div className="relative">
              <i className="ri-apps-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-base" />
              <input
                type="text"
                value={appId}
                onChange={e => setAppId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] text-sm
                  focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)] transition-all"
                placeholder="App ID"
                required
              />
            </div>

            {/* Admin Key */}
            <div className="relative">
              <i className="ri-key-2-line absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-base" />
              <input
                type="password"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[var(--color-input)] border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] text-sm
                  focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_var(--color-primary-glow)] transition-all"
                placeholder="Admin Key"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-danger)] text-sm bg-[var(--color-danger-bg)] px-4 py-2.5 rounded-lg">
                <i className="ri-error-warning-line" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold text-sm
                transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect</span>
                  <i className="ri-arrow-right-line" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
