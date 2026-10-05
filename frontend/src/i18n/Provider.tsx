"use client";

import { createContext, useContext, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { formatDecimal, isLocale, localeCookie, localeNames, localePath, locales, stripLocale, type Locale } from './locale';
import type { Messages } from './messages';

const Context = createContext<{ locale: Locale; messages: Messages } | null>(null);
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n() {
  const context = useContext(Context);
  if (!context) throw new Error('I18nProvider is required');
  const { locale } = context;
  return {
    ...context,
    path: (path = '/') => localePath(locale, path),
    number: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, options).format(value),
    decimal: (value: string) => formatDecimal(value, locale),
    date: (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)),
  };
}
export function LanguageSwitcher() {
  const { locale, messages } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  // Never render application controls inside an OBS browser source.
  if (stripLocale(pathname).startsWith('/overlay/')) return null;
  return <label className="language-switcher">
    <span>{messages.common.language}</span>
    <select value={locale} onChange={event => {
      const next = event.target.value;
      if (!isLocale(next)) return;
      document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
      router.replace(`${localePath(next, pathname)}${window.location.search}${window.location.hash}`);
    }}>
      {locales.map(value => <option key={value} value={value} lang={value}>{localeNames[value]}</option>)}
    </select>
  </label>;
}
