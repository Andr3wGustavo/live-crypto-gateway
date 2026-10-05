import { NextRequest, NextResponse } from 'next/server';
import { detectLocale, isLocale, localeCookie, localePath } from './i18n/locale';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split('/')[1] || '')) return NextResponse.next();
  // Only trust this header behind a proxy that strips client-supplied values.
  // No external geolocation call, IP persistence or IP-based access restriction.
  const country = process.env.TRUST_GEO_COUNTRY_HEADER === 'true' ? request.headers.get('x-country-code') || '' : '';
  const locale = detectLocale(request.cookies.get(localeCookie)?.value, request.headers.get('accept-language') || '', country);
  const target = request.nextUrl.clone();
  target.pathname = localePath(locale, pathname);
  const response = NextResponse.redirect(target);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Accept-Language, Cookie');
  return response;
}

export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
