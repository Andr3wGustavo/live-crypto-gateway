"use client";

import { useCallback, useSyncExternalStore } from 'react';

/**
 * One motion contract for the whole product.
 *
 * The operating-system preference is the default. A visitor can explicitly
 * override it; the decision is stored locally and broadcast to every mounted
 * consumer so the landing page and the product shell never disagree.
 */
export const MOTION_STORAGE_KEY = 'lc-motion-preference';
const MOTION_EVENT = 'lc-motion-preference-change';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export function readMotionOverride(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
    return stored === 'on' ? true : stored === 'off' ? false : null;
  } catch {
    return null;
  }
}

export function writeMotionOverride(value: boolean): void {
  try { window.localStorage.setItem(MOTION_STORAGE_KEY, value ? 'on' : 'off'); } catch { /* Storage can be unavailable. */ }
  window.dispatchEvent(new CustomEvent(MOTION_EVENT, { detail: value }));
}

function subscribe(notify: () => void) {
  const media = window.matchMedia(REDUCED_QUERY);
  const onStorage = (event: StorageEvent) => { if (event.key === MOTION_STORAGE_KEY) notify(); };
  const onPreference = () => notify();
  media.addEventListener('change', notify);
  window.addEventListener('storage', onStorage);
  window.addEventListener(MOTION_EVENT, onPreference);
  return () => {
    media.removeEventListener('change', notify);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(MOTION_EVENT, onPreference);
  };
}

const reducedSnapshot = () => window.matchMedia(REDUCED_QUERY).matches;

export function useMotionPreference() {
  const reduced = useSyncExternalStore(subscribe, reducedSnapshot, () => true);
  const override = useSyncExternalStore(subscribe, readMotionOverride, () => null);
  const enabled = override ?? !reduced;
  const toggle = useCallback(() => writeMotionOverride(!enabled), [enabled]);
  return { enabled, reduced, override, toggle };
}
