"use client";

import { useEffect, useRef } from 'react';
import { useLandingMotion } from './LandingMotion';

type Node = { x: number; y: number; vx: number; vy: number; r: number; hue: number; phase: number };
type Pulse = { a: number; b: number; t: number; speed: number };

/**
 * Ambient crypto network rendered on a canvas. It is decorative, pauses when
 * off-screen or when the tab is hidden, and becomes a static illustration when
 * the visitor asks for reduced motion.
 */
export function CryptoField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enabled } = useLandingMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reduced = !enabled;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let onScreen = true;
    let pageVisible = !document.hidden;
    const pointer = { x: 0, y: 0, active: false };

    const paint = (time: number) => {
      context.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 150) continue;
          const alpha = (1 - distance / 150) * 0.2;
          context.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 88%, 68%, ${alpha})`;
          context.lineWidth = 0.6;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }

      if (pointer.active) {
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 190);
        glow.addColorStop(0, 'rgba(34, 230, 255, 0.14)');
        glow.addColorStop(0.45, 'rgba(43, 157, 255, 0.06)');
        glow.addColorStop(1, 'rgba(34, 230, 255, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(pointer.x, pointer.y, 190, 0, Math.PI * 2);
        context.fill();
      }

      for (const node of nodes) {
        const shimmer = 0.65 + Math.sin(time * 0.0012 + node.phase) * 0.35;
        context.beginPath();
        context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        context.fillStyle = `hsla(${node.hue}, 90%, 70%, ${0.55 * shimmer})`;
        context.fill();
        context.beginPath();
        context.arc(node.x, node.y, node.r * 3.4, 0, Math.PI * 2);
        context.fillStyle = `hsla(${node.hue}, 90%, 70%, ${0.055 * shimmer})`;
        context.fill();
      }

      for (const pulse of pulses) {
        const a = nodes[pulse.a];
        const b = nodes[pulse.b];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * pulse.t;
        const y = a.y + (b.y - a.y) * pulse.t;
        const glow = context.createRadialGradient(x, y, 0, x, y, 15);
        glow.addColorStop(0, 'rgba(215, 247, 255, 0.95)');
        glow.addColorStop(0.35, 'rgba(34, 230, 255, 0.62)');
        glow.addColorStop(1, 'rgba(34, 230, 255, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, 15, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = 'rgba(111, 246, 255, 0.28)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(x, y);
        context.stroke();
      }
    };

    const animate = (time: number) => {
      if (!reduced && onScreen && pageVisible) {
        for (const node of nodes) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -20 || node.x > width + 20) node.vx *= -1;
          if (node.y < -20 || node.y > height + 20) node.vy *= -1;
          if (pointer.active) {
            const dx = node.x - pointer.x;
            const dy = node.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 145 && distance > 0.001) {
              node.x += (dx / distance) * 0.28;
              node.y += (dy / distance) * 0.28;
            }
          }
        }

        if (pulses.length < 6 && Math.random() < 0.03) {
          const a = Math.floor(Math.random() * nodes.length);
          const nearby = nodes
            .map((node, index) => ({ index, distance: Math.hypot(node.x - nodes[a].x, node.y - nodes[a].y) }))
            .filter(entry => entry.index !== a && entry.distance < 190);
          if (nearby.length) {
            pulses.push({ a, b: nearby[Math.floor(Math.random() * nearby.length)].index, t: 0, speed: 0.006 + Math.random() * 0.008 });
          }
        }

        for (const pulse of pulses) pulse.t += pulse.speed;
        pulses = pulses.filter(pulse => pulse.t < 1);
        paint(time);
      }
      frame = requestAnimationFrame(animate);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 700 ? 26 : width < 1100 ? 40 : 62;
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.8 + 1.1,
        hue: [184, 194, 210][Math.floor(Math.random() * 3)],
        phase: Math.random() * Math.PI * 2,
      }));
      pulses = [];
      paint(performance.now());
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= width && pointer.y <= height;
    };
    const onLeave = () => { pointer.active = false; };
    const onVisibility = () => { pageVisible = !document.hidden; };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(entries => {
      onScreen = entries[0]?.isIntersecting ?? true;
    }, { rootMargin: '140px' });
    intersectionObserver.observe(canvas);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    if (!reduced) frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  return <canvas ref={canvasRef} className="crypto-field" aria-hidden="true" />;
}
