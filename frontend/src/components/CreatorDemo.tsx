"use client";

import { useEffect, useRef, useState } from 'react';

export function CreatorDemo() {
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
      <div className="canvas-top"><span><i /> CREATOR STUDIO</span><span>PRÉVIA INTERATIVA</span></div>
      <div className="canvas-landscape" aria-hidden><div /><span>YOUR<br />NEXT<br /><em>LEVEL.</em></span></div>
      <div className={`demo-donation ${active ? 'is-active' : ''}`} role="status" aria-live="polite">
        {active ? <><span className="donation-glyph">↗</span><div><small>APOIO DEMONSTRATIVO</small><strong>alex.sol <span>+0.1 SOL</span></strong><p>Essa comunidade é de outro nível.</p></div></> : <p className="canvas-prompt">Seu próximo apoio aparece aqui.<br /><span>Dispare um alerta para experimentar.</span></p>}
      </div>
      <div className="canvas-bottom"><span>1920 × 1080 / OBS BROWSER SOURCE</span><span>DEMO · SEM TRANSAÇÃO</span></div>
    </div>
    <aside className="demo-controls">
      <p className="eyebrow">SEU ESTILO. AO VIVO.</p><h3>O palco é seu.</h3><p>Uma pequena amostra do que a sua comunidade pode sentir.</p>
      <fieldset><legend>Escolha a atmosfera</legend><div className="theme-choices">{[['signal', 'Signal', '#63ebdf'], ['ember', 'Ember', '#ffa676'], ['mono', 'Studio', '#f0eee6']].map(([id, label, color]) => <button type="button" key={id} aria-pressed={theme === id} onClick={() => setTheme(id)}><span style={{ background: color }} />{label}</button>)}</div></fieldset>
      <label className="sound-toggle"><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Ativar som da demonstração</label>
      <button type="button" className="brand-button primary full-width" onClick={() => void preview()}>{active ? 'Repetir experiência ↗' : 'Disparar alerta ↗'}</button>
      <p className="field-hint">Demonstração local. Não movimenta fundos, não acessa sua carteira e não envia alertas para uma live real.</p>
    </aside>
  </div>;
}

export function FeeCalculator() {
  const [amount, setAmount] = useState(1000);
  const format = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return <div className="fee-calculator product-panel"><div className="calculator-top"><span>SIMULAÇÃO DE TAXA</span><span>02%</span></div><label htmlFor="support-volume">Se sua comunidade apoiar com</label><output htmlFor="support-volume" className="calculator-total">{format(amount)}</output><input id="support-volume" type="range" min="100" max="10000" step="100" value={amount} onChange={e => setAmount(Number(e.target.value))} aria-valuetext={format(amount)} /><div className="range-labels"><span>R$ 100</span><span>R$ 10.000</span></div><dl><div><dt>Para quem cria</dt><dd>{format(amount * 0.98)}</dd></div><div><dt>Para manter a plataforma</dt><dd>{format(amount * 0.02)}</dd></div></dl><div className="fee-bar" aria-label="98 por cento para o criador, 2 por cento para a plataforma"><span /><span /></div><p className="field-hint">Exemplo em reais para ilustrar a divisão. Não é cotação, promessa de receita ou suporte a Pix. Gas e variação cambial não incluídos.</p></div>;
}
