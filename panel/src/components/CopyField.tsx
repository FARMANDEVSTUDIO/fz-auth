'use client';

import { useState } from 'react';

// Masked credential field with copy-to-clipboard.
export default function CopyField({ label, value, mask = false }: { label: string; value: string; mask?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!mask);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-[#0b0b0d] border border-edge rounded-lg px-3 py-2 text-xs text-gray-300 font-mono truncate">
          {revealed ? value : '•'.repeat(Math.min(value.length, 32))}
        </code>
        {mask && (
          <button
            onClick={() => setRevealed(r => !r)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-edge text-gray-400 hover:text-white hover:bg-card2 transition-colors"
            title={revealed ? 'Hide' : 'Reveal'}
          >
            <i className={revealed ? 'ri-eye-off-line' : 'ri-eye-line'} />
          </button>
        )}
        <button
          onClick={copy}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-edge text-gray-400 hover:text-white hover:bg-card2 transition-colors"
          title="Copy"
        >
          <i className={copied ? 'ri-check-line text-green-500' : 'ri-clipboard-line'} />
        </button>
      </div>
    </div>
  );
}
