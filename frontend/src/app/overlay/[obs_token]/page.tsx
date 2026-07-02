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
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={`matrix-decode ${className}`}>{displayed}</span>;
}

// Token ID map for CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  'ETH': 'ethereum',
  'MATIC': 'matic-network',
  'SOL': 'solana',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai'
};

export default function OverlayPage({ params }: { params: Promise<{ obs_token: string }> }) {
  const { obs_token } = use(params);
  const [donation, setDonation] = useState<{ amount: number, currency: string, sender: string, message: string, fiatValue?: number } | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [theme, setTheme] = useState<'matrix' | 'cyberpunk' | 'minimal' | 'fire'>('cyberpunk'); // Defaulting to cyberpunk for demo

  // Goal State
  const [goalAmount] = useState(1500.00);
  const [currentAmount, setCurrentAmount] = useState(1240.50);

  // Text-to-Speech using Web Speech API
  const speakDonation = useCallback((donationData: { amount: number, currency: string, sender: string, message: string }) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const senderShort = donationData.sender.substring(0, 8);
      let utteranceText = `${senderShort} sent ${donationData.amount} ${donationData.currency}.`;
      if (donationData.message) {
        const sanitized = donationData.message.replace(/<[^>]*>/g, '').substring(0, 200);
        utteranceText += ` Message: ${sanitized}`;
      }
      const utterance = new SpeechSynthesisUtterance(utteranceText);
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.volume = 1.0;
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

    const connectWS = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log('Connected to WS');

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Allow theme updates via WebSocket
          if (data.event === 'CONFIG_UPDATE' && data.theme) {
            setTheme(data.theme);
          }

          if (data.event === 'DONATION') {
            const fiatVal = await fetchFiatValue(data.currency, data.amount);
            const donationData = {
              amount: data.amount,
              currency: data.currency,
              sender: data.sender,
              message: data.message,
              fiatValue: fiatVal ? parseFloat(fiatVal) : undefined
            };
            
            setDonation(donationData);
            setIsExiting(false);
            setCurrentAmount(prev => prev + (fiatVal ? parseFloat(fiatVal) : data.amount)); // Add equivalent USD to goal

            speakDonation(donationData);

            setTimeout(() => {
              setIsExiting(true);
              setTimeout(() => {
                setDonation(null);
                setIsExiting(false);
              }, 500);
            }, 8000);
          }
        } catch (e) {
          console.error("WS message parse error:", e);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, [obs_token, speakDonation]);

  const progressPercent = Math.min((currentAmount / goalAmount) * 100, 100);

  // Theme configurations
  const getThemeClasses = () => {
    switch (theme) {
      case 'cyberpunk':
        return {
          container: "bg-transparent font-sans tracking-wide text-cyan-400 scanlines",
          goalBox: "bg-fuchsia-900/40 border-2 border-cyan-400 p-3 shadow-[0_0_15px_rgba(0,255,255,0.6),inset_0_0_10px_rgba(255,0,255,0.4)] backdrop-blur-sm",
          goalText: "text-3xl text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,1)]",
          barBg: "bg-fuchsia-950/60 border border-cyan-500/50",
          barFill: "bg-gradient-to-r from-fuchsia-500 to-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.8)]",
          alertBox: "bg-slate-900/80 border-l-4 border-r-4 border-fuchsia-500 p-8 shadow-[0_0_30px_rgba(255,0,255,0.4)] backdrop-blur-md skew-x-[-2deg]",
          alertAccent: "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]",
          messageText: "text-xl mt-4 border-t border-cyan-500/50 pt-4 text-cyan-200"
        };
      case 'minimal':
        return {
          container: "bg-transparent font-sans text-slate-800",
          goalBox: "bg-white/70 border border-white/40 p-4 rounded-2xl shadow-xl backdrop-blur-xl",
          goalText: "text-2xl font-semibold text-slate-800",
          barBg: "bg-slate-200 rounded-full overflow-hidden h-2",
          barFill: "bg-slate-800 rounded-full",
          alertBox: "bg-white/80 border border-white/50 p-8 rounded-3xl shadow-2xl backdrop-blur-2xl text-center",
          alertAccent: "text-indigo-600 font-bold",
          messageText: "text-lg mt-4 text-slate-600 font-medium"
        };
      case 'fire':
        return {
          container: "bg-transparent font-bold text-orange-500",
          goalBox: "bg-red-950/80 border-b-4 border-orange-500 p-3 shadow-[0_4px_20px_rgba(255,100,0,0.4)]",
          goalText: "text-3xl text-yellow-400 drop-shadow-[0_2px_5px_rgba(255,0,0,1)]",
          barBg: "bg-red-950",
          barFill: "bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400",
          alertBox: "bg-red-950/90 border-2 border-orange-500 p-8 shadow-[0_0_50px_rgba(255,50,0,0.6)] rounded-lg",
          alertAccent: "text-yellow-400 drop-shadow-[0_0_10px_rgba(255,100,0,1)]",
          messageText: "text-xl mt-4 text-orange-200"
        };
      default: // matrix (original)
        return {
          container: "bg-transparent font-mono text-green-500 font-bold scanlines crt-flicker",
          goalBox: "bg-black/85 border border-green-500 p-3 shadow-[0_0_10px_rgba(0,255,0,0.5)]",
          goalText: "text-3xl numeral-pulse text-green-400 drop-shadow-[0_0_5px_rgba(0,255,0,1)] text-center",
          barBg: "bg-green-900/20 border border-green-500/30",
          barFill: "bg-green-500 shadow-[0_0_10px_rgba(0,255,0,1)]",
          alertBox: "bg-black/95 border-2 border-green-500 p-8 text-center shadow-[0_0_40px_rgba(0,255,0,0.9)]",
          alertAccent: "text-green-400 drop-shadow-[0_0_10px_rgba(0,255,0,1)]",
          messageText: "text-xl mt-4 border-t border-green-500/50 pt-4 text-green-400 drop-shadow-[0_0_5px_rgba(0,255,0,1)]"
        };
    }
  };

  const t = getThemeClasses();

  return (
    <div className={`w-screen h-screen overflow-hidden relative ${t.container}`}>
      {/* Goal Overlay */}
      <div className={`absolute top-4 right-4 transition-all duration-500 ${t.goalBox}`}>
        <div className={t.goalText}>
          ${currentAmount.toFixed(2)} / ${goalAmount.toFixed(2)}
        </div>
        <div className={`mt-2 w-48 h-1.5 ${t.barBg}`}>
          <div
            className={`h-full transition-all duration-1000 ease-out ${t.barFill}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Donation Alert Animation */}
      {donation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`max-w-2xl transform transition-all duration-500 ${t.alertBox} ${isExiting ? 'scale-90 opacity-0' : 'scale-100 opacity-100 animate-bounce-short'}`}>
            <div className="text-4xl mb-4 tracking-widest text-center">
              {theme === 'matrix' ? (
                <MatrixText text={`${donation.sender.substring(0, 8)}...`} className={t.alertAccent} />
              ) : (
                <span className={t.alertAccent}>{donation.sender.substring(0, 8)}...</span>
              )}
              <span className="mx-2 opacity-80">SENT</span>
              <span className={`font-bold ${t.alertAccent}`}>
                {donation.amount} {donation.currency}
              </span>
              
              {/* Fiat Value display (CoinGecko) */}
              {donation.fiatValue && (
                <div className="text-xl mt-2 opacity-80">
                  (~${donation.fiatValue.toFixed(2)} USD)
                </div>
              )}
            </div>

            {donation.message && (
              <p className={`break-words text-center ${t.messageText}`}>
                &quot;{donation.message}&quot;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
