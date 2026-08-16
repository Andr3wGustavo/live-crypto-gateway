"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function BackgroundLayer() {
  const pathname = usePathname();
  const isOverlay = pathname?.startsWith('/overlay');
  const [videoPlaying, setVideoPlaying] = useState(true);

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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Background Video Layer with Web3 Cinematic Shading */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30 mix-blend-screen scale-105 filter contrast-125 brightness-110 transition-opacity duration-1000"
          style={{ willChange: 'transform, opacity' }}
        >
          <source src="/brand/consegue_fazer_um_video_de_um.mp4" type="video/mp4" />
          <source src="/brand/animation.mp4" type="video/mp4" />
        </video>
        
        {/* Cinematic Vignette & Radial Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090d]/85 via-[#08090d]/70 to-[#08090d]/95"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#08090d]/50 to-[#08090d]"></div>
      </div>

      {/* Cyber Grid & Ambient Floating Orbs */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20"></div>
      <div className="absolute inset-0 bg-dot-grid opacity-35"></div>

      {/* Dynamic Floating Glow Orbs (GPU Accelerated) */}
      <div className="absolute -top-[15%] -left-[10%] w-[650px] h-[650px] rounded-full bg-cyan-500/12 blur-[150px] animate-float-slow"></div>
      <div className="absolute top-[35%] -right-[15%] w-[700px] h-[700px] rounded-full bg-purple-600/12 blur-[170px] animate-float-reverse"></div>
      <div className="absolute -bottom-[20%] left-[25%] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[180px] animate-pulse-slow"></div>
      <div className="absolute top-[60%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px]"></div>

      {/* Scanline Texture Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_50%,transparent_50%)] bg-[length:100%_4px] opacity-15"></div>
    </div>
  );
}
