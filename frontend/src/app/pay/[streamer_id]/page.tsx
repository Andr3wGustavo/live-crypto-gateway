"use client";

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import routerAbi from '@/abi/LiveCryptoRouter.json';

type Network = { chainId: string; name: string; currency: string; testnet: boolean; enabled: boolean; router?: string; treasury?: string; explorer: string };
type Config = { enabled: boolean; feeBps: number; networks: Network[] };
type Wallet = { chain_id: string; public_address: string };
type Submitted = { hash: string; network: Network; gross: string };
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
  const { streamer_id } = use(params);
  const [config, setConfig] = useState<Config | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [networkId, setNetworkId] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [state, setState] = useState<State>(() => loadSubmittedPayment(streamer_id) ? 'pending' : 'idle');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<Submitted | null>(() => loadSubmittedPayment(streamer_id));
  const [netReceived, setNetReceived] = useState('');
  const [loading, setLoading] = useState(true);
  const busy = useRef(false);
  const { address, chainId, isConnected } = useAccount();
  const { open } = useAppKit();
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
        if (!settings.ok || !profile.ok) throw new Error('Não foi possível carregar este criador. Nenhum endereço alternativo será usado.');
        const data: Config = await settings.json();
        const creator: { wallets: Wallet[] } = await profile.json();
        setConfig(data);
        setWallets(creator.wallets);
        setNetworkId(data.networks.find(n => n.enabled && creator.wallets.some(w => w.chain_id === n.chainId))?.chainId || data.networks[0]?.chainId || '');
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Falha ao carregar checkout.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [streamer_id]);

  const network = config?.networks.find(n => n.chainId === networkId);
  const recipient = wallets.find(w => w.chain_id === networkId)?.public_address;
  const decimals = networkId.startsWith('solana') ? 9 : 18;
  let raw = 0n;
  try {
    if (/^\d+(\.\d+)?$/.test(amount) && (amount.split('.')[1]?.length || 0) <= decimals) raw = parseUnits(amount, decimals);
  } catch { /* Invalid values cannot be submitted. */ }
  const fee = raw * BigInt(config?.feeBps || 0) / 10000n;
  const canPay = !loading && network?.enabled && recipient && raw > 0n && !submitted && state !== 'signing';

  async function verify(payment: Submitted) {
    setState('pending');
    setError('');
    try {
      const response = await fetch('/api/webhooks/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamer_id, tx_hash: payment.hash, chain: payment.network.chainId }),
        signal: AbortSignal.timeout(20000)
      });
      const result = await response.json();
      if (response.status === 202) return;
      if (response.status === 409 && result.verified) { setState('confirmed'); return; }
      if (!response.ok || !result.verified) throw new Error(result.error || 'Confirmação indisponível.');
      setNetReceived(result.transaction.amount);
      setState('confirmed');
    } catch (err) {
      setState('pending');
      setError(`${err instanceof Error ? err.message : 'Falha de conexão.'} O envio já foi feito; consulte o mesmo hash antes de qualquer nova doação.`);
    }
  }

  async function donate() {
    if (!canPay || !network || !recipient || !config || busy.current) return;
    busy.current = true;
    setError('');
    setState('signing');
    try {
      let hash: string;
      if (network.chainId.startsWith('solana')) {
        const browser = window as unknown as { phantom?: { solana?: SolanaWallet }; solana?: SolanaWallet };
        const wallet = browser.phantom?.solana || browser.solana;
        if (!wallet) throw new Error('Conecte uma carteira Solana compatível, como Phantom.');
        if (raw > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Valor acima do limite seguro deste checkout.');
        if (!network.treasury) throw new Error('Tesouraria indisponível.');
        await wallet.connect();
        const connection = new Connection(network.testnet ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com', 'confirmed');
        const { blockhash } = await connection.getLatestBlockhash();
        const tx = new Transaction({ recentBlockhash: blockhash, feePayer: wallet.publicKey });
        if (fee > 0n) tx.add(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: new PublicKey(network.treasury), lamports: Number(fee) }));
        tx.add(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: new PublicKey(recipient), lamports: Number(raw - fee) }));
        hash = (await wallet.signAndSendTransaction(tx)).signature;
      } else {
        if (!isConnected || !address) { await open(); setState('idle'); return; }
        const target = Number(network.chainId);
        if (chainId !== target) await switchChainAsync({ chainId: target });
        if (!network.router) throw new Error('Contrato indisponível nesta rede.');
        hash = await sendTransactionAsync({ chainId: target, to: network.router as `0x${string}`, value: raw,
          data: encodeFunctionData({ abi: routerAbi, functionName: 'donateNative', args: [recipient] }) });
      }
      const payment = { hash, network, gross: amount };
      setSubmitted(payment);
      // Retain the submitted hash across reloads; never silently create a new payment.
      try { sessionStorage.setItem(`livecrypto:payment:${streamer_id}`, JSON.stringify(payment)); } catch { /* Keep the in-memory hash if storage is disabled. */ }
      await verify(payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A carteira não concluiu o envio.');
      setState('error');
    } finally { busy.current = false; }
  }

  const explorer = submitted ? `${submitted.network.explorer}${encodeURIComponent(submitted.hash)}${submitted.network.chainId === 'solana-devnet' ? '?cluster=devnet' : ''}` : '';
  return (
    <main className="checkout-shell">
      <Link href="/" className="brand-wordmark">LIVE<span>CRYPTO</span><span className="brand-dot" /></Link>
      <section className="product-panel checkout-panel" aria-labelledby="checkout-title">
        <p className="eyebrow">APOIO DIRETO / CRIADOR #{streamer_id}</p>
        <h1 id="checkout-title">Faça parte<br />da próxima live.</h1>
        <p className="muted">Da sua carteira para a carteira do criador. Revise a rede, o destino e a taxa antes de assinar.</p>
        {loading && <p role="status">Carregando configurações verificadas…</p>}
        {config && !config.enabled && <p className="notice">Ambiente de prévia. Pagamentos reais estão desativados.</p>}
        <label className="field-label" htmlFor="network">Rede e ativo</label>
        <select id="network" className="glass-input field-control" value={networkId} disabled={!!submitted || state === 'signing'} onChange={e => setNetworkId(e.target.value)}>
          {config?.networks.map(n => <option value={n.chainId} key={n.chainId}>{n.name} · {n.currency}{!n.enabled ? ' · indisponível' : ''}</option>)}
        </select>
        {network?.testnet && <p className="field-hint">Testnet: use apenas tokens de teste sem valor financeiro.</p>}
        <label className="field-label" htmlFor="amount">Valor em {network?.currency || 'cripto'}</label>
        <input id="amount" className="glass-input field-control" inputMode="decimal" value={amount} disabled={!!submitted || state === 'signing'} onChange={e => setAmount(e.target.value)} autoComplete="off" />
        <dl className="fee-breakdown">
          <div><dt>Taxa da plataforma ({(config?.feeBps || 0) / 100}%)</dt><dd>{formatUnits(fee, decimals)} {network?.currency}</dd></div>
          <div><dt>O criador recebe</dt><dd>{formatUnits(raw - fee, decimals)} {network?.currency}</dd></div>
          <div><dt>Taxa da rede</dt><dd>Adicional · exibida na carteira</dd></div>
        </dl>
        <p className="field-hint break-all">Destino: {recipient || 'Este criador ainda não cadastrou uma carteira para esta rede.'}</p>
        {!submitted && <button className="brand-button primary full-width" disabled={!canPay} onClick={() => void donate()}>{state === 'signing' ? 'Aguardando carteira…' : 'Revisar na carteira ↗'}</button>}
        {submitted && <div className="notice" role="status">
          <strong>{state === 'confirmed' ? 'Doação registrada' : 'Transação enviada · confirmação pendente'}</strong>
          <p>{state === 'confirmed' ? `${netReceived ? `${netReceived} ${submitted.network.currency} recebidos. ` : ''}O alerta foi enfileirado para publicação; a exibição depende do OBS conectado.` : 'O tempo depende da rede. Verificar novamente não envia outra transação.'}</p>
          <a href={explorer} target="_blank" rel="noreferrer">Consultar transação ↗</a>
          {state !== 'confirmed' && <button className="brand-button secondary" onClick={() => void verify(submitted)}>Verificar o mesmo hash</button>}
          {state === 'confirmed' && <button className="brand-button secondary" onClick={() => { sessionStorage.removeItem(`livecrypto:payment:${streamer_id}`); setSubmitted(null); setState('idle'); }}>Nova doação</button>}
        </div>}
        {error && <p className="error-notice" role="alert">{error}</p>}
        <p className="field-hint">Tokens ERC-20/SPL, Bitcoin, Lightning, Sui, Pix e cartões estão no roadmap. Só redes habilitadas podem ser usadas aqui.</p>
      </section>
      <p className="field-hint">Sua chave privada permanece na sua carteira.</p>
    </main>
  );
}
