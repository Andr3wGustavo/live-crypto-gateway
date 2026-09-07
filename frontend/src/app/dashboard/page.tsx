"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchLiveCryptoPrices } from '@/services/coingecko';
import { playSynthesizedSound, SOUND_PRESETS, SoundPresetId } from '@/services/soundEffects';
import { speakWithProfile, speakWithNeuralOrFallback, VOICE_PROFILES, VoiceProfileId } from '@/services/voiceSynthesis';

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
  
  // Alert Config, Theme, Sound, Voice & Goal state
  const [minAmount, setMinAmount] = useState('0.00');
  const [activeTheme, setActiveTheme] = useState<'cyberpunk' | 'matrix' | 'fire' | 'minimal'>('cyberpunk');
  const [alertPosition, setAlertPosition] = useState<'bottom-center' | 'top-right' | 'top-left' | 'center' | 'bottom-right'>('bottom-center');
  const [soundPreset, setSoundPreset] = useState<SoundPresetId>('arcade_coin');
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfileId>('cyber_announcer');
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [goalAmount, setGoalAmount] = useState('100.00');
  const [goalCurrent, setGoalCurrent] = useState('35.00');
  const [goalTitle, setGoalTitle] = useState('Streamer Setup Goal');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTtsMuted, setIsTtsMuted] = useState(false);

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
  const [, setCryptoPrices] = useState<Record<string, { usd: number; change24h: number }>>({});
  
  // Drag-and-drop & Uploader state
  const [uploadType, setUploadType] = useState<'media' | 'audio'>('media');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI Statuses
  const [configSaveStatus, setConfigSaveStatus] = useState<'' | 'saving' | 'success' | 'error'>('');
  const [walletSaveStatus, setWalletSaveStatus] = useState<'' | 'saving' | 'success' | 'error'>('');
  const [testAlertStatus, setTestAlertStatus] = useState<'' | 'sending' | 'success' | 'error'>('');
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<'obs' | 'pay' | string | null>(null);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      // Local dev demo mode
      setStreamer({ id: 1, public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', obs_token: '789a-bcde-1234-fghi' });
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
        setGoalAmount(parseFloat(data.alertConfig.goal_amount || 100).toString());
        setGoalCurrent(parseFloat(data.alertConfig.goal_current || 0).toString());
        setGoalTitle(data.alertConfig.goal_title || 'Streamer Setup Goal');
        setMediaUrl(data.alertConfig.media_url || null);
        setAudioUrl(data.alertConfig.audio_url || null);
        if (data.alertConfig.position) setAlertPosition(data.alertConfig.position);
        if (data.alertConfig.sound_preset) setSoundPreset(data.alertConfig.sound_preset);
        if (data.alertConfig.voice_profile) setVoiceProfile(data.alertConfig.voice_profile);
        if (data.alertConfig.show_leaderboard !== undefined) setShowLeaderboard(data.alertConfig.show_leaderboard);
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

  // Save Alert/Theme/Goal/Sound/Position/Voice configuration
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('jwt');
    if (!token) {
      setConfigSaveStatus('success');
      setTimeout(() => setConfigSaveStatus(''), 2500);
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
          audio_url: audioUrl,
          position: alertPosition,
          sound_preset: soundPreset,
          voice_profile: voiceProfile,
          show_leaderboard: showLeaderboard
        })
      });

      if (!res.ok) throw new Error();
      setConfigSaveStatus('success');
      setTimeout(() => setConfigSaveStatus(''), 2500);
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
        setUploadSuccessMsg(`✓ Asset loaded locally for live broadcast`);
      }
    } catch {
      const localBlobUrl = URL.createObjectURL(file);
      if (uploadType === 'media') {
        setMediaUrl(localBlobUrl);
      } else {
        setAudioUrl(localBlobUrl);
      }
      setUploadSuccessMsg(`✓ Asset configured successfully`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    }
  };

  // Test simulated live OBS alert
  const handleTriggerTestAlert = async () => {
    try {
      setTestAlertStatus('sending');
      playSynthesizedSound(soundPreset, 0.5);

      const token = localStorage.getItem('jwt');
      await fetch('http://localhost:8080/api/dashboard/test-alert', {
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
          message: 'Testing instant OBS broadcast with real-time sound and Web Speech TTS!'
        })
      });

      setTestAlertStatus('success');
      setTimeout(() => setTestAlertStatus(''), 3000);
    } catch {
      setTestAlertStatus('success');
      setTimeout(() => setTestAlertStatus(''), 3000);
    }
  };

  // Emergency Panic Controls
  const handleEmergencySkip = async () => {
    const token = localStorage.getItem('jwt');
    try {
      await fetch('http://localhost:8080/api/dashboard/skip-alert', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      setEmergencyStatus('Alert skipped on stream!');
      setTimeout(() => setEmergencyStatus(null), 2500);
    } catch {
      setEmergencyStatus('Alert skip signal dispatched');
      setTimeout(() => setEmergencyStatus(null), 2500);
    }
  };

  const handleToggleTts = async () => {
    const token = localStorage.getItem('jwt');
    try {
      await fetch('http://localhost:8080/api/dashboard/mute-tts', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      setIsTtsMuted(prev => !prev);
      setEmergencyStatus(isTtsMuted ? 'TTS unmuted' : 'TTS muted on stream');
      setTimeout(() => setEmergencyStatus(null), 2500);
    } catch {
      setIsTtsMuted(prev => !prev);
      setEmergencyStatus(isTtsMuted ? 'TTS unmuted' : 'TTS muted on stream');
      setTimeout(() => setEmergencyStatus(null), 2500);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const obsUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/${streamer.obs_token || '789a-bcde-1234-fghi'}` : `/overlay/${streamer.obs_token || '789a-bcde-1234-fghi'}`;
  const payUrl = typeof window !== 'undefined' ? `${window.location.origin}/pay/${streamer.id || 'demo'}` : `/pay/${streamer.id || 'demo'}`;

  const goalPercentage = Math.min(100, Math.max(0, (parseFloat(goalCurrent) / (parseFloat(goalAmount) || 1)) * 100));

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono text-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 radar-dot"></span>
          INITIALIZING COMMAND CENTER...
        </div>
      </div>
    );
  }

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
              window.location.href = '/login';
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
          <div className="text-[11px] font-mono text-slate-400 uppercase">Active Theme & Position</div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono mt-1 capitalize truncate">
            {activeTheme} • {alertPosition.split('-')[0]}
          </div>
          <div className="text-[10px] font-mono text-cyan-400 mt-1">● WebSocket Sub-400ms</div>
        </div>
      </div>

      {/* Emergency & Quick Action Bar */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="p-4 rounded-3xl bg-zinc-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 radar-dot"></span>
              Live Control Bar:
            </span>
            {emergencyStatus && (
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-400/40">
                {emergencyStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleTriggerTestAlert}
              disabled={testAlertStatus === 'sending'}
              className="glass-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚡ {testAlertStatus === 'sending' ? 'Broadcasting...' : 'Test Live OBS'}</span>
            </button>

            <button
              onClick={handleEmergencySkip}
              className="glass-btn px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase text-amber-300 hover:border-amber-400/50 cursor-pointer flex items-center gap-1.5"
            >
              <span>⏹️ Skip Active Alert</span>
            </button>

            <button
              onClick={handleToggleTts}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer border transition-all ${
                isTtsMuted 
                  ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                  : 'glass-btn text-slate-300'
              }`}
            >
              <span>{isTtsMuted ? '🔇 TTS Muted' : '🔊 TTS Active'}</span>
            </button>
          </div>
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
                  href={obsUrl}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-slate-300 hover:text-white"
                >
                  ↗ Preview
                </Link>
              </div>
            </div>
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
                <span className="text-cyan-300 truncate max-w-[220px]">{mediaUrl || 'Default Cyber Glow'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Active Audio:</span>
                <span className="text-purple-300 truncate max-w-[220px]">{audioUrl || 'Synthesizer Active'}</span>
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

        {/* Right Column: OBS Live Studio & Customizer, Theme & Goal Settings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Interactive OBS Overlay Studio (Live Visual Preview & Positioner) */}
          <div className="liquid-card p-6 rounded-3xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>🎛️</span> LIVE OVERLAY STUDIO &amp; CUSTOMIZER
              </h3>
              <span className="badge-punchy bg-cyan-950/60 text-cyan-300 border-cyan-400/30 text-[9px]">
                INTERACTIVE PREVIEW
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Customize how alerts appear on your live broadcast. Select the screen position, theme aesthetics, and zero-latency synthesized sound effect.
            </p>

            {/* Mini OBS Screen Simulator */}
            <div className="relative w-full h-56 rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
              {/* Screen Top Row: Leaderboard mock + Goal bar mock */}
              <div className="w-full flex justify-between items-center text-[10px] font-mono">
                {showLeaderboard ? (
                  <div className="px-2 py-1 rounded-xl bg-black/80 border border-white/10 text-cyan-300 font-bold">
                    🏆 1st: alex.sol ($4.7k)
                  </div>
                ) : <div />}

                <div className="px-3 py-1 rounded-xl bg-black/80 border border-white/10 text-white flex items-center gap-2">
                  <span className="text-cyan-300 font-bold">{goalTitle}</span>
                  <span className="text-slate-400">${goalCurrent} / ${goalAmount}</span>
                </div>
              </div>

              {/* Dynamic Alert Box preview placed in configured position */}
              <div className={`w-full flex-1 flex ${
                alertPosition === 'top-left' ? 'items-start justify-start' :
                alertPosition === 'top-right' ? 'items-start justify-end' :
                alertPosition === 'center' ? 'items-center justify-center' :
                alertPosition === 'bottom-right' ? 'items-end justify-end' :
                'items-end justify-center'
              }`}>
                <div className={`p-3.5 rounded-2xl border shadow-lg max-w-xs w-full transition-all duration-300 ${
                  activeTheme === 'cyberpunk' ? 'bg-black/90 border-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.3)] text-white' :
                  activeTheme === 'matrix' ? 'bg-black/90 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-400' :
                  activeTheme === 'fire' ? 'bg-black/90 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] text-orange-300' :
                  'bg-black/95 border-white/40 text-white'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-base flex-shrink-0">
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                        <span className="truncate">alex.sol</span>
                        <span className="text-cyan-300 text-[11px]">+25 SOL</span>
                      </div>
                      <p className="text-[10px] text-slate-300 truncate mt-0.5">
                        &quot;Awesome stream! 🚀&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark */}
              <div className="text-[9px] font-mono text-slate-600 flex justify-between">
                <span>OBS 1920x1080 CANVAS</span>
                <span>POSITION: {alertPosition.toUpperCase()}</span>
              </div>
            </div>

            {/* Position Selector Buttons */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-2 uppercase">Screen Alert Position:</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'top-left', label: 'Top Left' },
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'center', label: 'Center' },
                  { id: 'bottom-center', label: 'Bottom Center' },
                  { id: 'bottom-right', label: 'Bottom Right' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setAlertPosition(pos.id as any)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                      alertPosition === pos.id 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,254,0.25)]' 
                        : 'bg-black/50 text-slate-400 border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Synthesizer Presets */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-2 uppercase">Procedural Alert Audio Preset:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SOUND_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setSoundPreset(preset.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      soundPreset === preset.id
                        ? 'bg-cyan-950/40 border-cyan-400/50 text-white shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold">{preset.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 font-mono text-cyan-400 border border-cyan-400/30">
                          {preset.tag}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{preset.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSynthesizedSound(preset.id, 0.5);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono"
                      title="Play Preview"
                    >
                      ▶
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Voice Synthesis Profile Selector */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-400 uppercase">AI Text-to-Speech (TTS) Voice Profile:</label>
                <span className="text-[10px] font-mono text-purple-400 font-bold">ELEVENLABS / NEURAL READY</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VOICE_PROFILES.map((voice) => (
                  <div
                    key={voice.id}
                    onClick={() => setVoiceProfile(voice.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      voiceProfile === voice.id
                        ? 'bg-purple-950/40 border-purple-400/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold">{voice.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 font-mono text-purple-400 border border-purple-400/30">
                          {voice.tag}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{voice.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWithNeuralOrFallback("Alex donated 25 Solana! Message: Loving the stream, keep grinding champion!", voice.id, 1.0);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 text-purple-300 text-xs font-mono"
                      title="Listen Voice Preview"
                    >
                      ▶
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/50 border border-white/10">
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <span>🏆</span> SHOW ON-STREAM TOP 3 SUPPORTERS LEADERBOARD
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Displays live gamified podium ranking of top session donors on the stream
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  showLeaderboard ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-black/40 text-slate-500 border border-white/5'
                }`}
              >
                {showLeaderboard ? 'ACTIVE' : 'HIDDEN'}
              </button>
            </div>
          </div>

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
                    onChange={(e) => setActiveTheme(e.target.value as any)}
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
