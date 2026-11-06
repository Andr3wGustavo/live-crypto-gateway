import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/locale';

type RouteKey = 'home' | 'docs';

const routes: Record<RouteKey, string> = { home: '', docs: '/docs' };

function languages(base: string, path: string) {
  return {
    languages: {
      ...Object.fromEntries(locales.map(language => [language, `${base}/${language}${path}`])),
      'x-default': `${base}/${locales[0]}${path}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return (Object.keys(routes) as RouteKey[]).flatMap(key =>
    locales.map(locale => ({
      url: `${base}/${locale}${routes[key]}`,
      alternates: languages(base, routes[key]),
    })),
  );
}
