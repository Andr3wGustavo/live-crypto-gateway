"use client";

import { useEffect, useRef } from 'react';
import { useLandingMotion } from './LandingMotion';

/**
 * Shared cinematic layer: scroll progress, cursor spotlight, reveal-on-scroll,
 * parallax and pointer-driven card tilt. All effects are opt-in through the
 * visitor's motion preference and degrade to a static, fully readable page.
 */
export function CinematicFX() {
  const progressRef = useRef<HTMLSpanElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const { enabled } = useLandingMotion();

  useEffect(() => {
    const progress = progressRef.current;
    const aura = auraRef.current;
    const hero = document.querySelector<HTMLElement>('.cinema-hero');
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const parallaxItems = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));

    revealItems.forEach(item => {
      const delay = Number(item.dataset.revealDelay || 0);
      if (delay) item.style.setProperty('--reveal-delay', `${delay}ms`);
    });

    if (!enabled) return;

    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach(item => revealObserver.observe(item));

    let frame = 0;
    const updateScroll = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progressValue = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (progress) progress.style.transform = `scaleX(${progressValue})`;

      for (const item of parallaxItems) {
        const rect = item.getBoundingClientRect();
        const factor = Number(item.dataset.parallax || 0.08);
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * factor;
        item.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateScroll);
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;

      if (hero) {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty('--pointer-x', `${(event.clientX - rect.left).toFixed(0)}px`);
        hero.style.setProperty('--pointer-y', `${(event.clientY - rect.top).toFixed(0)}px`);
      }

      if (aura) {
        aura.style.setProperty('--x', `${event.clientX}px`);
        aura.style.setProperty('--y', `${event.clientY}px`);
        aura.classList.add('is-active');
      }

      const tiltTarget = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-tilt]');
      if (!tiltTarget) return;
      const rect = tiltTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tiltTarget.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
      tiltTarget.style.setProperty('--tilt-y', `${(x * 6).toFixed(2)}deg`);
    };

    const onTiltOut = (event: PointerEvent) => {
      const tiltTarget = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-tilt]');
      if (!tiltTarget) return;
      if (event.relatedTarget instanceof Node && tiltTarget.contains(event.relatedTarget)) return;
      tiltTarget.style.setProperty('--tilt-x', '0deg');
      tiltTarget.style.setProperty('--tilt-y', '0deg');
    };

    const onLeave = () => aura?.classList.remove('is-active');

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('pointerout', onTiltOut);
    document.addEventListener('pointerleave', onLeave);
    updateScroll();

    return () => {
      cancelAnimationFrame(frame);
      revealObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerout', onTiltOut);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  return <>
    <div className="scroll-progress" aria-hidden="true"><span ref={progressRef} /></div>
    <div className="cursor-aura" ref={auraRef} aria-hidden="true" />
  </>;
}
