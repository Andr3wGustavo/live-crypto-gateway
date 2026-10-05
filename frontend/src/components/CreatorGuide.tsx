"use client";

import Link from 'next/link';
import { useId } from 'react';
import { useI18n } from '@/i18n/Provider';

export function CreatorGuide({ studio = false, walletReady = false }: { studio?: boolean; walletReady?: boolean }) {
  const { messages:{guide:g}, path } = useI18n();
  const id = useId();
  const targets = ['#studio-account','#studio-wallets','#studio-obs','#studio-share'];
  return <section className="creator-guide" aria-labelledby={id}>
    <div className="guide-heading"><p className="eyebrow">START_HERE / 01—04</p><h2 id={id}>{g.setupTitle}</h2><p>{g.intro}</p></div>
    <ol className="setup-grid">{g.setupSteps.map(([code,title,body],i)=><li key={code}>
      <span className="setup-code">{code}</span><h3>{title}</h3><p>{body}</p>
      {studio ? <a href={targets[i]}>{[g.authenticated,walletReady?g.walletReady:g.walletMissing,g.obsCheck,g.publicLink][i]} <span aria-hidden="true">↗</span></a> : <Link href={path('/login')}>{title} <span aria-hidden="true">↗</span></Link>}
    </li>)}</ol>
  </section>;
}

export function LoginInstructions() {
  const { messages:{guide:g} }=useI18n();
  return <aside className="login-instructions"><p className="eyebrow">AUTH_PROTOCOL / SIGN_MESSAGE</p><h2>{g.loginTitle}</h2><ol className="instruction-list">{g.loginSteps.map(text=><li key={text}>{text}</li>)}</ol></aside>;
}

export function ObsInstructions() {
  const { messages:{guide:g} }=useI18n();
  return <div className="obs-instructions"><h3>{g.obsTitle}</h3><ol className="instruction-list">{g.obsSteps.map(text=><li key={text}>{text}</li>)}</ol><p className="security-note">{g.obsHelp}</p></div>;
}

export function ReceivingGuide() {
  const { messages:{guide:g} }=useI18n();
  return <section className="receiving-guide"><p className="eyebrow">WALLET → CREATOR</p><h2>{g.receiveTitle}</h2><p>{g.receiveBody}</p><ul className="guide-list">{g.receiveNotes.map(text=><li key={text}>{text}</li>)}</ul></section>;
}

export function SecurityGuide() {
  const { messages:{guide:g} }=useI18n();
  return <section className="security-guide"><p className="eyebrow">SECURITY / YOUR_KEYS</p><h2>{g.safetyTitle}</h2><ul className="guide-list">{g.safety.map(text=><li key={text}>{text}</li>)}</ul></section>;
}
