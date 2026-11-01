"use client";

import { useEffect, useRef, useState } from 'react';
import { useMotionPreference } from './useMotionPreference';

type AnimatedValueProps = {
  value: number;
  format: (value: number) => string;
  duration?: number;
  className?: string;
};

/**
 * Counts from the previous real value to the new one. The accessible label is
 * always the final value, so assistive technology never reads intermediate
 * frames. Without motion, the final value renders immediately.
 */
export function AnimatedValue({ value, format, duration = 900, className }: AnimatedValueProps) {
  const { enabled } = useMotionPreference();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const frame = useRef(0);

  useEffect(() => {
    if (!enabled) {
      previous.current = value;
      return;
    }

    const from = previous.current;
    previous.current = value;
    if (from === value) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [enabled, value, duration]);

  return <span className={className}>
    <span aria-hidden="true">{format(enabled ? display : value)}</span>
    <span className="sr-only">{format(value)}</span>
  </span>;
}
