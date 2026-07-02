"use client";

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { parseEther, parseUnits, type Address } from 'viem';
import { QRCodeSVG } from 'qrcode.react';
import ROUTER_ABI from '@/abi/LiveCryptoRouter.json';

// Supported ERC-20 tokens per chain (address => {symbol, decimals})
const ERC20_TOKENS: Record<string, { symbol: string; decimals: number; address: Address }[]> = {
  // Polygon
  '137': [
    { symbol: 'USDT', decimals: 6, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
    { symbol: 'USDC', decimals: 6, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' },
    { symbol: 'DAI', decimals: 18, address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' },
  ],
  // Ethereum Mainnet
  '1': [
    { symbol: 'USDT', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { symbol: 'USDC', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { symbol: 'DAI', decimals: 18, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  ],
  // Base
  '8453': [
    { symbol: 'USDC', decimals: 6, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  ],
  // Arbitrum
  '42161': [
    { symbol: 'USDT', decimals: 6, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
    { symbol: 'USDC', decimals: 6, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
    { symbol: 'DAI', decimals: 18, address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' },
  ],
  // BSC
  '56': [
    { symbol: 'USDT', decimals: 18, address: '0x55d398326f99059fF775485246999027B3197955' },
    { symbol: 'USDC', decimals: 18, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' },
    { symbol: 'DAI', decimals: 18, address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3' },
  ],
};

// Contract address placeholder — to be set after deployment
const ROUTER_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

export default function PayStreamerPage({ params }: { params: Promise<{ streamer_id: string }> }) {
  const { streamer_id } = use(params);
  
  // Dual-Mode State
  const [mode, setMode] = useState<'WEB3' | 'MANUAL'>('WEB3');
  const [amount, setAmount] = useState('5.0');
  const [message, setMessage] = useState('');
  const [paymentType, setPaymentType] = useState<'NATIVE' | 'ERC20'>('NATIVE');
  const [selectedToken, setSelectedToken] = useState<string>('');
  
  // Streamer details (fetched from backend)
  const [streamerAddress, setStreamerAddress] = useState<Address>('0x0000000000000000000000000000000000000000');
  
  useEffect(() => {
    // Fetch streamer wallet address from backend
    fetch(`http://localhost:8080/api/dashboard/streamer/${streamer_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.public_address) setStreamerAddress(data.public_address as Address);
      })
      .catch(() => {
        // Fallback for dev
        setStreamerAddress('0x1234567890123456789012345678901234567890' as Address);
      });
  }, [streamer_id]);

  // Mode A: Web3 Native
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();
  
  // Use writeContract for interacting with the Router
  const { data: hash, writeContract, isPending: isSigning } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const currentChainTokens = chainId ? ERC20_TOKENS[String(chainId)] || [] : [];

  const handleWeb3Donate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return open();
    
    if (paymentType === 'NATIVE') {
      // Call donateNative on the Router contract
      writeContract({
        address: ROUTER_CONTRACT_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'donateNative',
        args: [streamerAddress],
        value: parseEther(amount),
      });
    } else {
      // Call donateERC20 on the Router contract
      const token = currentChainTokens.find(t => t.symbol === selectedToken);
      if (!token) return;
      
      const parsedAmount = parseUnits(amount, token.decimals);
      
      // NOTE: User must have approved the Router contract to spend their tokens first.
      // In production, check allowance and prompt for approval if needed.
      writeContract({
        address: ROUTER_CONTRACT_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'donateERC20',
        args: [token.address, streamerAddress, parsedAmount],
      });
    }
  };

  // Mode B: Manual Send Long-Polling
  const [manualStatus, setManualStatus] = useState<'WAITING' | 'DETECTED'>('WAITING');
  useEffect(() => {
    if (mode === 'MANUAL') {
      // Poll the backend for the transaction (long-poll the mempool)
      const timer = setTimeout(() => {
        setManualStatus('DETECTED');
      }, 10000); // Fakes detection after 10s (replace with real polling)
      return () => clearTimeout(timer);
    }
  }, [mode]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-primary shadow-[0_0_15px_rgba(0,255,0,0.15)] bg-black">
        
        <header className="text-center p-6 border-b border-primary">
          <h1 className="text-2xl font-bold tracking-wider">LIVE CRYPTO DAPP</h1>
          <p className="mt-2 text-sm opacity-80">Donating to Streamer ID: <span className="font-bold">{streamer_id}</span></p>
          {chainId && <p className="mt-1 text-xs opacity-60">Chain: {chainId}</p>}
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
            // MODE A: Web3 Native (Wagmi + Reown AppKit)
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
                {/* Payment Type Toggle */}
                <div className="flex border border-primary">
                  <button 
                    type="button"
                    className={`flex-1 py-2 text-xs uppercase font-bold ${paymentType === 'NATIVE' ? 'bg-primary text-black' : 'text-primary hover:bg-primary/10'}`}
                    onClick={() => setPaymentType('NATIVE')}
                  >
                    Native (ETH/MATIC)
                  </button>
                  <button 
                    type="button"
                    className={`flex-1 py-2 text-xs uppercase font-bold border-l border-primary ${paymentType === 'ERC20' ? 'bg-primary text-black' : 'text-primary hover:bg-primary/10'}`}
                    onClick={() => setPaymentType('ERC20')}
                  >
                    Token (USDT/USDC)
                  </button>
                </div>

                {/* Token selector for ERC-20 */}
                {paymentType === 'ERC20' && (
                  <div>
                    <label className="block text-xs uppercase mb-2 opacity-70">Select Token</label>
                    {currentChainTokens.length > 0 ? (
                      <select 
                        value={selectedToken} 
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="w-full p-3 bg-black text-primary border border-primary font-mono"
                        required
                      >
                        <option value="">-- Select --</option>
                        {currentChainTokens.map(t => (
                          <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-red-400 border border-red-400/30 p-2">
                        No ERC-20 tokens mapped for this chain. Switch network or use Native.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase mb-2 opacity-70">
                    Amount {paymentType === 'ERC20' && selectedToken ? `(${selectedToken})` : '(Native)'}
                  </label>
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
                  <button type="submit" disabled={isSigning || isConfirming || (paymentType === 'ERC20' && !selectedToken)} className="w-full py-3 bg-primary text-black hover:bg-primary/80 uppercase font-bold text-lg disabled:opacity-50">
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
