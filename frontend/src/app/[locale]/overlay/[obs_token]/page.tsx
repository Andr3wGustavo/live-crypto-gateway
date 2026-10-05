"use client";

import { use, useEffect, useState } from 'react';
import { useI18n } from '@/i18n/Provider';
import { playSynthesizedSound, type SoundPresetId } from '@/services/soundEffects';
import { speakWithNeuralOrFallback, type VoiceProfileId } from '@/services/voiceSynthesis';

type Alert = { event_id?: string; amount: string; currency: string; sender: string; message: string; is_test?: boolean; media_url?: string; audio_url?: string };
type Settings = { theme: string; position: string; sound_preset: SoundPresetId; voice_profile: VoiceProfileId; goal_title: string; goal_amount: number; goal_current: number; show_leaderboard: boolean };
export default function Overlay({ params }: { params: Promise<{ obs_token: string }> }) {
  const { obs_token } = use(params);
  const { locale, messages: { overlay: o }, decimal, number } = useI18n();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [settings, setSettings] = useState<Settings>({ theme: 'cyberpunk', position: 'bottom-center', sound_preset: 'arcade_coin', voice_profile: 'cyber_announcer', goal_title: o.goal, goal_amount: 0, goal_current: 0, show_leaderboard: true });
  useEffect(() => {
    document.body.classList.add('obs-transparent-mode');
    document.documentElement.classList.add('obs-transparent-mode');
    let current: Settings = { theme: 'cyberpunk', position: 'bottom-center', sound_preset: 'arcade_coin', voice_profile: 'cyber_announcer', goal_title: o.goal, goal_amount: 0, goal_current: 0, show_leaderboard: true };
    let socket: WebSocket;
    let disposed = false, muted = false;
    let active: Alert | null = null;
    const queue: Alert[] = [];
    const storageKey = `livecrypto:obs:seen:${obs_token}`;
    let seen: string[] = [];
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(saved)) seen = saved.filter(value => typeof value === 'string').slice(-500); } catch { /* Storage may be disabled. Server ACK remains authoritative. */ }
    let displayTimer: ReturnType<typeof setTimeout>, reconnectTimer: ReturnType<typeof setTimeout>, nextTimer: ReturnType<typeof setTimeout>;
    let audio: HTMLAudioElement | null = null;
    const acknowledge = (id?: string) => { if (id && socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ event: 'ACK', event_id: id })); };
    const finish = () => {
      clearTimeout(displayTimer);
      if (active?.event_id) {
        seen = [...seen.filter(id => id !== active!.event_id), active.event_id].slice(-500);
        try { localStorage.setItem(storageKey, JSON.stringify(seen)); } catch { /* At-least-once replay after a storage failure is possible. */ }
        acknowledge(active.event_id);
      }
      active = null; setAlert(null);
      audio?.pause(); window.speechSynthesis?.cancel();
      nextTimer = setTimeout(showNext, 300);
    };
    function showNext() {
      if (disposed || active || !queue.length) return;
      active = queue.shift()!; setAlert(active);
      if (active.audio_url) { audio = new Audio(active.audio_url); void audio.play().catch(() => playSynthesizedSound(current.sound_preset, .45)); }
      else playSynthesizedSound(current.sound_preset, .45);
      if (!muted) {
        const text = o.speech.replace('{sender}', active.sender.slice(0, 24)).replace('{amount}', new Intl.NumberFormat(locale, { maximumFractionDigits: 18 }).format(Number(active.amount))).replace('{currency}', active.currency);
        void speakWithNeuralOrFallback(`${text} ${active.message ? `${o.message} ${active.message}` : ''}`, current.voice_profile, 1, locale);
      }
      displayTimer = setTimeout(finish, 7500);
    }
    function connect() {
      if (disposed) return;
      const base = process.env.NEXT_PUBLIC_WS_URL || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8080`;
      socket = new WebSocket(`${base.replace(/\/$/, '')}/?obs_token=${encodeURIComponent(obs_token)}`);
      socket.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'CONNECTED' || data.event === 'CONFIG_UPDATE') {
            const incoming = data.config || data;
            current = { ...current, ...incoming, theme: incoming.theme || incoming.active_theme || current.theme };
            setSettings(current);
          } else if (data.event === 'TTS_MUTE_TOGGLE') { muted = !muted; if (muted) window.speechSynthesis?.cancel(); }
          else if (data.event === 'ALERT_SKIP') finish();
          else if (data.event === 'DONATION') {
            const id = data.event_id ? String(data.event_id) : undefined;
            if (id && seen.includes(id)) { acknowledge(id); return; }
            if (id && (active?.event_id === id || queue.some(item => item.event_id === id))) return;
            if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) return;
            if (queue.length >= 50) return; // Real events remain unacknowledged and retry after reconnect.
            queue.push({ ...data, event_id: id, amount: String(data.amount), sender: data.sender || o.anonymous, message: data.message || '' });
            showNext();
          }
        } catch (error) { console.error('Invalid OBS event', error); }
      };
      socket.onclose = event => { if (!disposed && event.code !== 1008) reconnectTimer = setTimeout(connect, 3000); };
    }
    connect();
    return () => {
      disposed = true; clearTimeout(displayTimer); clearTimeout(nextTimer); clearTimeout(reconnectTimer); socket?.close(); audio?.pause(); window.speechSynthesis?.cancel();
      document.body.classList.remove('obs-transparent-mode'); document.documentElement.classList.remove('obs-transparent-mode');
    };
  }, [obs_token, locale, o]);

  const position = settings.position === 'top-left' ? 'items-start justify-start' : settings.position === 'top-right' ? 'items-end justify-start' : settings.position === 'center' ? 'items-center justify-center' : settings.position === 'bottom-right' ? 'items-end justify-end' : 'items-center justify-end';
  const goal = Math.min(100, Math.max(0, Number(settings.goal_current) / (Number(settings.goal_amount) || 1) * 100));
  return <main className={`fixed inset-0 p-8 flex flex-col ${position} pointer-events-none`}>
    <aside className="absolute top-8 right-8 product-panel p-4 max-w-sm">
      <p>{settings.goal_title}</p><p className="field-hint">{number(Number(settings.goal_current || 0), { style: 'currency', currency: 'USD' })} / {number(Number(settings.goal_amount || 0), { style: 'currency', currency: 'USD' })}</p>
      <div className="h-1 bg-white/10 mt-3"><div className="h-full bg-primary" style={{ width: `${goal}%` }} /></div>
    </aside>
    {settings.show_leaderboard && <span className="absolute top-8 left-8 text-xs text-white/60">{o.supporters}</span>}
    {alert && <article className={`studio-sample visual-${settings.theme} !w-full !max-w-lg alert-enter`}>
      {alert.media_url && (/\.(mp4|webm)$/i.test(alert.media_url) ? <video src={alert.media_url} autoPlay muted playsInline className="w-16 h-16 object-cover mb-3" /> :
        // eslint-disable-next-line @next/next/no-img-element
        <img src={alert.media_url} alt={o.media} className="w-16 h-16 object-cover mb-3" />)}
      <strong><bdi>{alert.sender}</bdi><span>+{decimal(alert.amount)} {alert.currency}</span></strong>
      {alert.message && <p>{alert.message}</p>}
      <p className="field-hint">{alert.is_test ? o.test : o.settled}</p>
    </article>}
  </main>;
}
