"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { stripLocale } from '@/i18n/locale';
import { useMotionPreference } from './useMotionPreference';

/**
 * Site-wide "Act II" motion: a persistent atmosphere, route curtain, scroll
 * progress, reveal choreography and pointer light for the product pages.
 *
 * The layer is decorative. Every value shown elsewhere comes from real page
 * state. Motion is always on, so the shell has no pause control.
 */
export function SiteMotion() {
  const pathname = stripLocale(usePathname());
  const isOverlay = pathname?.startsWith('/overlay') ?? false;
  const isLanding = pathname === '/';
  const inactive = isLanding || isOverlay;
  const { enabled } = useMotionPreference();
  const progressRef = useRef<HTMLSpanElement>(null);
  const previousPath = useRef(pathname);
  const [curtain, setCurtain] = useState(0);

  // Publish the decision before child effects run so CSS can gate safely.
  useEffect(() => {
    document.documentElement.dataset.siteMotion = enabled ? 'on' : 'off';
    return () => { delete document.documentElement.dataset.siteMotion; };
  }, [enabled]);

  // A short curtain marks navigation without blocking input or the router.
  useEffect(() => {
    const changed = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (!enabled || !changed || isOverlay) return;
    const frame = requestAnimationFrame(() => setCurtain(value => value + 1));
    return () => cancelAnimationFrame(frame);
  }, [enabled, pathname, isOverlay]);

  useEffect(() => {
    // Cancel the pre-hydration reveal failsafe: from here the observer owns
    // the reveal state. The fallback class is only cleared once animations are
    // actually running, so slow devices never sit on a blank panel.
    const fallbackTimer = (window as unknown as { __lcRevealTimer?: number }).__lcRevealTimer;
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    document.documentElement.classList.remove('site-motion-fallback');

    if (inactive) return;
    const root = document.documentElement;
    const progress = progressRef.current;

    // Data arrives after first paint on the product pages, so the reveal set
    // is discovered continuously rather than scanned once at mount. A WeakSet
    // keeps the observer and the delay preparation idempotent.
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    const trackedReveals = new WeakSet<Element>();

    // IntersectionObserver is the primary path, but it can be delayed or
    // suspended (background tabs, headless capture, long first frames). The
    // rect check below reveals whatever is already on screen instead of
    // leaving the first paint blank. Only elements below the fold wait for
    // the observer or the rAF-throttled scroll fallback.
    const inView = (item: HTMLElement) => {
      const rect = item.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.94 && rect.bottom > 0;
    };

    const scanReveals = () => {
      for (const item of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
        if (trackedReveals.has(item)) continue;
        trackedReveals.add(item);
        const delay = Number(item.dataset.revealDelay || 0);
        if (delay) item.style.setProperty('--reveal-delay', `${delay}ms`);
        if (!enabled || inView(item)) item.classList.add('is-revealed');
        else revealObserver.observe(item);
      }
    };

    const revealInView = () => {
      if (!enabled) return;
      for (const item of document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)')) {
        if (!inView(item)) continue;
        item.classList.add('is-revealed');
        revealObserver.unobserve(item);
      }
    };

    const revealMutations = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const candidate = node as Element;
          if (candidate.matches('[data-reveal]') || candidate.querySelector('[data-reveal]')) {
            scanReveals();
            return;
          }
        }
      }
    });
    revealMutations.observe(document.body, { childList: true, subtree: true });
    root.classList.toggle('site-motion-ready', enabled);
    scanReveals();

    if (!enabled) {
      return () => {
        revealMutations.disconnect();
        root.classList.remove('site-motion-ready');
      };
    }

    let scrollFrame = 0;
    const updateScroll = () => {
      scrollFrame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (progress) progress.style.transform = `scaleX(${value})`;
      root.style.setProperty('--scroll-ratio', value.toFixed(3));
      revealInView();
    };
    const onScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); };

    let pointerFrame = 0;
    let pointer: PointerEvent | null = null;
    let activeGlow: HTMLElement | null = null;
    let activeTilt: HTMLElement | null = null;

    const paintPointer = () => {
      pointerFrame = 0;
      const event = pointer;
      if (!event) return;

      root.style.setProperty('--cursor-x', `${event.clientX}px`);
      root.style.setProperty('--cursor-y', `${event.clientY}px`);
      root.style.setProperty('--cursor-dx', (event.clientX / window.innerWidth - 0.5).toFixed(3));
      root.style.setProperty('--cursor-dy', (event.clientY / window.innerHeight - 0.5).toFixed(3));

      const target = event.target instanceof Element ? event.target : null;

      const glow = target?.closest<HTMLElement>('[data-glow]') ?? null;
      if (glow !== activeGlow) {
        activeGlow?.classList.remove('is-glowing');
        activeGlow = glow;
        glow?.classList.add('is-glowing');
      }
      if (glow) {
        const rect = glow.getBoundingClientRect();
        glow.style.setProperty('--glow-x', `${(event.clientX - rect.left).toFixed(0)}px`);
        glow.style.setProperty('--glow-y', `${(event.clientY - rect.top).toFixed(0)}px`);
      }

      const tilt = target?.closest<HTMLElement>('[data-tilt-soft]') ?? null;
      if (tilt !== activeTilt) {
        if (activeTilt && activeTilt !== tilt) {
          activeTilt.style.setProperty('--tilt-x', '0deg');
          activeTilt.style.setProperty('--tilt-y', '0deg');
        }
        activeTilt = tilt;
      }
      if (tilt) {
        const rect = tilt.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        tilt.style.setProperty('--tilt-x', `${(-y * 2.4).toFixed(2)}deg`);
        tilt.style.setProperty('--tilt-y', `${(x * 2.8).toFixed(2)}deg`);
      }
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointer = event;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
    };

    const onLeave = () => {
      activeGlow?.classList.remove('is-glowing');
      activeGlow = null;
      if (activeTilt) {
        activeTilt.style.setProperty('--tilt-x', '0deg');
        activeTilt.style.setProperty('--tilt-y', '0deg');
        activeTilt = null;
      }
      root.style.setProperty('--cursor-dx', '0');
      root.style.setProperty('--cursor-dy', '0');
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    updateScroll();

    return () => {
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(pointerFrame);
      revealMutations.disconnect();
      revealObserver.disconnect();
      root.classList.remove('site-motion-ready');
      activeGlow?.classList.remove('is-glowing');
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled, inactive, pathname]);

  if (inactive) return null;

  return <>
    <div className="app-ambience" aria-hidden="true">
      <i className="amb-orb amb-orb-a" />
      <i className="amb-orb amb-orb-b" />
      <i className="amb-orb amb-orb-c" />
      <span className="amb-grid" />
      <span className="amb-scan" />
      <span className="amb-grain" />
    </div>
    <div className="app-cursor-glow" aria-hidden="true" />
    <div className="app-progress" aria-hidden="true"><span ref={progressRef} /></div>
    {curtain > 0 && <div key={curtain} className="route-curtain" aria-hidden="true">
      <span /><b>LC</b><small>SYNC</small>
    </div>}
  </>;
}
