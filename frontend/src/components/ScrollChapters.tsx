"use client";

import { useEffect, useRef } from 'react';

type Chapter = readonly string[];

/**
 * The how-it-works chapters progress with the reader. The reading line at 55%
 * of the viewport decides which chapter is current, and the same position
 * drives a CSS progress spine. With motion disabled the CSS spine simply stays
 * at the first chapter and the list remains readable.
 */
export function ScrollChapters({ chapters }: { chapters: readonly Chapter[] }) {
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const items = Array.from(element.children) as HTMLElement[];
    if (!items.length) return;

    let frame = 0;
    let current = -1;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.55;
      let active = 0;
      items.forEach((item, index) => {
        if (item.getBoundingClientRect().top <= line) active = index;
      });
      if (active !== current) {
        current = active;
        items.forEach((item, index) => {
          item.classList.toggle('is-current', index === active);
          if (index === active) item.setAttribute('aria-current', 'step');
          else item.removeAttribute('aria-current');
        });
      }
      element.style.setProperty('--chapter-progress', String((active + 1) / items.length));
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
  }, [chapters]);

  return <ol className="chain-chapters" ref={list}>
    {chapters.map(([title, body], index) => <li key={title} data-chapter={index}>
      <span className="chapter-number">0{index + 1}</span>
      <div><h3>{title}</h3><p>{body}</p></div>
    </li>)}
  </ol>;
}
