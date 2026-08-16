"use client";

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';

// Matrix decoding effect for crypto sender names
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

export default function OverlayPage({ params }: { params: Promise<{ obs_token: string }> }) {
  const { obs_token } = use(params);
  const [donation, setDonation] = useState<{ amount: number, currency: string, sender: string, message: string, fiatValue?: number } | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [theme, setTheme] = useState<'matrix' | 'cyberpunk' | 'minimal' | 'fire'>('cyberpunk');
  const [goalAmount, setGoalAmount] = useState(100.00);
  const [currentAmount, setCurrentAmount] = useState(0.00);
  const [goalTitle, setGoalTitle] = useState('Stream Donation Goal');
  const [mediaConfig, setMediaConfig] = useState<{ mediaUrl: string | null; audioUrl: string | null }>({ mediaUrl: null, audioUrl: null });

  // Text-to-Speech using Web Speech API (English)
  const speakDonation = useCallback((donationData: { amount: number, currency: string, sender: string, message: string }) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const senderShort = donationData.sender.substring(0, 12);
      let utteranceText = `${senderShort} donated ${donationData.amount} ${donationData.currency}!`;
      if (donationData.message) {
        const sanitized = donationData.message.replace(/<[^>]*>/g, '').substring(0, 200);
        utteranceText += ` Message: ${sanitized}`;
      }
      const utterance = new SpeechSynthesisUtterance(utteranceText);
      utterance.rate = 0.95;
      utterance.pitch = 0.95;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    // Add OBS transparent mode class
    document.body.classList.add('obs-transparent-mode');
    document.documentElement.classList.add('obs-transparent-mode');

    // Connect to WebSocket Server
    const wsUrl = `ws://localhost:8080/?obs_token=${obs_token}`;
    let ws: WebSocket;

    const connectWS = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => console.log('Connected to Live Crypto OBS WebSocket stream');

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.event === 'CONNECTED' && data.config) {
              setTheme(data.config.theme || 'cyberpunk');
              setGoalAmount(data.config.goal_amount || 100);
              setCurrentAmount(data.config.goal_current || 0);
              setGoalTitle(data.config.goal_title || 'Stream Donation Goal');
              setMediaConfig({ mediaUrl: data.config.media_url, audioUrl: data.config.audio_url });
            }

            if (data.event === 'CONFIG_UPDATE') {
              if (data.theme) setTheme(data.theme);
              if (data.goal_amount !== undefined) setGoalAmount(data.goal_amount);
              if (data.goal_current !== undefined) setCurrentAmount(data.goal_current);
              if (data.goal_title !== undefined) setGoalTitle(data.goal_title);
            }

            if (data.event === 'DONATION') {
              const donationAmount = parseFloat(data.amount);
              const donationData = {
                amount: donationAmount,
                currency: data.currency,
                sender: data.sender || 'Anonymous',
                message: data.message || '',
                fiatValue: data.fiatValue ? parseFloat(data.fiatValue) : undefined
              };
              
              setDonation(donationData);
              setIsExiting(false);
              
              setCurrentAmount(prev => prev + (donationData.fiatValue || donationAmount));

              // Play audio chime if configured
              const audioToPlay = data.audio_url || mediaConfig.audioUrl;
              if (audioToPlay) {
                const audio = new Audio(audioToPlay);
                audio.volume = 1.0;
                audio.play().catch(e => console.warn("Audio playback error:", e));
              }

              speakDonation(donationData);

              // Auto-dismiss alert after 7 seconds
              setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => {
                  setDonation(null);
                  setIsExiting(false);
                }, 500);
              }, 7000);
            }
          } catch (err) {
            console.error("WS message parse error:", err);
          }
        };

        ws.onclose = () => {
          setTimeout(connectWS, 3000);
        };
      } catch (err) {
        console.warn("WS connection error:", err);
      }
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      document.body.classList.remove('obs-transparent-mode');
      document.documentElement.classList.remove('obs-transparent-mode');
    };
  }, [obs_token, mediaConfig.audioUrl, speakDonation]);

  const goalPercentage = Math.min(100, Math.max(0, (currentAmount / (goalAmount || 1)) * 100));

  return (
    <div className="w-screen h-screen overflow-hidden pointer-events-none p-8 flex flex-col justify-between select-none font-sans">
      
      {/* Top Donation Goal Widget */}
      <div className="w-full flex justify-end">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 max-w-sm w-full shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-white font-bold">{goalTitle}</span>
            <span className="text-cyan-300 font-bold">${currentAmount.toFixed(0)} / ${goalAmount.toFixed(0)}</span>
          </div>
          <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(0,242,254,0.6)]"
              style={{ width: `${goalPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Center/Bottom Donation Alert Card */}
      <div className="w-full flex justify-center mb-8">
        {donation && (
          <div className={`w-full max-w-lg p-6 rounded-3xl backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-all duration-500 ${
            isExiting ? 'alert-exit' : 'alert-enter'
          } ${
            theme === 'cyberpunk' ? 'bg-black/90 border-cyan-400/70 shadow-[0_0_45px_rgba(0,242,254,0.35)]' :
            theme === 'matrix' ? 'bg-black/90 border-emerald-500/70 shadow-[0_0_45px_rgba(16,185,129,0.35)] text-emerald-400' :
            theme === 'fire' ? 'bg-black/90 border-orange-500/70 shadow-[0_0_45px_rgba(249,115,22,0.35)] text-orange-300' :
            'bg-black/90 border-white/30 text-white'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,242,254,0.3)]">
                ⚡
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-white font-mono tracking-wide">
                    <MatrixText text={donation.sender} />
                  </span>
                  <span className="text-sm font-mono font-black text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-xl border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
                    +{donation.amount} {donation.currency}
                  </span>
                </div>

                {donation.message && (
                  <p className="text-xs text-slate-200 mt-2 font-sans leading-relaxed bg-black/50 p-2.5 rounded-xl border border-white/5">
                    &quot;{donation.message}&quot;
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 radar-dot"></span>
                NON-CUSTODIAL SETTLED
              </span>
              <span className="text-cyan-400 font-bold">LIVE CRYPTO ENGINE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
