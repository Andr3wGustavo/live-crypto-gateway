"use client";

import { useEffect, useState, type CSSProperties } from 'react';
import { useI18n } from '@/i18n/Provider';
import { useLandingMotion } from './LandingMotion';

const initial = { block: 18452301, throughput: 42.7, finality: 1.8, nodes: 1284 };

/** Decorative network telemetry. Clearly labelled as a simulation, never real chain data. */
export function LiveNetworkTicker() {
  const { messages: { fx }, number } = useI18n();
  const { enabled } = useLandingMotion();
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      setStats(current => ({
        block: current.block + Math.floor(Math.random() * 3) + 1,
        throughput: Math.max(18, Math.min(92, current.throughput + (Math.random() - 0.5) * 9)),
        finality: Math.max(0.8, Math.min(4.2, current.finality + (Math.random() - 0.5) * 0.35)),
        nodes: Math.max(900, current.nodes + Math.floor(Math.random() * 7) - 3),
      }));
    }, 2400);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return <div className="network-ticker" role="img" aria-label={`${fx.simulation}. ${fx.note}`}>
    <span className="ticker-live"><i aria-hidden="true" />{fx.simulation}</span>
    <dl aria-hidden="true">
      <div><dt>{fx.block}</dt><dd>#{number(stats.block)}</dd></div>
      <div><dt>{fx.throughput}</dt><dd>{number(stats.throughput, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</dd></div>
      <div><dt>{fx.finality}</dt><dd>{number(stats.finality, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}s</dd></div>
      <div><dt>{fx.nodes}</dt><dd>{number(stats.nodes)}</dd></div>
    </dl>
    <span className="ticker-wave" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--i': index } as CSSProperties} />)}
    </span>
    <span className="ticker-note" aria-hidden="true">{fx.note}</span>
  </div>;
}
