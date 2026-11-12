/**
 * Parent Voice Praise Mission Helper
 * Manages parent voice recordings, customized praise scripts, and fallback TTS
 * played when a child successfully solves or reads a Hangul quiz/card/mission.
 */

import { playSfx, speakKorean } from './sound';
import { audioBufferToWav } from './audioRecordHelper';

export interface ParentVoiceMissionConfig {
  guideText: string;
  recordingScript: string;
  fallbackTTS: string;
  audioUrl?: string;
  recordedAt?: string;
  enabled: boolean;
}

export const STORAGE_KEY_PARENT_VOICE = 'hangul_parent_voice_mission';

export const DEFAULT_PARENT_VOICE_MISSION: ParentVoiceMissionConfig = {
  guideText: '아이가 문제를 맞히면 들려줄 엄마/아빠 목소리를 5초간 녹음해주세요!',
  recordingScript: "우와, 우리 시아 최고! 벌써 '시' 글자를 찾았네? 사랑해!",
  fallbackTTS: '정답이에요! 참 잘했어요!',
  enabled: true,
};

export const PRESET_SCRIPTS = [
  "우와, 우리 {name} 최고! 벌써 '{letter}' 글자를 찾았네? 사랑해!",
  "대단해! 우리 {name} 혼자서도 척척 읽었네! 엄마 아빠가 정말 뿌듯해!",
  "딩동댕 정답! 우리 {name} 한글 천재 맞나 봐! 너무너무 멋져!",
  "와아! 우리 {name} 오늘 미션 성공! 사랑하고 최고야!",
];

export function getParentVoiceMission(): ParentVoiceMissionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PARENT_VOICE);
    if (!raw) return DEFAULT_PARENT_VOICE_MISSION;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PARENT_VOICE_MISSION,
      ...parsed,
    };
  } catch {
    return DEFAULT_PARENT_VOICE_MISSION;
  }
}

export function saveParentVoiceMission(config: ParentVoiceMissionConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_PARENT_VOICE, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save parent voice mission:', err);
  }
}

let activeAudioInstance: HTMLAudioElement | null = null;

/**
 * Plays the parent's recorded voice when child answers correctly.
 * If no custom recording exists, falls back gracefully to warm Korean TTS ("정답이에요! 참 잘했어요!").
 */
export function playParentPraiseVoice(options?: {
  childName?: string;
  letter?: string;
  onEnd?: () => void;
}): void {
  const config = getParentVoiceMission();
  const name = options?.childName || '우리 아이';
  const letter = options?.letter || '글자';

  // Stop any currently playing audio
  if (activeAudioInstance) {
    try {
      activeAudioInstance.pause();
      activeAudioInstance = null;
    } catch {}
  }

  // 1. If parent recorded custom voice and enabled
  if (config.audioUrl && config.enabled) {
    try {
      playSfx('fan');
      const audio = new Audio(config.audioUrl);
      activeAudioInstance = audio;
      audio.onended = () => {
        activeAudioInstance = null;
        options?.onEnd?.();
      };
      audio.onerror = () => {
        // Fallback to TTS if audio playback fails
        activeAudioInstance = null;
        speakFallback(config.fallbackTTS, name, letter, options?.onEnd);
      };
      audio.play().catch(() => {
        speakFallback(config.fallbackTTS, name, letter, options?.onEnd);
      });
      return;
    } catch {
      speakFallback(config.fallbackTTS, name, letter, options?.onEnd);
      return;
    }
  }

  // 2. Fallback to friendly Korean TTS
  speakFallback(config.fallbackTTS, name, letter, options?.onEnd);
}

function speakFallback(
  fallbackTTS: string,
  childName: string,
  letter: string,
  onEnd?: () => void
) {
  playSfx('fan');
  const speechText = fallbackTTS || '정답이에요! 참 잘했어요!';
  speakKorean(speechText);
  if (onEnd) {
    setTimeout(onEnd, 2200);
  }
}

/**
 * Generates a warm 5-second parental praise melody sample as a WAV Data URL
 * for immediate testing without microphone hardware.
 */
export async function generateParentPraiseSample(
  parentName: string = '엄마'
): Promise<string> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  }

  const sampleRate = 22050;
  const duration = 4.2; // ~4.2 seconds of warm celebration fanfare
  const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);

  // Warm chime notes: C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6
  const notes = [
    { freq: 261.63, time: 0.0, dur: 0.4 },
    { freq: 329.63, time: 0.35, dur: 0.4 },
    { freq: 392.0, time: 0.7, dur: 0.5 },
    { freq: 523.25, time: 1.15, dur: 0.6 },
    { freq: 659.25, time: 1.7, dur: 0.6 },
    { freq: 783.99, time: 2.25, dur: 0.7 },
    { freq: 1046.5, time: 2.9, dur: 1.2 },
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.32, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(offlineCtx.destination);

    osc.start(time);
    osc.stop(time + dur);
  });

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(wavBlob);
  });
}
