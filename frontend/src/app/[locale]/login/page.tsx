"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi';
import { useWalletPicker } from '@/components/Web3Provider';
import { SiweMessage } from 'siwe';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { LoginInstructions, SecurityGuide } from '@/components/CreatorGuide';
import { LanguageSwitcher, useI18n } from '@/i18n/Provider';
import { detectSolanaWallets, type SolanaProvider, type SolanaWalletOption } from '@/lib/solanaWallets';
import { connectSuiWallet, initSuiWallets, signSuiPersonalMessage, subscribeSuiWallets, type SuiAccount, type SuiWallet } from '@/lib/suiWallets';

type Status = 'idle' | 'nonce' | 'signing' | 'verifying' | 'success';
type Tab = 'evm' | 'solana' | 'sui';
type SuiConnection = { wallet: string; account: SuiAccount; address: string };

export default function LoginPage() {
  const { messages: { login: l, common: c }, path } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('evm');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');
  const [solanaWallets, setSolanaWallets] = useState<SolanaWalletOption[]>([]);
  const [solanaWalletId, setSolanaWalletId] = useState('');
  const [suiWallets, setSuiWallets] = useState<SuiWallet[]>([]);
  const [suiWalletId, setSuiWalletId] = useState('');
  const [suiConnection, setSuiConnection] = useState<SuiConnection | null>(null);
  const [evmChainId, setEvmChainId] = useState<number | null>(null);
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWalletPicker();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const busy = status !== 'idle';
  const suiAddress = suiConnection?.address || '';
  const selectedSui = suiWallets.find(wallet => wallet.name === suiWalletId) || suiWallets[0];

  useEffect(() => {
    let cancelled = false;
    // Detection touches extension globals, so it must run after hydration. The
    // microtask keeps the state update out of the effect's synchronous body and
    // avoids a cascading render warning.
    queueMicrotask(() => {
      if (cancelled) return;
      const detected = detectSolanaWallets();
      setSolanaWallets(detected);
      setSolanaWalletId(detected[0]?.id || '');
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    initSuiWallets();
    return subscribeSuiWallets(list => {
      setSuiWallets(list);
      setSuiWalletId(previous => previous || list[0]?.name || '');
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/payment-config', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then((config: { networks?: { chainId: string }[] } | null) => {
        const numeric = config?.networks?.map(network => Number(network.chainId)).find(value => Number.isSafeInteger(value) && value > 0);
        if (numeric) setEvmChainId(numeric);
      })
      .catch(() => { /* SIWE still works if the config endpoint is temporarily unavailable. */ });
    return () => controller.abort();
  }, []);

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
      let suiWallet: SuiWallet | undefined;
      let suiAccount: SuiAccount | undefined;

      if (tab === 'solana') {
        const option = solanaWallets.find(wallet => wallet.id === solanaWalletId) || solanaWallets[0];
        if (!option) { setError(l.noWallet); setStatus('idle'); return; }
        solana = option.provider;
        await solana.connect();
        publicKey = solana.publicKey?.toString() || '';
        if (!publicKey) throw new Error('The Solana wallet returned no public key.');
        setSolanaAddress(publicKey);
      } else if (tab === 'sui') {
        suiWallet = selectedSui;
        if (!suiWallet) { setError(l.noSuiWallet); setStatus('idle'); return; }
        // Keep the wallet's own account object for signing: Wallet Standard
        // features look the account up by reference. Only the address used in
        // the signed text and the API payload is normalised.
        suiAccount = suiConnection?.wallet === suiWallet.name ? suiConnection.account : await connectSuiWallet(suiWallet);
        setSuiConnection({ wallet: suiWallet.name, account: suiAccount, address: suiAccount.address.trim().toLowerCase() });
      } else if (evmChainId && chainId !== evmChainId) {
        // The backend now binds SIWE to the one configured EVM network, so ask
        // the wallet to switch before producing the message.
        await switchChainAsync({ chainId: evmChainId });
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
      } else if (suiWallet && suiAccount) {
        // Same protocol shape as the backend's signInMessage() helper.
        const suiSigningAddress = suiAccount.address.trim().toLowerCase();
        const message = `Sign in to Live Crypto Creator Portal\nOrigin: ${window.location.origin}\nSui Address: ${suiSigningAddress}\nNonce: ${nonce}`;
        const signature = await signSuiPersonalMessage(suiWallet, suiAccount, message);
        payload = { type: 'sui', address: suiSigningAddress, nonce, message, signature };
      } else {
        const message = new SiweMessage({ domain: window.location.host, address: address!, statement: 'Sign in to Live Crypto Creator Portal.', uri: window.location.origin, version: '1', chainId: evmChainId || chainId || 1, nonce }).prepareMessage();
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

  const label = status === 'idle' ? tab === 'solana' ? l.signSol : tab === 'sui' ? l.signSui : isConnected ? l.signEvm : l.connect : l[status];
  const activeStep = status === 'idle' ? 0 : status === 'nonce' || status === 'signing' ? 1 : status === 'verifying' ? 2 : 3;
  const shownAddress = tab === 'evm' ? address : tab === 'solana' ? solanaAddress : suiAddress;
  return <main className="checkout-shell">
    <header className="product-toolbar"><Brand href={path()} label={`LiveCrypto · ${c.home}`} /><LanguageSwitcher /></header>
    <div className="login-grid">
    <div>
      <div className="login-visual-wrap" data-reveal>
        <div className="auth-visual" aria-hidden="true" data-state={error ? 'error' : status}>
          <div className="auth-rings"><i /><i /><i /></div>
          <div className="auth-core"><Image src="/brand/logo-png.png" alt="" width={124} height={124} unoptimized /></div>
          <span className="auth-node auth-node-1">Ξ</span>
          <span className="auth-node auth-node-2">◎</span>
          <span className="auth-node auth-node-3">✳</span>
          <span className="auth-scan" />
        </div>
        <ol className="auth-steps" aria-label={l.title}>
          {l.steps.map((step, index) => <li key={step} className={index < activeStep ? 'is-done' : index === activeStep ? 'is-active' : ''}>
            <span>{String(index + 1).padStart(2, '0')}</span>{step}
          </li>)}
        </ol>
      </div>
      <div data-reveal data-reveal-delay="80"><LoginInstructions /><SecurityGuide /></div>
    </div>
    <section className={`product-panel checkout-panel login-panel is-${status}${error ? ' has-error' : ''}`} aria-labelledby="login-title" data-reveal data-reveal-delay="120" data-glow>
      <p className="eyebrow">{c.creator}</p><h1 id="login-title">{l.title}</h1><p className="muted">{l.intro}</p>
      <div className="button-row" aria-label={l.connect}>
        {(['evm', 'solana', 'sui'] as const).map(value => <button key={value} className={`brand-button ${tab === value ? 'primary' : 'secondary'}`} aria-pressed={tab === value} disabled={busy} onClick={() => { setTab(value); setError(''); }}>{value === 'evm' ? 'EVM' : value === 'solana' ? 'Solana' : 'Sui'}</button>)}
      </div>
      <p className="field-hint">{tab === 'evm' ? l.extensionHint : tab === 'solana' ? l.solanaHint : l.suiHint}</p>
      {tab === 'solana' && solanaWallets.length > 1 && <>
        <label className="field-label" htmlFor="solana-wallet">{l.wallet}</label>
        <select id="solana-wallet" className="glass-input field-control" value={solanaWalletId} disabled={busy} onChange={event => setSolanaWalletId(event.target.value)}>
          {solanaWallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
        </select>
      </>}
      {tab === 'sui' && suiWallets.length > 1 && <>
        <label className="field-label" htmlFor="sui-wallet">{l.wallet}</label>
        <select id="sui-wallet" className="glass-input field-control" value={selectedSui?.name || ''} disabled={busy} onChange={event => { setSuiWalletId(event.target.value); setSuiConnection(null); }}>
          {suiWallets.map(wallet => <option key={wallet.name} value={wallet.name}>{wallet.name}</option>)}
        </select>
      </>}
      {tab === 'sui' && suiWallets.length === 1 && <p className="field-hint">{l.detected}: <b>{suiWallets[0].name}</b></p>}
      {tab === 'sui' && suiWallets.length === 0 && <p className="field-hint">{l.noSuiWallet}</p>}
      {tab === 'solana' && solanaWallets.length === 1 && <p className="field-hint">{l.detected}: <b>{solanaWallets[0].name}</b></p>}
      {shownAddress && <p className="notice">{l.address}<br /><bdi className="break-all" dir="ltr">{shownAddress}</bdi></p>}
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
