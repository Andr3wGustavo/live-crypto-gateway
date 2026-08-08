"use client";

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
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
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  }
] as const;

// Contract address placeholder — to be set after deployment
const ROUTER_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

export default function PayStreamerPage({ params }: { params: Promise<{ streamer_id: string }> }) {
  const { streamer_id } = use(params);
  
  // Dual-Mode State
  const [mode, setMode] = useState<'WEB3' | 'MANUAL'>('WEB3');
  const [amount, setAmount] = useState('5.0');
  const [message, setMessage] = useState('');
  const [paymentType, setPaymentType] = useState<'NATIVE' | 'ERC20' | 'SOLANA'>('NATIVE');
  const [selectedToken, setSelectedToken] = useState<string>('');
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

  // ERC-20 approval state
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null);
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({ hash: approvalHash || undefined });
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    // Fetch streamer wallets and configs from new public endpoint
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
        // Fallback for dev environment
        setStreamerAddress('0x1234567890123456789012345678901234567890');
        setStreamerWallets([
          { chain_id: '137', public_address: '0x1234567890123456789012345678901234567890' },
          { chain_id: 'solana', public_address: 'devStreamerSolanaAddress111111111111111' }
        ]);
        setIsLoadingConfig(false);
      });
  }, [streamer_id]);

  // Determine current active chain ID for EVM
  const evmChainId = caipNetwork?.chainNamespace === 'eip155' ? String(caipNetwork.id) : null;
  const currentChainTokens = evmChainId ? ERC20_TOKENS[evmChainId] || [] : [];

  // Determine streamer payout address based on selected payment type
  const getRecipientAddress = () => {
    if (paymentType === 'SOLANA') {
      const solWallet = streamerWallets.find(w => w.chain_id === 'solana' || w.chain_id === 'solana-devnet');
      return solWallet ? solWallet.public_address : streamerAddress;
    }
    
    if (evmChainId) {
      const evmWallet = streamerWallets.find(w => w.chain_id === evmChainId);
      return evmWallet ? (evmWallet.public_address as Address) : (streamerAddress as Address);
    }
    
    return streamerAddress;
  };

  // Handle EVM Approval Flow
  const handleApproveToken = async () => {
    const token = currentChainTokens.find(t => t.symbol === selectedToken);
    if (!token || !evmChainId) return;

    try {
      setIsApproving(true);
      const parsedAmount = parseUnits(amount, token.decimals);
      
      writeContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ROUTER_CONTRACT_ADDRESS, parsedAmount],
      }, {
        onSuccess: (txHash) => {
          setApprovalHash(txHash);
          setIsApproving(false);
        },
        onError: (err) => {
          console.error("Approval error:", err);
          setIsApproving(false);
        }
      });
    } catch (err) {
      console.error(err);
      setIsApproving(false);
    }
  };

  // Main Submit Handler for Web3 Payments
  const handleWeb3Donate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return open();

    const recipient = getRecipientAddress();

    if (paymentType === 'SOLANA' || caipNetwork?.chainNamespace === 'solana') {
      // Solana Donation Flow
      try {
        const provider = walletProvider || (window as any).solana || (window as any).phantom?.solana;
        if (!provider) {
          alert("Solana wallet provider not found. Please connect your Solana wallet.");
          return;
        }

        const { Connection, PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');
        // Standard Solana Devnet Connection
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        
        const fromPubkey = provider.publicKey ? new PublicKey(provider.publicKey.toString()) : new PublicKey(address!);
        const toPubkey = new PublicKey(recipient);
        
        const lamports = Math.round(parseFloat(amount) * 1000000000); // 1 SOL = 10^9 lamports

        let transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;

        const response = await provider.signAndSendTransaction(transaction);
        const signature = response.signature || response;
        console.log("Solana Transaction Sent:", signature);

        // Notify backend of manual transfer to log & trigger WebSocket overlay alert
        await fetch('http://localhost:8080/api/webhooks/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tx_hash: signature,
            streamer_id: streamer_id,
            sender_address: fromPubkey.toBase58(),
            amount: amount,
            currency: 'SOL',
            message: message
          })
        });

        alert("Solana donation sent successfully!");
        setAmount('5.0');
        setMessage('');
      } catch (err: any) {
        console.error("Solana donation error:", err);
        alert("Solana transaction failed: " + err.message);
      }
    } else {
      // EVM Donation Flow (Native or ERC-20)
      if (paymentType === 'NATIVE') {
        writeContract({
          address: ROUTER_CONTRACT_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'donateNative',
          args: [recipient as Address],
          value: parseEther(amount),
        });
      } else {
        const token = currentChainTokens.find(t => t.symbol === selectedToken);
        if (!token) return;
        const parsedAmount = parseUnits(amount, token.decimals);
        
        writeContract({
          address: ROUTER_CONTRACT_ADDRESS,
          abi: ROUTER_ABI,
          functionName: 'donateERC20',
          args: [token.address, recipient as Address, parsedAmount],
        });
      }
    }
  };

  // Mode B: Manual Send Long-Polling simulation
  const [manualStatus, setManualStatus] = useState<'WAITING' | 'DETECTED'>('WAITING');
  useEffect(() => {
    if (mode === 'MANUAL') {
      const timer = setTimeout(() => {
        setManualStatus('DETECTED');
      }, 10000); 
      return () => clearTimeout(timer);
    }
  }, [mode]);

  // Handle active payment types list based on connected wallet chain
  useEffect(() => {
    if (caipNetwork?.chainNamespace === 'solana') {
      setPaymentType('SOLANA');
    } else {
      setPaymentType('NATIVE');
    }
  }, [caipNetwork]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black text-primary flex items-center justify-center p-4 scanlines">
      <div className="max-w-md w-full border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.15),inset_0_0_10px_rgba(6,182,212,0.05)] bg-black/95 relative overflow-hidden backdrop-blur-md rounded">
        
        {/* Decorative corner borders */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></div>

        <header className="text-center p-6 border-b border-cyan-500/30">
          <h1 className="text-2xl font-bold tracking-widest text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] uppercase font-sans">⚡ LIVE CRYPTO GATEWAY</h1>
          <p className="mt-2 text-xs opacity-75 font-mono">DONATING TO STREAMER ID: <span className="text-cyan-300 font-bold">{streamer_id}</span></p>
          {isConnected && (
            <p className="mt-1 text-[10px] opacity-60 font-mono">
              NETWORK: {caipNetwork?.name || 'EVM'} ({caipNetwork?.chainNamespace?.toUpperCase()})
            </p>
          )}
        </header>

        {/* Dual-Mode Selector Tabs */}
        <div className="flex border-b border-cyan-500/30 font-mono text-xs">
          <button 
            className={`flex-1 py-3 font-bold uppercase tracking-wider transition-all duration-300 ${mode === 'WEB3' ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'hover:bg-cyan-950/20 text-cyan-400'}`}
            onClick={() => setMode('WEB3')}
          >
            [ Web3 Wallet ]
          </button>
          <button 
            className={`flex-1 py-3 font-bold uppercase tracking-wider border-l border-cyan-500/30 transition-all duration-300 ${mode === 'MANUAL' ? 'bg-cyan-500 text-black font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'hover:bg-cyan-950/20 text-cyan-400'}`}
            onClick={() => setMode('MANUAL')}
          >
            [ CEX / QR Code ]
          </button>
        </div>

        <div className="p-6">
          {isLoadingConfig ? (
            <div className="text-center py-12 font-mono text-cyan-400 animate-pulse">
              &gt; FETCHING STREAMER PROTOCOL...
            </div>
          ) : mode === 'WEB3' ? (
            isConfirmed ? (
              <div className="text-center py-8 font-mono space-y-4">
                <h2 className="text-2xl text-cyan-400 font-bold animate-pulse tracking-widest">&gt;&gt; TRANSACTION SUCCESSFUL_</h2>
                <div className="p-3 border border-cyan-500/30 bg-cyan-950/20 text-xs break-all text-cyan-300">
                  HASH: {hash}
                </div>
                <button 
                  onClick={() => { setAmount('5.0'); setMessage(''); }}
                  className="mt-4 px-6 py-2.5 border border-cyan-400 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-300 uppercase font-bold text-xs"
                >
                  [ NEW DONATION ]
                </button>
              </div>
            ) : (
              <form onSubmit={handleWeb3Donate} className="space-y-5 font-mono text-sm">
                
                {/* Connection check */}
                {isConnected && (
                  <div className="flex border border-cyan-500/30 rounded overflow-hidden">
                    {caipNetwork?.chainNamespace === 'solana' ? (
                      <button 
                        type="button"
                        className="flex-1 py-2 text-xs uppercase font-bold bg-cyan-500 text-black"
                      >
                        Solana (SOL)
                      </button>
                    ) : (
                      <>
                        <button 
                          type="button"
                          className={`flex-1 py-2 text-xs uppercase font-bold ${paymentType === 'NATIVE' ? 'bg-cyan-500 text-black' : 'text-cyan-400 hover:bg-cyan-950/20'}`}
                          onClick={() => setPaymentType('NATIVE')}
                        >
                          Native (ETH/MATIC)
                        </button>
                        <button 
                          type="button"
                          className={`flex-1 py-2 text-xs uppercase font-bold border-l border-cyan-500/30 ${paymentType === 'ERC20' ? 'bg-cyan-500 text-black' : 'text-cyan-400 hover:bg-cyan-950/20'}`}
                          onClick={() => setPaymentType('ERC20')}
                        >
                          Token (USDT/USDC)
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Token selector for ERC-20 */}
                {paymentType === 'ERC20' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase text-cyan-400 opacity-80">Select Token</label>
                    {currentChainTokens.length > 0 ? (
                      <select 
                        value={selectedToken} 
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="w-full p-2.5 bg-black text-cyan-400 border border-cyan-500/40 rounded focus:border-cyan-400 focus:outline-none"
                        required
                      >
                        <option value="">-- Select Token --</option>
                        {currentChainTokens.map(t => (
                          <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-rose-400 border border-rose-500/30 bg-rose-950/10 p-2.5 rounded">
                        No ERC-20 tokens mapped for this chain. Switch network or use Native.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase text-cyan-400 opacity-80">
                    Amount {paymentType === 'ERC20' && selectedToken ? `(${selectedToken})` : paymentType === 'SOLANA' ? '(SOL)' : '(Native)'}
                  </label>
                  <input 
                    type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 text-2xl bg-black text-cyan-400 border border-cyan-500/40 rounded text-center focus:border-cyan-400 focus:outline-none" required
                  />
                  {alertConfig && alertConfig.min_amount > 0 && (
                    <div className="text-[10px] text-right text-cyan-500/60">
                      MINIMUM ALERT AMOUNT: {parseFloat(alertConfig.min_amount)}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase text-cyan-400 opacity-80">Message (Overlay alert)</label>
                  <textarea 
                    value={message} onChange={(e) => setMessage(e.target.value)} maxLength={255} rows={2}
                    placeholder="Enter your message..."
                    className="w-full p-2.5 bg-black text-cyan-400 border border-cyan-500/40 rounded resize-none focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                
                {!isConnected ? (
                  <button type="button" onClick={() => open()} className="w-full py-3 border border-cyan-400 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-300 uppercase font-bold tracking-widest">
                    [ CONNECT WALLET ]
                  </button>
                ) : paymentType === 'ERC20' && selectedToken && !isApprovalConfirmed && !approvalHash ? (
                  // EVM ERC-20 approval button
                  <button 
                    type="button" 
                    onClick={handleApproveToken} 
                    disabled={isApproving}
                    className="w-full py-3 bg-cyan-500 text-black hover:bg-cyan-400 uppercase font-extrabold tracking-widest disabled:opacity-50 transition-all duration-300"
                  >
                    {isApproving ? '[ SIGNING APPROVAL... ]' : '[ APPROVE TOKEN ACCESS ]'}
                  </button>
                ) : isApprovalConfirming || isApproving ? (
                  <button type="button" disabled className="w-full py-3 border border-cyan-500/30 text-cyan-500/50 uppercase font-bold animate-pulse">
                    [ CONFIRMING APPROVAL... ]
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isSigning || isConfirming || (paymentType === 'ERC20' && !selectedToken)} 
                    className="w-full py-3 bg-cyan-500 text-black hover:bg-cyan-400 uppercase font-extrabold tracking-widest disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    {isSigning ? '[ SIGNING DONATION... ]' : isConfirming ? '[ CONFIRMING ON CHAIN... ]' : '[ SEND DONATION ]'}
                  </button>
                )}
              </form>
            )
          ) : (
            // MODE B: Manual Send (CEX / Mobile Scan)
            <div className="text-center space-y-5 font-mono text-sm">
              <p className="text-xs opacity-75">Scan to send SOL/EVM directly via your Exchange App (Binance, Coinbase, etc.)</p>
              
              <div className="flex justify-center bg-white p-4 mx-auto w-fit border border-cyan-500/40 rounded">
                <QRCodeSVG value={getRecipientAddress()} size={180} />
              </div>
              
              <div className="space-y-1.5 text-left">
                <label className="block text-xs uppercase text-cyan-400 opacity-80">Streamer Payout Address</label>
                <div className="flex border border-cyan-500/40 rounded overflow-hidden">
                  <input type="text" readOnly value={getRecipientAddress()} className="flex-1 p-2 bg-black text-cyan-400 text-xs focus:outline-none" />
                  <button className="px-4 bg-cyan-500 text-black font-bold uppercase text-xs hover:bg-cyan-400 transition-colors" onClick={() => navigator.clipboard.writeText(getRecipientAddress())}>
                    Copy
                  </button>
                </div>
              </div>

              <div className="border border-cyan-500/30 bg-cyan-950/10 p-3 text-xs">
                {manualStatus === 'WAITING' ? (
                  <span className="animate-pulse flex items-center justify-center text-cyan-400">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2 shadow-[0_0_5px_rgba(6,182,212,1)]"></span> Awaiting transaction detection in mempool...
                  </span>
                ) : (
                  <span className="text-cyan-400 font-bold flex items-center justify-center animate-pulse">
                    &gt;&gt; TRANSACTION DETECTED! DISPATCHING ALERTS...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
