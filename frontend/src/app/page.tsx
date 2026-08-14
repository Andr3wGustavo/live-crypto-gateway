"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [demoAlertActive, setDemoAlertActive] = useState(false);
  const [demoTheme, setDemoTheme] = useState<'cyberpunk' | 'matrix' | 'fire' | 'minimal'>('cyberpunk');
  const [selectedWorkflowNode, setSelectedWorkflowNode] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const triggerDemoAlert = () => {
    setDemoAlertActive(true);
    setTimeout(() => {
      setDemoAlertActive(false);
    }, 6000);
  };

  const workflowNodes = [
    {
      id: 1,
      name: "1. Trigger de Doação",
      type: "Input / Web3 Trigger",
      badge: "SLUSH / PHANTOM / METAMASK",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      description: "O espectador seleciona a moeda (SUI, SOL, POL, USDT) e assina a transferência em 1-Click ou escaneia o QR Code no app mobile.",
      payloadSnippet: `{\n  "network": "SUI_PROTOCOL",\n  "amount": "25.0",\n  "sender": "0x8f3c...Slush",\n  "message": "Top d+ a live! 🚀"\n}`
    },
    {
      id: 2,
      name: "2. Smart Contract Router",
      type: "Execution / Split Atômico",
      badge: "100% NON-CUSTODIAL",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      description: "O contrato inteligente divide instantaneamente 98% para o criador e 2% de taxa da plataforma em uma única instrução atômica on-chain.",
      payloadSnippet: `function donateNative(address payable streamer) external payable {\n    uint256 fee = (msg.value * 200) / 10000; // 2%\n    uint256 net = msg.value - fee;           // 98%\n    streamer.transfer(net);\n}`
    },
    {
      id: 3,
      name: "3. WebSocket & Redis Pub/Sub",
      type: "Event Dispatch / < 400ms",
      badge: "ULTRA LOW LATENCY",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      description: "O backend detecta o bloco validado e publica o evento no canal Redis do streamer. O WebSocket túnel despacha o alerta ao OBS em sub-segundo.",
      payloadSnippet: `redis.publish("streamer:1:events", {\n  "event": "DONATION",\n  "amount": 25.0,\n  "currency": "SUI",\n  "fiatValue": 87.50\n});`
    },
    {
      id: 4,
      name: "4. OBS Studio Overlay",
      type: "Visual Action / Áudio + TTS",
      badge: "BROWSER SOURCE",
      badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      description: "O OBS Studio toca o áudio customizado no IPFS, exibe o GIF animado, incrementa a barra da meta e lê a mensagem do fã com síntese de voz (TTS).",
      payloadSnippet: `speechSynthesis.speak("0x8f3c doou 25 SUI. Mensagem: Top d+ a live!");`
    }
  ];

  return (
    <div className="min-h-screen text-slate-100 selection:bg-cyan-500 selection:text-black overflow-hidden relative">
      {/* Floating Pill Navbar (n8n-inspired) */}
      <div className="max-w-6xl mx-auto px-6 pt-6 sticky top-4 z-40">
        <header className="px-6 py-3.5 flex items-center justify-between border border-white/10 rounded-full backdrop-blur-2xl bg-black/45 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-500/30 bg-zinc-900 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <Image 
                src="/brand/logo-png.png" 
                alt="Live Crypto Logo" 
                width={32} 
                height={32}
                className="object-contain"
              />
            </div>
            <span className="font-extrabold text-sm tracking-wide text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-sans">
              LIVE CRYPTO <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">v2.0</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#pipeline" className="hover:text-cyan-400 transition-colors">Como Funciona</a>
            <a href="#demo" className="hover:text-cyan-400 transition-colors">Simulador OBS</a>
            <a href="#bento" className="hover:text-cyan-400 transition-colors">Recursos</a>
            <a href="#comparison" className="hover:text-cyan-400 transition-colors">Por Que Web3?</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link 
              href="/login" 
              className="px-3.5 py-1.5 text-xs font-mono border border-white/15 text-slate-300 hover:text-white hover:border-cyan-400 transition-all rounded-full font-bold"
            >
              Login
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-1.5 text-xs font-mono bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all rounded-full tracking-wide"
            >
              Dashboard ⚡
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono tracking-wider uppercase mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 radar-badge"></span>
          O LivePix Descentralizado & Multi-Chain para Criadores
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-tight font-sans">
          Receba Doações Cripto <br />
          <span className="text-gradient-brand drop-shadow-[0_0_40px_rgba(6,182,212,0.35)]">
            Direto na Sua Carteira.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed font-sans">
          A infraestrutura não-custodial que conecta seus espectadores ao seu <strong className="text-white">OBS Studio</strong>. Aceite <strong className="text-cyan-400">SUI (Slush Wallet), SOL (Phantom), MATIC, USDT, USDC, ETH</strong> em menos de 400ms com alertas animados e voz TTS.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 relative z-10">
          <Link 
            href="/login" 
            className="px-8 py-4 bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 text-black hover:opacity-95 transition-all font-extrabold tracking-wider rounded-2xl text-sm uppercase shadow-[0_0_30px_rgba(6,182,212,0.45)] flex items-center justify-center gap-2 font-mono"
          >
            <span>Conectar Minha Carteira</span>
          </Link>
          <a 
            href="#demo" 
            className="px-8 py-4 glass-card hover:border-cyan-400/50 text-slate-200 transition-all font-bold tracking-wider rounded-2xl text-sm flex items-center justify-center gap-2 font-mono"
          >
            <span>▶ Testar Simulador OBS</span>
          </a>
        </div>

        {/* Multi-Chain Live Network Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
          <span className="text-slate-500 font-bold">REDE MULTI-CHAIN:</span>
          <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            💧 SUI Protocol (Slush)
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 font-bold">
            ⚡ Solana (SOL)
          </span>
          <span className="px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 font-bold">
            Polygon (POL)
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-950/50 border border-blue-500/30 text-blue-300 font-bold">
            Base / Arbitrum
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-bold">
            USDT / USDC
          </span>
        </div>
      </section>

      {/* n8n-INSPIRED INTERACTIVE WORKFLOW PIPELINE CANVAS */}
      <section id="pipeline" className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300 text-xs font-mono uppercase mb-3">
            ⚡ Arquitetura Descentralizada Interativa
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            Como o Fluxo de Dados Funciona
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">CLIQUE NOS NÓS DA PIPELINE PARA INSPECIONAR O CÓDIGO E O PAYLOAD</p>
        </div>

        {/* Flowchart Node Canvas (n8n Style) */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 relative overflow-hidden bg-dot-grid">
          
          {/* Node Grid Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            {workflowNodes.map((node) => {
              const isSelected = selectedWorkflowNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedWorkflowNode(node.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected 
                      ? 'bg-zinc-900 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)] scale-[1.02]' 
                      : 'bg-zinc-950/80 border-white/10 hover:border-white/20 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{node.type}</span>
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 node-pulse-cyan' : 'bg-slate-600'}`}></span>
                  </div>

                  <h3 className="text-sm font-bold text-white font-sans mb-1">{node.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border mb-3 ${node.badgeColor}`}>
                    {node.badge}
                  </span>
                  
                  <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3">
                    {node.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Node Inspector Panel (Bottom) */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">NÓ SELECIONADO:</span>
                <span className="text-sm font-bold text-white font-sans">{workflowNodes.find(n => n.id === selectedWorkflowNode)?.name}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {workflowNodes.find(n => n.id === selectedWorkflowNode)?.description}
              </p>
            </div>

            <div className="bg-black/90 p-4 rounded-2xl border border-white/10 font-mono text-[11px] text-cyan-300 overflow-x-auto shadow-inner">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                <span>PAYLOAD / SMART CONTRACT CODE:</span>
                <span className="text-emerald-400 font-bold">● EXECUTANDO</span>
              </div>
              <pre className="whitespace-pre-wrap">{workflowNodes.find(n => n.id === selectedWorkflowNode)?.payloadSnippet}</pre>
            </div>
          </div>
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
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] bg-black">
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
                    <div className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-2xl font-bold shrink-0 text-cyan-400 font-mono">
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

      {/* BENTO GRID (n8n Style Modular Features) */}
      <section id="bento" className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            Tudo o Que Você Precisa para Monetizar
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">ARQUITETURA COMPLETA E SEM DEPENDÊNCIAS DE BANCOS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Card 1: Multi-Chain */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 md:col-span-2 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold mb-5 font-mono">
                💧
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2 font-sans">SUI, Solana & 7 Redes EVM</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-md">
                Aceite qualquer token de qualquer rede sem precisar criar várias contas. O doador paga com o saldo que já tem na carteira.
              </p>
            </div>
            
            <div className="mt-6 p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30 font-bold">Slush Wallet (Sui)</span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 font-bold">Phantom (SOL)</span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 font-bold">MetaMask (Polygon / Base)</span>
            </div>
          </div>

          {/* Bento Card 2: 100% Non-Custodial */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold mb-5 font-mono">
                🔒
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2 font-sans">0% Custódia</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                O Live Crypto nunca segura o seu dinheiro. O valor é liquidado de carteira para carteira no mesmo segundo.
              </p>
            </div>
            <div className="mt-6 text-emerald-400 text-xs font-mono font-bold">✓ Sem risco de bloqueio ou chargeback</div>
          </div>

          {/* Bento Card 3: Real-Time Audio & IPFS */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl font-bold mb-5 font-mono">
                🎙️
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2 font-sans">Voz TTS & Áudio IPFS</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Suba seus próprios sons e GIFs customizados diretamente para a rede IPFS Pinata.
              </p>
            </div>
            <div className="mt-6 text-purple-400 text-xs font-mono font-bold">✓ Sintetizador de voz inteligente</div>
          </div>

          {/* Bento Card 4: CoinGecko USD Live */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 md:col-span-2 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl font-bold mb-5 font-mono">
                📈
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2 font-sans">Conversão Fiat Automática (CoinGecko)</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-md">
                O overlay calcula em tempo real o valor de mercado de cada doação para atualizar sua barra de metas com precisão.
              </p>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Exemplo: 25 SUI</span>
              <span className="text-cyan-400 font-bold">≈ $87.50 USD</span>
              <span className="text-emerald-400 font-bold">Meta: 70% Concluída</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            Live Crypto vs Plataformas Web2
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">A REVOLUÇÃO DA LIBERDADE FINANCEIRA PARA STREAMERS</p>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden border border-white/10">
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

      {/* Interactive FAQ Accordion */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-sans">
            Perguntas Frequentes (FAQ)
          </h2>
          <p className="mt-2 text-xs text-slate-400 font-mono">TUDO O QUE VOCÊ PRECISA SABER SOBRE O SISTEMA</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Preciso ter conhecimento avançado em Web3 para usar no meu canal?",
              a: "Não! Basta conectar sua carteira uma única vez no painel, copiar o link do Browser Source para o seu OBS Studio e compartilhar seu link com o chat. Funciona exatamente igual ao LivePix tradicional."
            },
            {
              q: "Quais carteiras e redes são aceitas?",
              a: "Aceitamos SUI (Slush Wallet / Sui Wallet), Solana (Phantom / Solflare), Polygon, Base, Arbitrum, BSC e Ethereum Mainnet (MetaMask / Rainbow), além de QR Code compatível com apps da Binance, Bybit e Coinbase."
            },
            {
              q: "O que acontece se a internet cair ou o OBS fechar?",
              a: "O dinheiro nunca é perdido! Como a transação ocorre diretamente on-chain na blockchain, os fundos já estão na sua carteira pessoal. Quando o OBS for reaberto, o painel recupera o histórico e as metas automaticamente."
            },
            {
              q: "Como funciona a taxa da plataforma?",
              a: "O contrato inteligente realiza um split atômico de 98% para o streamer e 2% para a plataforma em uma única instrução de transferência, sem taxa de saque posterior."
            }
          ].map((item, idx) => (
            <div key={idx} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex justify-between items-center font-sans font-bold text-sm text-white hover:text-cyan-400 transition-colors"
              >
                <span>{item.q}</span>
                <span className="text-cyan-400 font-mono text-base">{openFaq === idx ? '−' : '+'}</span>
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

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg overflow-hidden border border-cyan-500/20">
            <Image src="/brand/logo-png.png" alt="Logo" width={24} height={24} className="object-contain" />
          </div>
          <span>LIVE CRYPTO GATEWAY © 2026 — 100% NON-CUSTODIAL SAAS</span>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-6">
          <Link href="/login" className="hover:text-cyan-400 transition-colors">Streamer Login</Link>
          <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
          <a href="#pipeline" className="hover:text-cyan-400 transition-colors">Pipeline</a>
        </div>
      </footer>
    </div>
  );
}
