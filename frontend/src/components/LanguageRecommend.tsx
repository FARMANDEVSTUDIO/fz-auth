'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n';
import { Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const browserLangMap: Record<string, Locale> = {
  en: 'en', ur: 'ur', ar: 'ar',
};

export default function LanguageRecommend() {
  const { locale, setLocale, t } = useLanguage();
  const [suggested, setSuggested] = useState<Locale | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('fz-lang-recommend-dismissed')) return;

    const browserLang = navigator.language?.split('-')[0]?.toLowerCase() || '';
    const match = browserLangMap[browserLang];
    if (match && match !== locale && locales.includes(match)) {
      setSuggested(match);
    }
  }, [locale]);

  const accept = () => {
    if (suggested) setLocale(suggested);
    localStorage.setItem('fz-lang-recommend-dismissed', '1');
    setDismissed(true);
  };

  const dismiss = () => {
    localStorage.setItem('fz-lang-recommend-dismissed', '1');
    setDismissed(true);
  };

  if (!suggested || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 end-4 z-50 glass-strong rounded-xl border border-accent/20 shadow-2xl p-4 max-w-[280px]"
      >
        <button
          onClick={dismiss}
          className="absolute top-2 end-2 text-gray-500 hover:text-white transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center border border-accent/20">
            <Globe className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{t('language.detected')}</p>
            <p className="text-[10px] text-gray-500">{t('language.basedOnBrowser')}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3">
          {t('language.switchTo', { name: `${localeFlags[suggested]} ${localeNames[suggested]}` })}
        </p>

        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 px-3 py-1.5 btn-gradient text-white rounded-lg text-xs font-semibold"
          >
            {t('language.switchAction', { name: localeNames[suggested] })}
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-1.5 bg-white/5 border border-edge rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
          >
            {t('language.keepCurrent')}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
