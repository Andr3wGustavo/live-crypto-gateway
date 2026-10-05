"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useI18n } from '@/i18n/Provider';

const query = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const snapshot = () => window.matchMedia(query).matches;
const Motion = createContext({ enabled:false, reduced:true, toggle:() => {} });
export const useLandingMotion = () => useContext(Motion);

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribe, snapshot, () => true);
  const [override, setOverride] = useState<boolean | null>(null);
  const { messages: { guide: g } } = useI18n();
  const enabled = override ?? !reduced;
  const toggle = () => setOverride(!enabled);

  useEffect(() => {
    const videos = Array.from(root.current?.querySelectorAll<HTMLVideoElement>('video[data-ambient]') || []);
    const visible = new Set<HTMLVideoElement>();
    let disposed = false;
    const sync = (video: HTMLVideoElement) => {
      if (enabled && visible.has(video) && !document.hidden) {
        if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
        void video.play().catch(() => {}).then(() => { if (disposed) video.pause(); });
      } else video.pause();
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) visible.add(video); else visible.delete(video);
        sync(video);
      }
    });
    const visibility = () => videos.forEach(sync);
    videos.forEach(video => observer.observe(video));
    document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; observer.disconnect(); document.removeEventListener('visibilitychange', visibility); videos.forEach(video => video.pause()); };
  }, [enabled]);

  return <Motion.Provider value={{ enabled, reduced, toggle }}><div ref={root} className="marketing-page matrix-landing" data-motion={enabled ? 'on' : 'off'}>
    {children}
    <button type="button" className="motion-control" aria-pressed={enabled} onClick={toggle}><span aria-hidden="true">{enabled ? 'Ⅱ' : '▷'}</span>{enabled ? g.pause : g.enable}</button>
  </div></Motion.Provider>;
}
