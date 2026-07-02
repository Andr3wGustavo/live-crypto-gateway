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

export default function OverlayPage({ params }: { params: Promise<{ obs_token: string }> }) {
  const { obs_token } = use(params);
  const [donation, setDonation] = useState<{ amount: number, currency: string, sender: string, message: string } | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Strict rule: Goal Overlays should have NO descriptive text, only raw numerals
  const [goalAmount] = useState(1500.00);
  const [currentAmount, setCurrentAmount] = useState(1240.50);

  // Text-to-Speech using Web Speech API
  const speakDonation = useCallback((donationData: { amount: number, currency: string, sender: string, message: string }) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const senderShort = donationData.sender.substring(0, 8);
      let utteranceText = `${senderShort} sent ${donationData.amount} ${donationData.currency}.`;
      if (donationData.message) {
        // Sanitize message to prevent XSS in TTS
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

  useEffect(() => {
    // Connect to WebSocket Server
    const wsUrl = `ws://localhost:8080/?obs_token=${obs_token}`;
    let ws: WebSocket;

    const connectWS = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to WS');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'DONATION') {
            const donationData = {
              amount: data.amount,
              currency: data.currency,
              sender: data.sender,
              message: data.message
            };
            setDonation(donationData);
            setIsExiting(false);
            setCurrentAmount(prev => prev + data.amount);

            // Trigger TTS
            speakDonation(donationData);

            // Start exit animation after 8 seconds, then remove after 0.5s
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
        console.log('WS Disconnected. Reconnecting in 5s...');
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, [obs_token, speakDonation]);

  const progressPercent = Math.min((currentAmount / goalAmount) * 100, 100);

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent relative font-mono text-primary font-bold scanlines crt-flicker">
      {/* Goal Overlay - STRICT RULE: Raw pulsating numerals ONLY. No descriptive text. */}
      <div className="absolute top-4 right-4 bg-black/85 border border-primary p-3 shadow-[0_0_10px_rgba(0,255,0,0.5)]">
        <div className="text-3xl numeral-pulse text-glow text-center">
          {currentAmount.toFixed(2)} / {goalAmount.toFixed(2)}
        </div>
        {/* Progress bar - no labels */}
        <div className="mt-2 w-48 h-1.5 bg-primary/20 border border-primary/30">
          <div
            className="h-full bg-primary bar-glow transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Donation Alert Animation */}
      {donation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`bg-black/95 border-2 border-primary p-8 text-center shadow-[0_0_40px_rgba(0,255,0,0.9)] max-w-2xl ${isExiting ? 'alert-exit' : 'alert-enter'}`}>
            {/* Donor address with Matrix decode effect */}
            <div className="text-4xl mb-4 tracking-widest">
              <MatrixText
                text={`${donation.sender.substring(0, 8)}...`}
                className="text-primary"
              />
              <span className="text-white drop-shadow-[0_0_10px_#00ff00]"> SENT </span>
              <span className="text-glow">{donation.amount} {donation.currency}</span>
            </div>

            {/* Donation message */}
            {donation.message && (
              <p className="text-xl mt-4 border-t border-primary/50 pt-4 break-words text-glow">
                &quot;{donation.message}&quot;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
