'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

export default function ExportButton({ appId, type }: { appId: string; type: 'users' | 'licenses' | 'logs' }) {
  const [open, setOpen] = useState(false);

  const download = (format: 'csv' | 'json') => {
    setOpen(false);
    window.open(`/api/export?type=${type}&format=${format}&app_id=${appId}`, '_blank');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-white/5 border border-edge rounded-lg hover:bg-white/10 hover:text-white transition-colors font-medium"
      >
        <Download className="w-3.5 h-3.5" /> Export
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-full mt-1 z-20 glass-strong rounded-lg border border-edge/50 shadow-xl overflow-hidden min-w-[100px]">
            <button onClick={() => download('csv')}
              className="w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-start">
              CSV
            </button>
            <button onClick={() => download('json')}
              className="w-full px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-start">
              JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
