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

// Korean Jamo Phonetic Name Map for reliable TTS pronunciation
export const JAMO_NAME_MAP: Record<string, string> = {
  // 14 기본 자음
  'ㄱ': '기역',
  'ㄴ': '니은',
  'ㄷ': '디귿',
  'ㄹ': '리을',
  'ㅁ': '미음',
  'ㅂ': '비읍',
  'ㅅ': '시옷',
  'ㅇ': '이응',
  'ㅈ': '지읒',
  'ㅊ': '치읓',
  'ㅋ': '키읔',
  'ㅌ': '티읕',
  'ㅍ': '피읖',
  'ㅎ': '히읗',
  // 쌍자음
  'ㄲ': '쌍기역',
  'ㄸ': '쌍디귿',
  'ㅃ': '쌍비읍',
  'ㅆ': '쌍시옷',
  'ㅉ': '쌍지읒',
  // 기본 모음
  'ㅏ': '아',
  'ㅑ': '야',
  'ㅓ': '어',
  'ㅕ': '여',
  'ㅗ': '오',
  'ㅛ': '요',
  'ㅜ': '우',
  'ㅠ': '유',
  'ㅡ': '으',
  'ㅣ': '이',
  // 복합 모음
  'ㅐ': '애',
  'ㅒ': '얘',
  'ㅔ': '에',
  'ㅖ': '예',
};

export type VoiceTone = 'mom' | 'dad' | 'teacher' | 'friend';

export interface VoiceToneInfo {
  id: VoiceTone;
  name: string;
  emoji: string;
  desc: string;
  pitch: number;
  rate: number;
  playbackRate: number;
}

export const VOICE_TONES: VoiceToneInfo[] = [
  {
    id: 'mom',
    name: '다정한 엄마',
    emoji: '👩',
    desc: '부드럽고 포근하게 감싸주는 따뜻한 톤 (기본)',
    pitch: 1.15,
    rate: 0.92,
    playbackRate: 1.02,
  },
  {
    id: 'dad',
    name: '친근한 아빠',
    emoji: '👨',
    desc: '자상하고 든든하게 응원해주는 톤',
    pitch: 0.82,
    rate: 0.93,
    playbackRate: 0.88,
  },
  {
    id: 'teacher',
    name: '선생님',
    emoji: '👩‍🏫',
    desc: '또랑또랑하고 정확한 발음의 친절한 톤',
    pitch: 1.25,
    rate: 0.96,
    playbackRate: 1.08,
  },
  {
    id: 'friend',
    name: '귀여운 친구',
    emoji: '🧒',
    desc: '신나고 발랄하게 함께 배우는 톤',
    pitch: 1.35,
    rate: 1.0,
    playbackRate: 1.12,
  },
];

let currentVoiceTone: VoiceTone = 'mom';

export function getVoiceTone(): VoiceTone {
  try {
    const val = localStorage.getItem('hangul_voice_tone');
    if (val && ['mom', 'dad', 'teacher', 'friend'].includes(val)) {
      currentVoiceTone = val as VoiceTone;
      return currentVoiceTone;
    }
  } catch (e) {
    // ignore
  }
  return currentVoiceTone;
}

export function setVoiceTone(tone: VoiceTone) {
  currentVoiceTone = tone;
  try {
    localStorage.setItem('hangul_voice_tone', tone);
  } catch (e) {
    // ignore
  }
}

// In-memory audio buffer cache and active sources for instant, natural speech
const audioBufferCache = new Map<string, AudioBuffer>();
let activeSpeechAudio: HTMLAudioElement | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

function playAudioFallback(audioUrl: string, volMult: number, toneInfo: VoiceToneInfo) {
  try {
    const audio = new Audio(audioUrl);
    audio.volume = volMult;
    audio.playbackRate = toneInfo.playbackRate;
    activeSpeechAudio = audio;
    audio.play().catch(() => {});
  } catch (e) {
    // ignore
  }
}

export function speakKorean(text: string, withSoftChime = false, customTone?: VoiceTone) {
  const volMult = getVolumeMultiplier();
  if (volMult <= 0) return;

  if (withSoftChime) {
    playSfx('bell');
  }

  // Convert single consonant/vowel jamos into full Korean phonetic names (e.g. 'ㄱ' -> '기역')
  const rawText = text.trim();
  const spokenText = JAMO_NAME_MAP[rawText] || rawText;

  // Selected Voice Tone info
  const toneId = customTone || getVoiceTone();
  const toneInfo = VOICE_TONES.find((t) => t.id === toneId) || VOICE_TONES[0];

  // Stop any ongoing native speech synthesis or audio playback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  if (activeSpeechAudio) {
    activeSpeechAudio.pause();
    activeSpeechAudio.currentTime = 0;
    activeSpeechAudio = null;
  }
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
    } catch (e) {}
    currentSourceNode = null;
  }

  // Priority 1: High-fidelity Native Web Speech API (Sounds 100% human, gentle and natural on iOS, Mac, Android, and Windows)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'ko-KR';
      utterance.pitch = toneInfo.pitch;
      utterance.rate = toneInfo.rate;
      utterance.volume = Math.min(1.0, volMult * 1.1);

      // Select matching gender/persona Korean voice if available in system
      const voices = window.speechSynthesis.getVoices();
      const koreanVoices = voices.filter(
        (v) => v.lang.startsWith('ko') || v.lang.includes('KR') || v.lang.includes('Korean')
      );

      if (koreanVoices.length > 0) {
        if (toneInfo.id === 'dad') {
          const maleVoice = koreanVoices.find(
            (v) =>
              v.name.includes('InJoon') ||
              v.name.includes('Male') ||
              v.name.includes('남') ||
              v.name.includes('남자')
          );
          utterance.voice = maleVoice || koreanVoices[0];
        } else {
          // Warm maternal female voice prioritized
          const femaleVoice = koreanVoices.find(
            (v) =>
              v.name.includes('Yuna') ||
              v.name.includes('SunHi') ||
              v.name.includes('Sora') ||
              v.name.includes('Heami') ||
              v.name.includes('Female') ||
              v.name.includes('여') ||
              v.name.includes('여성') ||
              v.name.includes('Google 한국의')
          );
          utterance.voice = femaleVoice || koreanVoices[0];
        }
      }

      let speechStarted = false;
      utterance.onstart = () => {
        speechStarted = true;
      };

      window.speechSynthesis.speak(utterance);

      // Fallback check: If browser speech synthesis was muted or suspended (e.g. mobile silent mode)
      const audioUrl = `/api/tts?text=${encodeURIComponent(spokenText)}`;
      setTimeout(() => {
        if (!speechStarted && !window.speechSynthesis.speaking) {
          playAudioFallback(audioUrl, volMult, toneInfo);
        }
      }, 350);

      return;
    } catch (e) {
      // Fall through to server audio fallback
    }
  }

  // Priority 2: Server TTS Proxy Fallback
  const audioUrl = `/api/tts?text=${encodeURIComponent(spokenText)}`;
  playAudioFallback(audioUrl, volMult, toneInfo);
}

