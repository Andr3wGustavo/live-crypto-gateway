"use client";

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useWalletPicker } from '@/components/Web3Provider';
import { SiweMessage } from 'siwe';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { LoginInstructions, SecurityGuide } from '@/components/CreatorGuide';
import { LanguageSwitcher, useI18n } from '@/i18n/Provider';

type SolanaProvider = {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (message: Uint8Array, encoding: 'utf8') => Promise<{ signature: Uint8Array }>;
};
type Status = 'idle' | 'nonce' | 'signing' | 'verifying' | 'success';

export default function LoginPage() {
  const { messages: { login: l, common: c }, path } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<'evm' | 'solana'>('evm');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWalletPicker();
  const { signMessageAsync } = useSignMessage();
  const busy = status !== 'idle';

  async function signIn() {
    if (busy) return;
    setError('');
    if (tab === 'evm' && (!isConnected || !address)) {
      try { await open(); } catch { setError(l.failure); }
      return;
    }
    try {
      setStatus('nonce');
      let solana: SolanaProvider | undefined;
      let publicKey = '';
      if (tab === 'solana') {
        const browser = window as typeof window & { phantom?: { solana?: SolanaProvider }; solana?: SolanaProvider };
        solana = browser.phantom?.solana || browser.solana;
        if (!solana) { setError(l.noWallet); setStatus('idle'); return; }
        publicKey = (await solana.connect()).publicKey.toString();
        setSolanaAddress(publicKey);
      }
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) throw new Error('Nonce request failed');
      const nonce = await nonceResponse.text();
      setStatus('signing');
      let payload;
      if (solana) {
        // Protocol text stays byte-for-byte compatible with the backend verifier.
        const message = `Sign in to Live Crypto Creator Portal\nOrigin: ${window.location.origin}\nPublic Key: ${publicKey}\nNonce: ${nonce}`;
        const signed = await solana.signMessage(new TextEncoder().encode(message), 'utf8');
        const signature = Array.from(signed.signature).map(byte => byte.toString(16).padStart(2, '0')).join('');
        payload = { type: 'solana', publicKey, nonce, message, signature };
      } else {
        const message = new SiweMessage({ domain: window.location.host, address: address!, statement: 'Sign in to Live Crypto Creator Portal.', uri: window.location.origin, version: '1', chainId: chainId || 1, nonce }).prepareMessage();
        payload = { message, signature: await signMessageAsync({ message }) };
      }
      setStatus('verifying');
      const response = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Signature verification failed');
      // The API sets a revocable HttpOnly cookie; never persist a JWT in JS.
      localStorage.removeItem('jwt');
      setStatus('success');
      router.replace(path('/dashboard'));
    } catch (error) {
      console.error('Sign-in failed:', error);
      setError(l.failure);
      setStatus('idle');
    }
  }

  const label = status === 'idle' ? tab === 'solana' ? l.signSol : isConnected ? l.signEvm : l.connect : l[status];
  return <main className="checkout-shell">
    <header className="product-toolbar"><Brand href={path()} label={`LiveCrypto · ${c.home}`} /><LanguageSwitcher /></header>
    <div className="login-grid">
    <div><LoginInstructions /><SecurityGuide /></div>
    <section className="product-panel checkout-panel" aria-labelledby="login-title">
      <p className="eyebrow">{c.creator}</p><h1 id="login-title">{l.title}</h1><p className="muted">{l.intro}</p>
      <div className="button-row" aria-label={l.connect}>
        {(['evm', 'solana'] as const).map(value => <button key={value} className={`brand-button ${tab === value ? 'primary' : 'secondary'}`} aria-pressed={tab === value} disabled={busy} onClick={() => { setTab(value); setError(''); }}>{value === 'evm' ? 'EVM' : 'Solana'}</button>)}
      </div>
      <p className="field-hint">{tab === 'evm' ? l.extensionHint : l.solanaHint}</p>
      {(tab === 'evm' ? address : solanaAddress) && <p className="notice">{l.address}<br /><bdi className="break-all" dir="ltr">{tab === 'evm' ? address : solanaAddress}</bdi></p>}
      <button className="brand-button primary full-width" disabled={busy} onClick={() => void signIn()}>{label}</button>
      {tab === 'evm' && isConnected && <button className="brand-button secondary full-width" disabled={busy} onClick={() => { void open().catch(() => setError(l.failure)); }}>{l.switch}</button>}
      {error && <p role="alert" className="error-notice">{error}</p>}
      {busy && <p role="status" className="field-hint">{label}</p>}
      <p className="field-hint">{l.signature}</p><p className="field-hint">{c.privateKeys}</p>
    </section>
    </div>
    <Link className="field-hint" href={path()}>← {c.back}</Link>
  </main>;
}
