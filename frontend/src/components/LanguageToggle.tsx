'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { localeNames, localeFlags, locales, type Locale } from '@/lib/i18n';
import { Languages, ChevronDown } from 'lucide-react';

export default function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = (l: Locale) => {
    setLocale(l);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-edge hover:bg-white/5 transition-colors text-xs"
        title={`${t('language.label')}: ${localeNames[locale]}`}
        aria-label={t('language.label')}
      >
        <Languages className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-400 font-medium hidden sm:inline">
          {localeFlags[locale]} {localeNames[locale]}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-1.5 z-50 glass-strong rounded-xl border border-edge/50 shadow-2xl overflow-hidden min-w-[180px]">
          <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-gray-500 font-bold">
            {t('language.choose')}
          </div>
          {locales.map(l => (
            <button
              key={l}
              onClick={() => pick(l)}
              className={`w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                locale === l ? 'bg-accent/10 text-accent' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-sm">{localeFlags[l]}</span>
              <span className="font-medium">{localeNames[l]}</span>
              {locale === l && (
                <span className="ms-auto text-[8px] text-accent font-bold">{t('language.active')}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
