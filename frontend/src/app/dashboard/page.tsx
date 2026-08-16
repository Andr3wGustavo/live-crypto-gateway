"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [streamer, setStreamer] = useState<{ id?: number; public_address: string; obs_token: string }>({ public_address: '', obs_token: '' });
  const [wallets, setWallets] = useState<{ chain_id: string; public_address: string }[]>([]);
  
  // Alert Config and Goal state
  const [minAmount, setMinAmount] = useState('0.00');
  const [activeTheme, setActiveTheme] = useState('cyberpunk');
  const [goalAmount, setGoalAmount] = useState('100.00');
  const [goalCurrent, setGoalCurrent] = useState('0.00');
  const [goalTitle, setGoalTitle] = useState('Setup Novo');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // New Wallet form state (SUI, Solana, Polygon, etc.)
  const [selectedChain, setSelectedChain] = useState('sui');
  const [newWalletAddress, setNewWalletAddress] = useState('');

  // Transactions & Analytics states
  const [transactions, setTransactions] = useState<{ tx_hash: string; sender_address: string; amount: string; currency: string; status: string; timestamp: string }[]>([]);
  const [analytics, setAnalytics] = useState<{ totalTransactions: number; estimatedTotalUSD: string; tokenBreakdown: Record<string, number> }>({ totalTransactions: 0, estimatedTotalUSD: '0.00', tokenBreakdown: {} });
  
  // Upload and UI notifications
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [configSaveStatus, setConfigSaveStatus] = useState<'' | 'saving' | 'success' | 'error'>('');
  const [walletSaveStatus, setWalletSaveStatus] = useState<'' | 'saving' | 'success' | 'error'>('');
  const [testAlertStatus, setTestAlertStatus] = useState<'' | 'sending' | 'success' | 'error'>('');
  const [copiedLink, setCopiedLink] = useState<'obs' | 'pay' | null>(null);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      window.location.href = '/login';
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
        setGoalTitle(data.alertConfig.goal_title || 'Setup Novo');
        setMediaUrl(data.alertConfig.media_url || null);
        setAudioUrl(data.alertConfig.audio_url || null);
      }

      // Fetch recent transactions
      const txRes = await fetch('http://localhost:8080/api/dashboard/transactions', { headers });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      }

      // Fetch analytics
      const analyticsRes = await fetch('http://localhost:8080/api/dashboard/analytics', { headers });
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('jwt');
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Save Alert/Theme/Goal configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('jwt');
    if (!token) return;

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
          goal_title: goalTitle
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
    const token = localStorage.getItem('jwt');
    if (!token || !newWalletAddress) return;

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
        } else {
          return [...prev, { chain_id: selectedChain, public_address: newWalletAddress }];
        }
      });
      
      setNewWalletAddress('');
      setWalletSaveStatus('success');
      setTimeout(() => setWalletSaveStatus(''), 2000);
    } catch {
      setWalletSaveStatus('error');
      setTimeout(() => setWalletSaveStatus(''), 3000);
    }
  };

  // Trigger Live Test Alert on OBS Overlay
  const handleTriggerTestAlert = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      setTestAlertStatus('sending');
      const res = await fetch('http://localhost:8080/api/dashboard/test-alert', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 25,
          currency: 'SUI',
          sender: streamer.public_address ? `${streamer.public_address.slice(0, 6)}...Slush` : '0xSlushDonor',
          message: '⚡ Teste de alerta ao vivo no Live Crypto OBS!'
        })
      });

      if (!res.ok) throw new Error();
      setTestAlertStatus('success');
      setTimeout(() => setTestAlertStatus(''), 2500);
    } catch {
      setTestAlertStatus('error');
      setTimeout(() => setTestAlertStatus(''), 3000);
    }
  };

  // Rotate OBS Token for security
  const handleRotateToken = async () => {
    if (!confirm('Deseja realmente gerar um novo link de OBS? Você precisará atualizar a URL no seu OBS Studio.')) return;
    const token = localStorage.getItem('jwt');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:8080/api/dashboard/rotate-token', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStreamer(prev => ({ ...prev, obs_token: data.obs_token }));
        alert('Novo token OBS gerado com sucesso!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle IPFS Upload for Alert Media or Audio
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('jwt');
    if (!token) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      if (type === 'media') setUploadingMedia(true);
      else setUploadingAudio(true);

      const res = await fetch('http://localhost:8080/api/dashboard/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (type === 'media') {
        setMediaUrl(data.url);
        setUploadingMedia(false);
      } else {
        setAudioUrl(data.url);
        setUploadingAudio(false);
      }
    } catch (err) {
      console.error(err);
      alert(`Falha no upload para o IPFS.`);
      if (type === 'media') setUploadingMedia(false);
      else setUploadingAudio(false);
    }
  };

  const copyToClipboard = (text: string, type: 'obs' | 'pay') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen text-cyan-400 flex flex-col items-center justify-center font-mono gap-4">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm tracking-widest uppercase animate-pulse">Carregando Painel Live Crypto...</div>
      </div>
    );
  }

  const obsUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/${streamer.obs_token}` : '';
  const donationUrl = typeof window !== 'undefined' && streamer.id ? `${window.location.origin}/pay/${streamer.id}` : '';

  return (
    <div className="min-h-screen text-slate-100 pb-16 relative">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-500/30 bg-zinc-900 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
              <Image src="/brand/logo-png.png" alt="Logo" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <span className="font-extrabold tracking-wide text-base text-white flex items-center gap-2 font-sans">
                PAINEL DO CRIADOR <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold">LIVE CRYPTO</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">Conectado:</span>
              <span className="text-cyan-400 font-bold">{streamer.public_address.slice(0, 6)}...{streamer.public_address.slice(-4)}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-mono border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer font-bold"
            >
              SAIR
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Quick Link Share Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OBS Overlay Source Link */}
          <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-2">
                <span>📹 LINK DO OBS BROWSER SOURCE</span>
              </span>
              <button 
                onClick={handleRotateToken} 
                className="text-[10px] font-mono text-slate-400 hover:text-red-400 transition-colors"
                title="Gera um novo link e cancela o anterior"
              >
                [ Redefinir Token ]
              </button>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={obsUrl}
                className="w-full text-xs font-mono px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-slate-300 select-all"
              />
              <button 
                onClick={() => copyToClipboard(obsUrl, 'obs')}
                className="px-4 py-2 bg-cyan-500 text-black text-xs font-mono font-bold rounded-xl hover:bg-cyan-400 transition-all shrink-0 cursor-pointer shadow-md"
              >
                {copiedLink === 'obs' ? 'COPIADO!' : 'COPIAR'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Cole no OBS como <strong>Browser Source</strong> com resolução <strong>1920x1080</strong>.
            </p>
          </div>

          {/* Public Donation Link for Donors */}
          <div className="glass-card p-6 rounded-3xl border border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.15)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-2">
                <span>🔗 SEU LINK PÚBLICO DE DOAÇÕES (DOADORES)</span>
              </span>
              {streamer.id && (
                <Link 
                  href={`/pay/${streamer.id}`} 
                  target="_blank" 
                  className="text-[10px] font-mono text-slate-400 hover:text-purple-300 transition-colors"
                >
                  [ Abrir Página ↗ ]
                </Link>
              )}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={donationUrl}
                className="w-full text-xs font-mono px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-slate-300 select-all"
              />
              <button 
                onClick={() => copyToClipboard(donationUrl, 'pay')}
                className="px-4 py-2 bg-purple-500 text-white text-xs font-mono font-bold rounded-xl hover:bg-purple-400 transition-all shrink-0 cursor-pointer shadow-md"
              >
                {copiedLink === 'pay' ? 'COPIADO!' : 'COPIAR'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Divulgue no chat da Twitch/YouTube ou no comando <code>!donate</code>.
            </p>
          </div>
        </div>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <div className="text-xs font-mono text-slate-400 uppercase">Total Arrecadado (Est.)</div>
            <div className="text-3xl font-black text-cyan-400 mt-2 font-mono">${analytics.estimatedTotalUSD} <span className="text-xs text-slate-400">USD</span></div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">100% direto na sua carteira</div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <div className="text-xs font-mono text-slate-400 uppercase">Total de Doações</div>
            <div className="text-3xl font-black text-purple-400 mt-2 font-mono">{analytics.totalTransactions}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">Transações confirmadas on-chain</div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <div className="text-xs font-mono text-slate-400 uppercase">Tokens Recebidos (SUI / SOL / EVM)</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(analytics.tokenBreakdown).length > 0 ? (
                Object.entries(analytics.tokenBreakdown).map(([token, amount]) => (
                  <span key={token} className="px-2.5 py-1 bg-zinc-800 rounded-xl text-xs font-mono text-slate-200 font-bold border border-white/5">
                    {amount.toFixed(2)} {token}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 font-mono">Aguardando primeira doação</span>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Configs & Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Alerts, Themes & Donation Goals */}
          <div className="space-y-8">
            {/* Visual Theme & Goals Settings */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <h2 className="text-base font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
                <span>🎨 TEMA VISUAL & META DE DOAÇÕES</span>
              </h2>

              <form onSubmit={handleSaveConfig} className="space-y-5">
                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-2 uppercase">Tema Ativo do Overlay:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'cyberpunk', label: 'Cyberpunk', color: 'border-cyan-500 text-cyan-400' },
                      { id: 'matrix', label: 'Matrix', color: 'border-green-500 text-green-400' },
                      { id: 'fire', label: 'Fire Ember', color: 'border-orange-500 text-orange-400' },
                      { id: 'minimal', label: 'Minimal', color: 'border-slate-300 text-slate-200' },
                    ].map(t => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setActiveTheme(t.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                          activeTheme === t.id ? `${t.color} bg-white/10 shadow-md` : 'border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Título da Meta:</label>
                    <input 
                      type="text" 
                      value={goalTitle}
                      onChange={e => setGoalTitle(e.target.value)}
                      placeholder="Ex: Novo Microfone"
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Valor Alvo (USD):</label>
                    <input 
                      type="number" 
                      step="1"
                      value={goalAmount}
                      onChange={e => setGoalAmount(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Progresso Atual (USD):</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={goalCurrent}
                      onChange={e => setGoalCurrent(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Valor Mínimo p/ Alerta ($):</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={minAmount}
                      onChange={e => setMinAmount(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={configSaveStatus === 'saving'}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs font-mono tracking-wider uppercase rounded-xl hover:opacity-90 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                >
                  {configSaveStatus === 'saving' ? 'SALVANDO CONFIGURAÇÃO...' : 
                   configSaveStatus === 'success' ? '✅ CONFIGURAÇÃO SALVA!' : 
                   '💾 SALVAR ALTERAÇÕES NO OVERLAY'}
                </button>
              </form>
            </div>

            {/* Custom IPFS Media & Audio Uploader */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <h2 className="text-base font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-2">
                <span>📁 MÍDIA & ÁUDIO PERSONALIZADOS (IPFS)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Media Uploader */}
                <div className="p-4 rounded-2xl border border-dashed border-white/20 bg-zinc-950/50 text-center space-y-2">
                  <div className="text-slate-300 font-bold">GIF / MP4 do Alerta</div>
                  <p className="text-[10px] text-slate-500">Exibido na tela quando doar</p>
                  <label className="inline-block px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold cursor-pointer transition-colors">
                    {uploadingMedia ? 'Enviando ao IPFS...' : 'Selecionar Arquivo'}
                    <input 
                      type="file" 
                      accept="image/*,video/mp4" 
                      onChange={e => handleFileUpload(e, 'media')} 
                      disabled={uploadingMedia}
                      className="hidden" 
                    />
                  </label>
                  {mediaUrl && (
                    <div className="text-[10px] text-emerald-400 truncate">Ativo: {mediaUrl.slice(0, 30)}...</div>
                  )}
                </div>

                {/* Audio Uploader */}
                <div className="p-4 rounded-2xl border border-dashed border-white/20 bg-zinc-950/50 text-center space-y-2">
                  <div className="text-slate-300 font-bold">Áudio / Chime do Alerta</div>
                  <p className="text-[10px] text-slate-500">Tocado instantaneamente</p>
                  <label className="inline-block px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-purple-400 font-bold cursor-pointer transition-colors">
                    {uploadingAudio ? 'Enviando ao IPFS...' : 'Selecionar Áudio (MP3)'}
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={e => handleFileUpload(e, 'audio')} 
                      disabled={uploadingAudio}
                      className="hidden" 
                    />
                  </label>
                  {audioUrl && (
                    <div className="text-[10px] text-emerald-400 truncate">Ativo: {audioUrl.slice(0, 30)}...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Overlay Simulator & Wallets */}
          <div className="space-y-8">
            
            {/* Live OBS Overlay Simulator */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  ⚡ SIMULADOR DO OVERLAY OBS
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30 font-bold">
                  WEBSOCKET ATIVO
                </span>
              </div>

              {/* Visual Preview Box */}
              <div className="p-6 rounded-2xl bg-black/80 border border-white/10 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                {/* Goal Bar Preview */}
                <div>
                  <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span className="text-slate-200 font-bold">🎯 {goalTitle}</span>
                    <span className="text-cyan-400 font-bold">${parseFloat(goalCurrent).toFixed(2)} / ${parseFloat(goalAmount).toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeTheme === 'matrix' ? 'bg-green-500' :
                        activeTheme === 'fire' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                        activeTheme === 'minimal' ? 'bg-white' :
                        'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, (parseFloat(goalCurrent) / (parseFloat(goalAmount) || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Sample Alert Box */}
                <div className={`mt-4 p-4 rounded-xl border ${
                  activeTheme === 'matrix' ? 'bg-black border-green-500 text-green-400 font-mono' :
                  activeTheme === 'fire' ? 'bg-zinc-950 border-orange-500 text-orange-200' :
                  activeTheme === 'minimal' ? 'bg-slate-900 border-white/20 text-slate-100' :
                  'bg-zinc-900/90 border-cyan-400 text-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-base font-bold shrink-0 text-cyan-400">
                      SUI
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-mono tracking-widest text-cyan-400">NOVA DOAÇÃO RECEBIDA</div>
                      <div className="text-sm font-black">25 SUI ($87.50 USD)</div>
                      <div className="text-[10px] text-slate-400 font-mono">de: 0x8f3c...Slush</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10 text-xs italic text-slate-300">
                    &quot;Parabéns pela live, continue com o conteúdo incrível! 🚀&quot;
                  </div>
                </div>

                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={handleTriggerTestAlert}
                  disabled={testAlertStatus === 'sending'}
                  className="mt-4 w-full py-3 bg-cyan-500 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {testAlertStatus === 'sending' ? 'DISPARANDO ALERTA...' :
                   testAlertStatus === 'success' ? '✅ ALERTA ENVIADO AO OBS!' :
                   '⚡ DISPARAR ALERTA DE TESTE NO OBS'}
                </button>
              </div>
            </div>

            {/* Payout Wallets Manager */}
            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <h2 className="text-base font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-2">
                <span>👛 CARTEIRAS DE RECEBIMENTO (MULTI-CHAIN)</span>
              </h2>

              {/* Registered Wallets List */}
              <div className="space-y-2">
                {wallets.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono p-3 bg-black/40 rounded-xl">
                    Nenhuma carteira customizada cadastrada. O sistema usará sua carteira de login.
                  </div>
                ) : (
                  wallets.map(w => (
                    <div key={w.chain_id} className="p-3 bg-zinc-950/60 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-slate-300 font-bold uppercase mr-2">
                          {w.chain_id === 'sui' ? 'SUI PROTOCOL' : w.chain_id === 'solana' ? 'SOLANA' : w.chain_id === '137' ? 'POLYGON' : w.chain_id === '8453' ? 'BASE' : w.chain_id === '1' ? 'ETHEREUM' : `CHAIN ${w.chain_id}`}
                        </span>
                        <span className="text-slate-400">{w.public_address}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add / Update Wallet Form */}
              <form onSubmit={handleSaveWallet} className="space-y-4 pt-2 border-t border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Rede:</label>
                    <select 
                      value={selectedChain}
                      onChange={e => setSelectedChain(e.target.value)}
                      className="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-mono"
                    >
                      <option value="sui">SUI Protocol (Slush Wallet)</option>
                      <option value="solana">Solana (Phantom / SOL)</option>
                      <option value="137">Polygon (POL/MATIC)</option>
                      <option value="8453">Base (USDC)</option>
                      <option value="42161">Arbitrum</option>
                      <option value="56">BNB Chain (BSC)</option>
                      <option value="1">Ethereum Mainnet</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono text-slate-400 mb-1">Endereço da Carteira ({selectedChain.toUpperCase()}):</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 0x8f3c... (Sui) ou 8x3s... (Solana)"
                      value={newWalletAddress}
                      onChange={e => setNewWalletAddress(e.target.value)}
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={walletSaveStatus === 'saving' || !newWalletAddress}
                  className="w-full py-2.5 bg-emerald-500 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {walletSaveStatus === 'saving' ? 'SALVANDO...' : 
                   walletSaveStatus === 'success' ? '✅ CARTEIRA SALVA!' : 
                   '+ ADICIONAR / ATUALIZAR CARTEIRA'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold uppercase tracking-wider text-cyan-400 font-mono">
              📜 HISTÓRICO RECENTE DE DOAÇÕES
            </h2>
            
            {transactions.length > 0 && (
              <button
                onClick={() => {
                  const headers = ['Status', 'Valor', 'Moeda', 'Doador', 'TxHash', 'Data'];
                  const rows = transactions.map(t => [t.status, t.amount, t.currency, t.sender_address, t.tx_hash, new Date(t.timestamp).toISOString()]);
                  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `livecrypto_transactions_${Date.now()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs font-mono font-bold border border-white/10 flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-colors"
              >
                <span>📥 Exportar Relatório CSV</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-white/10 text-slate-400">
                  <th className="p-3">STATUS</th>
                  <th className="p-3">VALOR & MOEDA</th>
                  <th className="p-3">DOADOR</th>
                  <th className="p-3">TX HASH</th>
                  <th className="p-3">DATA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-mono">
                      Nenhuma transação registrada ainda.
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.tx_hash} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">
                        {tx.amount} {tx.currency}
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[120px]">
                        {tx.sender_address}
                      </td>
                      <td className="p-3 text-cyan-400 truncate max-w-[140px]">
                        {tx.tx_hash}
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(tx.timestamp).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
