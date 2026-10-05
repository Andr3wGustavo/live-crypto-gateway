"use client";
import { useI18n } from '@/i18n/Provider';
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { messages: { common: c } } = useI18n();
  return <main className="checkout-shell"><section className="product-panel checkout-panel"><h1>{c.error}</h1><button className="brand-button primary" onClick={reset}>{c.retry}</button></section></main>;
}
