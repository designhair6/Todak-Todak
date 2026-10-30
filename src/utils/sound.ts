import { SoundVolume } from '../types';

let audioCtx: AudioContext | null = null;
let currentVolume: SoundVolume = 'medium';

export function getSoundVolume(): SoundVolume {
  try {
    const val = localStorage.getItem('hangul_sound_volume');
    if (val && ['soft', 'medium', 'loud'].includes(val)) {
      currentVolume = val as SoundVolume;
      return currentVolume;
    }
  } catch (e) {
    // ignore
  }
  return currentVolume;
}

export function setSoundVolume(vol: SoundVolume) {
  currentVolume = vol;
  try {
    localStorage.setItem('hangul_sound_volume', vol);
  } catch (e) {
    // ignore
  }
}

export function cycleSoundVolume(): SoundVolume {
  const current = getSoundVolume();
  let next: SoundVolume = 'medium';
  if (current === 'soft') next = 'medium';
  else if (current === 'medium') next = 'loud';
  else next = 'soft'; // loops: 약 -> 중 -> 강 -> 약

  setSoundVolume(next);
  return next;
}

function getVolumeMultiplier(): number {
  switch (currentVolume) {
    case 'soft':
      return 0.35; // 약
    case 'medium':
      return 0.7; // 중
    case 'loud':
      return 1.0; // 강
    default:
      return 0.7;
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playSoftTone(
  freq: number,
  startDelay: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.12
) {
  const volMult = getVolumeMultiplier();
  if (volMult <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

    const actualVol = volume * volMult;
    gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
    gain.gain.linearRampToValueAtTime(actualVol, ctx.currentTime + startDelay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startDelay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration + 0.05);
  } catch (e) {
    // audio error ignored
  }
}

export type SfxType =
  | 'tap'
  | 'pop'
  | 'stick'
  | 'rare'
  | 'fan'
  | 'success'
  | 'draw'
  | 'erase'
  | 'pet'
  | 'levelup'
  | 'bell'
  | 'kiss';

export function playSfx(name: SfxType) {
  if (getVolumeMultiplier() <= 0) return;
  try {
    switch (name) {
      case 'tap':
        playSoftTone(587.33, 0, 0.07, 'sine', 0.1);
        break;
      case 'pop':
        playSoftTone(440, 0, 0.06, 'sine', 0.12);
        playSoftTone(880, 0.03, 0.1, 'sine', 0.14);
        break;
      case 'bell':
        playSoftTone(784, 0, 0.22, 'triangle', 0.1);
        playSoftTone(1046.5, 0.05, 0.3, 'sine', 0.1);
        break;
      case 'kiss':
        // Cute sound blending kiss
        playSoftTone(659.25, 0, 0.08, 'sine', 0.12);
        playSoftTone(880, 0.06, 0.12, 'triangle', 0.15);
        playSoftTone(1174.66, 0.12, 0.2, 'sine', 0.14);
        break;
      case 'pet':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          playSoftTone(f, i * 0.07, 0.25, 'sine', 0.1);
        });
        break;
      case 'levelup':
        [523, 659, 784, 987, 1047, 1318].forEach((f, i) => {
          playSoftTone(f, i * 0.08, 0.35, 'triangle', 0.14);
        });
        break;
      case 'stick':
        playSoftTone(392, 0, 0.08, 'triangle', 0.12);
        playSoftTone(523, 0.06, 0.09, 'triangle', 0.12);
        playSoftTone(784, 0.12, 0.2, 'triangle', 0.14);
        break;
      case 'rare':
        [784, 988, 1175, 1568].forEach((f, i) => {
          playSoftTone(f, i * 0.06, 0.24, 'sine', 0.11);
        });
        break;
      case 'fan':
      case 'success':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
          playSoftTone(f, i * 0.08, 0.28, 'triangle', 0.13);
        });
        break;
      case 'draw':
        playSoftTone(440, 0, 0.03, 'sine', 0.02);
        break;
      case 'erase':
        playSoftTone(260, 0, 0.06, 'sine', 0.04);
        break;
      default:
        playSoftTone(500, 0, 0.05, 'sine', 0.08);
    }
  } catch (e) {
    // ignore
  }
}

// Warm, natural human mother-like Korean voice synthesis
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function speakKorean(text: string, withSoftChime = true) {
  const volMult = getVolumeMultiplier();
  if (volMult <= 0) return;

  if (withSoftChime) {
    playSfx('bell');
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';

    // Warm, gentle mother/teacher tone (gentle cadence, melodious pitch)
    utterance.pitch = 1.06;
    utterance.rate = 0.88; // Comfortable, affectionate speed for toddlers
    utterance.volume = volMult;

    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    // Prioritize natural human/neural voices over harsh robotic default synthesizer
    const targetVoice =
      voices.find((v) => v.lang.startsWith('ko') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Yuna') || v.name.includes('SunHi') || v.name.includes('Heami'))) ||
      voices.find((v) => v.lang.startsWith('ko') && !v.name.includes('Compact')) ||
      voices.find((v) => v.lang.startsWith('ko'));

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    setTimeout(
      () => {
        window.speechSynthesis.speak(utterance);
      },
      withSoftChime ? 120 : 0
    );
  } catch (e) {
    // fallback
  }
}
