import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { CreatorDemo, FeeCalculator } from '@/components/CreatorDemo';
import { LandingMotion } from '@/components/LandingMotion';
import { BlockchainScene } from '@/components/BlockchainScene';
import { Brand } from '@/components/Brand';
import { CinematicFX } from '@/components/CinematicFX';
import { CinematicIntro } from '@/components/CinematicIntro';
import { CryptoField } from '@/components/CryptoField';
import { LiveNetworkTicker } from '@/components/LiveNetworkTicker';
import { CreatorGuide, ReceivingGuide, SecurityGuide } from '@/components/CreatorGuide';
import { SectionRail } from '@/components/SectionRail';
import { ScrollChapters } from '@/components/ScrollChapters';
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
  const { home: h, common: c, guide: g, fx } = dictionaries[locale];
  const x = h.cinema;
  const login = localePath(locale, '/login');
  const poster = '/brand/ChatGPT Image Aug 12, 2026, 12_28_01 PM.png';
  return <LandingMotion>
    <CinematicIntro />
    <CinematicFX />
    <a href="#main" className="skip-link">{h.skip}</a>
    <SectionRail label={fx.rail} />
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
        <div className="hero-aurora" aria-hidden="true"><i /><i /><i /></div>
        <CryptoField />
        <div className="hero-scanlines" aria-hidden="true" />
        <div className="matrix-rain" aria-hidden="true">{Array.from({length:16},(_,i)=><span key={i} style={{'--column':i} as CSSProperties}>01 LC 101 ↗ 0xF2 001 01 110 LC 010 01 101</span>)}</div>
        <div className="token-floaters" aria-hidden="true">
          {['Ξ','◎','⬡','◈'].map((symbol, index) => <span key={symbol} style={{ '--i': index } as CSSProperties}>{symbol}<small>{['EVM','SOL','BASE','P2P'][index]}</small></span>)}
        </div>
        <div className="cinema-hero-copy">
          <p className="eyebrow"><span className="live-dot" />{h.eyebrow}</p>
          <h1 id="hero-title">{h.hero.map((line, index) => <span key={line} className={`hero-line${index === 2 ? ' hero-gradient' : ''}`} style={{ '--i': index } as CSSProperties}>{line}</span>)}</h1>
          <p className="cinema-description">{h.description}</p>
          <ul className="hero-signals" aria-hidden="true">{fx.protocol.slice(0, 3).map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul>
          <div className="button-row"><Link href={login} className="brand-button primary">{h.explore}<span aria-hidden="true">↗</span></Link><a href="#experience" className="brand-button secondary"><span className="play-symbol" aria-hidden="true">▷</span>{h.watch}</a></div>
          <p className="cinema-caption">{h.caption}</p>
        </div>
        <div className="hero-network" data-parallax="0.035" data-tilt-strong><div className="network-emblem"><Image src="/brand/logo-png.png" alt="" width={200} height={200} unoptimized /><span>{x.signal}<small>WALLET · CHAIN · OBS</small></span></div><BlockchainScene compact /><div className="hero-deck-hud" aria-hidden="true"><i className="deck-scan" />{x.nodes.map((node, index) => <b key={node}><i>0{index + 1}</i>{node}</b>)}</div><a href="#how-it-works" className="console-link">{g.timeline} <span aria-hidden="true">↓</span></a></div>
        <div className="cinema-hero-bottom"><span>01 — {x.stage}</span><a href="#how-it-works">{h.discover} <span aria-hidden="true">↓</span></a></div>
      </section>

      <div className="cinema-proof" data-reveal>{x.proof.map((label, i) => <span key={label}><b aria-hidden="true">{['↗', '◉', '⬡'][i]}</b>{label}</span>)}</div>
      <LiveNetworkTicker />
      <div className="kinetic-marquee" aria-hidden="true"><div>{Array.from({ length: 3 }, (_, cycle) => fx.marquee.map((word, index) => <span key={`${cycle}-${index}`}>{word}<i>↗</i></span>))}</div></div>

      <section className="chain-sequence" id="how-it-works" aria-labelledby="chain-title">
        <div className="chain-stage section-wrap">
          <div className="chain-copy" data-reveal>
            <p className="eyebrow">02 / {h.flowEyebrow}</p>
            <h2 id="chain-title">{g.chainTitle}</h2>
            <p className="section-copy">{g.chainIntro}</p>
            <ScrollChapters chapters={x.stages} />
          </div>
          <div className="chain-visual" data-reveal data-reveal-delay="120"><BlockchainScene /></div>
        </div>
      </section>

      <section className="signal-interlude" aria-labelledby="interlude-title">
        <div className="interlude-orbit" aria-hidden="true" data-parallax="0.1"><i /><i /><i /><span>LC</span></div>
        <div className="interlude-copy" data-reveal>
          <p className="eyebrow">02.5 / {h.flowEyebrow}</p>
          <h2 id="interlude-title">{h.flow[0]}<br /><span>{h.flow[1]}</span></h2>
          <p className="section-copy">{h.flowIntro}</p>
        </div>
        <ul className="interlude-protocol" data-reveal data-reveal-delay="140">
          {fx.protocol.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}
        </ul>
      </section>

      <div className="section-wrap setup-section" data-reveal><CreatorGuide /></div>

      <section id="experience" className="obs-experience section-wrap" aria-labelledby="obs-title">
        <div className="section-heading" data-reveal><div><p className="eyebrow">03 / {x.obsEyebrow}</p><h2 id="obs-title">{x.obsTitle[0]}<br /><span>{x.obsTitle[1]}</span></h2></div><p>{x.obsIntro}</p></div>
        <div className="obs-window" data-reveal data-reveal-delay="100"><div className="obs-window-bar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>LIVECRYPTO × OBS STUDIO</span><span className="obs-preview-tag">{x.preview}</span></div><CreatorDemo /></div>
        <ol className="obs-setup" data-reveal>{x.obsSteps.map(([title, text], i) => <li key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
        <Link href={login} className="obs-studio-link" data-reveal>{x.obsLink} <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="cinema-manifesto section-wrap">
        <p className="eyebrow" data-reveal>{h.manifesto}</p><h2 data-reveal>{h.control[0]}<br /><span>{h.control[1]}</span></h2>
        <div className="cinema-principles">{h.principles.map(([title, text], i) => <article key={title} data-reveal data-tilt data-reveal-delay={i * 90}><div className={`principle-art principle-art-${i}`} aria-hidden="true">{i === 0 ? <BlockIcon /> : i === 1 ? <span>✳</span> : <span>↗</span>}</div><span className="index-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <div id="security" className="section-wrap education-grid"><div data-reveal><ReceivingGuide /></div><div data-reveal data-reveal-delay="100"><SecurityGuide /></div></div>
      <section id="pricing" className="pricing-section section-wrap"><div data-reveal><p className="eyebrow">04 / {h.pricingEyebrow}</p><h2>{h.pricing[0]}<br /><span>{h.pricing[1]}</span></h2><p className="section-copy">{h.pricingIntro}</p><ul className="plain-list">{h.benefits.map(text => <li key={text}>{text}</li>)}</ul><p className="field-hint">{h.terms}</p></div><div data-reveal data-reveal-delay="100"><FeeCalculator /></div></section>
      <section className="network-section section-wrap"><p className="eyebrow" data-reveal>{h.chainsEyebrow}</p><h2 data-reveal>{h.chains[0]}<br /><span className="muted">{h.chains[1]}</span></h2><div className="network-grid">{h.networks.map(([title, text, tag], i) => <article key={title} className={`product-panel ${i === 2 ? 'future-network' : ''}`} data-reveal data-tilt data-reveal-delay={i * 90}><span className="network-symbol" aria-hidden="true">{['Ξ', '≋', '+'][i]}</span><h3>{title}</h3><p>{text}</p><span className="phase-tag">{tag}</span></article>)}</div></section>
      <section className="faq-section section-wrap" id="faq"><div data-reveal><p className="eyebrow">{h.faqEyebrow}</p><h2>{h.faqTitle[0]}<br /><span className="muted">{h.faqTitle[1]}</span></h2></div><div className="faq-list" data-reveal data-reveal-delay="100">{h.questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="closing-section section-wrap"><div className="closing-orb" data-parallax="0.12" aria-hidden="true" /><p className="eyebrow" data-reveal>{h.closing}</p><h2 data-reveal data-reveal-delay="80">{h.closingTitle[0]}<br /><span>{h.closingTitle[1]}</span></h2><Link href={login} className="brand-button primary" data-reveal data-reveal-delay="160">{c.creator} <span aria-hidden="true">↗</span></Link><p data-reveal data-reveal-delay="220">{h.beta}</p></section>
    </main>
    <footer className="site-footer section-wrap"><Brand href={`/${locale}`} label={`Live Crypto · ${c.home}`} /><p>{h.footer}</p><a href="#faq">{h.contact} ↗</a></footer>
  </LandingMotion>;
}
