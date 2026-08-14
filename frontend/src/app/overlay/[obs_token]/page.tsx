"use client";

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';

// Matrix decode effect - scrambles characters before revealing the real text
function MatrixText({ text, className = '' }: { text: string, className?: string }) {
  const [displayed, setDisplayed] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayed(
        text.split('').map((char, i) => {
          if (i < iteration) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      iteration += 1 / 3;
      if (iteration >= text.length) clearInterval(interval);
    }, 25);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={`matrix-decode ${className}`}>{displayed}</span>;
}

// Token ID map for CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  'ETH': 'ethereum',
  'MATIC': 'matic-network',
  'POL': 'matic-network',
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai',
  'BNB': 'binancecoin'
};

export default function OverlayPage({ params }: { params: Promise<{ obs_token: string }> }) {
  const { obs_token } = use(params);
  const [donation, setDonation] = useState<{ amount: number, currency: string, sender: string, message: string, fiatValue?: number } | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [theme, setTheme] = useState<'matrix' | 'cyberpunk' | 'minimal' | 'fire'>('cyberpunk');
  const [goalAmount, setGoalAmount] = useState(100.00);
  const [currentAmount, setCurrentAmount] = useState(0.00);
  const [goalTitle, setGoalTitle] = useState('Meta de Doações');
  const [mediaConfig, setMediaConfig] = useState<{ mediaUrl: string | null; audioUrl: string | null }>({ mediaUrl: null, audioUrl: null });

  // Text-to-Speech using Web Speech API
  const speakDonation = useCallback((donationData: { amount: number, currency: string, sender: string, message: string }) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const senderShort = donationData.sender.substring(0, 6);
      let utteranceText = `${senderShort} doou ${donationData.amount} ${donationData.currency}.`;
      if (donationData.message) {
        const sanitized = donationData.message.replace(/<[^>]*>/g, '').substring(0, 200);
        utteranceText += ` Mensagem: ${sanitized}`;
      }
      const utterance = new SpeechSynthesisUtterance(utteranceText);
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      utterance.volume = 1.0;
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const fetchFiatValue = async (currency: string, amount: number) => {
    try {
      const id = COINGECKO_IDS[currency.toUpperCase()];
      if (!id) return null;
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const data = await res.json();
      const price = data[id]?.usd;
      if (price) {
        return (price * amount).toFixed(2);
      }
    } catch (e) {
      console.error("Failed to fetch fiat value:", e);
    }
    return null;
  };

  useEffect(() => {
    // Connect to WebSocket Server
    const wsUrl = `ws://localhost:8080/?obs_token=${obs_token}`;
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWS = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log('Connected to Live Crypto OBS WebSocket');

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'CONNECTED' && data.config) {
            setTheme(data.config.theme || 'cyberpunk');
            setGoalAmount(data.config.goal_amount || 100);
            setCurrentAmount(data.config.goal_current || 0);
            setGoalTitle(data.config.goal_title || 'Meta de Doações');
            setMediaConfig({ mediaUrl: data.config.media_url, audioUrl: data.config.audio_url });
          }

          if (data.event === 'CONFIG_UPDATE') {
            if (data.theme) setTheme(data.theme);
            if (data.goal_amount !== undefined) setGoalAmount(data.goal_amount);
            if (data.goal_current !== undefined) setCurrentAmount(data.goal_current);
            if (data.goal_title !== undefined) setGoalTitle(data.goal_title);
            if (data.media_url !== undefined || data.audio_url !== undefined) {
              setMediaConfig(prev => ({
                mediaUrl: data.media_url !== undefined ? data.media_url : prev.mediaUrl,
                audioUrl: data.audio_url !== undefined ? data.audio_url : prev.audioUrl
              }));
            }
          }

          if (data.event === 'DONATION') {
            const donationAmount = parseFloat(data.amount);
            const fiatVal = await fetchFiatValue(data.currency, donationAmount);
            const donationData = {
              amount: donationAmount,
              currency: data.currency,
              sender: data.sender,
              message: data.message,
              fiatValue: fiatVal ? parseFloat(fiatVal) : undefined
            };
            
            setDonation(donationData);
            setIsExiting(false);
            
            const addedVal = fiatVal ? parseFloat(fiatVal) : donationAmount;
            setCurrentAmount(prev => prev + addedVal);

            // Play custom audio chime
            const audioToPlay = data.audio_url || mediaConfig.audioUrl;
            if (audioToPlay) {
              const audio = new Audio(audioToPlay);
              audio.volume = 1.0;
              audio.play().catch(e => console.error("Audio playback error:", e));
            }

            speakDonation(donationData);

            // Hide alert after 8 seconds
            setTimeout(() => {
              setIsExiting(true);
              setTimeout(() => {
                setDonation(null);
                setIsExiting(false);
              }, 600);
            }, 8000);
          }
        } catch (e) {
          console.error("WS message parse error:", e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connectWS, 4000);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [obs_token, mediaConfig.audioUrl, speakDonation]);

  const progressPercent = Math.min(100, (currentAmount / (goalAmount || 1)) * 100);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden relative p-8 select-none pointer-events-none">
      
      {/* 🎯 Real-Time Goal Progress Bar (Top Right) */}
      <div className="absolute top-8 right-8 w-96">
        <div className={`p-4 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-500 ${
          theme === 'matrix' ? 'bg-black/90 border-green-500 text-green-400 shadow-[0_0_25px_rgba(0,255,0,0.3)]' :
          theme === 'fire' ? 'bg-zinc-950/90 border-orange-500 text-orange-200 shadow-[0_0_25px_rgba(249,115,22,0.3)]' :
          theme === 'minimal' ? 'bg-slate-900/90 border-white/20 text-slate-100' :
          'bg-zinc-950/90 border-cyan-400 text-white shadow-[0_0_25px_rgba(6,182,212,0.3)]'
        }`}>
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="font-bold uppercase tracking-wider">🎯 {goalTitle}</span>
            <span className="font-bold">
              ${currentAmount.toFixed(2)} / ${goalAmount.toFixed(2)} USD
            </span>
          </div>

          {/* Bar container */}
          <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                theme === 'matrix' ? 'bg-green-500 shadow-[0_0_10px_rgba(0,255,0,0.8)]' :
                theme === 'fire' ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' :
                theme === 'minimal' ? 'bg-white' :
                'bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ⚡ Real-Time Pop-Up Donation Alert (Center-Top) */}
      {donation && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
          <div className={`p-6 rounded-2xl backdrop-blur-2xl border shadow-2xl transition-all ${
            isExiting ? 'alert-exit' : 'alert-enter'
          } ${
            theme === 'matrix' ? 'bg-black/95 border-green-500 text-green-400 shadow-[0_0_50px_rgba(0,255,0,0.5)]' :
            theme === 'fire' ? 'bg-zinc-950/95 border-orange-500 text-orange-100 shadow-[0_0_50px_rgba(249,115,22,0.5)]' :
            theme === 'minimal' ? 'bg-slate-900/95 border-white/30 text-white shadow-2xl' :
            'bg-zinc-900/95 border-cyan-400 text-white shadow-[0_0_50px_rgba(6,182,212,0.5)]'
          }`}>
            
            {/* Custom Media GIF / MP4 or Default Icon */}
            <div className="flex items-center gap-5">
              {mediaConfig.mediaUrl ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaConfig.mediaUrl} alt="Alert Media" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shrink-0 ${
                  theme === 'matrix' ? 'bg-green-950/50 border-green-500 text-green-400' :
                  theme === 'fire' ? 'bg-orange-950/50 border-orange-500 text-orange-400' :
                  'bg-cyan-950/50 border-cyan-400 text-cyan-400'
                }`}>
                  ⚡
                </div>
              )}

              <div className="overflow-hidden">
                <div className={`text-xs font-mono uppercase tracking-widest ${
                  theme === 'matrix' ? 'text-green-500' : theme === 'fire' ? 'text-orange-400' : 'text-cyan-400'
                }`}>
                  NOVA DOAÇÃO CRIPTO!
                </div>

                <div className="text-2xl font-black mt-0.5 tracking-tight">
                  {donation.amount} {donation.currency}
                  {donation.fiatValue && (
                    <span className="text-sm font-normal text-slate-300 ml-2">
                      (~${donation.fiatValue} USD)
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 font-mono mt-0.5 truncate">
                  De: <MatrixText text={donation.sender} />
                </div>
              </div>
            </div>

            {/* Donor Message */}
            {donation.message && (
              <div className="mt-4 pt-3 border-t border-white/10 text-sm font-medium italic text-slate-200 leading-relaxed">
                &quot;{donation.message}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
