"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-hidden relative scanlines">
      {/* Dynamic background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none"></div>

      {/* Header / Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          {/* Logo Concept: Lightning bolt intersecting a circle (representing global freedom/speed) */}
          <div className="relative w-8 h-8 rounded-full border border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.3)] bg-cyan-950/20">
            <span className="text-cyan-400 text-lg font-black italic">⚡</span>
            <div className="absolute inset-0 rounded-full border border-dashed border-fuchsia-400/40 animate-[spin_20s_linear_infinite]"></div>
          </div>
          <span className="font-sans font-black tracking-widest text-lg bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            LIVE CRYPTO
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-mono text-slate-400">
          <a href="#features" className="hover:text-cyan-400 transition-colors">FEATURES</a>
          <a href="#workflow" className="hover:text-cyan-400 transition-colors">HOW IT WORKS</a>
          <a href="#philosophy" className="hover:text-cyan-400 transition-colors">OUR VISION</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-4 py-2 text-xs font-mono border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all duration-300 rounded uppercase font-bold tracking-wider"
          >
            [ LOGIN ]
          </Link>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 text-xs font-mono bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-300 rounded uppercase font-bold tracking-wider"
          >
            DASHBOARD
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/10 text-cyan-400 text-[10px] font-mono tracking-widest uppercase mb-6 shadow-[0_0_10px_rgba(6,182,212,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          Decentralizing Live Stream Donations
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-black tracking-tight text-white max-w-4xl leading-none">
          Accept Crypto Donations
          <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-teal-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            With Zero Custody.
          </span>
        </h1>

        <p className="mt-8 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed font-mono">
          Analogous to LivePix but fully decentralized. Get paid instantly in SOL, MATIC, or stablecoins directly to your personal wallets with real-time OBS alerts and custom TTS.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 relative z-10">
          <Link 
            href="/login" 
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-400 text-black hover:opacity-90 transition-all font-bold tracking-wider rounded text-sm uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Get Started Now
          </Link>
          <a 
            href="#workflow" 
            className="px-8 py-4 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-950/10 text-slate-300 transition-all font-bold tracking-wider rounded text-sm uppercase font-mono"
          >
            [ Watch Tutorial ]
          </a>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest text-cyan-400 font-sans">
            -- UNCHAINED FEATURES --
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">POWERED BY SECURE MULTI-CHAIN WEB3 INFRASTRUCTURE</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 border border-white/5 bg-zinc-950/40 rounded backdrop-blur-sm relative group hover:border-cyan-500/40 transition-all duration-500">
            <div className="absolute top-0 right-0 w-8 h-[1px] bg-cyan-400 group-hover:w-16 transition-all"></div>
            <div className="w-12 h-12 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xl font-bold mb-6 font-mono">
              🔒
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3">100% Non-Custodial</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              We never hold, process, or see your private keys. All signing happens directly client-side. Platform fees (1-2%) and streamer payouts are split atomically in a single contract instruction.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 border border-white/5 bg-zinc-950/40 rounded backdrop-blur-sm relative group hover:border-cyan-500/40 transition-all duration-500">
            <div className="absolute top-0 right-0 w-8 h-[1px] bg-fuchsia-400 group-hover:w-16 transition-all"></div>
            <div className="w-12 h-12 rounded bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 text-xl font-bold mb-6 font-mono">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3">Real-time OBS Alerts</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Donations trigger immediate Redis Pub/Sub events routed through secure WebSocket tunnels directly to your OBS Browser Source. Plays custom sound effects, GIFs, and speaks messages out loud.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 border border-white/5 bg-zinc-950/40 rounded backdrop-blur-sm relative group hover:border-cyan-500/40 transition-all duration-500">
            <div className="absolute top-0 right-0 w-8 h-[1px] bg-teal-400 group-hover:w-16 transition-all"></div>
            <div className="w-12 h-12 rounded bg-teal-500/10 flex items-center justify-center text-teal-400 text-xl font-bold mb-6 font-mono">
              🌐
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3">Universal Gateway</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Supports web3-connected wallets (MetaMask, Phantom, WalletConnect) for a one-click payment, alongside a robust QR-code CEX mode for manual transfers directly from exchange mobile apps.
            </p>
          </div>
        </div>
      </section>

      {/* How it works (Interactive workflow) */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-white/5 bg-zinc-950/10">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest text-cyan-400 font-sans">
            -- STREAMER PROTOCOL --
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">THREE STEP SETUP TO FREEDOM OF DONATIONS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 font-mono text-xs relative">
          {/* Step 1 */}
          <div className="space-y-4">
            <div className="text-cyan-400 font-bold text-lg">&gt; STEP 01 // CONNECT</div>
            <h4 className="text-white font-bold text-sm uppercase">Login & Secure Identity</h4>
            <p className="text-slate-400 leading-relaxed">
              Authenticate via Sign-in with Ethereum (SIWE) using your crypto wallet. There are no passwords to lose. The system registers your address securely and gives you a protected dashboard.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-4">
            <div className="text-fuchsia-400 font-bold text-lg">&gt; STEP 02 // CONFIG</div>
            <h4 className="text-white font-bold text-sm uppercase">Add Wallets & Choose Theme</h4>
            <p className="text-slate-400 leading-relaxed">
              Add your Polygon and Solana payout addresses. Select your active overlay theme (Cyberpunk, Matrix, Fire, or Minimal) and upload custom alert sound files or animations.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="text-teal-400 font-bold text-lg">&gt; STEP 03 // LAUNCH</div>
            <h4 className="text-white font-bold text-sm uppercase">Paste OBS Browser Source</h4>
            <p className="text-slate-400 leading-relaxed">
              Copy your unique OBS overlay link from the dashboard and paste it into OBS Studio. Add the donation link to your stream channel, and you are ready to receive real-time, non-custodial alerts!
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy / Copywriting section */}
      <section id="philosophy" className="max-w-5xl mx-auto px-6 py-24 text-center relative z-10 border-t border-white/5">
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-6">
          Your Stream. Your Money.
          <span className="block mt-1 text-cyan-400">Decentralized Control.</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono max-w-2xl mx-auto mb-10">
          Traditional donation platforms take high cuts, delay payouts, and freeze accounts arbitrarily. Live Crypto operates directly on-chain, ensuring every donation is transferred to you instantly, atomically, and without middleman custodian dependencies. Take back your financial sovereignty.
        </p>
        <Link 
          href="/login" 
          className="px-8 py-4 bg-cyan-500 text-black hover:bg-cyan-400 transition-all font-bold tracking-widest rounded text-xs uppercase font-mono shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          [ LAUNCH SECURE CONSOLE ]
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-[10px] font-mono text-slate-500">
        <div>
          © {new Date().getFullYear()} LIVE CRYPTO SYSTEM. ALL RIGHTS RESERVED. MIT LICENSE.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-cyan-400 transition-colors">GITHUB</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">SECURITY AUDIT</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">API DOCS</a>
        </div>
      </footer>
    </div>
  );
}
