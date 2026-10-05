"use client";
import Link from 'next/link';
import { useI18n } from '@/i18n/Provider';
export default function NotFound() {
  const { messages: { common: c }, path } = useI18n();
  return <main className="checkout-shell"><section className="product-panel checkout-panel"><p className="eyebrow">404</p><h1>{c.notFound}</h1><Link className="brand-button primary" href={path()}>{c.back}</Link></section></main>;
}
