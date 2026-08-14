"use client";

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { SiweMessage } from 'siwe';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<'' | 'fetching_nonce' | 'signing' | 'verifying' | 'success' | 'error'>('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    if (!isConnected || !address) {
      return open();
    }

    try {
      setStatus('fetching_nonce');
      setErrorMsg('');

      // 1. Get nonce from backend
      const nonceRes = await fetch('http://localhost:8080/api/auth/nonce');
      if (!nonceRes.ok) throw new Error('Falha ao obter nonce criptográfico do servidor.');
      const nonce = await nonceRes.text();

      setStatus('signing');

      // 2. Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Autenticação segura no Live Crypto — Gateway Descentralizado de Streamers.',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce,
      });

      const preparedMessage = message.prepareMessage();

      // 3. Sign message with wallet
      const signature = await signMessageAsync({ message: preparedMessage });

      setStatus('verifying');

      // 4. Verify signature with backend
      const verifyRes = await fetch('http://localhost:8080/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: preparedMessage, signature }),
      });

      if (!verifyRes.ok) throw new Error('A assinatura não pôde ser verificada pelo backend.');

      const data = await verifyRes.json();
      
      // Store token in localStorage
      localStorage.setItem('jwt', data.token);
      
      setStatus('success');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Ocorreu um erro durante o login.');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none"></div>

      {/* Back to Home Link */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors z-20"
      >
        <span>← VOLTAR PARA O INÍCIO</span>
      </Link>

      {/* Login Card */}
      <div className="glass-card p-8 sm:p-10 rounded-2xl max-w-md w-full border border-white/10 relative z-10 shadow-2xl backdrop-blur-xl">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.4)] border border-cyan-500/30 bg-zinc-900 flex items-center justify-center p-2 mb-4">
            <Image 
              src="/brand/logo-png.png" 
              alt="Live Crypto Logo" 
              width={64} 
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            PAINEL DO CRIADOR <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono border border-cyan-500/30">SIWE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Conecte sua carteira para gerenciar alertas, metas e carteiras de recebimento.
          </p>
        </div>

        {/* Action Buttons & State Machine */}
        <div className="space-y-4">
          {!isConnected ? (
            <button 
              onClick={() => open()}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-black font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ Conectar Carteira (EVM / Solana)</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Carteira Conectada:</div>
                <div className="font-mono text-cyan-400 text-xs truncate mt-0.5 font-bold">
                  {address}
                </div>
              </div>
              
              <button 
                onClick={handleSignIn}
                disabled={status !== '' && status !== 'error'}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-400 text-black hover:opacity-90 transition-all font-bold text-sm tracking-wider uppercase rounded-xl disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                {status === '' ? '✍️ ASSINAR & ENTRAR NO PAINEL' : 
                 status === 'fetching_nonce' ? '⏳ GERANDO NONCE CRIPTOGRÁFICO...' :
                 status === 'signing' ? '🖊️ AGUARDANDO ASSINATURA NA CARTEIRA...' :
                 status === 'verifying' ? '🔍 VERIFICANDO ASSINATURA...' :
                 status === 'success' ? '✅ AUTENTICADO COM SUCESSO!' : '🔄 TENTAR NOVAMENTE'}
              </button>

              <button
                onClick={() => open()}
                className="w-full py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                Trocar de Carteira
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono text-center">
              ⚠️ ERRO: {errorMsg}
            </div>
          )}
        </div>

        {/* Security Feature Notice */}
        <div className="mt-8 pt-6 border-t border-white/5 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-2 text-center">
          <span>🔒 100% Non-Custodial. Suas chaves privadas nunca saem do seu dispositivo.</span>
        </div>
      </div>
    </div>
  );
}
