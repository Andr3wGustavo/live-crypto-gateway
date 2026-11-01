"use client";

import { useSyncExternalStore } from 'react';
import { useI18n } from '@/i18n/Provider';
import { useLandingMotion } from './LandingMotion';

// Server render keeps the neutral label; after hydration the tag tells the
// truth: a reel that cannot autoplay is paused, not looping.
const subscribeNoop = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function MotionReelTag({ label }: { label: string }) {
  const { enabled } = useLandingMotion();
  const { messages: { home: h } } = useI18n();
  const mounted = useSyncExternalStore(subscribeNoop, clientSnapshot, serverSnapshot);
  return <span className="reel-tag"><i aria-hidden="true" />{mounted && !enabled ? h.motion.pausedTag : label}</span>;
}
