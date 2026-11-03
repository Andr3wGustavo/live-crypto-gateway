"use client";

import { useEffect, useState, type CSSProperties } from 'react';
import { useLandingMotion } from './LandingMotion';

export type TheatreLabels = {
  sim: string;
  network: string;
  amount: string;
  hash: string;
  confirmations: string;
  alert: string;
  queued: string;
  sent: string;
  steps: string[];
};

const HEX = '0123456789abcdef';

/** Deterministic hex so the server and client render the same first frame. */
function digest(seed: number, length: number) {
  let value = (seed * 2654435761) % 4294967296;
  let out = '';
  for (let i = 0; i < length; i++) {
    value = (value * 1103515245 + 12345) % 2147483648;
    out += HEX[value % 16];
  }
  return out;
}

function group(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Simulated wallet -> signature -> chain -> OBS pipeline.
 *
 * Purely decorative and explicitly labelled as a simulation. It advances on a
 * 12 s loop while motion is enabled and freezes on a confirmed frame when the
 * visitor asks for reduced motion. No network calls, no wallet access.
 */
export function ChainTheatre({ labels }: { labels: TheatreLabels }) {
  const { enabled } = useLandingMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setTick(current => (current + 1) % 12), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  const step = enabled ? Math.min(3, Math.floor(tick / 3)) : 3;
  const confirmations = enabled ? (step === 3 ? 6 : step * 2) : 6;
  const block = 18452304 + (enabled ? tick : 0);
  const tx = `0x${digest(37 + (enabled ? tick : 0), 4)}…${digest(211 + (enabled ? tick : 0), 4)}`;
  const sent = step === 3;

  return (
    <div className="theatre" aria-hidden="true" data-step={step}>
      <div className="theatre-top">
        <span className="theatre-sim"><i />{labels.sim}</span>
        <span className="theatre-net">{labels.network}</span>
      </div>

      <ol className="theatre-track">
        {labels.steps.map((label, index) => (
          <li key={label} className={index <= step ? 'is-done' : undefined}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {label}
          </li>
        ))}
        <li className="theatre-line" aria-hidden="true">
          <i style={{ '--p': `${(step / 3) * 100}%` } as CSSProperties} />
        </li>
      </ol>

      <div className="theatre-core">
        <p className="theatre-label">{labels.amount}</p>
        <p className="theatre-amount">0.042 <small>ETH</small><em>≈ $128.40</em></p>
        <dl className="theatre-facts">
          <div><dt>{labels.hash}</dt><dd>{tx}</dd></div>
          <div><dt>{labels.confirmations}</dt><dd><b>{confirmations}</b>/06</dd></div>
        </dl>
      </div>

      <div className="theatre-alert" data-sent={sent ? 'true' : 'false'}>
        <span className="theatre-alert-icon" />
        <span>{labels.alert}</span>
        <b>{sent ? labels.sent : labels.queued}</b>
      </div>

      <div className="theatre-log">
        <span><i>SIG</i>{tx}</span>
        <span><i>BLOCK</i>#{group(block)}</span>
        <span><i>OBS</i>{sent ? labels.sent : labels.queued}</span>
      </div>
    </div>
  );
}
