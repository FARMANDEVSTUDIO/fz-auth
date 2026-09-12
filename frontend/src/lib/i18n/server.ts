import { cookies } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale, makeT, type Locale, type TFunction } from './index';

/**
 * Locale for the current request, taken from the cookie the language picker
 * writes. Server components need this because they cannot read React context.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Translator bound to the request's locale, for use in server components. */
export async function getT(): Promise<TFunction> {
  return makeT(await getLocale());
}
