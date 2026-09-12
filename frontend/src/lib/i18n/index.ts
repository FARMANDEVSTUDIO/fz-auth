import en from './en.json';
import ur from './ur.json';
import ar from './ar.json';

export type Locale = 'en' | 'ur' | 'ar';

export type Dictionary = typeof en;

const translations: Record<Locale, Dictionary> = { en, ur, ar };

/** Name of the cookie the locale is persisted in. Server components read it
 *  so the first paint is already in the right language. */
export const LOCALE_COOKIE = 'fz-locale';
export const LOCALE_STORAGE = 'fz-locale';

export const defaultLocale: Locale = 'en';

export const locales: Locale[] = ['en', 'ur', 'ar'];

/** Locales whose script reads right to left. Only the *text* flips for these,
 *  never the dashboard shell. */
export const rtlLocales: Locale[] = ['ur', 'ar'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as string[]).includes(value);
}

function lookup(dict: Dictionary | undefined, path: string): string | undefined {
  if (!dict) return undefined;
  let obj: unknown = dict;
  for (const key of path.split('.')) {
    if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
      obj = (obj as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof obj === 'string' ? obj : undefined;
}

/**
 * Resolve a dotted key for a locale.
 *
 * Falls back to English rather than to the raw key, so a string that has not
 * been translated yet still reads as words instead of `dashboard.manageApps`.
 * `vars` fills `{name}` style placeholders.
 */
export function t(locale: Locale, path: string, vars?: Record<string, string | number>): string {
  const value = lookup(translations[locale], path) ?? lookup(translations.en, path) ?? path;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export type TFunction = (path: string, vars?: Record<string, string | number>) => string;

export function makeT(locale: Locale): TFunction {
  return (path, vars) => t(locale, path, vars);
}

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ur: 'اردو',
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  ur: '🇵🇰',
  ar: '🇸🇦',
};

/** Count of keys that exist per locale — used by the coverage check. */
export function countKeys(locale: Locale): number {
  const walk = (o: Record<string, unknown>): number =>
    Object.values(o).reduce<number>(
      (n, v) => n + (v && typeof v === 'object' ? walk(v as Record<string, unknown>) : 1),
      0,
    );
  return walk(translations[locale] as unknown as Record<string, unknown>);
}
