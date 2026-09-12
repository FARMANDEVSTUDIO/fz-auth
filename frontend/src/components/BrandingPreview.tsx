'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, ExternalLink } from 'lucide-react';

export default function BrandingPreview({
  appName,
  accentColor,
  logoUrl,
  supportUrl,
}: {
  appName: string;
  accentColor: string;
  logoUrl: string;
  supportUrl: string;
}) {
  const [liveColor, setLiveColor] = useState(accentColor);
  const [liveName, setLiveName] = useState(appName);
  const [liveLogo, setLiveLogo] = useState(logoUrl);
  const [liveSupportUrl, setLiveSupportUrl] = useState(supportUrl);

  useEffect(() => {
    // Watch for form changes via MutationObserver-style approach
    const form = document.querySelector('form');
    if (!form) return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.name === 'app_name') setLiveName(target.value || appName);
      if (target.name === 'accent_color') setLiveColor(target.value || accentColor);
      if (target.name === 'accent_color_picker') setLiveColor(target.value || accentColor);
      if (target.name === 'logo_url') setLiveLogo(target.value);
      if (target.name === 'support_url') setLiveSupportUrl(target.value);
    };

    form.addEventListener('input', handleInput);
    return () => form.removeEventListener('input', handleInput);
  }, [appName, accentColor]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-xl"
    >
      <div className="px-5 py-4 border-b border-edge/50">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-accent" /> Live Preview
        </h3>
        <p className="text-xs text-gray-500 mt-1">How your branding looks in the login API response</p>
      </div>
      <div className="p-5">
        <div
          className="rounded-xl border border-edge/50 p-6 text-center space-y-4"
          style={{ background: `${liveColor}08` }}
        >
          {liveLogo ? (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={liveLogo}
                alt="Logo preview"
                className="h-12 w-auto rounded-lg object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: `${liveColor}25`, color: liveColor }}
            >
              {liveName[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div>
            <h4 className="text-lg font-bold text-white">{liveName || 'Your App'}</h4>
            <p className="text-xs text-gray-500 mt-1">Powered by FZ AUTH</p>
          </div>
          <div
            className="inline-block px-6 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: liveColor }}
          >
            Login
          </div>
          {liveSupportUrl && (
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <ExternalLink className="w-3 h-3" />
              <a href={liveSupportUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                {liveSupportUrl}
              </a>
            </p>
          )}
        </div>

        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">API Response Preview</p>
          <pre className="text-xs text-green-400 font-mono bg-bg rounded-lg p-4 border border-edge overflow-x-auto">
{JSON.stringify({
  branding: {
    ...(liveName ? { app_name: liveName } : {}),
    ...(liveColor ? { accent_color: liveColor } : {}),
    ...(liveLogo ? { logo_url: liveLogo } : {}),
    ...(liveSupportUrl ? { support_url: liveSupportUrl } : {}),
  },
}, null, 2)}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
