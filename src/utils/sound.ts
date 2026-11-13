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
    desc: '포근하고 부드러운 엄마 목소리 (기본)',
    pitch: 1.12,
    rate: 0.9,
    playbackRate: 1.0,
  },
  {
    id: 'dad',
    name: '친근한 아빠',
    emoji: '👨',
    desc: '자상하고 든든한 아빠 목소리',
    pitch: 0.85,
    rate: 0.92,
    playbackRate: 0.92,
  },
  {
    id: 'teacher',
    name: '선생님',
    emoji: '👩‍🏫',
    desc: '또렷하고 차분한 선생님 목소리',
    pitch: 1.18,
    rate: 0.94,
    playbackRate: 1.04,
  },
  {
    id: 'friend',
    name: '귀여운 친구',
    emoji: '🧒',
    desc: '밝고 신나는 친구 목소리',
    pitch: 1.28,
    rate: 0.98,
    playbackRate: 1.08,
  },
];

let currentVoiceTone: VoiceTone = 'mom';
let cachedVoices: SpeechSynthesisVoice[] = [];
let ttsFallbackTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSpeakTimer: ReturnType<typeof setTimeout> | null = null;
let speechGenerationId = 0;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        cachedVoices = list;
      }
    } catch {}
  };
  loadVoices();
  try {
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
  } catch {}
}

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

let activeSpeechAudio: HTMLAudioElement | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let externalAudioStopper: (() => void) | null = null;

export function registerExternalAudioStopper(stopper: () => void) {
  externalAudioStopper = stopper;
}

export function stopAllSpeech() {
  speechGenerationId += 1;

  if (pendingSpeakTimer) {
    clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = null;
  }
  if (ttsFallbackTimer) {
    clearTimeout(ttsFallbackTimer);
    ttsFallbackTimer = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }

  if (activeSpeechAudio) {
    try {
      activeSpeechAudio.pause();
      activeSpeechAudio.currentTime = 0;
      activeSpeechAudio.src = '';
    } catch {}
    activeSpeechAudio = null;
  }

  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
    } catch {}
    currentSourceNode = null;
  }

  if (externalAudioStopper) {
    try {
      externalAudioStopper();
    } catch {}
  }
}

function playAudioFallback(
  audioUrl: string,
  volMult: number,
  toneInfo: VoiceToneInfo,
  genId: number
) {
  if (genId !== speechGenerationId) return;
  try {
    // Guarantee speechSynthesis is fully cancelled before starting HTMLAudio fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (activeSpeechAudio) {
      try {
        activeSpeechAudio.pause();
        activeSpeechAudio.currentTime = 0;
      } catch {}
      activeSpeechAudio = null;
    }

    const audio = new Audio(audioUrl);
    audio.volume = Math.min(1, volMult);
    // Keep playbackRate in a gentle female clarity band so voice never sounds deep/distorted
    const safeRate = toneInfo.id === 'dad' ? 0.98 : Math.min(1.08, Math.max(0.96, toneInfo.playbackRate));
    audio.playbackRate = safeRate;
    activeSpeechAudio = audio;
    audio.onended = () => {
      if (activeSpeechAudio === audio) {
        activeSpeechAudio = null;
      }
    };
    audio.play().catch(() => {});
  } catch (e) {
    // ignore
  }
}

const MALE_VOICE_BLACKLIST =
  /injoon|in-joon|hyunsu|hyun-su|bongjin|bong-jin|gookmin|gook-min|minsu|male|남성|남자|\bman\b|\bboy\b/i;

const FEMALE_KO_VOICE_WHITELIST =
  /yuna|sunhi|sun-hi|sora|heami|hae-mi|jimin|ji-min|yujin|yu-jin|seohyeon|seo-hyeon|soonbok|seoyeon|jiyeon|narae|google 한국의|female|여성|여자/i;

function pickKoreanFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const live = window.speechSynthesis.getVoices();
  const voices = live.length > 0 ? live : cachedVoices;
  const koreanVoices = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase();
    const name = v.name || '';
    return lang.startsWith('ko') || lang.includes('kr') || name.includes('Korean') || name.includes('한국');
  });
  if (koreanVoices.length === 0) return null;

  // Strictly exclude any male / ambiguous system voices and keep verified ko-KR female voices only
  const verifiedFemale = koreanVoices.find(
    (v) => !MALE_VOICE_BLACKLIST.test(v.name) && FEMALE_KO_VOICE_WHITELIST.test(v.name)
  );
  return verifiedFemale || null;
}

export function speakKorean(text: string, withSoftChime = false, customTone?: VoiceTone) {
  const volMult = getVolumeMultiplier();
  if (volMult <= 0) return;

  if (withSoftChime) {
    playSfx('bell');
  }

  const rawText = text.trim();
  if (!rawText) return;
  const spokenText = JAMO_NAME_MAP[rawText] || rawText;

  const toneId = customTone || getVoiceTone();
  const toneInfo = VOICE_TONES.find((t) => t.id === toneId) || VOICE_TONES[0];

  // Unconditionally stop/cancel every currently active or queued voice before starting a new one
  stopAllSpeech();
  const myGen = speechGenerationId;

  const audioUrl = `/api/tts?text=${encodeURIComponent(spokenText)}`;
  const chosenFemaleVoice = pickKoreanFemaleVoice();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window && chosenFemaleVoice) {
    // Brief 45ms flush after speechSynthesis.cancel() prevents browsers from dropping or overlapping utterances
    pendingSpeakTimer = setTimeout(() => {
      pendingSpeakTimer = null;
      if (myGen !== speechGenerationId) return;

      try {
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.voice = chosenFemaleVoice;
        utterance.lang = 'ko-KR';
        // Enforce warm mom/female pitch (>= 1.06) so male voice register never leaks through
        utterance.pitch = toneInfo.id === 'dad' ? 1.08 : Math.max(1.06, toneInfo.pitch);
        utterance.rate = Math.min(1.0, Math.max(0.86, toneInfo.rate));
        utterance.volume = Math.min(1.0, volMult * 1.1);

        let speechStarted = false;
        let endedOrFailed = false;

        utterance.onstart = () => {
          speechStarted = true;
          if (ttsFallbackTimer) {
            clearTimeout(ttsFallbackTimer);
            ttsFallbackTimer = null;
          }
        };
        utterance.onend = () => {
          endedOrFailed = true;
          if (ttsFallbackTimer) {
            clearTimeout(ttsFallbackTimer);
            ttsFallbackTimer = null;
          }
        };
        utterance.onerror = () => {
          if (endedOrFailed || myGen !== speechGenerationId) return;
          endedOrFailed = true;
          if (ttsFallbackTimer) {
            clearTimeout(ttsFallbackTimer);
            ttsFallbackTimer = null;
          }
          if (!speechStarted) {
            playAudioFallback(audioUrl, volMult, toneInfo, myGen);
          }
        };

        window.speechSynthesis.speak(utterance);

        // Only trigger fallback if speechSynthesis genuinely failed to start after 900ms
        ttsFallbackTimer = setTimeout(() => {
          ttsFallbackTimer = null;
          if (myGen !== speechGenerationId || endedOrFailed || speechStarted) return;
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            playAudioFallback(audioUrl, volMult, toneInfo, myGen);
          }
        }, 900);
      } catch {
        playAudioFallback(audioUrl, volMult, toneInfo, myGen);
      }
    }, 45);
    return;
  }

  // If no verified ko-KR female SpeechSynthesis voice exists, use single clean server female TTS directly
  playAudioFallback(audioUrl, volMult, toneInfo, myGen);
}
