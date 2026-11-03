"use client";

import Link from 'next/link';
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { LanguageSwitcher, useI18n } from '@/i18n/Provider';
import { Brand } from './Brand';
import { MotionToggle } from './MotionToggle';

export type SideNavIcon = 'layers' | 'monitor' | 'shield' | 'tag' | 'help';
export type SideNavLink = { href: string; label: string; icon: SideNavIcon };

const ICONS: Record<SideNavIcon, ReactNode> = {
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
  shield: <><path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  tag: <><path d="M4 4h7l9 9-7 7-9-9V4Z" /><circle cx="8.5" cy="8.5" r="1.4" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3.6 1.9c-.9.6-1.4 1.1-1.4 2.1" /><path d="M12 17h.01" /></>,
};

const STORAGE_KEY = 'lc-sidenav-open';
const MOBILE_QUERY = '(max-width: 980px)';

// The desktop preference lives outside React so the rail can hydrate from
// localStorage without a state-setting effect. The server snapshot is always
// "open"; after hydration useSyncExternalStore re-reads the stored value.
const desktopListeners = new Set<() => void>();
let desktopPreference: boolean | null = null;

function readDesktopPreference() {
  if (desktopPreference === null) {
    try {
      desktopPreference = window.localStorage.getItem(STORAGE_KEY) !== '0';
    } catch {
      desktopPreference = true;
    }
  }
  return desktopPreference;
}

function subscribeDesktop(listener: () => void) {
  desktopListeners.add(listener);
  return () => { desktopListeners.delete(listener); };
}

function writeDesktopPreference(next: boolean) {
  desktopPreference = next;
  try { window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* Storage can be unavailable. */ }
  desktopListeners.forEach(listener => listener());
}

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
 * A floating side rail replaces the old fixed top header. It is a glass dock
 * that expands on demand, collapses to its icon column and becomes a
 * full-height drawer on small screens. The wordmark stays visible on the
 * rail's head; the cube mark alone remains when it is collapsed.
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
  const desktopOpen = useSyncExternalStore(subscribeDesktop, readDesktopPreference, () => true);
  const mobile = useSyncExternalStore(subscribeMobile, readMobile, serverMobile);
  const [mobileOpen, setMobileOpen] = useState(false);
  const open = mobile ? mobileOpen : desktopOpen;

  // Marks the rail as hydrated so the mobile drawer cannot paint open from the
  // desktop server snapshot before the media query resolves.
  useEffect(() => { document.documentElement.dataset.navReady = 'true'; }, []);

  useEffect(() => {
    if (!mobile) return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [mobile, mobileOpen]);

  const toggle = useCallback(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) setMobileOpen(current => !current);
    else writeDesktopPreference(!readDesktopPreference());
  }, []);

  const closeOnMobile = useCallback(() => {
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
      className={`side-scrim${open ? ' is-open' : ''}`}
      onClick={() => setMobileOpen(false)}
      aria-label={c.navClose}
      tabIndex={open ? 0 : -1}
    />

    <aside id="side-nav" className={`side-nav${open ? ' is-open' : ''}`} aria-label={navLabel}>
      <div className="side-nav-head">
        <Brand href={homeHref} label={brandLabel} />
        <span className="side-nav-status" aria-hidden="true"><i />LIVE</span>
      </div>

      <nav className="side-nav-links" aria-label={navLabel}>
        {links.map(link => <a key={link.href} href={link.href} onClick={closeOnMobile} title={link.label}>
          <span className="side-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICONS[link.icon]}</svg>
          </span>
          <span className="side-nav-label">{link.label}</span>
        </a>)}
      </nav>

      <div className="side-nav-foot">
        <div className="side-nav-tools">
          <LanguageSwitcher />
          <MotionToggle />
        </div>
        <Link href={loginHref} className="brand-button primary side-nav-cta" onClick={closeOnMobile}>
          {creatorLabel}<span aria-hidden="true">↗</span>
        </Link>
        <button
          type="button"
          className="side-nav-toggle"
          onClick={toggle}
          aria-label={open ? c.navClose : c.navOpen}
          aria-expanded={open}
          aria-controls="side-nav"
          title={open ? c.navClose : c.navOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
          <span className="side-nav-label">{c.navClose}</span>
        </button>
      </div>
    </aside>
  </>;
}
