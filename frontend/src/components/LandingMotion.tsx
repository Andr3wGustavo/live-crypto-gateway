"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useMotionPreference } from './useMotionPreference';

const Motion = createContext({ enabled:false, reduced:true, toggle:() => {} });
export const useLandingMotion = () => useContext(Motion);

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const { enabled, reduced, toggle } = useMotionPreference();

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

  return <Motion.Provider value={{ enabled, reduced, toggle }}><div ref={root} className="marketing-page matrix-landing gaming" data-motion={enabled ? 'on' : 'off'}>
    {children}
  </div></Motion.Provider>;
}
