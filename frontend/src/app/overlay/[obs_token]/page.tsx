"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { use } from 'react';
import { playSynthesizedSound, SoundPresetId } from '@/services/soundEffects';
import { speakWithProfile, VoiceProfileId } from '@/services/voiceSynthesis';

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

// Token Icon Badge helper
function TokenBadge({ currency }: { currency: string }) {
  const c = currency.toUpperCase();
  if (c.includes('SOL')) return <span className="text-xl">☀️</span>;
  if (c.includes('SUI')) return <span className="text-xl text-cyan-400">💧</span>;
  if (c.includes('ETH')) return <span className="text-xl text-blue-400">🔷</span>;
  if (c.includes('BTC')) return <span className="text-xl text-amber-400">⚡</span>;
  if (c.includes('POL') || c.includes('MATIC')) return <span className="text-xl text-purple-400">🟣</span>;
  if (c.includes('TON')) return <span className="text-xl text-sky-400">💎</span>;
  return <span className="text-xl">💰</span>;
}

interface LeaderboardItem {
  sender: string;
  totalFiat: number;
  lastCurrency: string;
}

export default function OverlayPage({ params }: { params: Promise<{ obs_token: string }> }) {
  const { obs_token } = use(params);
  const [donation, setDonation] = useState<{ 
    amount: number; 
    currency: string; 
    sender: string; 
    message: string; 
    fiatValue?: number;
    mediaUrl?: string | null;
  } | null>(null);

  const [isExiting, setIsExiting] = useState(false);
  const [theme, setTheme] = useState<'matrix' | 'cyberpunk' | 'minimal' | 'fire'>('cyberpunk');
  const [position, setPosition] = useState<'bottom-center' | 'top-right' | 'top-left' | 'center' | 'bottom-right'>('bottom-center');
  const [soundPreset, setSoundPreset] = useState<SoundPresetId>('arcade_coin');
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfileId>('cyber_announcer');
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([
    { sender: 'alex.sol', totalFiat: 4750.00, lastCurrency: 'SOL' },
    { sender: 'satoshi.eth', totalFiat: 480.00, lastCurrency: 'ETH' },
    { sender: 'slush_whale', totalFiat: 420.00, lastCurrency: 'SUI' }
  ]);

  const [goalAmount, setGoalAmount] = useState(100.00);
  const [currentAmount, setCurrentAmount] = useState(0.00);
  const [goalTitle, setGoalTitle] = useState('Stream Donation Goal');
  const [mediaConfig, setMediaConfig] = useState<{ mediaUrl: string | null; audioUrl: string | null }>({ mediaUrl: null, audioUrl: null });
  const [isTtsMuted, setIsTtsMuted] = useState(false);

  const activeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Text-to-Speech using configured AI Voice Profile
  const speakDonation = useCallback((donationData: { amount: number, currency: string, sender: string, message: string }) => {
    if (isTtsMuted) return;
    const senderShort = donationData.sender.substring(0, 14);
    let utteranceText = `${senderShort} donated ${donationData.amount} ${donationData.currency}!`;
    if (donationData.message) {
      const sanitized = donationData.message.replace(/<[^>]*>/g, '').substring(0, 200);
      utteranceText += ` Message: ${sanitized}`;
    }
    speakWithProfile(utteranceText, voiceProfile, 1.0);
  }, [isTtsMuted, voiceProfile]);

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
              if (data.config.position) setPosition(data.config.position);
              if (data.config.sound_preset) setSoundPreset(data.config.sound_preset);
              if (data.config.voice_profile) setVoiceProfile(data.config.voice_profile);
              if (data.config.show_leaderboard !== undefined) setShowLeaderboard(data.config.show_leaderboard);
            }

            if (data.event === 'CONFIG_UPDATE') {
              if (data.theme) setTheme(data.theme);
              if (data.goal_amount !== undefined) setGoalAmount(data.goal_amount);
              if (data.goal_current !== undefined) setCurrentAmount(data.goal_current);
              if (data.goal_title !== undefined) setGoalTitle(data.goal_title);
              if (data.position) setPosition(data.position);
              if (data.sound_preset) setSoundPreset(data.sound_preset);
              if (data.voice_profile) setVoiceProfile(data.voice_profile);
              if (data.show_leaderboard !== undefined) setShowLeaderboard(data.show_leaderboard);
              if (data.media_url !== undefined) setMediaConfig(prev => ({ ...prev, mediaUrl: data.media_url }));
              if (data.audio_url !== undefined) setMediaConfig(prev => ({ ...prev, audioUrl: data.audio_url }));
            }

            if (data.event === 'ALERT_SKIP') {
              // Immediately dismiss the active alert
              if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
              setIsExiting(true);
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              setTimeout(() => {
                setDonation(null);
                setIsExiting(false);
              }, 300);
            }

            if (data.event === 'TTS_MUTE_TOGGLE') {
              setIsTtsMuted(prev => !prev);
            }

            if (data.event === 'DONATION') {
              const donationAmount = parseFloat(data.amount);
              const fiatValue = data.fiatValue ? parseFloat(data.fiatValue) : donationAmount * 10;
              const donationData = {
                amount: donationAmount,
                currency: data.currency,
                sender: data.sender || 'Anonymous',
                message: data.message || '',
                fiatValue: fiatValue,
                mediaUrl: data.media_url || mediaConfig.mediaUrl
              };
              
              setDonation(donationData);
              setIsExiting(false);
              
              setCurrentAmount(prev => prev + fiatValue);

              // Update live on-chain leaderboard
              setLeaderboard(prev => {
                const existing = prev.find(item => item.sender.toLowerCase() === donationData.sender.toLowerCase());
                let updated: LeaderboardItem[];
                if (existing) {
                  updated = prev.map(item => item.sender.toLowerCase() === donationData.sender.toLowerCase() 
                    ? { ...item, totalFiat: item.totalFiat + fiatValue, lastCurrency: donationData.currency }
                    : item
                  );
                } else {
                  updated = [...prev, { sender: donationData.sender, totalFiat: fiatValue, lastCurrency: donationData.currency }];
                }
                return updated.sort((a, b) => b.totalFiat - a.totalFiat).slice(0, 3);
              });

              // Play audio chime if configured, or trigger procedural synthesized sound
              const audioToPlay = data.audio_url || mediaConfig.audioUrl;
              if (audioToPlay) {
                const audio = new Audio(audioToPlay);
                audio.volume = 1.0;
                audio.play().catch(e => {
                  console.warn("Audio file playback error, falling back to synthesizer:", e);
                  playSynthesizedSound(soundPreset, 0.45);
                });
              } else {
                playSynthesizedSound(soundPreset, 0.45);
              }

              speakDonation(donationData);

              // Clear any existing dismissal timer
              if (activeTimerRef.current) clearTimeout(activeTimerRef.current);

              // Auto-dismiss alert after 7 seconds
              activeTimerRef.current = setTimeout(() => {
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
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      document.body.classList.remove('obs-transparent-mode');
      document.documentElement.classList.remove('obs-transparent-mode');
    };
  }, [obs_token, mediaConfig.mediaUrl, mediaConfig.audioUrl, soundPreset, speakDonation]);

  const goalPercentage = Math.min(100, Math.max(0, (currentAmount / (goalAmount || 1)) * 100));

  // Determine flex alignment based on configured position
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'items-start justify-start pt-8 pl-8';
      case 'top-right':
        return 'items-end justify-start pt-8 pr-8';
      case 'center':
        return 'items-center justify-center';
      case 'bottom-right':
        return 'items-end justify-end pb-8 pr-8';
      case 'bottom-center':
      default:
        return 'items-center justify-end pb-8';
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden pointer-events-none p-8 flex flex-col justify-between select-none font-sans relative">
      
      {/* Top Header Row: Top 3 Leaderboard Widget + Donation Goal Widget */}
      <div className="w-full flex justify-between items-start z-10">
        
        {/* On-Chain Top 3 Leaderboard Widget */}
        {showLeaderboard && (
          <div className="glass-panel p-3.5 rounded-2xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl max-w-xs w-full">
            <div className="flex items-center justify-between text-[10px] font-mono mb-2 pb-1.5 border-b border-white/10">
              <span className="text-white font-bold flex items-center gap-1.5 uppercase">
                <span>🏆</span> TOP SUPPORTERS
              </span>
              <span className="text-cyan-400 font-bold">ON-CHAIN</span>
            </div>
            <div className="space-y-1.5">
              {leaderboard.map((supporter, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="text-slate-200 font-bold truncate max-w-[120px]">
                      {supporter.sender}
                    </span>
                  </div>
                  <span className="text-cyan-300 font-bold text-[11px] flex-shrink-0">
                    ${supporter.totalFiat.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Right Donation Goal Widget */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 max-w-sm w-full shadow-[0_15px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl ml-auto">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-white font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 radar-dot"></span>
              {goalTitle}
            </span>
            <span className="text-cyan-300 font-bold">${currentAmount.toFixed(0)} / ${goalAmount.toFixed(0)}</span>
          </div>
          <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(0,242,254,0.6)]"
              style={{ width: `${goalPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Donation Alert Display Area */}
      <div className={`absolute inset-0 p-8 flex flex-col ${getPositionClasses()} pointer-events-none z-20`}>
        {donation && (
          <div className={`w-full max-w-lg p-6 rounded-3xl backdrop-blur-2xl border shadow-[0_25px_60px_rgba(0,0,0,0.9)] transition-all duration-500 ${
            isExiting ? 'alert-exit' : 'alert-enter'
          } ${
            theme === 'cyberpunk' ? 'bg-black/92 border-cyan-400/80 shadow-[0_0_50px_rgba(0,242,254,0.38)]' :
            theme === 'matrix' ? 'bg-black/92 border-emerald-500/80 shadow-[0_0_50px_rgba(16,185,129,0.38)] text-emerald-400' :
            theme === 'fire' ? 'bg-black/92 border-orange-500/80 shadow-[0_0_50px_rgba(249,115,22,0.38)] text-orange-300' :
            'bg-black/95 border-white/40 text-white'
          }`}>
            <div className="flex items-start gap-4">
              {/* Media Container: Custom IPFS GIF/MP4 or High-Glow Crypto Badge */}
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-cyan-400/40 shadow-[0_0_25px_rgba(0,242,254,0.35)] flex-shrink-0 bg-black/80 flex items-center justify-center">
                {donation.mediaUrl ? (
                  donation.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                    <video src={donation.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={donation.mediaUrl} alt="Alert Media" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-600/20">
                    <TokenBadge currency={donation.currency} />
                  </div>
                )}
              </div>

              {/* Text & Message Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-white font-mono tracking-wide truncate">
                    <MatrixText text={donation.sender} />
                  </span>
                  <span className="text-sm font-mono font-black text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-400/50 shadow-[0_0_20px_rgba(0,242,254,0.3)] flex-shrink-0">
                    +{donation.amount} {donation.currency}
                  </span>
                </div>

                {donation.fiatValue && (
                  <div className="text-[11px] font-mono text-cyan-400/80 mt-0.5 font-bold">
                    ≈ ${donation.fiatValue.toFixed(2)} USD
                  </div>
                )}

                {donation.message && (
                  <p className="text-xs text-slate-200 mt-2.5 font-sans leading-relaxed bg-black/60 p-3 rounded-xl border border-white/10 shadow-inner break-words">
                    &quot;{donation.message}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Verification Footer */}
            <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 radar-dot"></span>
                NON-CUSTODIAL ON-CHAIN SETTLED
              </span>
              <span className="text-cyan-400 font-bold tracking-wider">LIVE CRYPTO PROTOCOL</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
