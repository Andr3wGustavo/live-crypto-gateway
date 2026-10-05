"use client";

import { use, useEffect, useRef, useState } from 'react';
import { Brand } from '@/components/Brand';
import { SecurityGuide } from '@/components/CreatorGuide';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';
import { useWalletPicker } from '@/components/Web3Provider';
import { encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import routerAbi from '@/abi/LiveCryptoRouter.json';
import { LanguageSwitcher, useI18n } from '@/i18n/Provider';

type Network = { chainId: string; name: string; currency: string; testnet: boolean; enabled: boolean; router?: string; treasury?: string; explorer: string };
type Config = { enabled: boolean; feeBps: number; networks: Network[] };
type Wallet = { chain_id: string; public_address: string };
type Intent = { id: string; accessToken: string; memo: string; reference: string | null; recipient: string; router: string; treasury: string; feeBps: number; amount: string; expiresAt: string };
type Submitted = { hash: string; network: Network; gross: string; intent?: Intent };
type SolanaWallet = { publicKey: PublicKey; connect: () => Promise<unknown>; signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }> };
type State = 'idle' | 'signing' | 'pending' | 'confirmed' | 'error';

function loadSubmittedPayment(streamerId: string): Submitted | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = sessionStorage.getItem(`livecrypto:payment:${streamerId}`);
    if (!value) return null;
    const payment = JSON.parse(value) as Submitted;
    return typeof payment.hash === 'string' && typeof payment.network?.chainId === 'string' ? payment : null;
  } catch { return null; }
}

export default function Checkout({ params }: { params: Promise<{ streamer_id: string }> }) {
  const { messages: { pay: p, common: c }, path, decimal, number } = useI18n();
  const { streamer_id } = use(params);
  const [config, setConfig] = useState<Config | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [networkId, setNetworkId] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [netReceived, setNetReceived] = useState('');
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const busy = useRef(false);
  const { address, chainId, isConnected } = useAccount();
  const { open } = useWalletPicker();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [settings, profile] = await Promise.all([
          fetch('/api/public/payment-config', { signal: controller.signal }),
          fetch(`/api/public/streamer/${encodeURIComponent(streamer_id)}`, { signal: controller.signal })
        ]);
        if (!settings.ok || !profile.ok) throw new Error('Profile unavailable');
        const data: Config = await settings.json();
        const creator: { wallets: Wallet[] } = await profile.json();
        setConfig(data);
        setWallets(creator.wallets);
        setNetworkId(data.networks.find(n => n.enabled && creator.wallets.some(w => w.chain_id === n.chainId))?.chainId || data.networks[0]?.chainId || '');
      } catch (err) {
        if (!controller.signal.aborted) { console.error(err); setError(p.loadError); }
      } finally {
        if (!controller.signal.aborted) {
          // Restore only after hydration, including after a language switch.
          // Keep submission disabled until the saved hash has been recovered.
          const saved = loadSubmittedPayment(streamer_id);
          if (saved) {
            setSubmitted(saved);
            setNetworkId(saved.network.chainId);
            if (typeof saved.gross === 'string') setAmount(saved.gross);
            setState('pending');
          }
          setLoading(false);
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [streamer_id, p.loadError]);

  const network = config?.networks.find(n => n.chainId === networkId);
  const recipient = wallets.find(w => w.chain_id === networkId)?.public_address;
  const decimals = networkId.startsWith('solana') ? 9 : 18;
  let raw = 0n;
  try {
    if (/^\d+(\.\d+)?$/.test(amount) && (amount.split('.')[1]?.length || 0) <= decimals) raw = parseUnits(amount, decimals);
  } catch { /* Invalid values cannot be submitted. */ }
  const fee = raw * BigInt(config?.feeBps || 0) / 10000n;
  const canPay = !loading && network?.enabled && recipient && raw > 0n && !submitted && state !== 'signing';

  useEffect(() => {
    if (!submitted?.intent) return;
    const controller = new AbortController();
    const { id, accessToken } = submitted.intent;
    let running = false;
    const check = async () => {
      if (running) return;
      running = true;
      try {
        const response = await fetch(`/api/payments/intents/${id}`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        if (!response.ok) throw new Error('Status unavailable');
        const result = await response.json();
        if (controller.signal.aborted) return;
        setExpired(result.status === 'EXPIRED');
        if (result.hash) setSubmitted(previous => previous && previous.hash !== result.hash ? { ...previous, hash: result.hash } : previous);
        if (result.status === 'CONFIRMED') { setNetReceived(result.transaction?.amount || ''); setState('confirmed'); setError(''); }
      } catch { /* The durable worker keeps reconciling when this page is offline. */ }
      finally { running = false; }
    };
    void check();
    const timer = setInterval(() => void check(), 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [submitted?.intent]);

  async function verify(payment: Submitted) {
    setState('pending');
    setError('');
    try {
      if (!payment.intent) throw new Error('Legacy payment: contact support with the transaction hash');
      const response = await fetch(`/api/payments/intents/${payment.intent.id}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${payment.intent.accessToken}` },
        body: JSON.stringify({ tx_hash: payment.hash }),
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) throw new Error('Submission unavailable');
    } catch (err) {
      setState('pending');
      console.error('Confirmation unavailable:', err);
      setError(p.retry);
    }
  }

  async function donate() {
    if (!canPay || !network || !recipient || !config || busy.current) return;
    busy.current = true;
    setError('');
    setState('signing');
    try {
      let hash: string;
      let solWallet: SolanaWallet | undefined;
      let sender: string | undefined = address;
      if (network.chainId.startsWith('solana')) {
        const browser = window as unknown as { phantom?: { solana?: SolanaWallet }; solana?: SolanaWallet };
        solWallet = browser.phantom?.solana || browser.solana;
        if (!solWallet) throw new Error('Solana wallet unavailable');
        await solWallet.connect();
        sender = solWallet.publicKey.toBase58();
      } else {
        if (!isConnected || !address) { await open(); setState('idle'); return; }
        if (chainId !== Number(network.chainId)) await switchChainAsync({ chainId: Number(network.chainId) });
      }
      const response = await fetch('/api/payments/intents', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamer_id, chain: network.chainId, sender, amount }), signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('Payment intent unavailable');
      const intent: Intent = await response.json();
      const pending: Submitted = { hash: '', network, gross: amount, intent };
      // Persist BEFORE opening the signing prompt. Discovery can find a payment
      // carrying this memo/reference even if the wallet broadcasts after close.
      sessionStorage.setItem(`livecrypto:payment:${streamer_id}`, JSON.stringify(pending));
      setSubmitted(pending);
      const intentRaw = parseUnits(intent.amount, decimals);
      const intentFee = intentRaw * BigInt(intent.feeBps) / 10000n;
      if (network.chainId.startsWith('solana')) {
        const wallet = solWallet;
        if (!wallet) throw new Error('Conecte uma carteira Solana compatível, como Phantom.');
        if (raw > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Valor acima do limite seguro deste checkout.');
        if (!network.treasury) throw new Error('Tesouraria indisponível.');
        const connection = new Connection(network.testnet ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com', 'confirmed');
        const { blockhash } = await connection.getLatestBlockhash();
        const tx = new Transaction({ recentBlockhash: blockhash, feePayer: wallet.publicKey });
        if (intentFee > 0n) tx.add(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: new PublicKey(intent.treasury), lamports: Number(intentFee) }));
        const transfer = SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: new PublicKey(intent.recipient), lamports: Number(intentRaw - intentFee) });
        if (!intent.reference) throw new Error('Missing payment reference');
        transfer.keys.push({ pubkey: new PublicKey(intent.reference), isSigner: false, isWritable: false });
        tx.add(transfer);
        tx.add(new TransactionInstruction({ programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), keys: [], data: Buffer.from(intent.memo, 'utf8') }));
        hash = (await wallet.signAndSendTransaction(tx)).signature;
      } else {
        const target = Number(network.chainId);
        if (!network.router) throw new Error('Contrato indisponível nesta rede.');
        hash = await sendTransactionAsync({ chainId: target, account: address, to: intent.router as `0x${string}`, value: intentRaw,
          data: encodeFunctionData({ abi: routerAbi, functionName: 'donateNativeWithMemo', args: [intent.recipient, intent.memo] }) });
      }
      const payment: Submitted = { hash, network, gross: amount, intent };
      setSubmitted(payment);
      // Retain the submitted hash across reloads; never silently create a new payment.
      try { sessionStorage.setItem(`livecrypto:payment:${streamer_id}`, JSON.stringify(payment)); } catch { /* Keep the in-memory hash if storage is disabled. */ }
      await verify(payment);
    } catch (err) {
      console.error('Wallet submission failed:', err);
      setError(p.failure);
      setState('error');
    } finally { busy.current = false; }
  }

  const explorer = submitted ? `${submitted.network.explorer}${encodeURIComponent(submitted.hash)}${submitted.network.chainId === 'solana-devnet' ? '?cluster=devnet' : ''}` : '';
  return (
    <main className="checkout-shell">
      <header className="product-toolbar"><Brand href={path()} label={`LiveCrypto · ${c.home}`} /><LanguageSwitcher /></header>
      <section className="product-panel checkout-panel" aria-labelledby="checkout-title">
        <p className="eyebrow">{p.creator.replace('{id}', streamer_id)}</p>
        <h1 id="checkout-title">{p.title}</h1>
        <p className="muted">{p.intro}</p>
        {loading && <p role="status">{c.loading}</p>}
        {config && !config.enabled && <p className="notice">{p.preview}</p>}
        <label className="field-label" htmlFor="network">{p.network}</label>
        <select id="network" className="glass-input field-control" value={networkId} disabled={!!submitted || state === 'signing'} onChange={e => setNetworkId(e.target.value)}>
          {config?.networks.map(n => <option value={n.chainId} key={n.chainId}>{n.name} · {n.currency}{!n.enabled ? ` · ${c.unavailable}` : ''}</option>)}
        </select>
        {network?.testnet && <p className="field-hint">{p.testnet}</p>}
        <label className="field-label" htmlFor="amount">{p.amount} {network?.currency}</label>
        <input id="amount" className="glass-input field-control" inputMode="decimal" value={amount} disabled={!!submitted || state === 'signing'} onChange={e => setAmount(e.target.value.replace(',', '.'))} autoComplete="off" aria-describedby="decimal-hint" />
        <p id="decimal-hint" className="field-hint">{p.decimalHint}</p>
        <dl className="fee-breakdown">
          <div><dt>{p.fee} ({number((config?.feeBps || 0) / 100)}%)</dt><dd>{decimal(formatUnits(fee, decimals))} {network?.currency}</dd></div>
          <div><dt>{p.receives}</dt><dd>{decimal(formatUnits(raw - fee, decimals))} {network?.currency}</dd></div>
          <div><dt>{p.gas}</dt><dd>{p.gasHint}</dd></div>
        </dl>
        <p className="field-hint">{p.destination}: <bdi dir="ltr" className="break-all">{recipient || p.missingWallet}</bdi></p>
        {!submitted && <button className="brand-button primary full-width" disabled={!canPay} onClick={() => void donate()}>{state === 'signing' ? p.signing : p.review}</button>}
        {submitted && <div className="notice" role="status">
          <strong>{state === 'confirmed' ? p.confirmed : submitted.hash ? p.pending : p.intentCreated}</strong>
          {state === 'confirmed' && netReceived && <p>{p.received}: {decimal(netReceived)} {submitted.network.currency}</p>}
          <p>{state === 'confirmed' ? p.queued : p.wait}</p>
          {submitted.hash && <a href={explorer} target="_blank" rel="noreferrer">{p.explorer} ↗</a>}
          {!submitted.hash && <p>{p.intentWaiting}</p>}
          {submitted.intent && <p className="break-all">ID: {submitted.intent.id}</p>}
          {state !== 'confirmed' && submitted.hash && <button className="brand-button secondary" onClick={() => void verify(submitted)}>{p.verify}</button>}
          {(state === 'confirmed' || expired) && <button className="brand-button secondary" onClick={() => { sessionStorage.removeItem(`livecrypto:payment:${streamer_id}`); setSubmitted(null); setExpired(false); setState('idle'); }}>{p.another}</button>}
        </div>}
        {error && <p className="error-notice" role="alert">{error}</p>}
        <p className="field-hint">{p.unsupported}</p>
      </section>
      <div className="checkout-security"><SecurityGuide /></div>
      <p className="field-hint">{c.privateKeys}</p>
    </main>
  );
}
