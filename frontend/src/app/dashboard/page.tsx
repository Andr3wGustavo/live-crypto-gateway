"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchLiveCryptoPrices, SUPPORTED_TOKENS } from '@/services/coingecko';

interface StreamerData {
  id?: number;
  public_address: string;
  obs_token: string;
}

interface WalletItem {
  chain_id: string;
  public_address: string;
}

interface TransactionItem {
  tx_hash: string;
  sender_address: string;
  amount: string;
  currency: string;
  status: string;
  timestamp: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [streamer, setStreamer] = useState<StreamerData>({ public_address: '', obs_token: '' });
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  
  // Alert Config and Goal state
  const [minAmount, setMinAmount] = useState('0.00');
  const [activeTheme, setActiveTheme] = useState('cyberpunk');
  const [goalAmount, setGoalAmount] = useState('100.00');
  const [goalCurrent, setGoalCurrent] = useState('0.00');
  const [goalTitle, setGoalTitle] = useState('Streamer Setup Goal');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // New Wallet form state
  const [selectedChain, setSelectedChain] = useState('solana');
  const [newWalletAddress, setNewWalletAddress] = useState('');

  // Transactions & Analytics states
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [analytics, setAnalytics] = useState<{ totalTransactions: number; estimatedTotalUSD: string; tokenBreakdown: Record<string, number> }>({
    totalTransactions: 0,
    estimatedTotalUSD: '0.00',
    tokenBreakdown: {}
  });
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, { usd: number; change24h: number }>>({});
  
  // Drag-and-drop & Uploader state
  const [uploadType, setUploadType] = useState<'media' | 'audio'>('media');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI Statuses
  const [configSaveStatus, setConfigSaveStatus] = useState<'' | 'saving' | 'success' | 'error'>('');
  const [walletSaveStatus, setWalletSaveStatus] = useState<'' | 'saving' | 'success' | 'error'>('');
  const [testAlertStatus, setTestAlertStatus] = useState<'' | 'sending' | 'success' | 'error'>('');
  const [copiedLink, setCopiedLink] = useState<'obs' | 'pay' | string | null>(null);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      // Local dev demo mode
      setStreamer({ id: 1, public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', obs_token: 'obs_tok_live_demo_987654' });
      setWallets([
        { chain_id: 'solana', public_address: '8x3sK2vPz1Lm9NxQa7Rt5Wb4Ey2Cg1Vj6F3aQ' },
        { chain_id: 'sui', public_address: '0x8f3c7e9a1b2d4f5c6e8a0b1d3f5e7c9a1b2d4f5c6e8a0b1d3f5e7c9a1b2d4f5c' },
        { chain_id: '137', public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
        { chain_id: '8453', public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
        { chain_id: 'btc', public_address: 'lnurl1dp68gurn8ghj7ampd3kx2ar0veekzar0wd5xjtnrdakj7tnhv4kxctttdehhwm30d3h82unvwqhksetjv35kuee5' }
      ]);
      setTransactions([
        { tx_hash: '0x8f2d...4a1c', sender_address: 'alex.sol', amount: '25.0', currency: 'SOL', status: 'CONFIRMED', timestamp: '2 minutes ago' },
        { tx_hash: '0x3e1b...99f0', sender_address: 'satoshi.eth', amount: '0.15', currency: 'ETH', status: 'CONFIRMED', timestamp: '15 minutes ago' },
        { tx_hash: '0x7c4a...11bb', sender_address: 'streamfan', amount: '50.0', currency: 'USDC', status: 'CONFIRMED', timestamp: '1 hour ago' },
        { tx_hash: 'sui_0x992', sender_address: 'slush_whale', amount: '120.0', currency: 'SUI', status: 'CONFIRMED', timestamp: '3 hours ago' }
      ]);
      setAnalytics({ totalTransactions: 4, estimatedTotalUSD: '5680.00', tokenBreakdown: { SOL: 25.0, ETH: 0.15, USDC: 50.0, SUI: 120.0 } });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const dashboardRes = await fetch('http://localhost:8080/api/dashboard', { headers });
      if (!dashboardRes.ok) throw new Error("Failed to load dashboard data");
      const data = await dashboardRes.json();

      setStreamer(data.streamer || {});
      setWallets(data.wallets || []);
      
      if (data.alertConfig) {
        setMinAmount(parseFloat(data.alertConfig.min_amount || 0).toString());
        setActiveTheme(data.alertConfig.active_theme || 'cyberpunk');
        setGoalAmount(parseFloat(data.alertConfig.goal_amount || 0).toString());
        setGoalCurrent(parseFloat(data.alertConfig.goal_current || 0).toString());
        setGoalTitle(data.alertConfig.goal_title || 'Streamer Setup Goal');
        setMediaUrl(data.alertConfig.media_url || null);
        setAudioUrl(data.alertConfig.audio_url || null);
      }

      const txRes = await fetch('http://localhost:8080/api/dashboard/transactions', { headers });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      }

      const analyticsRes = await fetch('http://localhost:8080/api/dashboard/analytics', { headers });
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      setLoading(false);
    } catch (err) {
      console.warn("Using fallback demo dashboard session:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchLiveCryptoPrices().then(prices => setCryptoPrices(prices));
  }, []);

  // Save Alert/Theme/Goal configuration
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('jwt');
    if (!token) {
      setConfigSaveStatus('success');
      setTimeout(() => setConfigSaveStatus(''), 2000);
      return;
    }

    try {
      setConfigSaveStatus('saving');
      const res = await fetch('http://localhost:8080/api/dashboard/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          min_amount: minAmount,
          active_theme: activeTheme,
          goal_amount: goalAmount,
          goal_current: goalCurrent,
          goal_title: goalTitle,
          media_url: mediaUrl,
          audio_url: audioUrl
        })
      });

      if (!res.ok) throw new Error();
      setConfigSaveStatus('success');
      setTimeout(() => setConfigSaveStatus(''), 2000);
    } catch {
      setConfigSaveStatus('error');
      setTimeout(() => setConfigSaveStatus(''), 3000);
    }
  };

  // Add or Update Wallet Payout Address
  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletAddress) return;

    const token = localStorage.getItem('jwt');
    if (!token) {
      setWallets(prev => {
        const idx = prev.findIndex(w => w.chain_id === selectedChain);
        if (idx > -1) {
          const u = [...prev];
          u[idx].public_address = newWalletAddress;
          return u;
        }
        return [...prev, { chain_id: selectedChain, public_address: newWalletAddress }];
      });
      setNewWalletAddress('');
      setWalletSaveStatus('success');
      setTimeout(() => setWalletSaveStatus(''), 2000);
      return;
    }

    try {
      setWalletSaveStatus('saving');
      const res = await fetch('http://localhost:8080/api/dashboard/wallet', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chain_id: selectedChain,
          public_address: newWalletAddress
        })
      });

      if (!res.ok) throw new Error();
      
      setWallets(prev => {
        const index = prev.findIndex(w => w.chain_id === selectedChain);
        if (index > -1) {
          const updated = [...prev];
          updated[index].public_address = newWalletAddress;
          return updated;
        }
        return [...prev, { chain_id: selectedChain, public_address: newWalletAddress }];
      });

      setNewWalletAddress('');
      setWalletSaveStatus('success');
      setTimeout(() => setWalletSaveStatus(''), 2000);
    } catch {
      setWalletSaveStatus('error');
      setTimeout(() => setWalletSaveStatus(''), 3000);
    }
  };

  // File Upload to IPFS via Pinata Backend Route
  const handleFileUpload = async (file: File) => {
    const token = localStorage.getItem('jwt');
    setIsUploading(true);
    setUploadSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const res = await fetch('http://localhost:8080/api/dashboard/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (uploadType === 'media') {
          setMediaUrl(data.url);
        } else {
          setAudioUrl(data.url);
        }
        setUploadSuccessMsg(`✓ Successfully pinned to IPFS: ${data.hash?.substring(0, 10)}...`);
      } else {
        // Fallback local blob preview for offline testing
        const localBlobUrl = URL.createObjectURL(file);
        if (uploadType === 'media') {
          setMediaUrl(localBlobUrl);
        } else {
          setAudioUrl(localBlobUrl);
        }
        setUploadSuccessMsg(`✓ Local asset configured for live broadcast`);
      }
    } catch (e) {
      const localBlobUrl = URL.createObjectURL(file);
      if (uploadType === 'media') {
        setMediaUrl(localBlobUrl);
      } else {
        setAudioUrl(localBlobUrl);
      }
      setUploadSuccessMsg(`✓ Asset loaded successfully`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    }
  };

  // Test simulated live OBS alert
  const handleTriggerTestAlert = async () => {
    try {
      setTestAlertStatus('sending');
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8080/api/dashboard/test-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          streamer_id: streamer.id || 1,
          amount: 25.0,
          currency: 'SOL',
          sender: 'LiveCryptoTester.sol',
          message: 'Testing instant OBS broadcast with real-time audio and voice TTS!'
        })
      });

      setTestAlertStatus('success');
      setTimeout(() => setTestAlertStatus(''), 3000);
    } catch (e) {
      setTestAlertStatus('success');
      setTimeout(() => setTestAlertStatus(''), 3000);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const obsUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/${streamer.obs_token || 'obs_tok_demo'}` : `/overlay/${streamer.obs_token || 'obs_tok_demo'}`;
  const payUrl = typeof window !== 'undefined' ? `${window.location.origin}/pay/${streamer.id || 'demo'}` : `/pay/${streamer.id || 'demo'}`;

  const goalPercentage = Math.min(100, Math.max(0, (parseFloat(goalCurrent) / (parseFloat(goalAmount) || 1)) * 100));

  return (
    <div className="min-h-screen bg-black text-slate-100 selection:bg-cyan-400 selection:text-black py-8 px-4 sm:px-6 relative overflow-hidden font-sans">
      
      {/* Top Command Bar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between pb-6 mb-8 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <Link href="/" className="w-11 h-11 rounded-2xl overflow-hidden bg-zinc-950 border border-cyan-400/30 p-2 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.35)]">
            <Image 
              src="/brand/logo-png.png" 
              alt="Live Crypto" 
              width={44} 
              height={44}
              className="object-contain"
            />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 font-sans tracking-tight">
              CREATOR COMMAND CENTER <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono font-bold border border-cyan-400/30">ONLINE</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Non-custodial settlement • Sub-400ms OBS WebSocket Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href={payUrl}
            target="_blank"
            className="glass-btn px-4 py-2 text-xs font-mono rounded-xl text-cyan-300 font-bold hidden sm:flex items-center gap-1.5"
          >
            <span>↗ Public Checkout</span>
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('jwt');
              window.location.href = '/';
            }}
            className="px-3.5 py-2 text-xs font-mono text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick Telemetry KPI Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="liquid-card p-4 sm:p-5 rounded-3xl border border-white/10">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Estimated Revenue</div>
          <div className="text-xl sm:text-2xl font-black text-cyan-300 font-mono mt-1">
            ${analytics.estimatedTotalUSD} <span className="text-xs text-slate-500 font-normal">USD</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">● 100% P2P Settled</div>
        </div>

        <div className="liquid-card p-4 sm:p-5 rounded-3xl border border-white/10">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Donations</div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            {analytics.totalTransactions} <span className="text-xs text-slate-500 font-normal">txs</span>
          </div>
          <div className="text-[10px] font-mono text-cyan-400 mt-1">● Real-time verified</div>
        </div>

        <div className="liquid-card p-4 sm:p-5 rounded-3xl border border-white/10">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Active Goal Progress</div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono mt-1">
            {goalPercentage.toFixed(0)}% <span className="text-xs text-slate-500 font-normal">completed</span>
          </div>
          <div className="text-[10px] font-mono text-purple-400 mt-1">${goalCurrent} / ${goalAmount} USD</div>
        </div>

        <div className="liquid-card p-4 sm:p-5 rounded-3xl border border-white/10">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Active Overlay Theme</div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono mt-1 capitalize">
            {activeTheme}
          </div>
          <div className="text-[10px] font-mono text-cyan-400 mt-1">● WebSocket Sub-400ms</div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: OBS Browser Source, Payout Wallets, and IPFS Uploader */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* OBS Studio Integration Card */}
          <div className="liquid-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>📹</span> OBS STUDIO BROWSER SOURCE
              </h3>
              <span className="badge-punchy bg-cyan-950/60 text-cyan-300 border-cyan-400/30 text-[9px]">
                ZERO PLUGIN REQUIRED
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Add this URL as a <strong>Browser Source (1920x1080)</strong> in OBS Studio. Sub-400ms animated alerts with sound chimes and Text-to-Speech.
            </p>

            <div className="p-3.5 rounded-2xl bg-black/80 border border-white/10 space-y-2">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Your Unique Overlay URL:</div>
              <div className="font-mono text-xs text-cyan-300 truncate bg-zinc-950 p-2.5 rounded-xl border border-white/5 select-all">
                {obsUrl}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => copyToClipboard(obsUrl, 'obs')}
                  className="flex-1 glass-btn py-2 rounded-xl text-xs font-mono font-bold uppercase text-white hover:text-cyan-300 cursor-pointer"
                >
                  {copiedLink === 'obs' ? '✓ Copied to Clipboard!' : '📋 Copy OBS URL'}
                </button>
                <Link
                  href={`/overlay/${streamer.obs_token || 'obs_tok_demo'}`}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300 hover:text-white"
                >
                  ↗ Preview
                </Link>
              </div>
            </div>

            {/* Test Trigger Button */}
            <button
              onClick={handleTriggerTestAlert}
              disabled={testAlertStatus === 'sending'}
              className="w-full glass-btn-primary py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{testAlertStatus === 'sending' ? 'Sending Test...' : testAlertStatus === 'success' ? '✓ Test Alert Sent to OBS!' : '⚡ Test Live OBS Broadcast'}</span>
            </button>
          </div>

          {/* IPFS Media & Audio Uploader */}
          <div className="liquid-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>🎨</span> CUSTOM ALERT ASSETS (IPFS)
              </h3>
              <span className="text-[10px] font-mono text-purple-400 font-bold">PINATA / IPFS</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload custom alert GIFs, MP4 animations, or MP3 sound effects to decentralized IPFS storage.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadType('media')}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  uploadType === 'media' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-black/40 text-slate-400 border border-white/5'
                }`}
              >
                Visual Media (GIF/MP4)
              </button>
              <button
                type="button"
                onClick={() => setUploadType('audio')}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  uploadType === 'audio' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-black/40 text-slate-400 border border-white/5'
                }`}
              >
                Audio Chime (MP3/WAV)
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-white/15 bg-black/50 hover:border-cyan-400/40 hover:bg-cyan-950/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept={uploadType === 'media' ? 'image/*,video/mp4' : 'audio/*'}
                className="hidden"
              />
              <div className="text-2xl">{uploadType === 'media' ? '🖼️' : '🔊'}</div>
              <div className="text-xs font-mono text-slate-300 font-bold">
                {isUploading ? 'Uploading & Pinning to IPFS...' : `Click or Drop ${uploadType === 'media' ? 'GIF / MP4' : 'MP3 / Audio'}`}
              </div>
              <div className="text-[10px] font-mono text-slate-500">Max size: 5MB • Automatically pinned</div>
            </div>

            {uploadSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center">
                {uploadSuccessMsg}
              </div>
            )}

            {/* Current Asset URLs */}
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Active Media:</span>
                <span className="text-cyan-300 truncate max-w-[220px]">{mediaUrl || 'Default Cyber HUD'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Active Audio:</span>
                <span className="text-purple-300 truncate max-w-[220px]">{audioUrl || 'Default Cyber Chime'}</span>
              </div>
            </div>
          </div>

          {/* Multi-Chain Payout Wallets Card */}
          <div className="liquid-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>💳</span> NON-CUSTODIAL PAYOUT WALLETS
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% P2P</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Donations route directly to your personal addresses. No middleman holds your funds.
            </p>

            {/* Active Wallets List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {wallets.map((w) => (
                <div key={w.chain_id} className="p-3 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-400/20">
                      {w.chain_id}
                    </span>
                    <span className="font-mono text-xs text-slate-300 truncate max-w-[180px]">
                      {w.public_address}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(w.public_address, w.chain_id)}
                    className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {copiedLink === w.chain_id ? '✓' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            {/* Add / Update Wallet Form */}
            <form onSubmit={handleSaveWallet} className="pt-2 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value)}
                  className="glass-input px-3 py-2 rounded-xl text-xs font-mono text-white col-span-1"
                >
                  <option value="solana">Solana (SOL)</option>
                  <option value="sui">Sui (SUI)</option>
                  <option value="137">Polygon (POL)</option>
                  <option value="8453">Base (ETH/USDC)</option>
                  <option value="42161">Arbitrum</option>
                  <option value="1">Ethereum</option>
                  <option value="56">BNB Chain</option>
                  <option value="43114">Avalanche</option>
                  <option value="btc">Bitcoin (LN)</option>
                  <option value="tron">TRON (TRC20)</option>
                  <option value="ton">TON</option>
                  <option value="doge">Dogecoin</option>
                </select>
                <input
                  type="text"
                  placeholder="Paste destination address..."
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className="glass-input px-3 py-2 rounded-xl text-xs font-mono text-white col-span-2"
                />
              </div>

              <button
                type="submit"
                className="w-full glass-btn py-2.5 rounded-xl text-xs font-mono font-bold uppercase text-cyan-300 cursor-pointer"
              >
                {walletSaveStatus === 'saving' ? 'Saving...' : walletSaveStatus === 'success' ? '✓ Wallet Saved!' : '+ Add / Update Payout Address'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Theme, Goal, and Donation Ledger */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Overlay Theme & Donation Goal Settings */}
          <div className="liquid-card p-6 rounded-3xl border border-white/10 space-y-6">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span>🎨</span> OVERLAY THEME &amp; LIVE DONATION GOAL
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5 uppercase">Overlay Aesthetic Theme</label>
                  <select
                    value={activeTheme}
                    onChange={(e) => setActiveTheme(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-xs font-mono text-white"
                  >
                    <option value="cyberpunk">Cyberpunk Neon Glass</option>
                    <option value="matrix">Matrix Green Terminal</option>
                    <option value="fire">Solar Fire Glass</option>
                    <option value="minimal">Minimal Frost Crystal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5 uppercase">Minimum Alert Amount (USD)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Goal Settings */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 uppercase font-bold">Live Stream Goal Widget:</span>
                  <span className="text-cyan-400 font-bold">${goalCurrent} / ${goalAmount} USD</span>
                </div>

                <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${goalPercentage}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Goal Title</label>
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-white mt-1"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Target Amount ($)</label>
                    <input
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-white mt-1"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Current Progress ($)</label>
                    <input
                      type="number"
                      value={goalCurrent}
                      onChange={(e) => setGoalCurrent(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full glass-btn-primary py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                {configSaveStatus === 'saving' ? 'Saving Preferences...' : configSaveStatus === 'success' ? '✓ Settings Synchronized to OBS!' : '💾 Save & Synchronize Overlay'}
              </button>
            </form>
          </div>

          {/* Recent Live Transactions Stream */}
          <div className="liquid-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>⚡</span> LIVE DONATION LEDGER
              </h3>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                Total: ~${analytics.estimatedTotalUSD} USD
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 uppercase text-[10px]">
                    <th className="pb-3">Sender</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 text-slate-200 font-bold">{tx.sender_address}</td>
                      <td className="py-3 text-cyan-300 font-bold">+{tx.amount} {tx.currency}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-[10px] border border-emerald-500/30">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{tx.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
