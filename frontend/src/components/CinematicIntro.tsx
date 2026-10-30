"use client";

import Image from 'next/image';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useI18n } from '@/i18n/Provider';
import { useLandingMotion } from './LandingMotion';

const INTRO_KEY = 'lc-cinematic-intro-v1';

/**
 * A short, skippable boot sequence. It is a client overlay, so crawlers and
 * no-JavaScript visitors see the real page immediately. It never locks scroll:
 * a wheel, touch, click, Escape or the timer dismisses it.
 */
export function CinematicIntro() {
  const { messages: { fx } } = useI18n();
  const { enabled } = useLandingMotion();
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'leaving'>('hidden');

  const dismiss = useCallback(() => {
    setPhase(current => {
      if (current !== 'visible') return current;
      try { sessionStorage.setItem(INTRO_KEY, '1'); } catch {}
      return 'leaving';
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === '1'; } catch {}
    if (seen) return;

    // Deferred so the overlay mounts after hydration instead of triggering a
    // synchronous state update inside the effect body.
    const show = window.setTimeout(() => setPhase(current => current === 'hidden' ? 'visible' : current), 0);
    return () => clearTimeout(show);
  }, [enabled]);

  // The dwell timer starts once the overlay is actually painted, so a slow
  // first render never eats the animation window.
  useEffect(() => {
    if (phase !== 'visible') return;
    const timer = window.setTimeout(dismiss, 2200);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    const onWheel = () => dismiss();
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true, once: true });
    window.addEventListener('touchmove', onWheel, { passive: true, once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onWheel);
    };
  }, [dismiss, phase]);

  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = window.setTimeout(() => setPhase('hidden'), 720);
    return () => clearTimeout(timer);
  }, [phase]);

  // Turning motion off mid-intro closes the overlay without trapping the page.
  useEffect(() => {
    if (enabled || phase === 'hidden') return;
    const timer = window.setTimeout(() => setPhase('hidden'), 0);
    return () => clearTimeout(timer);
  }, [enabled, phase]);

  if (phase === 'hidden') return null;

  return <div
    className={`cinematic-intro${phase === 'leaving' ? ' is-leaving' : ''}`}
    role="status"
    aria-label={fx.intro[0]}
    onClick={dismiss}
  >
    <div className="intro-grid" aria-hidden="true" />
    <div className="intro-scan" aria-hidden="true" />
    <div className="intro-frame">
      <div className="intro-brand">
        <Image src="/brand/logo-png.png" alt="" width={96} height={96} unoptimized />
        <span>LIVE<b>CRYPTO</b><small>PROTOCOL / 01</small></span>
      </div>
      <ul className="intro-lines" aria-hidden="true">
        {fx.intro.map((line, index) => <li key={line} style={{ '--i': index } as CSSProperties}>
          <span>0{index + 1}</span><b>{line}</b><em>OK</em>
        </li>)}
      </ul>
      <div className="intro-bar" aria-hidden="true"><span /></div>
      <p className="intro-note" aria-hidden="true">WALLET · CHAIN · OBS · COMMUNITY</p>
      <button type="button" className="intro-skip" onClick={dismiss}>{fx.skip}<kbd>ESC</kbd></button>
    </div>
  </div>;
}
