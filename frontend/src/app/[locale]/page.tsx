import Link from 'next/link';
import type { Metadata } from 'next';
import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { ChainTheatre } from '@/components/ChainTheatre';
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
import { SideNav } from '@/components/SideNav';
import { ScrollChapters } from '@/components/ScrollChapters';
import { MotionHint } from '@/components/MotionToggle';
import { MotionReelTag } from '@/components/MotionReelTag';
import { dictionaries } from '@/i18n/messages';
import { isLocale, localePath } from '@/i18n/locale';
import './landing.css';
import './landing-campaign.css';

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
  let heroCursor = 0;
  const heroLines = h.hero.map(line => line.split(' ').map(word => ({
    word,
    chars: Array.from(word).map(char => ({ char, index: heroCursor++ })),
  })));
  return <LandingMotion>
    <CinematicIntro />
    <CinematicFX />
    <a href="#main" className="skip-link">{h.skip}</a>
    <SectionRail label={fx.rail} />
    <SideNav
      homeHref={`/${locale}`}
      brandLabel={`Live Crypto · ${c.home}`}
      loginHref={login}
      creatorLabel={c.creator}
      navLabel={h.nav}
      links={[
        { href: '#how-it-works', label: h.how, icon: 'layers' },
        { href: '#experience', label: 'OBS Studio', icon: 'monitor' },
        { href: '#security', label: g.securityLink, icon: 'shield' },
        { href: '#pricing', label: h.fees, icon: 'tag' },
        { href: '#faq', label: 'FAQ', icon: 'help' },
      ]}
    />
    <main id="main">
      <section className="cinema-hero" aria-labelledby="hero-title">
        <div className="hero-scene" aria-hidden="true">
          <video className="hero-film" data-ambient data-src="/brand/animation.mp4" muted loop playsInline preload="none" tabIndex={-1} aria-hidden="true" />
          <span className="hero-watermark">LIVECRYPTO</span>
          <div className="hero-tokens">
            {['Ξ', '◎', '₿', '◈', '⬡', 'Ξ'].map((token, index) => <span key={index} style={{ '--t': index } as CSSProperties}>{token}</span>)}
          </div>
          <div className="hero-glow" />
          <div className="hero-floor" />
          <div className="hero-rings" />
          <div className="hero-noise" />
        </div>
        <CryptoField />
        <p className="hero-kicker"><span className="live-dot" aria-hidden="true" />{h.eyebrow}</p>
        <h1 id="hero-title" aria-label={h.hero.join(' ')}>
          {heroLines.map((words, line) => (
            <span key={line} className={`hero-line${line === 2 ? ' hero-gradient' : ''}`} aria-hidden="true" style={{ '--i': line } as CSSProperties}>
              {words.map(({ chars }, wordIndex) => (
                <Fragment key={`${line}-${wordIndex}`}>
                  <span className="hero-word">
                    {chars.map(({ char, index }) => <span className="hero-char" key={index} style={{ '--c': index } as CSSProperties}>{char}</span>)}
                  </span>
                  {wordIndex < words.length - 1 ? ' ' : null}
                </Fragment>
              ))}
            </span>
          ))}
        </h1>
        <ul className="hero-rails" aria-label={h.railsLabel}>
          {h.rails.map((rail, index) => <li key={rail}>
            <b aria-hidden="true">{['Ξ', '◎', '₿'][index]}</b>
            <span>{rail}</span>
            {index === 2 ? <em>{h.networks[2][2]}</em> : null}
          </li>)}
        </ul>
        <div className="hero-support">
          <div className="hero-copy-side">
            <p className="cinema-description">{h.description}</p>
            <div className="button-row"><Link href={login} className="brand-button primary">{h.explore}<span aria-hidden="true">↗</span></Link><a href="#experience" className="brand-button secondary"><span className="play-symbol" aria-hidden="true">▷</span>{h.watch}</a></div>
            <ul className="hero-signals" aria-hidden="true">{fx.protocol.slice(0, 3).map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ul>
            <MotionHint />
            <p className="cinema-caption">{h.caption}</p>
          </div>
          <div className="hero-stage">
            <ChainTheatre labels={h.theatre} />
            <a href="#how-it-works" className="console-link">{g.timeline} <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="cinema-hero-bottom"><span>01 — {x.stage}</span><a href="#how-it-works">{h.discover} <span aria-hidden="true">↓</span></a></div>
      </section>

      <div className="cinema-proof" data-reveal>{x.proof.map((label, i) => <span key={label}><b aria-hidden="true">{['Ξ', '◎', '⬡'][i]}</b>{label}</span>)}</div>
      <LiveNetworkTicker />
      <div className="kinetic-marquee" aria-hidden="true"><div>{Array.from({ length: 3 }, (_, cycle) => fx.marquee.map((word, index) => <span key={`${cycle}-${index}`}>{word}<i>↗</i></span>))}</div></div>

      <section className="motion-reel" id="in-motion" data-no="02" aria-labelledby="reel-title">
        <div className="reel-film" aria-hidden="true">
          <video data-ambient data-src="/brand/consegue_fazer_um_video_de_um.mp4" muted loop playsInline preload="none" tabIndex={-1} aria-hidden="true" />
        </div>
        <div className="reel-inner section-wrap">
          <div className="reel-heading" data-reveal>
            <p className="eyebrow">01.5 / {h.motion.eyebrow}</p>
            <h2 id="reel-title">{h.motion.title[0]}<br /><span>{h.motion.title[1]}</span></h2>
            <p>{h.motion.intro}</p>
          </div>
          <div className="reel-slate" data-reveal aria-hidden="true">
            <MotionReelTag label={h.motion.liveTag} />
            <span>{h.motion.bandLabel}</span>
            <span>{h.motion.bandCaption}</span>
            <i />
          </div>
        </div>
      </section>

      <section className="chain-sequence" id="how-it-works" data-no="03" aria-labelledby="chain-title">
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

      <div className="section-wrap setup-section" data-no="04" data-reveal><CreatorGuide /></div>

      <section id="experience" className="obs-experience section-wrap" data-no="05" aria-labelledby="obs-title">
        <div className="section-heading" data-reveal><div><p className="eyebrow">03 / {x.obsEyebrow}</p><h2 id="obs-title">{x.obsTitle[0]}<br /><span>{x.obsTitle[1]}</span></h2></div><p>{x.obsIntro}</p></div>
        <div className="obs-window" data-reveal data-reveal-delay="100"><div className="obs-window-bar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>LIVECRYPTO × OBS STUDIO</span><span className="obs-preview-tag">{x.preview}</span></div><CreatorDemo /></div>
        <ol className="obs-setup" data-reveal>{x.obsSteps.map(([title, text], i) => <li key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
        <Link href={login} className="obs-studio-link" data-reveal>{x.obsLink} <span aria-hidden="true">↗</span></Link>
      </section>

      <section className="cinema-manifesto section-wrap" data-no="06">
        <p className="eyebrow" data-reveal>{h.manifesto}</p><h2 data-reveal>{h.control[0]}<br /><span>{h.control[1]}</span></h2>
        <div className="cinema-principles">{h.principles.map(([title, text], i) => <article key={title} data-reveal data-tilt data-reveal-delay={i * 90}><div className={`principle-art principle-art-${i}`} aria-hidden="true">{i === 0 ? <BlockIcon /> : i === 1 ? <span>✳</span> : <span>↗</span>}</div><span className="index-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <div id="security" className="section-wrap education-grid" data-no="07"><div data-reveal><ReceivingGuide /></div><div data-reveal data-reveal-delay="100"><SecurityGuide /></div></div>
      <section id="pricing" className="pricing-section section-wrap"><div data-reveal><p className="eyebrow">04 / {h.pricingEyebrow}</p><h2>{h.pricing[0]}<br /><span>{h.pricing[1]}</span></h2><p className="section-copy">{h.pricingIntro}</p><ul className="plain-list">{h.benefits.map(text => <li key={text}>{text}</li>)}</ul><p className="field-hint">{h.terms}</p></div><div data-reveal data-reveal-delay="100"><FeeCalculator /></div></section>
      <section className="network-section section-wrap" data-no="09"><p className="eyebrow" data-reveal>{h.chainsEyebrow}</p><h2 data-reveal>{h.chains[0]}<br /><span className="muted">{h.chains[1]}</span></h2><div className="network-grid">{h.networks.map(([title, text, tag], i) => <article key={title} className={`product-panel ${i === 2 ? 'future-network' : ''}`} data-reveal data-tilt data-reveal-delay={i * 90}><span className="network-symbol" aria-hidden="true">{['Ξ', '◎', '₿'][i]}</span><h3>{title}</h3><p>{text}</p><span className="phase-tag">{tag}</span></article>)}</div></section>
      <section className="faq-section section-wrap" id="faq" data-no="10"><div data-reveal><p className="eyebrow">{h.faqEyebrow}</p><h2>{h.faqTitle[0]}<br /><span className="muted">{h.faqTitle[1]}</span></h2></div><div className="faq-list" data-reveal data-reveal-delay="100">{h.questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="closing-section section-wrap"><div className="closing-orb" data-parallax="0.12" aria-hidden="true" /><p className="eyebrow" data-reveal>{h.closing}</p><h2 data-reveal data-reveal-delay="80">{h.closingTitle[0]}<br /><span>{h.closingTitle[1]}</span></h2><Link href={login} className="brand-button primary" data-reveal data-reveal-delay="160">{c.creator} <span aria-hidden="true">↗</span></Link><p data-reveal data-reveal-delay="220">{h.beta}</p></section>
    </main>
    <footer className="site-footer section-wrap"><Brand href={`/${locale}`} label={`Live Crypto · ${c.home}`} /><p>{h.footer}</p><a href="#faq">{h.contact} ↗</a></footer>
  </LandingMotion>;
}
