"use client";

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { SiweMessage } from 'siwe';
import Image from 'next/image';
import Link from 'next/link';

type SolanaProvider = {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (message: Uint8Array, encoding: 'utf8') => Promise<{ signature: Uint8Array }>;
};

export default function LoginPage() {
  const [authTab, setAuthTab] = useState<'EVM' | 'SOLANA'>('EVM');
  
  // EVM Hooks
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  
  // Solana State
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);

  // Status Machine
  const [status, setStatus] = useState<'' | 'fetching_nonce' | 'signing' | 'verifying' | 'success' | 'error'>('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Handle EVM SIWE Sign In
  const handleEvmSignIn = async () => {
    if (!isEvmConnected || !evmAddress) {
      return open();
    }

    try {
      setStatus('fetching_nonce');
      setErrorMsg('');

      // 1. Get cryptographic nonce from backend
      const nonceRes = await fetch('/api/auth/nonce');
      if (!nonceRes.ok) throw new Error('Failed to obtain cryptographic nonce from server.');
      const nonce = await nonceRes.text();

      setStatus('signing');

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: evmAddress,
        statement: 'Secure authentication to Live Crypto — Non-Custodial Streamer Gateway.',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce,
      });

      const preparedMessage = message.prepareMessage();

      // 3. Sign message with Web3 wallet
      const signature = await signMessageAsync({ message: preparedMessage });

      setStatus('verifying');

      // 4. Verify signature on backend
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: preparedMessage, signature }),
      });

      if (!verifyRes.ok) throw new Error('Signature could not be verified by backend.');

      const data = await verifyRes.json() as { token: string };
      localStorage.setItem('jwt', data.token);
      setStatus('success');
      window.location.href = '/dashboard';

    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during Web3 authentication.');
    }
  };

  // 2. Handle Native Solana (Phantom) Sign In
  const handleSolanaSignIn = async () => {
    try {
      const win = window as typeof window & { phantom?: { solana?: SolanaProvider }; solana?: SolanaProvider };
      const solanaProvider = win.phantom?.solana || win.solana;

      if (!solanaProvider) {
        setErrorMsg('Phantom or Solana wallet extension not detected in your browser.');
        setStatus('error');
        return;
      }

      setStatus('fetching_nonce');
      setErrorMsg('');

      const connectResp = await solanaProvider.connect();
      const pubkey = connectResp.publicKey.toString();
      setSolanaAddress(pubkey);

      const nonceRes = await fetch('/api/auth/nonce');
      if (!nonceRes.ok) throw new Error('Failed to obtain nonce');
      const nonce = await nonceRes.text();

      setStatus('signing');

      const statement = `Sign in to Live Crypto Creator Portal\nOrigin: ${window.location.origin}\nPublic Key: ${pubkey}\nNonce: ${nonce}`;
      const encoded = new TextEncoder().encode(statement);
      const signedMessage = await solanaProvider.signMessage(encoded, 'utf8');

      setStatus('verifying');

      const hexSignature = Array.from(signedMessage.signature as Uint8Array)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'solana',
          publicKey: pubkey,
          message: statement,
          signature: hexSignature,
          nonce
        }),
      });

      if (!verifyRes.ok) throw new Error('Failed to verify Solana cryptographic signature');

      const data = await verifyRes.json() as { token: string };
      localStorage.setItem('jwt', data.token);
      setStatus('success');
      window.location.href = '/dashboard';

    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during Solana login.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Ambient glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none"></div>

      {/* Back to Home Link */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors z-20"
      >
        <span>← BACK TO HOMEPAGE</span>
      </Link>

      {/* Login Card */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md w-full border border-white/10 relative z-10 shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
        
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,242,254,0.35)] border border-cyan-400/30 bg-zinc-950 flex items-center justify-center p-2 mb-4">
            <Image 
              src="/brand/logo-png.png" 
              alt="Live Crypto Logo" 
              width={64} 
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 font-sans">
            CREATOR PORTAL <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">WEB3</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Connect your Web3 wallet to manage OBS overlays, multi-chain payouts, and live goals.
          </p>
        </div>

        {/* Dual Wallet Tab Switcher */}
        <div className="mb-6 p-1 rounded-2xl bg-black/80 border border-white/10 flex">
          <button
            type="button"
            onClick={() => { setAuthTab('EVM'); setStatus(''); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              authTab === 'EVM'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔷 EVM (MetaMask)
          </button>
          <button
            type="button"
            onClick={() => { setAuthTab('SOLANA'); setStatus(''); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              authTab === 'SOLANA'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ☀️ Solana (Phantom)
          </button>
        </div>

        {/* Action Buttons & State Machine */}
        <div className="space-y-4">
          {authTab === 'EVM' ? (
            !isEvmConnected ? (
              <button 
                onClick={() => open()}
                className="w-full glass-btn-primary py-4 text-xs font-mono uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <span>⚡ Connect EVM Wallet (MetaMask / Rabby)</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-black/80 border border-white/10 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Connected Address:</div>
                  <div className="font-mono text-cyan-300 text-xs truncate mt-0.5 font-bold">
                    {evmAddress}
                  </div>
                </div>
                
                <button 
                  onClick={handleEvmSignIn}
                  disabled={status !== '' && status !== 'error'}
                  className="w-full glass-btn-primary py-4 text-xs font-mono uppercase tracking-wider rounded-2xl disabled:opacity-50 cursor-pointer font-bold"
                >
                  {status === '' ? '✍️ SIGN IN WITH ETHEREUM (SIWE)' : 
                   status === 'fetching_nonce' ? '⏳ GENERATING NONCE...' :
                   status === 'signing' ? '🖊️ AWAITING WALLET SIGNATURE...' :
                   status === 'verifying' ? '🔍 VERIFYING SIGNATURE...' :
                   status === 'success' ? '✅ AUTHENTICATED SUCCESSFULLY!' : '🔄 RETRY LOGIN'}
                </button>

                <button
                  onClick={() => open()}
                  className="w-full py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Switch Connected Wallet
                </button>
              </div>
            )
          ) : (
            /* Solana Tab */
            <div className="space-y-4">
              {solanaAddress && (
                <div className="p-3.5 rounded-2xl bg-black/80 border border-white/10 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Solana Wallet:</div>
                  <div className="font-mono text-purple-300 text-xs truncate mt-0.5 font-bold">
                    {solanaAddress}
                  </div>
                </div>
              )}

              <button 
                onClick={handleSolanaSignIn}
                disabled={status !== '' && status !== 'error'}
                className="w-full glass-btn-accent py-4 text-xs font-mono uppercase tracking-wider rounded-2xl disabled:opacity-50 cursor-pointer font-bold flex items-center justify-center gap-2"
              >
                <span>
                  {status === '' ? '☀️ SIGN IN WITH PHANTOM (SOLANA)' : 
                   status === 'fetching_nonce' ? '⏳ GENERATING NONCE...' :
                   status === 'signing' ? '🖊️ AWAITING PHANTOM SIGNATURE...' :
                   status === 'verifying' ? '🔍 VERIFYING SIGNATURE...' :
                   status === 'success' ? '✅ AUTHENTICATED SUCCESSFULLY!' : '🔄 RETRY LOGIN'}
                </span>
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono text-center">
              ⚠️ ERROR: {errorMsg}
            </div>
          )}
        </div>

        {/* Security Feature Notice */}
        <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-2 text-center">
          <span>🔒 100% Non-Custodial. Your private keys never leave your device.</span>
        </div>
      </div>
    </div>
  );
}
