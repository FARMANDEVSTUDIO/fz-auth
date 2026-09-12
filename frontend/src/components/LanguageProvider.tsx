'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LOCALE_COOKIE,
  LOCALE_STORAGE,
  defaultLocale,
  isLocale,
  isRtlLocale,
  makeT,
  type Locale,
  type TFunction,
} from '@/lib/i18n';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunction;
  /** True for Urdu and Arabic. Affects text direction only, never layout. */
  isRtl: boolean;
  /** Direction to hand to a text node or an input. The shell stays 'ltr'. */
  textDir: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: makeT(defaultLocale),
  isRtl: false,
  textDir: 'ltr',
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({
  initialLocale = defaultLocale,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const apply = useCallback((l: Locale) => {
    const root = document.documentElement;
    root.lang = l;
    // The dashboard shell is never mirrored. Keeping dir="ltr" leaves the
    // sidebar, grids, cards and icon rows exactly where English puts them;
    // Urdu and Arabic get their direction on the text itself instead.
    root.dir = 'ltr';
    root.dataset.localeDir = isRtlLocale(l) ? 'rtl' : 'ltr';
  }, []);

  const setLocale = useCallback(
    (l: Locale) => {
      if (!isLocale(l)) return;
      setLocaleState(l);
      apply(l);
      // The cookie is the source of truth: server components read it so the
      // very first paint after a refresh is already in the chosen language.
      document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
      try {
        localStorage.setItem(LOCALE_STORAGE, l);
      } catch {}
      // Server components hold their own copy of the strings, so ask Next to
      // re-render them against the new cookie.
      router.refresh();
    },
    [apply, router],
  );

  useEffect(() => {
    apply(locale);
  }, [apply, locale]);

  useEffect(() => {
    // Older builds saved the locale in localStorage only. Promote it to the
    // cookie once so the server can render the right language from now on.
    if (document.cookie.includes(`${LOCALE_COOKIE}=`)) return;
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE);
      if (isLocale(saved) && saved !== locale) setLocale(saved);
    } catch {}
    // Runs once on mount; setLocale is stable enough for this migration step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const rtl = isRtlLocale(locale);
    return {
      locale,
      setLocale,
      t: makeT(locale),
      isRtl: rtl,
      textDir: rtl ? 'rtl' : 'ltr',
    };
  }, [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
