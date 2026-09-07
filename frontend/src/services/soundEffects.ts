/**
 * Web Audio API Sound Synthesizer for Live Crypto
 * Generates instantaneous, zero-latency procedural sound effects for OBS alerts and dashboard previews
 * without relying on external MP3 downloads or CORS.
 */

export type SoundPresetId = 'arcade_coin' | 'cyber_chime' | 'cash_register' | 'laser_beam';

export interface SoundPresetInfo {
  id: SoundPresetId;
  name: string;
  description: string;
  tag: string;
}

export const SOUND_PRESETS: SoundPresetInfo[] = [
  { id: 'arcade_coin', name: 'Retro Arcade Coin', description: 'Classic 8-bit rising two-tone coin ding', tag: '8-BIT' },
  { id: 'cyber_chime', name: 'Cyberpunk Chime', description: 'Futuristic ambient sci-fi harmonic chime', tag: 'SCI-FI' },
  { id: 'cash_register', name: 'Cash Register Cha-Ching', description: 'Satisfying mechanical register bell chime', tag: 'MONEY' },
  { id: 'laser_beam', name: 'Neon Laser Pulse', description: 'High-energy laser blast with sub-bass drop', tag: 'PUNCHY' },
];

export function playSynthesizedSound(preset: SoundPresetId = 'arcade_coin', volume: number = 0.4) {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), now);
    masterGain.connect(ctx.destination);

    if (preset === 'arcade_coin') {
      // Classic 8-bit Mario/Arcade coin: B5 (987.77Hz) -> E6 (1318.51Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);

    } else if (preset === 'cyber_chime') {
      // Futuristic 3-note harmonic shimmer (Root, 5th, Octave + Detune)
      const freqs = [523.25, 783.99, 1046.50]; // C5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.05);

        gain.gain.setValueAtTime(0.35, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + i * 0.1);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + i * 0.05);
        osc.stop(now + 1.0);
      });

    } else if (preset === 'cash_register') {
      // Metallic mechanical click + bell ring
      const oscBell = ctx.createOscillator();
      const gainBell = ctx.createGain();
      oscBell.type = 'sine';
      oscBell.frequency.setValueAtTime(1760, now + 0.04); // A6
      gainBell.gain.setValueAtTime(0.4, now + 0.04);
      gainBell.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      oscBell.connect(gainBell);
      gainBell.connect(masterGain);
      oscBell.start(now + 0.04);
      oscBell.stop(now + 0.75);

      // Short click transient
      const oscClick = ctx.createOscillator();
      const gainClick = ctx.createGain();
      oscClick.type = 'square';
      oscClick.frequency.setValueAtTime(320, now);
      gainClick.gain.setValueAtTime(0.2, now);
      gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      oscClick.connect(gainClick);
      gainClick.connect(masterGain);
      oscClick.start(now);
      oscClick.stop(now + 0.06);

    } else if (preset === 'laser_beam') {
      // Sci-fi downward laser sweep: 1500Hz -> 120Hz + sub drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn("Web Audio synthesis error:", e);
  }
}
