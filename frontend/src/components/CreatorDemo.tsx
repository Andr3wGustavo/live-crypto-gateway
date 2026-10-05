"use client";

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/Provider';

export function CreatorDemo() {
  const { messages: { demo: d, common: c }, decimal } = useI18n();
  const [theme, setTheme] = useState('signal');
  const [active, setActive] = useState(false);
  const [sound, setSound] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function preview() {
    if (timer.current) clearTimeout(timer.current);
    setActive(true);
    timer.current = setTimeout(() => setActive(false), 5500);
    if (sound) {
      const { playSynthesizedSound } = await import('@/services/soundEffects');
      playSynthesizedSound('cyber_chime', 0.25);
    }
  }

  return <div className="demo-studio">
    <div className={`demo-canvas theme-${theme}`}>
      <div className="canvas-top"><span><i />{c.creator}</span><span>{d.interactive}</span></div>
      <div className="canvas-landscape" aria-hidden><div /><span>{d.next}</span></div>
      <div className={`demo-donation ${active ? 'is-active' : ''}`} role="status" aria-live="polite">
        {active ? <><span className="donation-glyph">↗</span><div><small>{d.support}</small><strong>alex.sol <span>+{decimal('0.1')} SOL</span></strong><p>{d.message}</p></div></> : <p className="canvas-prompt">{d.placeholder}<br /><span>{d.prompt}</span></p>}
      </div>
      <div className="canvas-bottom"><span>{d.canvas}</span><span>{d.noTransfer}</span></div>
    </div>
    <aside className="demo-controls">
      <p className="eyebrow">{d.eyebrow}</p><h3>{d.title}</h3><p>{d.intro}</p>
      <fieldset><legend>{d.atmosphere}</legend><div className="theme-choices">{[['signal', 'Matrix', '#73efc3'], ['ember', 'Nebula', '#b39afb'], ['mono', 'Glacier', '#7bd4ff']].map(([id, label, color]) => <button type="button" key={id} aria-pressed={theme === id} onClick={() => setTheme(id)}><span style={{ background: color }} />{label}</button>)}</div></fieldset>
      <label className="sound-toggle"><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} />{d.sound}</label>
      <button type="button" className="brand-button primary full-width" onClick={() => void preview()}>{active ? d.repeat : d.trigger} ↗</button>
      <p className="field-hint">{d.disclaimer}</p>
    </aside>
  </div>;
}

export function FeeCalculator() {
  const { messages: { demo: d }, number } = useI18n();
  const [amount, setAmount] = useState(1000);
  const format = (value: number) => number(value, { style: 'currency', currency: 'USD' });
  return <div className="fee-calculator product-panel"><div className="calculator-top"><span>{d.fee}</span><span>2%</span></div><label htmlFor="support-volume">{d.volume}</label><output htmlFor="support-volume" className="calculator-total">{format(amount)}</output><input id="support-volume" type="range" min="100" max="10000" step="100" value={amount} onChange={e => setAmount(Number(e.target.value))} aria-valuetext={format(amount)} /><div className="range-labels"><span>{format(100)}</span><span>{format(10000)}</span></div><dl><div><dt>{d.creator}</dt><dd>{format(amount * 0.98)}</dd></div><div><dt>{d.platform}</dt><dd>{format(amount * 0.02)}</dd></div></dl><div className="fee-bar" aria-label={d.split}><span /><span /></div><p className="field-hint">{d.feeDisclaimer}</p></div>;
}
