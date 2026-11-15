import { SoundVolume } from '../types';
import { findCustomVoiceUrl, initCustomVoicePack } from './customVoicePack';

if (typeof window !== 'undefined') {
  void initCustomVoicePack();
}

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
    desc: '높고 맑은 톤 · 경쾌한 엄마 목소리 (기본)',
    pitch: 1.35,
    rate: 1.08,
    playbackRate: 1.14,
  },
  {
    id: 'dad',
    name: '친근한 아빠',
    emoji: '👨',
    desc: '부드럽고 밝은 톤 · 자상한 30대 아빠 목소리',
    pitch: 0.9,
    rate: 1.05,
    playbackRate: 0.94,
  },
  {
    id: 'teacher',
    name: '선생님',
    emoji: '👩‍🏫',
    desc: '차분하고 안정적인 표준 선생님 목소리',
    pitch: 1.0,
    rate: 1.0,
    playbackRate: 1.0,
  },
  {
    id: 'friend',
    name: '귀여운 친구',
    emoji: '🧒',
    desc: '5살 아이처럼 맑고 높은 · 깜찍한 친구 목소리',
    pitch: 1.8,
    rate: 1.1,
    playbackRate: 1.34,
  },
];

let currentVoiceTone: VoiceTone = 'mom';
let cachedVoices: SpeechSynthesisVoice[] = [];
let ttsFallbackTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSpeakTimer: ReturnType<typeof setTimeout> | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
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

  activeUtterance = null;
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

const MALE_KO_VOICE_REGEX =
  /injoon|in-joon|hyunsu|hyun-su|bongjin|bong-jin|gookmin|gook-min|minsu|eddy|reed|rocko|grandpa|ko-kr-x-khm|ko-kr-x-koe|ko-kr-x-kod|male|남성|남자|아빠|\bman\b|\bboy\b/i;

const FEMALE_KO_VOICE_REGEX =
  /yuna|유나|sunhi|sun-hi|선희|sora|소라|heami|hae-mi|혜미|jimin|ji-min|지민|yujin|yu-jin|유진|seohyeon|seo-hyeon|서현|soonbok|순복|seoyeon|서연|jiyeon|지연|narae|나래|google 한국의|google 한국어|ko-kr-x-ism|ko-kr-x-koc|female|여성|여자/i;

function getKoreanVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const live = window.speechSynthesis.getVoices();
  const voices = live.length > 0 ? live : cachedVoices;
  if (live.length > 0) {
    cachedVoices = live;
  }
  const filtered = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase();
    const name = v.name || '';
    return lang.startsWith('ko') || lang.includes('kr') || name.includes('Korean') || name.includes('한국');
  });
  // Prefer local OS voices first because they reliably honor pitch/rate (unlike remote Google TTS in Chromium)
  return [...filtered].sort((a, b) => Number(b.localService) - Number(a.localService));
}

export function getVoiceToneInfo(toneId?: VoiceTone): VoiceToneInfo {
  const id = toneId || getVoiceTone();
  return VOICE_TONES.find((t) => t.id === id) || VOICE_TONES[0];
}

export function getCharacterSpeechParams(toneId: VoiceTone): {
  pitch: number;
  rate: number;
  playbackRate: number;
} {
  switch (toneId) {
    case 'mom':
      // 엄마: 높고 따뜻한 톤 + 경쾌하고 빠른 속도
      return { pitch: 1.35, rate: 1.08, playbackRate: 1.14 };
    case 'dad':
      // 아빠: 밝고 다정한 30대 젊은 아빠 톤 (강제 고정)
      return { pitch: 0.9, rate: 1.05, playbackRate: 0.94 };
    case 'teacher':
      // 선생님: 안정적이고 또박또박한 표준 톤 및 속도
      return { pitch: 1.0, rate: 1.0, playbackRate: 1.0 };
    case 'friend':
      // 친구: 5살 아이처럼 맑고 매우 높은 톤 + 발랄한 속도 (강제 고정)
      return { pitch: 1.8, rate: 1.1, playbackRate: 1.34 };
    default: {
      const info = getVoiceToneInfo(toneId);
      return { pitch: info.pitch, rate: info.rate, playbackRate: info.playbackRate };
    }
  }
}

export function pickKoreanVoiceForTone(toneId: VoiceTone): SpeechSynthesisVoice | null {
  const koreanVoices = getKoreanVoices();
  if (koreanVoices.length === 0) return null;

  const femaleVoices = koreanVoices.filter(
    (v) => !MALE_KO_VOICE_REGEX.test(v.name) && FEMALE_KO_VOICE_REGEX.test(v.name)
  );
  const nonMaleVoices = koreanVoices.filter((v) => !MALE_KO_VOICE_REGEX.test(v.name));
  const maleVoices = koreanVoices.filter((v) => MALE_KO_VOICE_REGEX.test(v.name));

  switch (toneId) {
    case 'dad': {
      // Friendly Young Dad: prefer Korean male voice (local OS voice first), otherwise local Korean voice or default ko-KR
      if (maleVoices.length > 0) {
        return maleVoices.find((v) => v.localService) || maleVoices[0];
      }
      const localKorean = koreanVoices.find((v) => v.localService);
      if (localKorean) return localKorean;
      return koreanVoices.find((v) => v.default) || koreanVoices[0] || null;
    }
    case 'teacher': {
      // Calm Teacher: strictly non-male Korean voice (fallback to default ko-KR only if needed)
      const calm =
        femaleVoices.find((v) => /sunhi|sun-hi|선희|seoyeon|서연|heami|혜미|google/i.test(v.name)) ||
        femaleVoices[0] ||
        nonMaleVoices[0];
      return calm || koreanVoices[0] || null;
    }
    case 'friend': {
      // Pure 5-year-old Friend: prioritize child/bright local Korean voices so pitch=1.8 cleanly renders a child register
      const localNonMale = nonMaleVoices.filter((v) => v.localService);
      const brightLocal =
        localNonMale.find((v) => /child|kid|어린이|아이|yuna|유나|jimin|지민|yujin|유진|sora|소라/i.test(v.name)) ||
        localNonMale[0];
      if (brightLocal) return brightLocal;
      const brightAny =
        femaleVoices.find((v) => /child|kid|어린이|아이|yuna|유나|jimin|지민|yujin|유진|sora|소라/i.test(v.name)) ||
        femaleVoices[0] ||
        nonMaleVoices[0];
      return brightAny || koreanVoices[0] || null;
    }
    case 'mom':
    default: {
      // Gentle Mom: Korean female voice
      return femaleVoices[0] || nonMaleVoices[0] || koreanVoices[0] || null;
    }
  }
}

function playServerTtsFallback(
  audioUrl: string,
  volMult: number,
  toneInfo: VoiceToneInfo,
  genId: number
) {
  if (genId !== speechGenerationId) return;

  try {
    const audio = new Audio(audioUrl);
    audio.volume = Math.min(1, volMult);
    // Disable preservesPitch so playbackRate genuinely shifts pitch per character (low Dad vs high Friend)
    const audioWithPitch = audio as HTMLAudioElement & {
      preservesPitch?: boolean;
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    audioWithPitch.preservesPitch = false;
    audioWithPitch.mozPreservesPitch = false;
    audioWithPitch.webkitPreservesPitch = false;
    audio.playbackRate = toneInfo.playbackRate;

    activeSpeechAudio = audio;
    audio.onended = () => {
      if (activeSpeechAudio === audio) {
        activeSpeechAudio = null;
      }
    };
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

export interface SpeakKoreanOptions {
  bypassCustomVoice?: boolean;
}

/**
 * Strips emojis, icon pictographs, variation selectors, decorative symbols,
 * and UI meta brackets so TTS reads ONLY clean, natural spoken text without
 * announcing icon names (e.g. "반짝임", "하트") or punctuation glitches.
 */
export function sanitizeSpeechText(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (JAMO_NAME_MAP[trimmed]) return JAMO_NAME_MAP[trimmed];

  let cleaned = trimmed
    // Strip bracketed UI metadata tags like [공지], 【안내】, (Lv.5)
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/【[^】]*】/g, ' ')
    .replace(/\(Lv\.[^)]*\)/gi, ' ')
    // Strip emojis, pictographs, flags, skin tones, variation selectors & ZWJ
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, ' ')
    .replace(/[\u2600-\u27BF]/g, ' ')
    .replace(/[\uFE0E\uFE0F\u200D\u20E3]/g, '')
    // Strip decorative symbols, arrows, math/UI characters TTS tends to vocalize
    .replace(/[★☆✓✔✕✖✗✘•·▪▫▶▷►◀◁▲▼◆◇○●◎□■♠♡♢♣♧♪♫♬※→←↑↓↔⇒+="<>`|_@#$%^&*\\]/g, ' ')
    // Replace tilde & ellipsis with natural soft pause instead of "물결" / "점점점"
    .replace(/~+/g, ' ')
    .replace(/\.{2,}/g, ', ')
    // Strip stray quotation marks
    .replace(/["'“”‘’]/g, '')
    // Collapse excess punctuation and whitespace
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  return JAMO_NAME_MAP[cleaned] || cleaned;
}

export function speakKorean(
  text: string,
  withSoftChime = false,
  customTone?: VoiceTone,
  options?: SpeakKoreanOptions
) {
  const volMult = getVolumeMultiplier();
  if (volMult <= 0) return;

  if (withSoftChime) {
    playSfx('bell');
  }

  const rawText = text.trim();
  if (!rawText) return;
  const spokenText = sanitizeSpeechText(rawText);
  if (!spokenText) return;

  const toneId = customTone || getVoiceTone();
  const toneInfo = getVoiceToneInfo(toneId);

  // Immediately cancel any currently active or queued voice before starting the selected profile
  stopAllSpeech();
  const myGen = speechGenerationId;

  // Priority 1: Real recorded family voice (아이 / 아빠 / 엄마) from IndexedDB cache when enabled
  const customMatch = !options?.bypassCustomVoice
    ? findCustomVoiceUrl(spokenText, rawText, toneId)
    : null;

  if (customMatch) {
    try {
      const audio = new Audio(customMatch.url);
      audio.volume = Math.min(1, Math.max(0.2, volMult * 1.15));
      activeSpeechAudio = audio;
      audio.onended = () => {
        if (activeSpeechAudio === audio) {
          activeSpeechAudio = null;
        }
      };
      audio.onerror = () => {
        if (activeSpeechAudio === audio) {
          activeSpeechAudio = null;
        }
        if (myGen === speechGenerationId) {
          speakKorean(text, false, customTone, { bypassCustomVoice: true });
        }
      };
      audio.play().catch(() => {
        if (myGen === speechGenerationId) {
          speakKorean(text, false, customTone, { bypassCustomVoice: true });
        }
      });
      return;
    } catch {
      // Fall through to TTS cleanly if browser fails to play custom blob
    }
  }

  const audioUrl = `/api/tts?text=${encodeURIComponent(spokenText)}`;
  const selectedVoice = pickKoreanVoiceForTone(toneId);

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    let speechStarted = false;
    let fallbackTriggered = false;

    const triggerFallback = () => {
      if (fallbackTriggered || speechStarted || myGen !== speechGenerationId) return;
      fallbackTriggered = true;
      if (ttsFallbackTimer) {
        clearTimeout(ttsFallbackTimer);
        ttsFallbackTimer = null;
      }
      activeUtterance = null;
      try {
        window.speechSynthesis.cancel();
      } catch {}
      playServerTtsFallback(audioUrl, volMult, toneInfo, myGen);
    };

    // Slight 15ms delay after speechSynthesis.cancel() prevents browser policy/cancel race from blocking speak()
    pendingSpeakTimer = setTimeout(() => {
      pendingSpeakTimer = null;
      if (myGen !== speechGenerationId) return;

      try {
        // Re-filter live voice list in case voices loaded asynchronously
        const liveVoice = pickKoreanVoiceForTone(toneId) || selectedVoice;
        const isPitchIgnoredRemoteVoice =
          liveVoice !== null &&
          !liveVoice.localService &&
          ((toneId === 'dad' && !MALE_KO_VOICE_REGEX.test(liveVoice.name)) || toneId === 'friend');

        // Remote Google voices ignore SpeechSynthesisUtterance.pitch in Chromium;
        // if no local OS voice (or male voice for Dad) is available, route to pitch-shifted audio fallback
        // so Dad keeps a warm male register and Friend keeps a high 5-year-old child register.
        if (isPitchIgnoredRemoteVoice) {
          triggerFallback();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(spokenText);
        if (liveVoice) {
          utterance.voice = liveVoice;
          utterance.lang = liveVoice.lang || 'ko-KR';
        } else {
          utterance.lang = 'ko-KR';
        }

        const speechParams = getCharacterSpeechParams(toneId);
        if (toneId === 'dad') {
          utterance.pitch = 0.9;
          utterance.rate = 1.05;
        } else if (toneId === 'friend') {
          utterance.pitch = 1.8;
          utterance.rate = 1.1;
        } else {
          utterance.pitch = speechParams.pitch;
          utterance.rate = speechParams.rate;
        }
        utterance.volume = Math.min(1.0, volMult * 1.1);
        activeUtterance = utterance;

        utterance.onstart = () => {
          if (myGen !== speechGenerationId) return;
          speechStarted = true;
          if (ttsFallbackTimer) {
            clearTimeout(ttsFallbackTimer);
            ttsFallbackTimer = null;
          }
        };
        utterance.onend = () => {
          if (activeUtterance === utterance) {
            activeUtterance = null;
          }
        };
        utterance.onerror = () => {
          triggerFallback();
        };

        ttsFallbackTimer = setTimeout(() => {
          ttsFallbackTimer = null;
          triggerFallback();
        }, 1100);

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch {
        triggerFallback();
      }
    }, 15);
    return;
  }

  playServerTtsFallback(audioUrl, volMult, toneInfo, myGen);
}

export function previewVoiceTone(toneId: VoiceTone, childName?: string) {
  setVoiceTone(toneId);
  if (getSoundVolume() === 'mute') {
    setSoundVolume('medium');
  }
  const cleanName = (childName || '').trim() || '시아';
  speakKorean(`${cleanName}야 안녕! 오늘도 한글놀이 같이 하자!`, false, toneId, {
    bypassCustomVoice: true,
  });
}

export function speakLetterIfEnabled(text: string, customTone?: VoiceTone) {
  if (!getClickVoiceEnabled()) return;
  speakKorean(text, false, customTone);
}

