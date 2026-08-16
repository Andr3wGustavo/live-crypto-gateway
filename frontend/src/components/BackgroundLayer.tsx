"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function BackgroundLayer() {
  const pathname = usePathname();
  const isOverlay = pathname?.startsWith('/overlay');

  useEffect(() => {
    if (isOverlay) {
      document.body.classList.add('obs-transparent-mode');
      document.documentElement.classList.add('obs-transparent-mode');
    } else {
      document.body.classList.remove('obs-transparent-mode');
      document.documentElement.classList.remove('obs-transparent-mode');
    }
  }, [isOverlay]);

  if (isOverlay) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-black">
      {/* Background Video Layer with Deep Contrast Blend */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-20 mix-blend-screen filter contrast-125 brightness-90"
        >
          <source src="/brand/consegue_fazer_um_video_de_um.mp4" type="video/mp4" />
          <source src="/brand/animation.mp4" type="video/mp4" />
        </video>
        
        {/* Solid Black Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/75 to-black/95"></div>
      </div>

      {/* Cyber Grid & Ambient Dots */}
      <div className="absolute inset-0 bg-cyber-grid opacity-15"></div>
      <div className="absolute inset-0 bg-dot-grid opacity-25"></div>

      {/* Subtle Ambient Glowing Orbs */}
      <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[160px]"></div>
      <div className="absolute top-[35%] -right-[15%] w-[650px] h-[650px] rounded-full bg-purple-600/10 blur-[180px]"></div>
      <div className="absolute -bottom-[20%] left-[20%] w-[700px] h-[700px] rounded-full bg-blue-600/08 blur-[180px]"></div>
    </div>
  );
}
