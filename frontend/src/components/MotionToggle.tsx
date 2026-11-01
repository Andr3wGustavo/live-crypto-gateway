"use client";

import { useSyncExternalStore } from 'react';
import { useI18n } from '@/i18n/Provider';
import { useLandingMotion } from './LandingMotion';

// The server cannot know the visitor's preference, so client-only notices use
// a store that reports false on the server and true once hydrated.
const subscribeNoop = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * The landing motion switch. It lives in the header so the state of the page
 * is always one click away: visitors whose operating system asks for reduced
 * motion can enable the demonstration without hunting for a floating control.
 */
export function MotionToggle() {
  const { enabled, toggle } = useLandingMotion();
  const { messages: { guide: g } } = useI18n();
  return <button
    type="button"
    className="motion-toggle"
    aria-pressed={enabled}
    onClick={toggle}
    title={enabled ? g.pause : g.enable}
  >
    <span aria-hidden="true" className={enabled ? 'is-live' : undefined}>{enabled ? 'Ⅱ' : '▷'}</span>
    <b>{enabled ? g.pause : g.enable}</b>
  </button>;
}

/**
 * A short, explicit notice shown only when the operating system requests
 * reduced motion and the visitor has not opted in yet. Motion stays off until
 * the visitor chooses otherwise; this simply explains why the page is static.
 */
export function MotionHint() {
  const { enabled, reduced, toggle } = useLandingMotion();
  const { messages: { guide: g } } = useI18n();
  const mounted = useSyncExternalStore(subscribeNoop, clientSnapshot, serverSnapshot);
  // Only after hydration, and only when the operating system asks for reduced
  // motion without an explicit opt-in, so animating visitors never see a flash.
  if (!mounted || !reduced || enabled) return null;
  return <p className="motion-hint">
    <span>{g.reduced}</span>
    <button type="button" className="brand-button primary small" onClick={toggle}>{g.enable}</button>
  </p>;
}
