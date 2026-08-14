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
    <div className="min-h-screen text-slate-100 selection:bg-cyan-500 selection:text-black overflow-hidden relative">
      {/* Header / Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-20 backdrop-blur-md bg-black/30 sticky top-0">
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
            <span className="font-extrabold tracking-wide text-lg text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-sans">
              LIVE CRYPTO <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase font-mono font-bold">Web3</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">GATEWAY DESCENTRALIZADO DE STREAMERS</span>
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <a href="#demo" className="hover:text-cyan-400 transition-colors">OBS Demo</a>
          <a href="#sui" className="hover:text-cyan-400 transition-colors text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            Suporte a SUI
          </a>
          <a href="#features" className="hover:text-cyan-400 transition-colors">Recursos</a>
          <a href="#comparison" className="hover:text-cyan-400 transition-colors">Por Que Web3?</a>
          <a href="#workflow" className="hover:text-cyan-400 transition-colors">Como Funciona</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="px-4 py-2 text-xs font-mono border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all rounded-xl font-bold tracking-wider"
          >
            LOGIN
          </Link>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 text-xs font-mono bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all rounded-xl tracking-wider"
          >
            DASHBOARD
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 radar-badge"></span>
          O LivePix Descentralizado, Multi-Chain & Compatível com SUI
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-tight font-sans">
          Receba Doações Cripto <br />
          <span className="text-gradient-brand drop-shadow-[0_0_35px_rgba(6,182,212,0.35)]">
            Direto na Sua Carteira.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Sem custódia de terceiros, sem bloqueios bancários e com taxas quase nulas. Aceite <strong className="text-cyan-400">SUI (Slush Wallet), SOL (Phantom), MATIC, USDT, USDC, ETH</strong> com alertas instantâneos no <strong className="text-white">OBS Studio</strong> e Text-To-Speech em menos de 500ms.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 relative z-10">
          <Link 
            href="/login" 
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 text-black hover:opacity-95 transition-all font-bold tracking-wider rounded-xl text-sm uppercase shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
          >
            <span>Conectar Minha Carteira</span>
          </Link>
          <a 
            href="#demo" 
            className="px-8 py-4 glass-card hover:border-cyan-400/50 text-slate-200 transition-all font-bold tracking-wider rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <span>Ver Demonstração OBS</span>
          </a>
        </div>

        {/* Supported Multi-Chain Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
          <span className="text-slate-400 font-bold">REDE MULTI-CHAIN:</span>
          <span className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            SUI Protocol (Slush Wallet)
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-300 font-bold">
            Solana (SOL)
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 font-bold">
            Polygon (POL/MATIC)
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-blue-950/50 border border-blue-500/30 text-blue-300 font-bold">
            Base / Arbitrum
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-bold">
            USDT / USDC / DAI
          </span>
        </div>
      </section>

      {/* Interactive Video / OBS Stream Demo Section */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-gradient-cyan font-sans">
            SIMULAÇÃO AO VIVO NO OBS STUDIO
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
                <span className="text-slate-200 font-bold">🎯 Meta: Setup Novo</span>
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
                    <div className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-2xl font-bold shrink-0 text-cyan-400">
                      SUI
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">NOVA DOAÇÃO CRIPTO!</div>
                      <div className="text-xl font-black mt-0.5 font-sans">25 SUI ($87.50 USD)</div>
                      <div className="text-xs text-slate-300 font-mono">de: 0x8f3c...Slush</div>
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
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2 cursor-pointer font-mono"
              >
                <span>⚡ Testar Alerta Instantâneo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SUI Highlight Section */}
      <section id="sui" className="max-w-7xl mx-auto px-6 py-16 relative z-10 border-t border-white/5">
        <div className="glass-card p-8 sm:p-12 rounded-3xl border border-cyan-500/30 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-mono uppercase mb-4">
                💧 Compatibilidade Nativa SUI
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight font-sans">
                Suporte Completo ao <br />
                <span className="text-gradient-cyan">Ecossistema SUI & Slush Wallet</span>
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Além do suporte multi-chain para Solana e redes EVM, o Live Crypto aceita pagamentos em **SUI nativo** com integração direta à **Slush Wallet** (e Sui Wallet). O streamer cadastra seu endereço Sui (0x...) e recebe os fundos em segundos com confirmação sub-segundo!
              </p>
              <div className="mt-6 flex flex-wrap gap-3 font-mono text-xs">
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/10">
                  <div className="text-cyan-400 font-bold">✓ Sub-segundo</div>
                  <div className="text-slate-400 text-[11px]">Finalidade quase instantânea</div>
                </div>
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/10">
                  <div className="text-cyan-400 font-bold">✓ Slush Wallet</div>
                  <div className="text-slate-400 text-[11px]">1-Click ou QR Code Mobile</div>
                </div>
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/10">
                  <div className="text-cyan-400 font-bold">✓ Sem Custódia</div>
                  <div className="text-slate-400 text-[11px]">Direto na sua carteira Sui</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-950/90 rounded-2xl border border-cyan-500/30 shadow-2xl">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">CHECKOUT SUI AO VIVO:</div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-zinc-900 border border-white/10 flex justify-between items-center">
                  <span className="text-slate-300">Moeda Selecionada:</span>
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded font-bold">SUI Protocol</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-white/10 flex justify-between items-center">
                  <span className="text-slate-300">Carteira Suportada:</span>
                  <span className="text-white font-bold">Slush Wallet / Sui Wallet</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-white/10 flex justify-between items-center">
                  <span className="text-slate-300">Tempo de Resposta OBS:</span>
                  <span className="text-emerald-400 font-bold">&lt; 400ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-cyan-400 font-sans">
            RECURSOS DE PONTA
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">CRIADO PARA STREAMERS E CRIADORES DE CONTEÚDO WEB3</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl relative group transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold mb-6">
              🔒
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 font-sans">100% Sem Custódia</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              O Live Crypto nunca retém seu dinheiro. Os fundos saem da carteira do espectador e caem instantaneamente na sua carteira pessoal (SUI, Solana ou EVM).
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl relative group transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl font-bold mb-6">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 font-sans">Alertas & TTS ao Vivo</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Conexão WebSocket de baixa latência diretamente no OBS Browser Source. Toca áudios customizados do IPFS, exibe GIFs animados e lê a mensagem do doador em voz alta.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl relative group transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold mb-6">
              📱
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 font-sans">1-Click ou QR Code</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              O espectador pode conectar sua carteira Web3 (Slush, Phantom, MetaMask) para doar em 1 clique ou simplesmente escanear o QR Code de qualquer aplicativo mobile.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-gradient-cyan font-sans">
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
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-cyan-400 font-sans">
            PROTOCOLO DO STREAMER
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">COMECE A RECEBER EM 3 PASSOS SIMPLES</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-mono">
          <div className="glass-card p-6 rounded-xl space-y-3">
            <div className="text-cyan-400 font-bold text-base">&gt; PASSO 01 // CONECTAR</div>
            <h4 className="text-white font-bold text-sm uppercase">Login com a Carteira</h4>
            <p className="text-slate-400 leading-relaxed">
              Autentique-se via SIWE com sua carteira Web3. Sem senhas e com proteção criptográfica.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-3">
            <div className="text-purple-400 font-bold text-base">&gt; PASSO 02 // CONFIGURAR</div>
            <h4 className="text-white font-bold text-sm uppercase">Definir Metas & Carteiras</h4>
            <p className="text-slate-400 leading-relaxed">
              Cadastre suas carteiras de recebimento (SUI, Solana, Polygon, etc.) e configure o visual do seu overlay.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-3">
            <div className="text-emerald-400 font-bold text-base">&gt; PASSO 03 // OBS & STREAM</div>
            <h4 className="text-white font-bold text-sm uppercase">Adicionar no OBS Studio</h4>
            <p className="text-slate-400 leading-relaxed">
              Copie o link do seu Browser Source para o OBS Studio. Os alertas surgirão na live com som e TTS ao vivo!
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
