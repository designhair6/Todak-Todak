import { SoundVolume } from '../types';

let audioCtx: AudioContext | null = null;
let currentVolume: SoundVolume = 'medium';

export function getSoundVolume(): SoundVolume {
  try {
    const val = localStorage.getItem('hangul_sound_volume');
    if (val && ['mute', 'soft', 'medium', 'loud'].includes(val)) {
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
  else if (current === 'loud') next = 'mute';
  else next = 'soft'; // loops: 약 -> 중 -> 강 -> 꺼짐 -> 약

  setSoundVolume(next);
  if (next === 'mute') {
    stopAllSpeech();
  }
  return next;
}

const CLICK_VOICE_STORAGE_KEY = 'hangul_click_voice_enabled';
let currentClickVoiceEnabled = true;

export function getClickVoiceEnabled(): boolean {
  try {
    const val = localStorage.getItem(CLICK_VOICE_STORAGE_KEY);
    if (val === 'false') {
      currentClickVoiceEnabled = false;
      return false;
    }
    if (val === 'true') {
      currentClickVoiceEnabled = true;
      return true;
    }
  } catch (e) {
    // ignore
  }
  return currentClickVoiceEnabled;
}

export function setClickVoiceEnabled(enabled: boolean) {
  currentClickVoiceEnabled = enabled;
  try {
    localStorage.setItem(CLICK_VOICE_STORAGE_KEY, String(enabled));
  } catch (e) {
    // ignore
  }
  if (!enabled) {
    stopAllSpeech();
  }
}

function getVolumeMultiplier(): number {
  const vol = getSoundVolume();
  switch (vol) {
    case 'mute':
      return 0; // 꺼짐
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
  'ㅘ': '와',
  'ㅙ': '왜',
  'ㅚ': '외',
  'ㅝ': '워',
  'ㅞ': '웨',
  'ㅟ': '위',
  'ㅢ': '의',
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
      activeSpeechAudio.onplaying = null;
      activeSpeechAudio.oncanplaythrough = null;
      activeSpeechAudio.onended = null;
      activeSpeechAudio.onerror = null;
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

const MALE_VOICE_BLACKLIST =
  /injoon|in-joon|hyunsu|hyun-su|bongjin|bong-jin|gookmin|gook-min|minsu|male|남성|남자|\bman\b|\bboy\b/i;

const FEMALE_KO_VOICE_WHITELIST =
  /yuna|유나|sunhi|sun-hi|선희|sora|소라|heami|hae-mi|혜미|jimin|ji-min|지민|yujin|yu-jin|유진|seohyeon|seo-hyeon|서현|soonbok|순복|seoyeon|서연|jiyeon|지연|narae|나래|google 한국의|google 한국어|ko-kr-x-ism|ko-kr-x-koc|ko-kr-x-kod|female|여성|여자/i;

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

  // Prefer explicitly known female Korean voices, otherwise fall back to any non-male Korean voice
  const verifiedFemale = koreanVoices.find(
    (v) => !MALE_VOICE_BLACKLIST.test(v.name) && FEMALE_KO_VOICE_WHITELIST.test(v.name)
  );
  if (verifiedFemale) return verifiedFemale;

  const nonMale = koreanVoices.find((v) => !MALE_VOICE_BLACKLIST.test(v.name));
  return nonMale || null;
}

function speakViaWebSpeech(
  spokenText: string,
  volMult: number,
  toneInfo: VoiceToneInfo,
  genId: number
) {
  if (genId !== speechGenerationId) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const chosenVoice = pickKoreanFemaleVoice();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }
    utterance.lang = 'ko-KR';
    utterance.pitch = toneInfo.id === 'dad' ? 1.06 : Math.max(1.06, toneInfo.pitch);
    utterance.rate = Math.min(1.0, Math.max(0.86, toneInfo.rate));
    utterance.volume = Math.min(1.0, volMult * 1.1);
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
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
  let audioStarted = false;
  let fallbackTriggered = false;

  const triggerFallbackOnce = () => {
    if (fallbackTriggered || audioStarted || myGen !== speechGenerationId) return;
    fallbackTriggered = true;
    if (ttsFallbackTimer) {
      clearTimeout(ttsFallbackTimer);
      ttsFallbackTimer = null;
    }
    if (activeSpeechAudio) {
      try {
        activeSpeechAudio.onplaying = null;
        activeSpeechAudio.oncanplaythrough = null;
        activeSpeechAudio.onended = null;
        activeSpeechAudio.onerror = null;
        activeSpeechAudio.pause();
        activeSpeechAudio.src = '';
      } catch {}
      activeSpeechAudio = null;
    }
    speakViaWebSpeech(spokenText, volMult, toneInfo, myGen);
  };

  try {
    const audio = new Audio(audioUrl);
    audio.volume = Math.min(1, volMult);
    const safeRate = toneInfo.id === 'dad' ? 0.96 : Math.min(1.06, Math.max(0.95, toneInfo.playbackRate));
    audio.playbackRate = safeRate;
    activeSpeechAudio = audio;

    const markStarted = () => {
      if (myGen !== speechGenerationId) return;
      audioStarted = true;
      if (ttsFallbackTimer) {
        clearTimeout(ttsFallbackTimer);
        ttsFallbackTimer = null;
      }
    };

    audio.onplaying = markStarted;
    audio.oncanplaythrough = markStarted;
    audio.onended = () => {
      if (activeSpeechAudio === audio) {
        activeSpeechAudio = null;
      }
    };
    audio.onerror = () => {
      triggerFallbackOnce();
    };

    // Guard against stalled network response
    ttsFallbackTimer = setTimeout(() => {
      ttsFallbackTimer = null;
      triggerFallbackOnce();
    }, 1500);

    // Invoke play() synchronously within the user click gesture
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        triggerFallbackOnce();
      });
    }
  } catch {
    triggerFallbackOnce();
  }
}

export function speakLetterIfEnabled(text: string) {
  if (!getClickVoiceEnabled()) return;
  speakKorean(text);
}

