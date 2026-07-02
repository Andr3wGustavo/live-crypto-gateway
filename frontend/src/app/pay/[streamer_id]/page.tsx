"use client";

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { parseEther } from 'viem';
import { QRCodeSVG } from 'qrcode.react';

export default function PayStreamerPage({ params }: { params: Promise<{ streamer_id: string }> }) {
  const { streamer_id } = use(params);
  
  // Dual-Mode State
  const [mode, setMode] = useState<'WEB3' | 'MANUAL'>('WEB3');
  const [amount, setAmount] = useState('5.0');
  const [message, setMessage] = useState('');
  
  // Mock fetching streamer details
  const streamerAddress = '0x1234567890123456789012345678901234567890'; // Mock address

  // Mode A: Web3 Native
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const { data: hash, sendTransaction, isPending: isSigning } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleWeb3Donate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return open();
    
    // Using a simple native transfer for now, 
    // In production, this would call the LiveCryptoRouter contract's donateNative method
    sendTransaction({
      to: streamerAddress,
      value: parseEther(amount),
    });
  };

  // Mode B: Manual Send Long-Polling
  const [manualStatus, setManualStatus] = useState<'WAITING' | 'DETECTED'>('WAITING');
  useEffect(() => {
    if (mode === 'MANUAL') {
      // Mock long-polling the mempool/backend for the transaction
      const timer = setTimeout(() => {
        setManualStatus('DETECTED');
      }, 10000); // Fakes detection after 10s
      return () => clearTimeout(timer);
    }
  }, [mode]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-primary shadow-[0_0_15px_rgba(0,255,0,0.15)] bg-black">
        
        <header className="text-center p-6 border-b border-primary">
          <h1 className="text-2xl font-bold tracking-wider">LIVE CRYPTO DAPP</h1>
          <p className="mt-2 text-sm opacity-80">Donating to Streamer ID: <span className="font-bold">{streamer_id}</span></p>
        </header>

        {/* Dual-Mode Tabs */}
        <div className="flex border-b border-primary">
          <button 
            className={`flex-1 py-3 font-bold uppercase tracking-wider text-sm ${mode === 'WEB3' ? 'bg-primary text-black' : 'hover:bg-primary/10 text-primary'}`}
            onClick={() => setMode('WEB3')}
          >
            Web3 Native
          </button>
          <button 
            className={`flex-1 py-3 font-bold uppercase tracking-wider text-sm border-l border-primary ${mode === 'MANUAL' ? 'bg-primary text-black' : 'hover:bg-primary/10 text-primary'}`}
            onClick={() => setMode('MANUAL')}
          >
            CEX / Manual
          </button>
        </div>

        <div className="p-6">
          {mode === 'WEB3' ? (
            // MODE A: Web3 Native (Wagmi + Web3Modal)
            isConfirmed ? (
              <div className="text-center py-8">
                <h2 className="text-3xl mb-4 animate-pulse">TX SUCCESSFUL</h2>
                <p className="opacity-80 break-all font-mono text-xs mb-4">Hash: {hash}</p>
                <button 
                  onClick={() => { setAmount('5.0'); setMessage(''); }}
                  className="mt-4 px-6 py-2 border border-primary hover:bg-primary/10 uppercase font-bold text-sm"
                >
                  [ NEW DONATION ]
                </button>
              </div>
            ) : (
              <form onSubmit={handleWeb3Donate} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase mb-2 opacity-70">Amount (MATIC/ETH)</label>
                  <input 
                    type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 text-xl bg-black text-primary border border-primary font-mono text-center" required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase mb-2 opacity-70">Message (Optional)</label>
                  <textarea 
                    value={message} onChange={(e) => setMessage(e.target.value)} maxLength={255} rows={2}
                    className="w-full p-3 bg-black text-primary border border-primary font-mono resize-none"
                  />
                </div>
                
                {!isConnected ? (
                  <button type="button" onClick={() => open()} className="w-full py-3 border border-primary hover:bg-primary/10 uppercase font-bold text-lg">
                    [ CONNECT WALLET ]
                  </button>
                ) : (
                  <button type="submit" disabled={isSigning || isConfirming} className="w-full py-3 bg-primary text-black hover:bg-primary/80 uppercase font-bold text-lg disabled:opacity-50">
                    {isSigning ? '[ AWAITING SIGNATURE ]' : isConfirming ? '[ CONFIRMING ON CHAIN ]' : '[ SEND DONATION ]'}
                  </button>
                )}
              </form>
            )
          ) : (
            // MODE B: Manual Send (CEX / Mobile Scan)
            <div className="text-center space-y-6">
              <p className="text-sm opacity-80">Scan to send funds directly via your Exchange App (Binance, Coinbase, etc.)</p>
              
              <div className="flex justify-center bg-white p-4 mx-auto w-fit border-2 border-primary">
                <QRCodeSVG value={streamerAddress} size={200} />
              </div>
              
              <div>
                <label className="block text-xs uppercase mb-1 opacity-70">Streamer Public Address</label>
                <div className="flex border border-primary">
                  <input type="text" readOnly value={streamerAddress} className="flex-1 p-2 bg-black text-primary font-mono text-xs" />
                  <button className="px-4 bg-primary text-black font-bold uppercase text-xs" onClick={() => navigator.clipboard.writeText(streamerAddress)}>
                    Copy
                  </button>
                </div>
              </div>

              <div className="border border-primary/50 p-4 font-mono text-sm">
                {manualStatus === 'WAITING' ? (
                  <span className="animate-pulse flex items-center justify-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span> Awaiting transaction in mempool...
                  </span>
                ) : (
                  <span className="text-primary font-bold">TRANSACTION DETECTED! Processing...</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
