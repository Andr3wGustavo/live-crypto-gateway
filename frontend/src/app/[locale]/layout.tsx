import type { Metadata } from "next";
import { Anton, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import "../matrix-theme.css";
import "../cinematic-app.css";
import "../campaign-system.css";
import { BackgroundLayer } from "@/components/BackgroundLayer";
import { SiteMotion } from "@/components/SiteMotion";
import { notFound } from 'next/navigation';
import { dictionaries } from '@/i18n/messages';
import { isLocale, locales } from '@/i18n/locale';
import { I18nProvider } from '@/i18n/Provider';

const terminal = JetBrains_Mono({
  variable: "--font-terminal",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/**
 * Display face: Anton is the closest open poster face to the campaign
 * reference — heavy, condensed, and made for uppercase headlines. Body copy
 * stays on Inter Tight, and telemetry stays on JetBrains Mono.
 */
const display = Anton({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
});

/** Body face: Inter Tight keeps dense UI copy compact without losing legibility. */
const body = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = dictionaries[locale].common;
  return {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
   title: m.title,
   description: m.description,
  icons: {
    icon: '/brand/logo-png.png',
    apple: '/brand/logo-png.png',
  },
  openGraph: {
    title: m.title,
    description: m.description,
    locale: locale === 'pt-BR' ? 'pt_BR' : locale === 'es' ? 'es_ES' : 'en_US',
    images: ['/brand/logo.png'],
  }
  };
}

export function generateStaticParams() { return locales.map(locale => ({ locale })); }

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html
       lang={locale}
       dir="ltr"
      className={`${terminal.variable} ${display.variable} ${body.variable} h-full antialiased dark`}
    >
      <body className="matrix-theme min-h-full font-sans relative overflow-x-hidden">
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var p=localStorage.getItem('lc-motion-preference');var on=p==='on'||(p!=='off'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches);var path=location.pathname.replace(/^\\/(en|pt-BR|es)(\\/|$)/,'$2');if(!path)path='/';var app=path!=='/'&&path.indexOf('/overlay')!==0;var r=document.documentElement;r.dataset.siteMotion=on?'on':'off';if(on&&app){r.classList.add('site-motion-ready');window.__lcRevealTimer=setTimeout(function(){r.classList.add('site-motion-fallback');},2400);}}catch(e){document.documentElement.dataset.siteMotion='off';}})();" }} />
        <I18nProvider locale={locale} messages={dictionaries[locale]}>
        <BackgroundLayer />
        <SiteMotion />

        {/* Dynamic App Content */}
        <div className="relative z-10 min-h-full flex flex-col">
          {children}
        </div>
        </I18nProvider>
      </body>
    </html>
  );
}
