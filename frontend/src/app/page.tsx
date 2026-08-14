"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [demoAlertActive, setDemoAlertActive] = useState(false);
  const [demoTheme, setDemoTheme] = useState<'cyberpunk' | 'matrix' | 'fire' | 'minimal'>('cyberpunk');

  const triggerDemoAlert = () => {
    setDemoAlertActive(true);
    setTimeout(() => {
      setDemoAlertActive(false);
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 selection:bg-cyan-500 selection:text-black overflow-hidden relative">
      {/* Background glow radial orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none"></div>

      {/* Header / Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-20 backdrop-blur-md bg-black/20 sticky top-0">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-500/30 group-hover:scale-105 transition-transform bg-zinc-900 flex items-center justify-center">
            <Image 
              src="/brand/logo-png.png" 
              alt="Live Crypto Logo" 
              width={40} 
              height={40}
              className="object-contain p-1"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-lg text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              LIVE CRYPTO <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase font-mono">Web3</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">DECENTRALIZED STREAMING GATEWAY</span>
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#demo" className="hover:text-cyan-400 transition-colors">OBS Demo</a>
          <a href="#features" className="hover:text-cyan-400 transition-colors">Recursos</a>
          <a href="#comparison" className="hover:text-cyan-400 transition-colors">Por Que Web3?</a>
          <a href="#workflow" className="hover:text-cyan-400 transition-colors">Como Funciona</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="px-4 py-2 text-xs font-mono border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all rounded-lg font-semibold tracking-wider"
          >
            LOGIN
          </Link>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 text-xs font-mono bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all rounded-lg tracking-wider"
          >
            DASHBOARD
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-mono tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 radar-badge"></span>
          O LivePix Descentralizado & Multi-Chain
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Receba Doações Cripto <br />
          <span className="text-gradient-brand drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            Direto na Sua Carteira.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Sem custódia de terceiros, sem bloqueios bancários e com taxas quase nulas. Aceite <strong className="text-cyan-400">SOL, MATIC, USDT, USDC, ETH</strong> com alertas instantâneos no <strong className="text-white">OBS Studio</strong> e Text-To-Speech.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 relative z-10">
          <Link 
            href="/login" 
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 text-black hover:opacity-95 transition-all font-bold tracking-wider rounded-xl text-sm uppercase shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
          >
            <span>⚡ Conectar Minha Carteira</span>
          </Link>
          <a 
            href="#demo" 
            className="px-8 py-4 glass-card hover:border-cyan-400/50 text-slate-200 transition-all font-semibold tracking-wider rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <span>▶ Ver Demonstração OBS</span>
          </a>
        </div>

        {/* Supported Multi-Chain Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400">
          <span className="text-slate-500">SUPORTA MULTI-CHAIN:</span>
          <span className="px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-300">Solana (SOL)</span>
          <span className="px-2.5 py-1 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">Polygon (POL/MATIC)</span>
          <span className="px-2.5 py-1 rounded-md bg-blue-950/40 border border-blue-500/30 text-blue-300">Base / Arbitrum</span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">USDT / USDC / DAI</span>
          <span className="px-2.5 py-1 rounded-md bg-yellow-950/40 border border-yellow-500/30 text-yellow-300">BNB Chain</span>
        </div>
      </section>

      {/* Interactive Video / OBS Stream Demo Section */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-gradient-cyan">
            -- SIMULAÇÃO AO VIVO NO OBS STUDIO --
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">VEJA COMO O OVERLAY RESPONDE INSTANTANEAMENTE EM MENOS DE 500MS</p>
        </div>

        {/* Video Monitor Frame */}
        <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] bg-black">
          {/* Top Monitor Bar */}
          <div className="bg-zinc-900/90 border-b border-white/10 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block animate-pulse"></span>
              <span className="text-red-400 font-bold">LIVE STREAM // 1080p60</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">TEMA:</span>
              <div className="flex gap-1">
                {(['cyberpunk', 'matrix', 'fire', 'minimal'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDemoTheme(t)}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${demoTheme === t ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-slate-400 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Video Container with Overlaid Alert */}
          <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover opacity-85"
            >
              <source src="/brand/consegue_fazer_um_video_de_um.mp4" type="video/mp4" />
              <source src="/brand/animation.mp4" type="video/mp4" />
            </video>

            {/* Donation Goal Bar (Fixed Top-Right) */}
            <div className="absolute top-4 right-4 max-w-xs w-full glass-card p-3 rounded-xl border border-white/10 backdrop-blur-md z-20">
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-slate-300 font-bold">🎯 Meta: Setup Novo</span>
                <span className="text-cyan-400 font-bold">$350.00 / $500.00</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-800/80 rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full w-[70%] shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
              </div>
            </div>

            {/* Simulated Live Alert Box */}
            {demoAlertActive && (
              <div className="absolute inset-0 flex items-center justify-center p-4 z-30 pointer-events-none alert-enter">
                <div className={`p-6 rounded-2xl max-w-md w-full shadow-2xl backdrop-blur-xl border ${
                  demoTheme === 'cyberpunk' ? 'bg-zinc-900/90 border-cyan-400 text-white shadow-[0_0_40px_rgba(6,214,160,0.4)]' :
                  demoTheme === 'matrix' ? 'bg-black/95 border-green-500 text-green-400 font-mono shadow-[0_0_40px_rgba(0,255,0,0.4)]' :
                  demoTheme === 'fire' ? 'bg-zinc-950/90 border-orange-500 text-orange-200 shadow-[0_0_40px_rgba(249,115,22,0.4)]' :
                  'bg-slate-900/90 border-white/20 text-slate-100'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-3xl shrink-0">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">NOVA DOAÇÃO RECEBIDA</div>
                      <div className="text-xl font-black mt-0.5">0.5 SOL ($75.00 USD)</div>
                      <div className="text-xs text-slate-300 font-mono">de: 8x3s...F3aQ</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 text-sm italic text-slate-200">
                    &quot;Parabéns pela live, continue com o conteúdo incrível! 🚀&quot;
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Demo Trigger Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={triggerDemoAlert}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2 cursor-pointer"
              >
                <span>⚡ Testar Alerta Instantâneo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-cyan-400 font-sans">
            -- RECURSOS DE PONTA --
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">CRIADO PARA STREAMERS E CRIADORES DE CONTEÚDO WEB3</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-8 rounded-2xl relative group transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold mb-6">
              🔒
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3">100% Sem Custódia</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              O Live Crypto nunca retém seu dinheiro. Os fundos saem da carteira do espectador e caem instantaneamente na sua carteira pessoal (Solana ou EVM) via smart contract seguro.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 rounded-2xl relative group transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl font-bold mb-6">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3">Alertas & TTS ao Vivo</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Conexão WebSocket de baixa latência diretamente no OBS Browser Source. Toca áudios customizados do IPFS, exibe GIFs animados e lê a mensagem do doador em voz alta.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 rounded-2xl relative group transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold mb-6">
              📱
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3">1-Click ou QR Code</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              O espectador pode conectar sua carteira Web3 (Phantom, MetaMask, Rainbow) para pagar em 1 clique ou simplesmente escanear o QR Code direto do app da sua corretora (Binance, Bybit).
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Web3 Live Crypto vs Web2 LivePix / PayPal */}
      <section id="comparison" className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-gradient-cyan">
            Live Crypto vs Plataformas Tradicionais
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">A REVOLUÇÃO DA LIBERDADE FINANCEIRA PARA STREAMERS</p>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-white/10 text-slate-300">
                <th className="p-4">RECURSO</th>
                <th className="p-4 text-cyan-400 font-bold">LIVE CRYPTO (WEB3)</th>
                <th className="p-4 text-slate-500">LIVEPIX / PAYPAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="p-4 font-bold">Custódia do Dinheiro</td>
                <td className="p-4 text-emerald-400 font-bold">✓ 0% Custódia (Cai direto na sua carteira)</td>
                <td className="p-4 text-red-400">✗ Retido na plataforma por dias</td>
              </tr>
              <tr>
                <td className="p-4 font-bold">Risco de Chargeback / Estorno</td>
                <td className="p-4 text-emerald-400 font-bold">✓ ZERO (Transações blockchain são irreversíveis)</td>
                <td className="p-4 text-red-400">✗ Alto risco de golpe e estorno</td>
              </tr>
              <tr>
                <td className="p-4 font-bold">Alcance Global</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Espectadores de qualquer país podem doar</td>
                <td className="p-4 text-slate-400">✗ Limitado por moedas e bancos locais</td>
              </tr>
              <tr>
                <td className="p-4 font-bold">Privacidade & KYC</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Sem necessidade de CPF ou dados pessoais</td>
                <td className="p-4 text-slate-400">✗ Exige verificação e dados fiscais</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-cyan-400 font-sans">
            -- PROTOCOLO DO STREAMER --
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">COMECE A RECEBER EM 3 PASSOS SIMPLES</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-mono">
          <div className="glass-card p-6 rounded-xl space-y-3">
            <div className="text-cyan-400 font-bold text-base">&gt; PASSO 01 // CONECTAR</div>
            <h4 className="text-white font-bold text-sm uppercase">Login com a Carteira</h4>
            <p className="text-slate-400 leading-relaxed">
              Autentique-se via Sign-In with Ethereum (SIWE) ou Solana. Sem senhas para esquecer e com segurança criptográfica garantida.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-3">
            <div className="text-purple-400 font-bold text-base">&gt; PASSO 02 // CONFIGURAR</div>
            <h4 className="text-white font-bold text-sm uppercase">Definir Metas & Temas</h4>
            <p className="text-slate-400 leading-relaxed">
              Cadastre suas carteiras (Solana, Polygon, etc.), escolha o tema do seu overlay e personalize seus alertas sonoros no IPFS.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-3">
            <div className="text-emerald-400 font-bold text-base">&gt; PASSO 03 // OBS & STREAM</div>
            <h4 className="text-white font-bold text-sm uppercase">Adicionar no OBS Studio</h4>
            <p className="text-slate-400 leading-relaxed">
              Copie o link do seu Browser Source para o OBS Studio. Compartilhe seu link de doação e veja os alertas aparecerem na tela ao vivo!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-cyan-500/20">
            <Image src="/brand/logo-png.png" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
          <span>LIVE CRYPTO GATEWAY © 2026 — 100% NON-CUSTODIAL</span>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-6">
          <Link href="/login" className="hover:text-cyan-400 transition-colors">Streamer Login</Link>
          <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
          <a href="#demo" className="hover:text-cyan-400 transition-colors">OBS Simulator</a>
        </div>
      </footer>
    </div>
  );
}
