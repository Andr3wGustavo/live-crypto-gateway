"use client";

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [streamer, setStreamer] = useState({ public_address: '', obs_token: '' });
  const [wallets, setWallets] = useState<{ chain_id: string; public_address: string }[]>([]);
  
  // Alert Config and Goal state
  const [minAmount, setMinAmount] = useState('0.00');
  const [activeTheme, setActiveTheme] = useState('cyberpunk');
  const [goalAmount, setGoalAmount] = useState('100.00');
  const [goalCurrent, setGoalCurrent] = useState('0.00');
  const [goalTitle, setGoalTitle] = useState('Donation Goal');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // New Wallet form state
  const [selectedChain, setSelectedChain] = useState('137');
  const [newWalletAddress, setNewWalletAddress] = useState('');

  // Transactions and UI states
  const [transactions, setTransactions] = useState<{ tx_hash: string; sender_address: string; amount: string; currency: string; status: string; timestamp: string }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [configSaveStatus, setConfigSaveStatus] = useState<'' | 'saving' | 'success' | 'error'>('');
  const [walletSaveStatus, setWalletSaveStatus] = useState<'' | 'saving' | 'success' | 'error'>('');

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Fetch dashboard settings
    const fetchData = async () => {
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
          setGoalTitle(data.alertConfig.goal_title || 'Donation Goal');
          setMediaUrl(data.alertConfig.media_url || null);
          setAudioUrl(data.alertConfig.audio_url || null);
        }

        // Fetch recent transactions
        const txRes = await fetch('http://localhost:8080/api/dashboard/transactions', { headers });
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        localStorage.removeItem('jwt');
        window.location.href = '/login';
      }
    };

    fetchData();
  }, []);

  // Save general alert/theme/goal configuration
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
      
      // Update local wallet state
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

  // Handle IPFS Upload for Alert GIF/Video or Audio Sound
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('jwt');
    if (!token) return;

    const isMedia = type === 'media';
    if (isMedia) setUploadingMedia(true);
    else setUploadingAudio(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('http://localhost:8080/api/dashboard/upload', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      if (isMedia) {
        setMediaUrl(data.url);
      } else {
        setAudioUrl(data.url);
      }
      alert(`${type.toUpperCase()} successfully uploaded to IPFS and updated!`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload file to IPFS. Please verify Pinata credentials.");
    } finally {
      if (isMedia) setUploadingMedia(false);
      else setUploadingAudio(false);
    }
  };

  // Rotate OBS overlay token
  const handleRotateToken = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    if (!confirm("Are you sure you want to rotate your OBS overlay token? Any active OBS Browser Source will stop receiving alerts until you update its URL.")) return;

    try {
      const res = await fetch('http://localhost:8080/api/dashboard/rotate-token', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStreamer(prev => ({ ...prev, obs_token: data.obs_token }));
      alert("OBS Token successfully rotated!");
    } catch {
      alert("Failed to rotate OBS token.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center font-mono text-xl scanlines">
        &gt; LOADING SECURE PROTOCOLS...
      </div>
    );
  }

  // Calculate stats
  const totalReceived = transactions.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-cyan-400 font-mono p-4 md:p-8 scanlines">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-cyan-500/40 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              &gt; LIVE CRYPTO CONTROL CENTER_
            </h1>
            <p className="mt-2 text-xs text-cyan-400/70 break-all">
              AUTHENTICATED ADDRESS: <span className="text-cyan-300 font-bold">{streamer.public_address}</span>
            </p>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('jwt'); window.location.href = '/login'; }}
            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 uppercase font-bold text-xs tracking-wider transition-colors align-self-start md:align-self-auto"
          >
            [ DISCONNECT ]
          </button>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border border-cyan-500/30 bg-cyan-950/5 p-4 rounded shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <h3 className="text-xs uppercase text-cyan-400/60">Total Donations</h3>
            <p className="text-3xl font-bold mt-1 text-cyan-300">{transactions.length}</p>
          </div>
          <div className="border border-cyan-500/30 bg-cyan-950/5 p-4 rounded shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <h3 className="text-xs uppercase text-cyan-400/60">Current Goal Progress</h3>
            <p className="text-3xl font-bold mt-1 text-cyan-300">${parseFloat(goalCurrent).toFixed(2)}</p>
          </div>
          <div className="border border-cyan-500/30 bg-cyan-950/5 p-4 rounded shadow-[0_0_10px_rgba(6,182,212,0.05)]">
            <h3 className="text-xs uppercase text-cyan-400/60">Registered Payout Chains</h3>
            <p className="text-3xl font-bold mt-1 text-cyan-300">{wallets.length}</p>
          </div>
        </section>

        {/* Dynamic Integration Links */}
        <section className="border border-cyan-500/30 bg-cyan-950/5 p-6 rounded shadow-[0_0_15px_rgba(6,182,212,0.05)] space-y-4">
          <h2 className="text-lg font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-500/20 pb-2">-- INTEGRATIONS --</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase text-cyan-400/70 mb-1">OBS Browser Source Overlay Link</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`http://localhost:3000/overlay/${streamer.obs_token}`}
                  className="flex-1 p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded text-xs select-all focus:outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:3000/overlay/${streamer.obs_token}`);
                    alert("OBS Overlay Link copied to clipboard!");
                  }}
                  className="px-4 bg-cyan-500 text-black text-xs font-bold uppercase hover:bg-cyan-400 transition-colors rounded"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-cyan-400/50 mt-1">Paste this URL as a Browser Source in OBS Studio. Width: 1920, Height: 1080.</p>
            </div>
            
            <div>
              <label className="block text-xs uppercase text-cyan-400/70 mb-1">Public Donation Page Link (dApp)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={`http://localhost:3000/pay/${streamer.id}`}
                  className="flex-1 p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded text-xs select-all focus:outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`http://localhost:3000/pay/${streamer.id}`);
                    alert("Donation Page Link copied to clipboard!");
                  }}
                  className="px-4 bg-cyan-500 text-black text-xs font-bold uppercase hover:bg-cyan-400 transition-colors rounded"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-cyan-400/50 mt-1">Share this link with your audience so they can send payments directly.</p>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleRotateToken}
              className="px-4 py-1.5 border border-amber-500 text-amber-500 hover:bg-amber-500/10 uppercase font-bold text-[10px] tracking-wider transition-colors rounded"
            >
              [ Rotate OBS Token ]
            </button>
          </div>
        </section>

        {/* Settings grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuration Form */}
          <section className="border border-cyan-500/30 bg-cyan-950/5 p-6 rounded shadow-[0_0_15px_rgba(6,182,212,0.05)] space-y-6">
            <h2 className="text-lg font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-500/20 pb-2">-- METAS & VISUALS --</h2>
            
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs uppercase text-cyan-400/70">Active Theme</label>
                  <select 
                    value={activeTheme} 
                    onChange={(e) => setActiveTheme(e.target.value)}
                    className="w-full p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded focus:border-cyan-400 focus:outline-none text-xs"
                  >
                    <option value="cyberpunk">Cyberpunk (Cyan/Fuchsia)</option>
                    <option value="matrix">Matrix (Classic Green/CRT)</option>
                    <option value="fire">Fire (Orange/Red Glow)</option>
                    <option value="minimal">Minimal White (Modern Clean)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs uppercase text-cyan-400/70">Min Alert Amt ($)</label>
                  <input 
                    type="number" step="0.01" value={minAmount} onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded focus:outline-none focus:border-cyan-400 text-xs text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs uppercase text-cyan-400/70">Goal Title</label>
                <input 
                  type="text" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs uppercase text-cyan-400/70">Goal Target ($)</label>
                  <input 
                    type="number" step="1.0" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)}
                    className="w-full p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded focus:outline-none focus:border-cyan-400 text-xs text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs uppercase text-cyan-400/70">Goal Current ($)</label>
                  <input 
                    type="number" step="0.01" value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)}
                    className="w-full p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded focus:outline-none focus:border-cyan-400 text-xs text-center"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2 bg-cyan-500 text-black hover:bg-cyan-400 uppercase font-bold text-xs tracking-wider transition-colors rounded"
              >
                {configSaveStatus === 'saving' ? '[ SAVING CHANGES... ]' : 
                 configSaveStatus === 'success' ? '[ CONFIG UPDATED! ]' : 
                 configSaveStatus === 'error' ? '[ ERROR SAVING CONFIG ]' : '[ SAVE CONFIG ]'}
              </button>
            </form>

            {/* IPFS Media Upload */}
            <div className="space-y-4 pt-4 border-t border-cyan-500/20">
              <h3 className="text-xs uppercase font-bold text-cyan-400/70">Custom Alert Assets (IPFS via Pinata)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border border-cyan-500/20 bg-black rounded text-center space-y-2">
                  <span className="block text-xs text-cyan-400/70">ALERT MEDIA (GIF/MP4)</span>
                  {mediaUrl && <span className="block text-[8px] text-green-400 break-all select-all font-mono">IPFS: {mediaUrl.slice(0, 30)}...</span>}
                  <input 
                    type="file" accept="image/gif,video/mp4" id="alert-media" className="hidden"
                    onChange={(e) => handleFileUpload(e, 'media')} 
                  />
                  <label 
                    htmlFor="alert-media" 
                    className="block cursor-pointer px-3 py-1.5 border border-cyan-400 text-cyan-400 hover:bg-cyan-500/10 text-xs uppercase font-bold transition-all rounded"
                  >
                    {uploadingMedia ? '[ UPLOADING... ]' : '[ UPLOAD MEDIA ]'}
                  </label>
                </div>
                
                <div className="p-3 border border-cyan-500/20 bg-black rounded text-center space-y-2">
                  <span className="block text-xs text-cyan-400/70">ALERT AUDIO (MP3/WAV)</span>
                  {audioUrl && <span className="block text-[8px] text-green-400 break-all select-all font-mono">IPFS: {audioUrl.slice(0, 30)}...</span>}
                  <input 
                    type="file" accept="audio/mp3,audio/wav,audio/mpeg" id="alert-audio" className="hidden"
                    onChange={(e) => handleFileUpload(e, 'audio')} 
                  />
                  <label 
                    htmlFor="alert-audio" 
                    className="block cursor-pointer px-3 py-1.5 border border-cyan-400 text-cyan-400 hover:bg-cyan-500/10 text-xs uppercase font-bold transition-all rounded"
                  >
                    {uploadingAudio ? '[ UPLOADING... ]' : '[ UPLOAD AUDIO ]'}
                  </label>
                </div>
              </div>
            </div>

          </section>

          {/* Wallet Config */}
          <section className="border border-cyan-500/30 bg-cyan-950/5 p-6 rounded shadow-[0_0_15px_rgba(6,182,212,0.05)] space-y-6">
            <h2 className="text-lg font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-500/20 pb-2">-- DESTINATIONS --</h2>
            
            {/* Wallet list */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase text-cyan-400/70">Active Payout Addresses</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {wallets.length === 0 ? (
                  <p className="text-xs text-cyan-500/50 italic py-2">No custom wallets registered. Fallback used.</p>
                ) : (
                  wallets.map((w, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-black border border-cyan-500/20 rounded text-xs">
                      <div>
                        <span className="font-bold text-cyan-300 uppercase">{w.chain_id === '137' ? 'Polygon (137)' : w.chain_id === 'solana' ? 'Solana' : `Chain ID: ${w.chain_id}`}</span>
                        <span className="block font-mono text-[10px] text-cyan-400/70 mt-0.5 break-all select-all">{w.public_address}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Wallet Register Form */}
            <form onSubmit={handleSaveWallet} className="space-y-4 border-t border-cyan-500/20 pt-4">
              <h3 className="text-xs uppercase font-bold text-cyan-400/70">Register / Update Payout Address</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs uppercase text-cyan-400/70">Chain / Wallet</label>
                  <select 
                    value={selectedChain} 
                    onChange={(e) => setSelectedChain(e.target.value)}
                    className="w-full p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded focus:outline-none text-xs"
                  >
                    <option value="137">Polygon (137)</option>
                    <option value="1">Ethereum (1)</option>
                    <option value="8453">Base (8453)</option>
                    <option value="solana">Solana</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs uppercase text-cyan-400/70">Payout Address</label>
                  <input 
                    type="text" 
                    value={newWalletAddress} 
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    placeholder="0x... or Solana Base58"
                    className="w-full p-2 bg-black text-cyan-400 border border-cyan-500/40 rounded focus:outline-none focus:border-cyan-400 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2 border border-cyan-400 text-cyan-400 hover:bg-cyan-500 hover:text-black uppercase font-bold text-xs tracking-wider transition-all rounded"
              >
                {walletSaveStatus === 'saving' ? '[ SAVING carteira... ]' : 
                 walletSaveStatus === 'success' ? '[ CARTEIRA SALVA! ]' : 
                 walletSaveStatus === 'error' ? '[ ERRO AO SALVAR ]' : '[ REGISTER WALLET ]'}
              </button>
            </form>
          </section>

        </div>

        {/* Transactions Table */}
        <section className="border border-cyan-500/30 bg-cyan-950/5 p-6 rounded shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <h2 className="text-lg font-bold text-cyan-400 uppercase tracking-wider border-b border-cyan-500/20 pb-2">-- RECENT TRANSACTIONS --</h2>
          <div className="overflow-x-auto mt-4 pr-1">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-cyan-500/40 text-cyan-400/70">
                  <th className="p-2">TX Hash</th>
                  <th className="p-2">Sender Address</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Currency</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-cyan-500/50 italic">No transactions detected. Waiting for webhook broadcasts...</td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <tr key={idx} className="border-b border-cyan-500/10 hover:bg-cyan-950/20 transition-colors">
                      <td className="p-2 select-all text-cyan-300">{tx.tx_hash.slice(0, 16)}...</td>
                      <td className="p-2 select-all">{tx.sender_address.slice(0, 16)}...</td>
                      <td className="p-2 font-bold">{parseFloat(tx.amount).toFixed(4)}</td>
                      <td className="p-2 uppercase text-cyan-300">{tx.currency}</td>
                      <td className="p-2 font-bold text-cyan-300">[{tx.status}]</td>
                      <td className="p-2 text-cyan-500/70">{new Date(tx.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
