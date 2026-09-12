'use client';

import { useState } from 'react';
import { generateLinkCode, unlinkDiscord } from '@/app/(panel)/team/actions';

export default function DiscordLinkPanel({ discordId }: { discordId: string | null }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const c = await generateLinkCode();
      setCode(c);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-edge rounded-xl">
      <div className="px-5 py-4 border-b border-edge">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <i className="ri-discord-line text-[#5865F2]" /> Discord Link
        </h3>
      </div>
      <div className="p-5">
        {discordId ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">
                Linked: <code className="text-accent font-mono text-xs ml-1">{discordId}</code>
              </p>
              <p className="text-xs text-gray-500 mt-1">Your Discord account is linked. Bot commands will use your website role.</p>
            </div>
            <form action={unlinkDiscord}>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Unlink
              </button>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-400 mb-3">
              Link your Discord account to use bot commands with your website role.
            </p>
            {code ? (
              <div className="flex items-center gap-3">
                <div className="bg-[#0b0b0d] border border-edge rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Your link code (expires in 10 min):</p>
                  <code className="text-2xl font-bold text-accent tracking-widest">{code}</code>
                </div>
                <div className="text-xs text-gray-500 max-w-xs">
                  <p>Run this in Discord:</p>
                  <code className="block mt-1 text-white bg-[#0b0b0d] border border-edge rounded px-2 py-1">/link code:{code}</code>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <i className="ri-link" />
                {loading ? 'Generating...' : 'Generate Link Code'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
