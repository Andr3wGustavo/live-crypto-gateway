"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchLiveCryptoPrices, SUPPORTED_TOKENS } from '@/services/coingecko';

export default function Home() {
  const [demoAlertActive, setDemoAlertActive] = useState(false);
  const [demoTheme, setDemoTheme] = useState<'cyberpunk' | 'matrix' | 'fire' | 'minimal'>('cyberpunk');
  const [selectedWorkflowNode, setSelectedWorkflowNode] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedConceptIndex, setSelectedConceptIndex] = useState<number>(0);
  const [calculatorAmount, setCalculatorAmount] = useState<number>(1000);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, { usd: number; change24h: number }>>({});
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);

  // Fetch CoinGecko live prices
  useEffect(() => {
    fetchLiveCryptoPrices().then((prices) => setCryptoPrices(prices));
    const interval = setInterval(() => {
      fetchLiveCryptoPrices().then((prices) => setCryptoPrices(prices));
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const triggerDemoAlert = () => {
    setDemoAlertActive(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Alex donated 25 Solana! Message: Loving the stream, keep grinding champion!");
      utterance.rate = 0.95;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => {
      setDemoAlertActive(false);
    }, 6500);
  };

  const workflowNodes = [
    {
      id: 1,
      name: "1. Web3 Donation Trigger",
      type: "Input / Web3 & QR Trigger",
      badge: "PHANTOM / METAMASK / SUI / QR",
      badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      description: "The viewer selects their preferred cryptocurrency (SOL, SUI, ETH, POL, BTC Lightning, USDT, USDC) and executes a 1-Click Web3 transaction or scans the dynamic QR code on their mobile wallet.",
      payloadSnippet: `{\n  "network": "SOLANA_MAINNET",\n  "amount": "25.0",\n  "sender": "alex.sol",\n  "message": "Loving the stream, keep grinding! 🚀"\n}`
    },
    {
      id: 2,
      name: "2. Non-Custodial Settlement",
      type: "Execution / Direct P2P Transfer",
      badge: "100% NON-CUSTODIAL",
      badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      description: "Funds transfer peer-to-peer straight into the streamer's personal self-custody wallet. Zero custody, zero escrow delays, and zero chargeback risks.",
      payloadSnippet: `// Direct P2P on-chain settlement\nawait connection.sendTransaction(tx, [payer]);\n// Immediate finality in < 400ms`
    },
    {
      id: 3,
      name: "3. WebSocket & Redis Pub/Sub",
      type: "Event Dispatch / < 400ms Latency",
      badge: "ULTRA-LOW LATENCY",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      description: "Our high-speed node engine detects block confirmation and publishes the donation payload through Redis Pub/Sub. The event streams to the OBS Studio WebSocket tunnel in under 400 milliseconds.",
      payloadSnippet: `redis.publish("streamer:42:events", {\n  "event": "DONATION",\n  "amount": 25.0,\n  "currency": "SOL",\n  "fiatValue": 4750.00\n});`
    },
    {
      id: 4,
      name: "4. OBS Studio Browser Overlay",
      type: "Visual Action / Audio + Voice TTS",
      badge: "BROWSER SOURCE (NO PLUGIN)",
      badgeColor: "bg-orange-500/15 text-orange-300 border-orange-500/30",
      description: "OBS Studio displays the animated frosted-glass alert card, plays custom sound chimes, increments the live goal progress bar, and reads the donor's message using speech synthesis.",
      payloadSnippet: `speechSynthesis.speak("Alex donated 25 SOL. Message: Loving the stream!");`
    }
  ];

  const designConcepts = [
    {
      title: "Cyberpunk Terminal HUD",
      category: "DESIGN SYSTEM",
      image: "/brand/Generated Image August 09, 2026 - 1_03AM.jpg",
      description: "Ultra-modern glassmorphic HUD designed specifically for high-intensity gaming and IRL streaming."
    },
    {
      title: "Streamer Control Room",
      category: "DASHBOARD ARCHITECTURE",
      image: "/brand/Generated Image August 09, 2026 - 1_07AM.jpg",
      description: "Modular creator command center to manage multi-chain payout addresses, live goal widgets, and alert sounds."
    },
    {
      title: "1-Click Donor Checkout",
      category: "USER EXPERIENCE",
      image: "/brand/Generated Image August 09, 2026 - 1_08AM.jpg",
      description: "Frictionless checkout experience supporting Phantom, MetaMask, Sui Slush, and mobile camera QR code payments."
    },
    {
      title: "Real-Time Block Engine",
      category: "ON-CHAIN MONITOR",
      image: "/brand/Generated Image August 09, 2026 - 1_19AM.jpg",
      description: "Sub-second verification engine listening to Solana, Sui, and EVM network blocks."
    },
    {
      title: "Decentralized Creator Economy",
      category: "PRODUCT VISION",
      image: "/brand/ChatGPT Image Aug 12, 2026, 12_28_01 PM.png",
      description: "Returning 100% financial sovereignty to content creators across Twitch, YouTube, Kick, and X."
    }
  ];

  const netPlatformTake = (calculatorAmount * 0.99).toFixed(2);
  const platformFee = (calculatorAmount * 0.01).toFixed(2);
  const traditionalTake = (calculatorAmount * 0.82).toFixed(2);
  const moneySaved = (parseFloat(netPlatformTake) - parseFloat(traditionalTake)).toFixed(2);

  return (
    <div className="min-h-screen bg-black text-slate-100 selection:bg-cyan-400 selection:text-black overflow-hidden relative font-sans">
      
      {/* Floating Pill Navbar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sticky top-4 z-50">
        <header className="px-5 py-3 flex items-center justify-between border border-white/10 rounded-full backdrop-blur-2xl bg-black/75 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,242,254,0.35)] border border-cyan-400/30 bg-zinc-950 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <Image 
                src="/brand/logo-png.png" 
                alt="Live Crypto Logo" 
                width={32} 
                height={32}
                className="object-contain"
              />
            </div>
            <span className="font-extrabold text-sm tracking-wide text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-sans">
              LIVE CRYPTO <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 font-mono font-bold border border-cyan-400/30">v2.0</span>
            </span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#pipeline" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#demo" className="hover:text-cyan-400 transition-colors">OBS Simulator</a>
            <a href="#ticker" className="hover:text-cyan-400 transition-colors">Live Prices</a>
            <a href="#concepts" className="hover:text-cyan-400 transition-colors">Showcase</a>
            <a href="#calculator" className="hover:text-cyan-400 transition-colors">Earnings Calculator</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="glass-btn px-4 py-1.5 text-xs font-mono rounded-full font-bold text-slate-200 hover:text-white"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard" 
              className="glass-btn-primary px-4 py-1.5 text-xs font-mono rounded-full tracking-wide"
            >
              Dashboard ⚡
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center relative z-10 flex flex-col items-center">
        <div className="badge-punchy bg-cyan-950/40 text-cyan-300 border-cyan-500/30 mb-6 shadow-[0_0_20px_rgba(0,242,254,0.15)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 radar-dot"></span>
          NON-CUSTODIAL WEB3 DONATION ENGINE FOR STREAMERS
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-tight font-sans">
          Receive Crypto Donations <br />
          <span className="text-gradient-cyan drop-shadow-[0_0_40px_rgba(0,242,254,0.3)]">
            Straight to Your Wallet.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed font-sans">
          The sovereign streaming infrastructure connecting viewers to your <strong className="text-white">OBS Studio</strong>. Accept <strong className="text-cyan-300">Solana, SUI, Polygon, Base, Ethereum & Bitcoin Lightning</strong> in &lt; 400ms with animated overlays, sound chimes, and AI voice Text-to-Speech.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 relative z-10">
          <Link 
            href="/login" 
            className="glass-btn-primary px-8 py-4 text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 font-mono font-bold"
          >
            <span>Connect Wallet &amp; Launch</span>
            <span className="text-base">⚡</span>
          </Link>
          <a 
            href="#demo" 
            className="glass-btn px-8 py-4 text-slate-200 rounded-2xl text-sm flex items-center justify-center gap-2 font-mono font-bold"
          >
            <span>▶ Test OBS Simulator</span>
          </a>
        </div>

        {/* Multi-Chain Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
          <span className="text-slate-500 font-bold uppercase tracking-wider">Supported Networks:</span>
          <span className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold">
            ⚡ Solana (SOL)
          </span>
          <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 font-bold">
            💧 Sui Protocol (Slush)
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 font-bold">
            🟣 Polygon (POL)
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-950/50 border border-blue-500/30 text-blue-300 font-bold">
            🔷 Base &amp; Arbitrum
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-300 font-bold">
            🟠 Bitcoin Lightning (LN)
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-bold">
            💵 USDT &amp; USDC
          </span>
        </div>
      </section>

      {/* Cinematic Hero Video Banner Showcase */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        <div className="glass-panel p-3 sm:p-4 rounded-3xl border border-white/10 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
              <span className="text-slate-400 ml-2 font-bold">LIVE CRYPTO HUD // STREAM PREVIEW</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 radar-dot"></span>
              <span className="text-emerald-400 font-bold">ON-AIR 1080P 60FPS</span>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 group">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 contrast-110"
            >
              <source src="/brand/animation.mp4" type="video/mp4" />
              <source src="/brand/consegue_fazer_um_video_de_um.mp4" type="video/mp4" />
            </video>

            {/* In-Video Live Overlay Mockup */}
            <div className="absolute top-6 right-6 max-w-sm w-full p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-cyan-400/40 shadow-[0_10px_35px_rgba(0,242,254,0.25)] animate-float-gentle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">cryptoking.sol</span>
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-400/30">
                      +25.0 SOL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 font-sans line-clamp-1">
                    &quot;Best live streamer on Twitch! Keep crushing it! 🚀&quot;
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>🔊 Text-to-Speech: ACTIVE</span>
                <span className="text-emerald-400 font-bold">SETTLED IN 380MS</span>
              </div>
            </div>

            {/* Bottom Streamer Meta Bar */}
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">DONATION GOAL:</span>
                <span className="text-white font-bold">Upgrade Stream Setup (78%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-36 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 w-[78%]"></div>
                </div>
                <span className="text-cyan-300 font-bold">$780 / $1,000 USD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live CoinGecko Real-Time Price Ticker */}
      <section id="ticker" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="glass-panel p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-3 text-xs font-mono">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              REAL-TIME CRYPTO MARKET RATES (COINGECKO API)
            </span>
            <span className="text-[11px] text-slate-500">Auto-refreshing live feeds</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SUPPORTED_TOKENS.slice(0, 5).map((token) => {
              const priceData = cryptoPrices[token.symbol];
              const price = priceData?.usd || token.defaultUSD;
              const change = priceData?.change24h || 0;
              const isPositive = change >= 0;

              return (
                <div key={token.symbol} className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                      <span>{token.icon}</span> {token.symbol}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 text-base font-black text-slate-100 font-mono">
                    ${price.toLocaleString('en-US', { minimumFractionDigits: price < 1 ? 4 : 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive OBS Alert Simulator */}
      <section id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="text-center mb-8">
          <div className="badge-punchy bg-purple-950/40 text-purple-300 border-purple-500/30 mb-3">
            INTERACTIVE OBS ALERT ENGINE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Test the Real-Time Alert &amp; TTS Voice
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto font-sans">
            Experience how donation alerts appear in your OBS Studio broadcast with zero delay and speech synthesis.
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-lg font-bold text-white font-mono">Alert Configuration</h3>
            
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">Select Overlay Aesthetic Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {(['cyberpunk', 'matrix', 'fire', 'minimal'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDemoTheme(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                      demoTheme === t 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,254,0.2)]' 
                        : 'bg-black/50 text-slate-400 border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Simulated Donor:</span>
                <span className="text-white font-bold">Alex (alex.sol)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Simulated Token:</span>
                <span className="text-cyan-300 font-bold">25.0 SOL (~$4,750 USD)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Message:</span>
                <span className="text-slate-200 italic">&quot;Loving the stream, keep grinding!&quot;</span>
              </div>
            </div>

            <button
              onClick={triggerDemoAlert}
              className="w-full glass-btn-primary py-3.5 rounded-xl text-sm font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>🚀 Trigger Live OBS Alert + Audio TTS</span>
            </button>
          </div>

          {/* Screen simulator column */}
          <div className="lg:col-span-7">
            <div className="aspect-video rounded-2xl bg-black border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>OBS BROWSER SOURCE CANVAS (1920x1080)</span>
                <span className={demoAlertActive ? 'text-cyan-400 font-bold animate-pulse' : 'text-slate-600'}>
                  {demoAlertActive ? '🔴 ALERT BROADCASTING' : 'IDLE STANDBY'}
                </span>
              </div>

              {/* Alert Card in Simulator */}
              <div className="flex items-center justify-center min-h-[140px]">
                {demoAlertActive ? (
                  <div className={`w-full max-w-md p-5 rounded-2xl backdrop-blur-xl border animate-float-gentle ${
                    demoTheme === 'cyberpunk' ? 'bg-black/90 border-cyan-400/60 shadow-[0_0_35px_rgba(0,242,254,0.3)]' :
                    demoTheme === 'matrix' ? 'bg-black/90 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.3)] text-emerald-400' :
                    demoTheme === 'fire' ? 'bg-black/90 border-orange-500/60 shadow-[0_0_35px_rgba(249,115,22,0.3)] text-orange-300' :
                    'bg-black/90 border-white/30 text-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-2xl">
                        ⚡
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white font-mono">alex.sol</span>
                          <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/40">
                            +25.0 SOL
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1.5 font-sans">
                          &quot;Loving the stream, keep grinding champion! 🚀&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-600 text-xs font-mono">
                    Press &quot;Trigger Live OBS Alert&quot; to test the real-time visual &amp; audio simulation
                  </div>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-500 text-center">
                Sub-400ms end-to-end WebSocket transmission • Non-custodial direct settlement
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Architecture Workflow Pipeline */}
      <section id="pipeline" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="text-center mb-10">
          <div className="badge-punchy bg-cyan-950/40 text-cyan-300 border-cyan-500/30 mb-3">
            DECENTRALIZED ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            How the Live Crypto Engine Works
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto font-sans">
            From donor wallet approval to OBS Studio overlay in under 400 milliseconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowNodes.map((node) => (
            <div
              key={node.id}
              onClick={() => setSelectedWorkflowNode(node.id)}
              className={`glass-card p-5 rounded-2xl cursor-pointer transition-all ${
                selectedWorkflowNode === node.id 
                  ? 'border-cyan-400/70 shadow-[0_0_25px_rgba(0,242,254,0.18)] bg-zinc-950/80' 
                  : 'hover:border-white/20'
              }`}
            >
              <div className={`badge-punchy ${node.badgeColor} mb-3 text-[10px]`}>
                {node.badge}
              </div>
              <h4 className="text-base font-bold text-white mb-1.5 font-sans">{node.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{node.description}</p>
            </div>
          ))}
        </div>

        {/* Selected Workflow Node Code Inspector */}
        <div className="mt-6 glass-panel p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2 border-b border-white/10 pb-2">
            <span>CODE PAYLOAD // {workflowNodes.find(n => n.id === selectedWorkflowNode)?.name}</span>
            <span className="text-cyan-400">STATUS: VERIFIED ON-CHAIN</span>
          </div>
          <pre className="text-xs font-mono text-cyan-300 bg-black/70 p-4 rounded-xl overflow-x-auto">
            <code>{workflowNodes.find(n => n.id === selectedWorkflowNode)?.payloadSnippet}</code>
          </pre>
        </div>
      </section>

      {/* Visual Design Concepts Showcase */}
      <section id="concepts" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="text-center mb-10">
          <div className="badge-punchy bg-purple-950/40 text-purple-300 border-purple-500/30 mb-3">
            IMMERSIVE STREAMING SUITE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Designed for Modern Streamers &amp; Communities
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designConcepts.map((concept, idx) => (
            <div key={idx} className="glass-card rounded-2xl overflow-hidden border border-white/10 group">
              <div className="relative aspect-video overflow-hidden bg-zinc-950">
                <Image
                  src={concept.image}
                  alt={concept.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 badge-punchy bg-black/80 text-cyan-300 border-cyan-400/30 text-[10px]">
                  {concept.category}
                </div>
              </div>
              <div className="p-5">
                <h4 className="text-base font-bold text-white mb-1.5 font-sans">{concept.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{concept.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings & Fee Comparison Calculator */}
      <section id="calculator" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="badge-punchy bg-emerald-950/40 text-emerald-300 border-emerald-500/30 mb-3">
              CREATOR REVENUE SOVEREIGNTY
            </div>
            <h2 className="text-3xl font-extrabold text-white font-sans">
              Stop Giving Away 15% to 30% of Your Stream Income
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 font-sans">
              Traditional donation platforms and credit card processors charge heavy transaction fees and subject creators to fraudulent chargebacks.
            </p>
          </div>

          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-400">Monthly Stream Donations:</span>
                <span className="text-cyan-400 font-bold text-sm">${calculatorAmount.toLocaleString('en-US')} USD</span>
              </div>
              <input 
                type="range" 
                min="100" 
                max="20000" 
                step="100"
                value={calculatorAmount}
                onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/60 border border-white/5">
                <div className="text-[11px] text-slate-400 font-mono">Traditional Platforms:</div>
                <div className="text-xl font-bold text-red-400 font-mono mt-1">${traditionalTake}</div>
                <div className="text-[10px] text-slate-500 mt-1">High cuts + chargeback exposure</div>
              </div>
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-400/30">
                <div className="text-[11px] text-cyan-300 font-mono">With Live Crypto:</div>
                <div className="text-xl font-bold text-cyan-300 font-mono mt-1">${netPlatformTake}</div>
                <div className="text-[10px] text-emerald-400 mt-1 font-bold">You keep +${moneySaved} extra</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="text-center mb-8">
          <div className="badge-punchy bg-cyan-950/40 text-cyan-300 border-cyan-500/30 mb-3">
            CLEAR &amp; TRANSPARENT
          </div>
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Do I need to install an OBS plugin to use Live Crypto?",
              a: "No plugin installation is needed! Live Crypto utilizes the universal OBS Browser Source standard. You simply copy your unique overlay URL from your dashboard and paste it into OBS Studio as a Browser Source. It works immediately on Windows, Mac, and Linux."
            },
            {
              q: "How do I receive the crypto donations?",
              a: "Live Crypto is 100% non-custodial. When a viewer donates Solana, SUI, Bitcoin Lightning, Polygon, Base, or Ethereum, the transaction routes directly to your personal self-custody wallet address. The platform never holds your funds."
            },
            {
              q: "Can viewers donate with their mobile phones?",
              a: "Yes! The checkout page automatically renders dynamic QR codes for Solana Pay, EIP-681, and Lightning invoices. Viewers can open Binance, Phantom, Coinbase, or TrustWallet on their phones, point their camera, and approve in seconds."
            },
            {
              q: "Are there any credit card chargeback risks?",
              a: "Zero chargeback risks. All blockchain transactions are cryptographically signed and immutable on-chain. Once confirmed, payments cannot be reversed by fraudulent donors."
            },
            {
              q: "How does the Text-to-Speech (TTS) voice alert work?",
              a: "When a donation occurs, the OBS Browser Source receives the event via sub-second WebSocket connection and invokes the browser speech synthesis engine to read the donor's message out loud in real time."
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-white font-sans"
              >
                <span>{item.q}</span>
                <span className="text-cyan-400 text-base">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed font-sans border-t border-white/5 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center border-t border-white/10 relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,242,254,0.4)] border border-cyan-400/30 bg-zinc-950 flex items-center justify-center p-2 mb-4">
            <Image 
              src="/brand/logo-png.png" 
              alt="Live Crypto" 
              width={48} 
              height={48}
              className="object-contain"
            />
          </div>
          <h3 className="text-2xl font-black text-white font-sans">
            Ready to Revolutionize Your Stream Donations?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md font-sans">
            Join the decentralized creator economy. Zero chargebacks, non-custodial payouts, and instant OBS alerts.
          </p>

          <div className="mt-6 flex gap-4">
            <Link 
              href="/login" 
              className="glass-btn-primary px-8 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider"
            >
              Get Started for Free ⚡
            </Link>
          </div>

          <div className="mt-12 text-[11px] font-mono text-slate-500">
            © 2026 Live Crypto Protocol. 100% Non-Custodial Streaming Infrastructure. Universal English Edition.
          </div>
        </div>
      </footer>
    </div>
  );
}
