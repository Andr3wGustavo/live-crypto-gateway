import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/locale';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return locales.map(locale => ({ url: `${base}/${locale}`, alternates: { languages: Object.fromEntries(locales.map(language => [language, `${base}/${language}`])) } }));
}
