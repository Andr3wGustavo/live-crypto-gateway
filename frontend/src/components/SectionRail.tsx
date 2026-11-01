"use client";

import { useEffect, useRef } from 'react';

const SECTIONS = ['how-it-works', 'experience', 'security', 'pricing', 'faq'] as const;

/**
 * A quiet chapter rail for the landing film. Labels are read from the real
 * section headings, so translations stay in sync automatically.
 *
 * The active chapter is the last section whose top has passed a reading line
 * at 40% of the viewport. Unlike an IntersectionObserver band, this keeps one
 * chapter active through the interlude and between sections, so the rail never
 * loses its current position.
 */
export function SectionRail({ label }: { label: string }) {
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = nav.current;
    if (!element) return;

    const items: { link: HTMLAnchorElement; section: HTMLElement }[] = [];
    for (const id of SECTIONS) {
      const link = element.querySelector<HTMLAnchorElement>(`a[href="#${id}"]`);
      const section = document.getElementById(id);
      if (!link || !section) continue;
      items.push({ link, section });
      const heading = section.querySelector('h2');
      const name = heading?.textContent?.replace(/\s+/g, ' ').trim();
      if (name) {
        link.dataset.label = name;
        link.setAttribute('aria-label', name);
      }
    }
    if (!items.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.scrollY + window.innerHeight * 0.4;
      let activeIndex = 0;
      items.forEach(({ section }, index) => {
        if (section.getBoundingClientRect().top + window.scrollY <= line) activeIndex = index;
      });

      items.forEach(({ link }, index) => {
        const current = index === activeIndex;
        link.classList.toggle('is-active', current);
        if (current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return <nav className="section-rail" aria-label={label} ref={nav}>
    {SECTIONS.map((id, index) => <a key={id} href={`#${id}`}>
      <span>{String(index + 2).padStart(2, '0')}</span><i aria-hidden="true" />
    </a>)}
  </nav>;
}
