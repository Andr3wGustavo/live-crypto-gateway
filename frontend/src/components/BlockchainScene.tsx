"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { useLandingMotion } from './LandingMotion';
import { useI18n } from '@/i18n/Provider';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const blocks = Array.from({ length:6 }, (_, i) => ({ x:246 + i % 3 * 76, y:102 + Math.floor(i / 3) * 78, dx:(i % 3 - 1) * 58, dy:i < 3 ? -65 : 65 }));

/** Visible animation on every viewport: SVG attributes, not CSS media-query effects. */
export function BlockchainScene({ compact = false }: { compact?: boolean }) {
  const { messages: { guide:g, home:h } } = useI18n();
  const { enabled, reduced, toggle } = useLandingMotion();
  const [mode, setMode] = useState<'auto' | 'scroll' | 'manual'>('auto');
  const [stage, setStage] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const phase = useRef(0);
  const previousStage = useRef(0);
  const paint = useRef<(value: number) => void>(() => {});
  const id = useId().replace(/:/g,'');

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const tiles = Array.from(element.querySelectorAll<SVGGElement>('[data-block]'));
    const path = element.querySelector<SVGPathElement>('[data-route]')!;
    const packet = element.querySelector<SVGCircleElement>('[data-packet]')!;
    const receipt = element.querySelector<SVGGElement>('[data-receipt]')!;
    const meter = element.querySelector<HTMLElement>('[data-meter]')!;
    const range = element.querySelector<HTMLInputElement>('input[type=range]');
    const length = path.getTotalLength();
    let frame = 0, lastTime = 0, visible = false;
    const draw = (value: number) => {
      const assembly = clamp(value / .35);
      const ease = 1 - (1 - assembly) ** 3;
      tiles.forEach((tile, i) => {
        const b = blocks[i];
        tile.setAttribute('transform',`translate(${b.x + b.dx * (1-ease)} ${b.y + b.dy * (1-ease)})`);
        tile.setAttribute('data-verified',value >= .55 ? 'true' : 'false');
      });
      const point = path.getPointAtLength(clamp((value-.15)/.68)*length);
      packet.setAttribute('cx',String(point.x)); packet.setAttribute('cy',String(point.y));
      packet.setAttribute('opacity',value > .12 && value < .85 ? '1' : '0');
      receipt.setAttribute('opacity',String(clamp((value-.73)*10)));
      meter.style.transform = `scaleX(${value})`;
      if (range) range.value = String(Math.round(value*100));
      element.dataset.phase = String(Math.round(value*1000));
      const next = Math.min(3,Math.floor(value*4));
      if (previousStage.current !== next) { previousStage.current = next; setStage(next); }
    };
    paint.current = draw;
    const tick = (time: number) => {
      frame = 0;
      if (!enabled || !visible || document.hidden || mode !== 'auto') return;
      // Cap elapsed time after a suspended frame; there is no offscreen catch-up.
      if (lastTime) phase.current = (phase.current + Math.min(time-lastTime,64)/12000) % 1;
      lastTime = time; draw(phase.current);
      frame = requestAnimationFrame(tick);
    };
    const synchronize = () => {
      cancelAnimationFrame(frame); frame = 0; lastTime = 0;
      if (visible && enabled && !document.hidden && mode === 'auto') frame = requestAnimationFrame(tick);
    };
    const scroll = () => {
      if (!visible || !enabled || mode !== 'scroll' || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = element.getBoundingClientRect();
        phase.current = clamp((window.innerHeight-rect.top)/(window.innerHeight+rect.height));
        draw(phase.current);
      });
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; synchronize(); scroll(); }, { threshold:.08 });
    observer.observe(element);
    document.addEventListener('visibilitychange',synchronize);
    window.addEventListener('scroll',scroll,{passive:true});
    window.addEventListener('resize',scroll);
    draw(phase.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange',synchronize); window.removeEventListener('scroll',scroll); window.removeEventListener('resize',scroll); paint.current = () => {}; };
  }, [enabled, mode]);

  const seek = (value: number) => { phase.current = value; paint.current(value); setMode('manual'); };
  return <div ref={root} className={`blockchain-console ${compact ? 'is-compact' : ''}`}>
    <div className="terminal-bar"><span><i />{g.terminal}</span><span>v.01 / {enabled ? '▶' : 'Ⅱ'}</span></div>
    <svg viewBox="0 0 700 350" className="blockchain-svg" role="img" aria-label={g.chainTitle}>
      <defs><pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#65d5cb" strokeOpacity=".08" /></pattern><linearGradient id={`${id}-tile`} x2="1" y2="1"><stop stopColor="#153f4e" /><stop offset="1" stopColor="#17182f" /></linearGradient></defs>
      <rect width="700" height="350" fill={`url(#${id}-grid)`} />
      <path data-route d="M155 192H216L254 143H444L505 192H547" fill="none" stroke="#518f9a" strokeWidth="2" strokeDasharray="5 7" />
      <g className="chain-endpoint"><rect x="18" y="145" width="137" height="94" rx="5" /><path d="M40 178h36v26H40zM66 188h17v8H66z" fill="none" /><text x="35" y="164">01 / SIGN</text><text x="35" y="224">{h.cinema.nodes[0]}</text></g>
      {blocks.map((b,i)=><g key={i} data-block data-verified="false" transform={`translate(${b.x} ${b.y})`} className="chain-block"><rect width="64" height="64" rx="4" fill={`url(#${id}-tile)`} /><path d="M64 22h7v18h-7M22 64v7h18v-7" /><text x="9" y="17">0{i+1}</text><path d="m23 28 9-5 9 5v10l-9 5-9-5zM23 28l9 5 9-5M32 33v10" className="block-cube" /><circle cx="53" cy="52" r="2" /></g>)}
      <circle data-packet cx="155" cy="192" r="6" fill="#52ffb4" opacity="0" />
      <g className="chain-endpoint obs-endpoint"><rect x="547" y="145" width="135" height="94" rx="5" /><text x="563" y="165">03 / BROADCAST</text><path d="M572 177h40v26h-40zM584 210h16M592 203v7" fill="none" /><text x="563" y="227">OBS STUDIO</text></g>
      <g data-receipt opacity="0" className="chain-receipt"><rect x="490" y="264" width="190" height="46" rx="3" /><path d="m504 284 6 6 10-13" fill="none" /><text x="529" y="292">ALERT_QUEUED</text></g>
      <text x="251" y="286" className="chain-svg-caption">02 / BLOCKCHAIN</text>
    </svg>
    <div className="chain-status"><span className="terminal-cursor" aria-hidden="true">▸</span><span>{g.states[stage]}</span><span className="chain-step">0{stage+1}/04</span></div>
    <div className="chain-progress"><span data-meter /></div>
    {!compact && <>
      <div className="chain-controls"><button type="button" aria-pressed={enabled} onClick={toggle}>{enabled ? g.pause : g.enable}</button><button type="button" aria-pressed={mode==='auto'} onClick={()=>{setMode('auto'); if(!enabled) toggle();}}>{g.auto}</button><button type="button" aria-pressed={mode==='scroll'} onClick={()=>{setMode('scroll'); if(!enabled) toggle();}}>{g.scroll}</button><button type="button" onClick={()=>{phase.current=0;paint.current(0);setMode('auto');if(!enabled)toggle();}}>{g.replay} ↺</button></div>
      <label className="chain-scrubber">{g.timeline}<input type="range" min="0" max="100" defaultValue="0" onChange={event=>seek(Number(event.target.value)/100)} /></label>
      {reduced && !enabled && <p className="field-hint">{g.reduced}</p>}
    </>}
    <p className="chain-disclaimer">{g.preview}</p>
  </div>;
}
