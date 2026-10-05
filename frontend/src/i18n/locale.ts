export const locales = ['en', 'pt-BR', 'es'] as const;
export type Locale = typeof locales[number];
export const localeNames: Record<Locale, string> = { en: 'English', 'pt-BR': 'Português', es: 'Español' };
export const localeCookie = 'livecrypto_locale';
export function isLocale(value: string): value is Locale {
  return locales.some(locale => locale === value);
}
function matchLanguage(value: string): Locale | undefined {
  const language = value.trim().toLowerCase().split('-')[0];
  return language === 'pt' ? 'pt-BR' : language === 'en' ? 'en' : language === 'es' ? 'es' : undefined;
}
export function detectLocale(cookie?: string, acceptLanguage = '', country = ''): Locale {
  if (cookie && isLocale(cookie)) return cookie;
  const preferences = acceptLanguage.slice(0, 2048).split(',').map((part, index) => {
    const [language, ...parameters] = part.trim().split(';');
    const quality = parameters.find(parameter => parameter.trim().startsWith('q='));
    const q = quality ? Number(quality.trim().slice(2)) : 1;
    return { locale: matchLanguage(language), q, index };
  }).filter(item => item.locale && Number.isFinite(item.q) && item.q > 0 && item.q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  if (preferences[0]?.locale) return preferences[0].locale;
  // Country is only a weak fallback; multilingual countries use English.
  if (['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST'].includes(country.toUpperCase())) return 'pt-BR';
  if (['ES', 'MX', 'AR', 'CL', 'CO', 'PE', 'EC', 'UY', 'PY', 'BO', 'VE', 'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'DO', 'CU'].includes(country.toUpperCase())) return 'es';
  return 'en';
}
export function stripLocale(path: string): string {
  const first = path.split('/')[1];
  return isLocale(first || '') ? path.slice(first.length + 1) || '/' : path;
}
export function localePath(locale: Locale, path = '/'): string {
  const rest = stripLocale(path);
  return `/${locale}${rest === '/' ? '' : rest}`;
}
// Crypto decimals are localized without converting exact values to Number.
export function formatDecimal(value: string, locale: Locale): string {
  if (!/^-?\d+(\.\d+)?$/.test(value)) return value;
  const [integer, fraction] = value.split('.');
  const separator = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
  const formatted = `${value.startsWith('-') && BigInt(integer) === 0n ? '-' : ''}${new Intl.NumberFormat(locale).format(BigInt(integer))}`;
  return fraction ? `${formatted}${separator}${fraction}` : formatted;
}
