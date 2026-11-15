import { useEffect, useState } from 'react';
import { CHO, JUNG, NAMES, syl } from '../data/hangulData';
import { JAMO_NAME_MAP, VoiceTone } from './sound';

export type CustomVoiceSpeaker = 'child' | 'dad' | 'mom';

export interface CustomSpeakerMeta {
  id: CustomVoiceSpeaker;
  name: string;
  shortName: string;
  emoji: string;
  desc: string;
}

export const CUSTOM_SPEAKERS: CustomSpeakerMeta[] = [
  {
    id: 'child',
    name: '우리 아이 목소리',
    shortName: '우리 아이',
    emoji: '🧒',
    desc: '아이가 직접 말한 진짜 목소리',
  },
  {
    id: 'dad',
    name: '친근한 아빠 목소리',
    shortName: '아빠',
    emoji: '👨',
    desc: '다정한 아빠가 직접 읽어주는 목소리',
  },
  {
    id: 'mom',
    name: '다정한 엄마 목소리',
    shortName: '엄마',
    emoji: '👩',
    desc: '따뜻한 엄마가 직접 읽어주는 목소리',
  },
];

export type CustomVoiceCategoryId = 'cons' | 'vowel' | 'syl' | 'word';

export interface CustomVoiceItem {
  key: string; // Canonical spoken key matching JAMO_NAME_MAP[text] || text
  display: string; // Visual character/word shown on card
  hint: string; // Reading hint shown during recording
}

export interface CustomVoiceCategory {
  id: CustomVoiceCategoryId;
  label: string;
  emoji: string;
  guide: string;
  items: CustomVoiceItem[];
}

const VOWEL_NAMES = ['아', '야', '어', '여', '오', '요', '우', '유', '으', '이'];

const PRACTICE_WORDS: Array<{ word: string; hint: string }> = [
  { word: '나비', hint: '훨훨 나는 나비' },
  { word: '나무', hint: '초록초록 나무' },
  { word: '사자', hint: '어흥 멋진 사자' },
  { word: '모자', hint: '머리에 쏙 모자' },
  { word: '하마', hint: '입이 큰 하마' },
  { word: '오리', hint: '꽥꽥 귀여운 오리' },
  { word: '기린', hint: '목이 긴 기린' },
  { word: '토끼', hint: '깡충깡충 토끼' },
  { word: '포도', hint: '달콤한 보라 포도' },
  { word: '아기', hint: '사랑스러운 아기' },
];

export const CUSTOM_VOICE_CATEGORIES: CustomVoiceCategory[] = [
  {
    id: 'cons',
    label: '자음 14자',
    emoji: 'ㄱ',
    guide: '기역, 니은처럼 글자 이름을 짧고 또박또박 말해 보세요.',
    items: CHO.map((c, i) => ({
      key: NAMES[i],
      display: c,
      hint: NAMES[i],
    })),
  },
  {
    id: 'vowel',
    label: '모음 10자',
    emoji: 'ㅏ',
    guide: '아, 야, 어, 여처럼 입 모양을 크게 벌려 소리 내 보세요.',
    items: JUNG.map((v, i) => ({
      key: VOWEL_NAMES[i],
      display: v,
      hint: VOWEL_NAMES[i],
    })),
  },
  {
    id: 'syl',
    label: '첫소리 가~하',
    emoji: '가',
    guide: '한글 첫걸음 가, 나, 다 ~ 하를 신나게 읽어 보세요.',
    items: CHO.map((_, i) => {
      const ch = syl(i, 0);
      return {
        key: ch,
        display: ch,
        hint: ch,
      };
    }),
  },
  {
    id: 'word',
    label: '낱말 카드 10개',
    emoji: '🦋',
    guide: '플래시 퀴즈에 나오는 대표 낱말 10개를 녹음해요.',
    items: PRACTICE_WORDS.map((w) => ({
      key: w.word,
      display: w.word,
      hint: w.hint,
    })),
  },
];

export const TOTAL_CUSTOM_VOICE_ITEMS = CUSTOM_VOICE_CATEGORIES.reduce(
  (sum, c) => sum + c.items.length,
  0
);

const DB_NAME = 'hangul_custom_voice_db';
const DB_VERSION = 1;
const STORE_NAME = 'clips';

const CUSTOM_VOICE_ENABLED_KEY = 'hangul_custom_voice_enabled';
const ACTIVE_SPEAKER_KEY = 'hangul_custom_voice_speaker';
export const CUSTOM_VOICE_UPDATED_EVENT = 'hangul-custom-voice-updated';

interface StoredClipRecord {
  id: string; // `${speaker}:${key}`
  speaker: CustomVoiceSpeaker;
  key: string;
  blob: Blob;
  mimeType: string;
  durationMs?: number;
  updatedAt: number;
}

// Synchronous in-memory cache of blob URLs for instant 0ms playback in speakKorean()
const clipUrlCache = new Map<string, string>();
let initPromise: Promise<void> | null = null;
let cachedEnabled: boolean | null = null;
let cachedSpeaker: CustomVoiceSpeaker | null = null;

function makeClipId(speaker: CustomVoiceSpeaker, key: string): string {
  return `${speaker}:${key}`;
}

export function normalizeVoiceKey(text: string): string {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  return JAMO_NAME_MAP[trimmed] || trimmed;
}

function emitUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CUSTOM_VOICE_UPDATED_EVENT));
  }
}

function openVoiceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open custom voice DB'));
  });
}

export function initCustomVoicePack(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await openVoiceDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const rows = (req.result || []) as StoredClipRecord[];
          rows.forEach((row) => {
            if (row && row.id && row.blob instanceof Blob) {
              const prevUrl = clipUrlCache.get(row.id);
              if (prevUrl) {
                try {
                  URL.revokeObjectURL(prevUrl);
                } catch {}
              }
              try {
                clipUrlCache.set(row.id, URL.createObjectURL(row.blob));
              } catch {}
            }
          });
          resolve();
        };
        req.onerror = () => resolve();
      });
      emitUpdate();
    } catch {
      // IndexedDB unavailable (e.g. strict private mode); memory cache still works per session
    }
  })();

  return initPromise;
}

export function getCustomVoiceEnabled(): boolean {
  if (cachedEnabled !== null) return cachedEnabled;
  try {
    const raw = localStorage.getItem(CUSTOM_VOICE_ENABLED_KEY);
    if (raw === 'true') {
      cachedEnabled = true;
      return true;
    }
    if (raw === 'false') {
      cachedEnabled = false;
      return false;
    }
  } catch {}
  cachedEnabled = false;
  return false;
}

export function setCustomVoiceEnabled(enabled: boolean) {
  cachedEnabled = enabled;
  try {
    localStorage.setItem(CUSTOM_VOICE_ENABLED_KEY, String(enabled));
  } catch {}
  emitUpdate();
}

export function getActiveCustomSpeaker(): CustomVoiceSpeaker {
  if (cachedSpeaker) return cachedSpeaker;
  try {
    const raw = localStorage.getItem(ACTIVE_SPEAKER_KEY);
    if (raw === 'child' || raw === 'dad' || raw === 'mom') {
      cachedSpeaker = raw;
      return raw;
    }
  } catch {}
  cachedSpeaker = 'child';
  return 'child';
}

export function setActiveCustomSpeaker(speaker: CustomVoiceSpeaker) {
  cachedSpeaker = speaker;
  try {
    localStorage.setItem(ACTIVE_SPEAKER_KEY, speaker);
  } catch {}
  emitUpdate();
}

export async function saveCustomVoiceClip(
  speaker: CustomVoiceSpeaker,
  rawKey: string,
  blob: Blob,
  durationMs?: number
): Promise<string> {
  const key = normalizeVoiceKey(rawKey);
  const id = makeClipId(speaker, key);

  const prevUrl = clipUrlCache.get(id);
  if (prevUrl) {
    try {
      URL.revokeObjectURL(prevUrl);
    } catch {}
  }
  const objectUrl = URL.createObjectURL(blob);
  clipUrlCache.set(id, objectUrl);

  try {
    const db = await openVoiceDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredClipRecord = {
        id,
        speaker,
        key,
        blob,
        mimeType: blob.type || 'audio/webm',
        durationMs,
        updatedAt: Date.now(),
      };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Keep session URL in memory cache even if IndexedDB fails
  }

  // Automatically select this speaker & enable custom voice playback so newly recorded audio works right away
  setActiveCustomSpeaker(speaker);
  setCustomVoiceEnabled(true);
  emitUpdate();
  return objectUrl;
}

export async function deleteCustomVoiceClip(
  speaker: CustomVoiceSpeaker,
  rawKey: string
): Promise<void> {
  const key = normalizeVoiceKey(rawKey);
  const id = makeClipId(speaker, key);
  const prevUrl = clipUrlCache.get(id);
  if (prevUrl) {
    try {
      URL.revokeObjectURL(prevUrl);
    } catch {}
  }
  clipUrlCache.delete(id);

  try {
    const db = await openVoiceDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}

  emitUpdate();
}

export async function clearSpeakerClips(speaker: CustomVoiceSpeaker): Promise<void> {
  const prefix = `${speaker}:`;
  const toDelete: string[] = [];
  clipUrlCache.forEach((url, id) => {
    if (id.startsWith(prefix)) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
      toDelete.push(id);
    }
  });
  toDelete.forEach((id) => clipUrlCache.delete(id));

  try {
    const db = await openVoiceDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      toDelete.forEach((id) => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}

  emitUpdate();
}

export function getCustomVoiceClipUrl(
  speaker: CustomVoiceSpeaker,
  textOrKey: string
): string | null {
  const canonical = normalizeVoiceKey(textOrKey);
  const exactId = makeClipId(speaker, canonical);
  const url = clipUrlCache.get(exactId);
  if (url) return url;
  const rawTrimmed = (textOrKey || '').trim();
  if (rawTrimmed && rawTrimmed !== canonical) {
    return clipUrlCache.get(makeClipId(speaker, rawTrimmed)) || null;
  }
  return null;
}

export function getSpeakerClipCount(speaker: CustomVoiceSpeaker): number {
  const prefix = `${speaker}:`;
  let count = 0;
  clipUrlCache.forEach((_, id) => {
    if (id.startsWith(prefix)) count += 1;
  });
  return count;
}

export function getTotalCustomClipCount(): number {
  return clipUrlCache.size;
}

/**
 * Synchronous lookup used inside speakKorean().
 * Prioritizes the active recorded family speaker when Custom Voice Mode is ON,
 * then falls back across any other recorded speaker matching the character/tone.
 */
export function findCustomVoiceUrl(
  spokenText: string,
  rawText: string,
  preferredTone?: VoiceTone
): { url: string; speaker: CustomVoiceSpeaker } | null {
  if (!getCustomVoiceEnabled() || clipUrlCache.size === 0) return null;

  const activeSpeaker = getActiveCustomSpeaker();
  const toneToSpeaker: Partial<Record<VoiceTone, CustomVoiceSpeaker>> = {
    friend: 'child',
    dad: 'dad',
    mom: 'mom',
  };
  const preferredFromTone = preferredTone ? toneToSpeaker[preferredTone] : undefined;

  const searchOrder: CustomVoiceSpeaker[] = [activeSpeaker];
  if (preferredFromTone && !searchOrder.includes(preferredFromTone)) {
    searchOrder.push(preferredFromTone);
  }
  (['child', 'dad', 'mom'] as CustomVoiceSpeaker[]).forEach((sp) => {
    if (!searchOrder.includes(sp)) searchOrder.push(sp);
  });

  for (const speaker of searchOrder) {
    const url =
      getCustomVoiceClipUrl(speaker, spokenText) || getCustomVoiceClipUrl(speaker, rawText);
    if (url) {
      return { url, speaker };
    }
  }
  return null;
}

export function getSpeakerMeta(speaker: CustomVoiceSpeaker): CustomSpeakerMeta {
  return CUSTOM_SPEAKERS.find((s) => s.id === speaker) || CUSTOM_SPEAKERS[0];
}

export function useCustomVoicePackState() {
  const [, setTick] = useState(0);

  useEffect(() => {
    void initCustomVoicePack();
    const onUpdate = () => setTick((n) => n + 1);
    window.addEventListener(CUSTOM_VOICE_UPDATED_EVENT, onUpdate);
    return () => {
      window.removeEventListener(CUSTOM_VOICE_UPDATED_EVENT, onUpdate);
    };
  }, []);

  return {
    enabled: getCustomVoiceEnabled(),
    activeSpeaker: getActiveCustomSpeaker(),
    totalCount: getTotalCustomClipCount(),
    getCountForSpeaker: getSpeakerClipCount,
    hasClip: (speaker: CustomVoiceSpeaker, key: string) =>
      Boolean(getCustomVoiceClipUrl(speaker, key)),
    setEnabled: setCustomVoiceEnabled,
    setActiveSpeaker: setActiveCustomSpeaker,
  };
}
