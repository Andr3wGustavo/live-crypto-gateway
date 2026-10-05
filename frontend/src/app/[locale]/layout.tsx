import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "../globals.css";
import "../matrix-theme.css";
import { BackgroundLayer } from "@/components/BackgroundLayer";
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

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${terminal.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
    >
      <body className="matrix-theme min-h-full font-sans relative overflow-x-hidden">
        <I18nProvider locale={locale} messages={dictionaries[locale]}>
        <BackgroundLayer />

        {/* Dynamic App Content */}
        <div className="relative z-10 min-h-full flex flex-col">
          {children}
        </div>
        </I18nProvider>
      </body>
    </html>
  );
}
