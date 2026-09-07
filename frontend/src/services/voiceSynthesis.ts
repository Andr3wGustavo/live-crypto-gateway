/**
 * AI Voice Synthesis Service for Live Crypto
 * Supports tuned procedural vocal profiles (Web Speech API) and ElevenLabs Neural Voice API integration.
 */

export type VoiceProfileId = 'cyber_announcer' | 'anime_kawaii' | 'scifi_robot' | 'natural_host';

export interface VoiceProfileInfo {
  id: VoiceProfileId;
  name: string;
  tag: string;
  description: string;
  pitch: number;
  rate: number;
  elevenLabsVoiceId?: string;
}

export const VOICE_PROFILES: VoiceProfileInfo[] = [
  {
    id: 'cyber_announcer',
    name: 'Cyber Stadium Announcer',
    tag: 'EPIC BASS',
    description: 'Deep, resonant, authoritative stadium commentator',
    pitch: 0.72,
    rate: 0.90,
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB' // Adam - Deep Narrator
  },
  {
    id: 'anime_kawaii',
    name: 'Anime Vtuber Cheer',
    tag: 'KAWAII',
    description: 'High-energy, playful anime character cadence',
    pitch: 1.42,
    rate: 1.06,
    elevenLabsVoiceId: 'ThT5KcBeYPX3keUQqHPh' // Dorothy
  },
  {
    id: 'scifi_robot',
    name: 'Cyborg Synthesizer',
    tag: 'MECHA',
    description: 'Mechanical staccato robotic delivery',
    pitch: 0.55,
    rate: 0.96,
    elevenLabsVoiceId: 'onwK4e9ZLuTAKqWW03F9' // Daniel
  },
  {
    id: 'natural_host',
    name: 'Natural Stream Host',
    tag: 'WARM & CLEAR',
    description: 'Smooth, friendly podcast & esports caster tone',
    pitch: 1.0,
    rate: 0.98,
    elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel
  }
];

export function speakWithProfile(
  text: string, 
  profileId: VoiceProfileId = 'cyber_announcer', 
  volume: number = 1.0
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const profile = VOICE_PROFILES.find(p => p.id === profileId) || VOICE_PROFILES[0];
  const sanitized = text.replace(/<[^>]*>/g, '').substring(0, 250);
  const utterance = new SpeechSynthesisUtterance(sanitized);

  utterance.pitch = profile.pitch;
  utterance.rate = profile.rate;
  utterance.volume = Math.min(1.0, Math.max(0, volume));
  utterance.lang = 'en-US';

  // Try picking a matching system voice if available
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    if (profileId === 'cyber_announcer' || profileId === 'scifi_robot') {
      const deepVoice = voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('male')));
      if (deepVoice) utterance.voice = deepVoice;
    } else if (profileId === 'anime_kawaii') {
      const femaleVoice = voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('female')));
      if (femaleVoice) utterance.voice = femaleVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Speaks message prioritizing ElevenLabs Neural AI voice streaming via backend proxy,
 * gracefully falling back to browser Web Speech API if backend or API key is absent.
 */
export async function speakWithNeuralOrFallback(
  text: string, 
  profileId: VoiceProfileId = 'cyber_announcer', 
  volume: number = 1.0
): Promise<void> {
  const profile = VOICE_PROFILES.find(p => p.id === profileId) || VOICE_PROFILES[0];
  const sanitized = text.replace(/<[^>]*>/g, '').substring(0, 250);

  try {
    const res = await fetch('http://localhost:8080/api/public/tts-synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: sanitized,
        voice_id: profile.elevenLabsVoiceId
      })
    });

    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('audio/mpeg')) {
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = Math.min(1.0, Math.max(0, volume));
      await audio.play();
      return;
    }
  } catch (err) {
    console.debug('Neural TTS unreachable, using procedural Web Speech fallback:', err);
  }

  // Fallback to procedural synthesis
  speakWithProfile(sanitized, profileId, volume);
}
