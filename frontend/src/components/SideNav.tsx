"use client";

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { LanguageSwitcher, useI18n } from '@/i18n/Provider';
import { Brand } from './Brand';

export type SideNavIcon = 'layers' | 'monitor' | 'shield' | 'tag' | 'help';
export type SideNavLink = { href: string; label: string; icon: SideNavIcon };

const ICONS: Record<SideNavIcon, ReactNode> = {
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  shield: <><path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  tag: <><path d="M4 4h7l9 9-7 7-9-9V4Z" /><circle cx="8.5" cy="8.5" r="1.4" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3.6 1.9c-.9.6-1.4 1.1-1.4 2.1" /><path d="M12 17h.01" /></>,
};

const MOBILE_QUERY = '(max-width: 980px)';
const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function subscribeMobile(listener: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function readMobile() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

const serverMobile = () => false;

/**
 * A floating glass dock replaces the old top bar. On desktop it stays as a
 * compact icon column and unfolds when the pointer enters or keyboard focus
 * lands inside, pushing the editorial layout instead of covering it. There is
 * no toggle: leaving the rail collapses it again.
 *
 * Under 980 px the same component becomes a full-height modal drawer with a
 * scrim: the hamburger opens it, focus is trapped, the page behind is inert,
 * Escape closes it and focus returns to the trigger.
 *
 * The rail also tracks the section under the reading line so the current
 * chapter stays highlighted without replacing the native anchors.
 */
export function SideNav({
  homeHref, brandLabel, loginHref, creatorLabel, navLabel, links,
}: {
  homeHref: string;
  brandLabel: string;
  loginHref: string;
  creatorLabel: string;
  navLabel: string;
  links: SideNavLink[];
}) {
  const { messages } = useI18n();
  const c = messages.common;
  const mobile = useSyncExternalStore(subscribeMobile, readMobile, serverMobile);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const open = mobile ? mobileOpen : hovered || focusWithin;

  // Marks the rail as hydrated so the mobile drawer cannot paint open from the
  // desktop server snapshot before the media query resolves.
  useEffect(() => { document.documentElement.dataset.navReady = 'true'; }, []);

  // Modal drawer behavior: focus enters the rail, Tab cycles inside it, the
  // page behind becomes inert, and closing restores the trigger.
  useEffect(() => {
    if (!mobile || !mobileOpen) return;
    const aside = asideRef.current;
    if (!aside) return;
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = () => Array.from(aside.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter(element => element.offsetWidth > 0 || element.offsetHeight > 0);

    const initial = focusable()[0];
    initial?.focus({ preventScroll: true });

    const behind = Array.from(document.querySelectorAll<HTMLElement>('main, footer, .section-rail, .skip-link'));
    behind.forEach(element => { element.inert = true; });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      behind.forEach(element => { element.inert = false; });
      restore?.focus({ preventScroll: true });
    };
  }, [mobile, mobileOpen]);

  // Section spy: the last anchor whose target crossed the reading line wins.
  // rAF throttling keeps this cheap, and the state only changes when the
  // chapter actually changes.
  useEffect(() => {
    const targets = links
      .filter(link => link.href.startsWith('#'))
      .map(link => ({ href: link.href, id: link.href.slice(1) }));
    if (!targets.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.42;
      let current: string | null = null;
      for (const target of targets) {
        const element = document.getElementById(target.id);
        if (element && element.getBoundingClientRect().top <= line) current = target.href;
      }
      setActiveHref(previous => previous === current ? previous : current);
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
  }, [links]);

  const toggle = useCallback(() => { setMobileOpen(current => !current); }, []);

  const closeMobile = useCallback(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) setMobileOpen(false);
  }, []);

  return <>
    <header className="mobile-nav">
      <Brand href={homeHref} label={brandLabel} />
      <button
        type="button"
        className="mobile-nav-toggle"
        onClick={toggle}
        aria-label={open ? c.navClose : c.navOpen}
        aria-expanded={open}
        aria-controls="side-nav"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
    </header>

    <button
      type="button"
      className={`side-scrim${mobileOpen ? ' is-open' : ''}`}
      onClick={() => setMobileOpen(false)}
      aria-label={c.navClose}
      tabIndex={-1}
    />

    <aside
      id="side-nav"
      ref={asideRef}
      className={`side-nav${open ? ' is-open' : ''}`}
      aria-label={navLabel}
      role={mobile && mobileOpen ? 'dialog' : undefined}
      aria-modal={mobile && mobileOpen ? true : undefined}
      aria-hidden={mobile && !mobileOpen ? true : undefined}
      inert={mobile && !mobileOpen ? true : undefined}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={event => {
        const next = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(next)) setFocusWithin(false);
      }}
    >
      <div className="side-nav-head">
        <Brand href={homeHref} label={brandLabel} />
        <span className="side-nav-status" aria-hidden="true"><i />LIVE</span>
      </div>

      <nav className="side-nav-links" aria-label={navLabel}>
        {links.map(link => {
          const active = activeHref === link.href;
          return <a
            key={link.href}
            href={link.href}
            onClick={event => {
              closeMobile();
              if (!mobile) {
                setFocusWithin(false);
                event.currentTarget.blur();
              }
            }}
            title={link.label}
            className={active ? 'is-active' : undefined}
            aria-current={active ? 'location' : undefined}
          >
            <span className="side-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[link.icon]}</svg>
            </span>
            <span className="side-nav-label">{link.label}</span>
          </a>;
        })}
      </nav>

      <div className="side-nav-foot">
        <div className="side-nav-tools">
          <LanguageSwitcher />
        </div>
        <Link href={loginHref} className="brand-button primary side-nav-cta" onClick={closeMobile}>
          {creatorLabel}<span aria-hidden="true">↗</span>
        </Link>
        <button
          type="button"
          className="side-nav-toggle"
          onClick={toggle}
          aria-label={c.navClose}
          aria-controls="side-nav"
          title={c.navClose}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
          <span className="side-nav-label">{c.navClose}</span>
        </button>
      </div>
    </aside>
  </>;
}
