"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '@/i18n/Provider';
import styles from './DocsInteractive.module.css';

export type DocsFlowItem = { label: string; title: string; text: string };

/**
 * A small, keyboard-operable timeline for the donation journey. It is a real
 * tab set instead of a decorative animation: arrow keys move the selection,
 * Home/End jump to the edges, and the panel is announced as a tab panel.
 */
export function DocsFlow({ items, ariaLabel }: { items: DocsFlowItem[]; ariaLabel: string }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (index: number) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      select(active + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(active - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(items.length - 1);
    }
  };

  const current = items[active];
  if (!current) return null;

  return <div className={styles.flow}>
    <div className={styles.flowRail} role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => <button
        key={item.label}
        ref={element => { tabs.current[index] = element; }}
        type="button"
        role="tab"
        id={`donation-tab-${index}`}
        aria-selected={index === active}
        aria-controls={`donation-panel-${index}`}
        tabIndex={index === active ? 0 : -1}
        className={styles.flowTab}
        onClick={() => setActive(index)}
        onKeyDown={onKeyDown}
      >
        <span className={styles.flowLabel}>{item.label}</span>
        <strong>{item.title}</strong>
      </button>)}
    </div>
    <div
      key={active}
      className={styles.flowPanel}
      id={`donation-panel-${active}`}
      role="tabpanel"
      aria-labelledby={`donation-tab-${active}`}
      tabIndex={0}
    >
      <span className={styles.flowLabel}>{current.label}</span>
      <h3>{current.title}</h3>
      <p>{current.text}</p>
    </div>
  </div>;
}

/**
 * Code blocks carry a copy action because the commands are meant to be used,
 * not just read. The clipboard write is best-effort; a blocked clipboard never
 * removes the selectable text.
 */
export function DocsCode({ label, lines }: { label: string; lines: string[] }) {
  const { messages: { common: c } } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return <figure className={styles.code}>
    <figcaption>
      <span>{label}</span>
      <button type="button" className={styles.copy} onClick={() => void copy()} aria-label={`${copied ? c.copied : c.copy}: ${label}`}>
        {copied ? c.copied : c.copy}
      </button>
    </figcaption>
    <pre tabIndex={0}><code>{lines.join('\n')}</code></pre>
  </figure>;
}

/**
 * GitHub-docs style section index. It follows the reading line with a single
 * rAF-throttled scroll listener and marks the current section with
 * `aria-current="location"`, without replacing the native anchors.
 */
export function DocsOnThisPage({ label, sections }: { label: string; sections: Array<{ id: string; nav: string }> }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = sections[0]?.id ?? '';
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= line) current = section.id;
      }
      setActive(previous => previous === current ? previous : current);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [sections]);

  return <aside className={styles.toc} aria-label={label}>
    <p className={styles.tocLabel}>{label}</p>
    <ul>{sections.map(section => <li key={section.id}>
      <a
        href={`#${section.id}`}
        className={active === section.id ? styles.isActive : undefined}
        aria-current={active === section.id ? 'location' : undefined}
      >{section.nav}</a>
    </li>)}</ul>
  </aside>;
}
