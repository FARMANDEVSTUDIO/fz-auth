'use client';

import { useState } from 'react';

export default function CopyButton({ text, title = 'Copy' }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="w-7 h-7 flex items-center justify-center rounded-lg border border-edge text-gray-400 hover:text-white hover:bg-card2 transition-colors"
      title={title}
    >
      <i className={copied ? 'ri-check-line text-green-500' : 'ri-clipboard-line'} />
    </button>
  );
}
