"use client";

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import { parseEther, parseUnits, type Address } from 'viem';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import Link from 'next/link';
import ROUTER_ABI from '@/abi/LiveCryptoRouter.json';

// Supported ERC-20 tokens per chain
const ERC20_TOKENS: Record<string, { symbol: string; decimals: number; address: Address }[]> = {
  '137': [
    { symbol: 'USDT', decimals: 6, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
    { symbol: 'USDC', decimals: 6, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' },
    { symbol: 'DAI', decimals: 18, address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' },
  ],
  '1': [
    { symbol: 'USDT', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { symbol: 'USDC', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { symbol: 'DAI', decimals: 18, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  ],
  '8453': [
    { symbol: 'USDC', decimals: 6, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  ],
  '42161': [
    { symbol: 'USDT', decimals: 6, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
    { symbol: 'USDC', decimals: 6, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
    { symbol: 'DAI', decimals: 18, address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' },
  ],
  '56': [
    { symbol: 'USDT', decimals: 18, address: '0x55d398326f99059fF775485246999027B3197955' },
    { symbol: 'USDC', decimals: 18, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
  ],
};

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  }
] as const;

const ROUTER_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

export default function PayStreamerPage({ params }: { params: Promise<{ streamer_id: string }> }) {
  const { streamer_id } = use(params);
  
  // Dual-Mode State
  const [mode, setMode] = useState<'WEB3' | 'MANUAL'>('WEB3');
  const [amount, setAmount] = useState('0.5');
  const [message, setMessage] = useState('');
  const [paymentType, setPaymentType] = useState<'SOL' | 'POLYGON' | 'USDT' | 'USDC' | 'ETH'>('SOL');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  // Streamer details
  const [streamerAddress, setStreamerAddress] = useState<string>('0x0000000000000000000000000000000000000000');
  const [streamerWallets, setStreamerWallets] = useState<{ chain_id: string; public_address: string }[]>([]);
  const [alertConfig, setAlertConfig] = useState<any>(null);

  // AppKit / Web3 Hooks
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('solana');
  const { open } = useAppKit();

  // EVM specific write hooks
  const { data: hash, writeContract, isPending: isSigning } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Solana donation state
  const [isSolanaSending, setIsSolanaSending] = useState(false);
  const [solanaSuccess, setSolanaSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    setIsLoadingConfig(true);
    fetch(`http://localhost:8080/api/public/streamer/${streamer_id}`)
      .then(res => {
        if (!res.ok) throw new Error("Streamer not found");
        return res.json();
      })
      .then(data => {
        setStreamerAddress(data.public_address);
        setStreamerWallets(data.wallets || []);
        setAlertConfig(data.alertConfig || null);
        setIsLoadingConfig(false);
      })
      .catch(() => {
        // Fallback demo addresses
        setStreamerAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
        setStreamerWallets([
          { chain_id: 'solana', public_address: '8x3sK2vPz1Lm9NxQa7Rt5Wb4Ey2Cg1Vj6F3aQ' },
          { chain_id: '137', public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' }
        ]);
        setIsLoadingConfig(false);
      });
  }, [streamer_id]);

  // Determine current active recipient address
  const getActiveRecipient = () => {
    if (paymentType === 'SOL') {
      const sol = streamerWallets.find(w => w.chain_id === 'solana');
      return sol ? sol.public_address : '8x3sK2vPz1Lm9NxQa7Rt5Wb4Ey2Cg1Vj6F3aQ';
    }
    const evm = streamerWallets.find(w => w.chain_id === '137' || w.chain_id === '8453' || w.chain_id === '1');
    return evm ? evm.public_address : streamerAddress;
  };

  // Handle Solana Transfer
  const handleSolanaDonation = async () => {
    const recipient = getActiveRecipient();
    try {
      setIsSolanaSending(true);

      // In browser with Solana Provider (Phantom / Solflare)
      const solana = (window as any).solana;
      if (!solana || !solana.isPhantom) {
        alert('Por favor conecte sua carteira Phantom ou use o modo QR Code!');
        setIsSolanaSending(false);
        return;
      }

      const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const fromPubkey = new PublicKey(solana.publicKey.toString());
      const toPubkey = new PublicKey(recipient);

      const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      const signed = await solana.signAndSendTransaction(transaction);
      console.log('Solana Tx sent:', signed.signature);

      // Notify backend to trigger OBS alert
      await fetch('http://localhost:8080/api/webhooks/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_hash: signed.signature,
          streamer_id: parseInt(streamer_id),
          sender_address: solana.publicKey.toString(),
          amount: parseFloat(amount),
          currency: 'SOL',
          message: message
        })
      });

      setIsSolanaSending(false);
      setSolanaSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(`Falha no envio da doação Solana: ${err.message || 'Erro'}`);
      setIsSolanaSending(false);
    }
  };

  // Handle EVM Native Transfer
  const handleEvmNativeDonation = async () => {
    const recipient = getActiveRecipient() as Address;
    try {
      writeContract({
        address: ROUTER_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' ? ROUTER_CONTRACT_ADDRESS : recipient,
        abi: ROUTER_ABI,
        functionName: 'donateNative',
        args: [recipient],
        value: parseEther(amount),
      }, {
        onSuccess: async (txHash) => {
          await fetch('http://localhost:8080/api/webhooks/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tx_hash: txHash,
              streamer_id: parseInt(streamer_id),
              sender_address: address || '0xDonor',
              amount: parseFloat(amount),
              currency: paymentType,
              message: message
            })
          });
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(getActiveRecipient());
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none"></div>

      {/* Top Brand Header */}
      <div className="max-w-md w-full mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/30">
            <Image src="/brand/logo-png.png" alt="Logo" width={28} height={28} className="object-contain" />
          </div>
          <span className="font-bold text-xs tracking-wider text-white">LIVE CRYPTO</span>
        </Link>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
          ● DIRETO EM CARTEIRA
        </span>
      </div>

      {/* Main Donation Gateway Card */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full border border-white/10 relative z-10 shadow-2xl backdrop-blur-xl">
        
        {/* Streamer Header */}
        <div className="text-center pb-6 border-b border-white/10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 mx-auto mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center text-xl font-bold text-cyan-400">
              ⚡
            </div>
          </div>
          <h1 className="text-lg font-bold text-white uppercase tracking-wider">
            Doar para Streamer #{streamer_id}
          </h1>
          <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
            {streamerAddress}
          </div>

          {/* Goal Bar if configured */}
          {alertConfig && (
            <div className="mt-4 p-3 bg-zinc-950/60 rounded-xl border border-white/5">
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-slate-300 font-bold">🎯 {alertConfig.goal_title || 'Meta do Streamer'}</span>
                <span className="text-cyan-400 font-bold">${parseFloat(alertConfig.goal_current || 0).toFixed(2)} / ${parseFloat(alertConfig.goal_amount || 100).toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                  style={{ width: `${Math.min(100, (parseFloat(alertConfig.goal_current || 0) / (parseFloat(alertConfig.goal_amount || 100))) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Dual Mode Switch (Web3 1-Click vs Manual QR Code) */}
        <div className="grid grid-cols-2 gap-2 mt-6 p-1 bg-zinc-950/80 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setMode('WEB3')}
            className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${mode === 'WEB3' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            ⚡ 1-Click Web3
          </button>
          <button
            onClick={() => setMode('MANUAL')}
            className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${mode === 'MANUAL' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            📱 QR Code (CEX)
          </button>
        </div>

        {/* Token Selection */}
        <div className="mt-5 space-y-2">
          <label className="block text-xs font-mono text-slate-400 uppercase">Escolha a Moeda / Rede:</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs font-mono">
            {(['SOL', 'POLYGON', 'USDT', 'USDC', 'ETH'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPaymentType(t)}
                className={`py-2 px-1 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                  paymentType === t ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-white/10 text-slate-400 hover:text-white bg-zinc-900/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Amount & Custom Message */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">Quantidade ({paymentType}):</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full glass-input px-3 py-2.5 rounded-xl text-sm font-mono font-bold"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-cyan-400 font-bold">
                {paymentType}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">Mensagem na Live (TTS):</label>
            <textarea 
              rows={2}
              maxLength={200}
              placeholder="Digite sua mensagem que será lida na transmissão..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full glass-input p-3 rounded-xl text-xs font-mono resize-none"
            />
            <div className="text-[10px] text-right text-slate-500 font-mono">{message.length}/200 caracteres</div>
          </div>
        </div>

        {/* Mode 1: Web3 1-Click Pay */}
        {mode === 'WEB3' && (
          <div className="mt-6 space-y-3">
            {paymentType === 'SOL' ? (
              <button
                onClick={handleSolanaDonation}
                disabled={isSolanaSending}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-black font-bold text-sm tracking-wider uppercase rounded-xl hover:opacity-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSolanaSending ? '⏳ PROCESSANDO SOLANA...' : 
                 solanaSuccess ? '✅ DOAÇÃO ENVIADA COM SUCESSO!' : 
                 `⚡ ENVIAR ${amount} SOL VIA PHANTOM`}
              </button>
            ) : !isConnected ? (
              <button
                onClick={() => open()}
                className="w-full py-4 bg-cyan-500 text-black font-bold text-sm tracking-wider uppercase rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                CONECTAR CARTEIRA WEB3
              </button>
            ) : (
              <button
                onClick={handleEvmNativeDonation}
                disabled={isSigning || isConfirming}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm tracking-wider uppercase rounded-xl hover:opacity-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50"
              >
                {isSigning ? '🖊️ CONFIRME NA SUA CARTEIRA...' :
                 isConfirming ? '⏳ AGUARDANDO CONFIRMAÇÃO DO BLOCO...' :
                 isConfirmed ? '✅ DOAÇÃO CONFIRMADA!' :
                 `⚡ ENVIAR ${amount} ${paymentType}`}
              </button>
            )}
          </div>
        )}

        {/* Mode 2: Manual QR Code Transfer */}
        {mode === 'MANUAL' && (
          <div className="mt-6 p-4 rounded-xl bg-black/80 border border-white/10 text-center space-y-4">
            <div className="bg-white p-3 rounded-xl inline-block shadow-lg">
              <QRCodeSVG 
                value={getActiveRecipient()} 
                size={160} 
                level="H" 
              />
            </div>

            <div className="text-xs font-mono text-slate-300">
              <div className="text-[10px] text-slate-400 uppercase">Endereço de Recebimento ({paymentType}):</div>
              <div className="p-2 bg-zinc-900 rounded-lg border border-white/10 truncate font-bold text-cyan-400 text-[11px] mt-1 select-all">
                {getActiveRecipient()}
              </div>
            </div>

            <button
              onClick={copyAddress}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer"
            >
              {copiedAddress ? '✅ ENDEREÇO COPIADO!' : '📋 COPIAR ENDEREÇO'}
            </button>
          </div>
        )}

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-slate-500 font-mono">
          🔒 Transação 100% direta P2P na blockchain sem intermediários.
        </div>
      </div>
    </div>
  );
}
