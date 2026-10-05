import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { CreatorDemo, FeeCalculator } from '@/components/CreatorDemo';
import { LandingMotion } from '@/components/LandingMotion';
import { BlockchainScene } from '@/components/BlockchainScene';
import { Brand } from '@/components/Brand';
import { CreatorGuide, ReceivingGuide, SecurityGuide } from '@/components/CreatorGuide';
import { LanguageSwitcher } from '@/i18n/Provider';
import { dictionaries } from '@/i18n/messages';
import { isLocale, localePath } from '@/i18n/locale';
import './landing.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { alternates: { canonical: `/${locale}`, languages: { en: '/en', 'pt-BR': '/pt-BR', es: '/es', 'x-default': '/en' } } };
}

function BlockIcon() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 4 42 14v20L24 44 6 34V14L24 4Z" /><path d="m6 14 18 10 18-10M24 24v20M15 9l18 10v10" /></svg>;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { home: h, common: c, guide: g } = dictionaries[locale];
  const x = h.cinema;
  const login = localePath(locale, '/login');
  const poster = '/brand/ChatGPT Image Aug 12, 2026, 12_28_01 PM.png';
  return <LandingMotion>
    <a href="#main" className="skip-link">{h.skip}</a>
    <header className="site-header cinema-header">
      <Brand href={`/${locale}`} label={`Live Crypto · ${c.home}`} />
      <nav aria-label={h.nav}><a href="#how-it-works">{h.how}</a><a href="#experience">OBS Studio</a><a href="#security">{g.securityLink}</a></nav>
      <div className="header-actions"><LanguageSwitcher /><Link href={login} className="brand-button secondary small">{c.creator} <span aria-hidden="true">↗</span></Link></div>
    </header>
    <main id="main">
      <section className="cinema-hero" aria-labelledby="hero-title">
        <div className="cinema-film" aria-hidden="true">
          <video data-ambient data-src="/brand/animation.mp4" muted loop playsInline preload="none" poster={poster} tabIndex={-1} />
          <div className="film-wash" />
        </div>
        <div className="cinema-grid" aria-hidden="true" />
        <div className="matrix-rain" aria-hidden="true">{Array.from({length:16},(_,i)=><span key={i} style={{'--column':i} as CSSProperties}>01 LC 101 ↗ 0xF2 001 01 110 LC 010 01 101</span>)}</div>
        <div className="cinema-hero-copy">
          <p className="eyebrow"><span className="live-dot" />{h.eyebrow}</p>
          <h1 id="hero-title">{h.hero[0]}<br />{h.hero[1]}<br /><span>{h.hero[2]}</span></h1>
          <p className="cinema-description">{h.description}</p>
          <div className="button-row"><Link href={login} className="brand-button primary">{h.explore}<span aria-hidden="true">↗</span></Link><a href="#experience" className="brand-button secondary"><span className="play-symbol" aria-hidden="true">▷</span>{h.watch}</a></div>
          <p className="cinema-caption">{h.caption}</p>
        </div>
        <div className="hero-network"><div className="network-emblem"><Image src="/brand/logo-png.png" alt="" width={200} height={200} unoptimized /><span>{x.signal}<small>WALLET · CHAIN · OBS</small></span></div><BlockchainScene compact /><a href="#how-it-works" className="console-link">{g.timeline} <span aria-hidden="true">↓</span></a></div>
        <div className="cinema-hero-bottom"><span>01 — {x.stage}</span><a href="#how-it-works">{h.discover} <span aria-hidden="true">↓</span></a></div>
      </section>

      <div className="cinema-proof">{x.proof.map((label, i) => <span key={label}><b aria-hidden="true">{['↗', '◉', '⬡'][i]}</b>{label}</span>)}</div>

      <section className="chain-sequence" id="how-it-works" aria-labelledby="chain-title">
        <div className="chain-stage section-wrap">
          <div className="chain-copy">
            <p className="eyebrow">02 / {h.flowEyebrow}</p>
            <h2 id="chain-title">{g.chainTitle}</h2>
            <p className="section-copy">{g.chainIntro}</p>
            <ol className="chain-chapters">{x.stages.map(([title, body], i) => <li key={title} data-chapter={i}><span className="chapter-number">0{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
          </div>
          <BlockchainScene />
        </div>
      </section>

      <div className="section-wrap setup-section"><CreatorGuide /></div>

      <section id="experience" className="obs-experience section-wrap" aria-labelledby="obs-title">
        <div className="section-heading"><div><p className="eyebrow">03 / {x.obsEyebrow}</p><h2 id="obs-title">{x.obsTitle[0]}<br /><span>{x.obsTitle[1]}</span></h2></div><p>{x.obsIntro}</p></div>
        <div className="obs-window"><div className="obs-window-bar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>LIVECRYPTO × OBS STUDIO</span><span className="obs-preview-tag">{x.preview}</span></div><CreatorDemo /></div>
        <ol className="obs-setup">{x.obsSteps.map(([title, text], i) => <li key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
        <Link href={login} className="obs-studio-link">{x.obsLink} <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="cinema-manifesto section-wrap">
        <p className="eyebrow">{h.manifesto}</p><h2>{h.control[0]}<br /><span>{h.control[1]}</span></h2>
        <div className="cinema-principles">{h.principles.map(([title, text], i) => <article key={title}><div className={`principle-art principle-art-${i}`} aria-hidden="true">{i === 0 ? <BlockIcon /> : i === 1 ? <span>✳</span> : <span>↗</span>}</div><span className="index-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <div id="security" className="section-wrap education-grid"><ReceivingGuide /><SecurityGuide /></div>
      <section id="pricing" className="pricing-section section-wrap"><div><p className="eyebrow">04 / {h.pricingEyebrow}</p><h2>{h.pricing[0]}<br /><span>{h.pricing[1]}</span></h2><p className="section-copy">{h.pricingIntro}</p><ul className="plain-list">{h.benefits.map(text => <li key={text}>{text}</li>)}</ul><p className="field-hint">{h.terms}</p></div><FeeCalculator /></section>
      <section className="network-section section-wrap"><p className="eyebrow">{h.chainsEyebrow}</p><h2>{h.chains[0]}<br /><span className="muted">{h.chains[1]}</span></h2><div className="network-grid">{h.networks.map(([title, text, tag], i) => <article key={title} className={`product-panel ${i === 2 ? 'future-network' : ''}`}><span className="network-symbol" aria-hidden="true">{['Ξ', '≋', '+'][i]}</span><h3>{title}</h3><p>{text}</p><span className="phase-tag">{tag}</span></article>)}</div></section>
      <section className="faq-section section-wrap" id="faq"><div><p className="eyebrow">{h.faqEyebrow}</p><h2>{h.faqTitle[0]}<br /><span className="muted">{h.faqTitle[1]}</span></h2></div><div className="faq-list">{h.questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="closing-section section-wrap"><div className="closing-orb" aria-hidden="true" /><p className="eyebrow">{h.closing}</p><h2>{h.closingTitle[0]}<br /><span>{h.closingTitle[1]}</span></h2><Link href={login} className="brand-button primary">{c.creator} <span aria-hidden="true">↗</span></Link><p>{h.beta}</p></section>
    </main>
    <footer className="site-footer section-wrap"><Brand href={`/${locale}`} label={`Live Crypto · ${c.home}`} /><p>{h.footer}</p><a href="#faq">{h.contact} ↗</a></footer>
  </LandingMotion>;
}
