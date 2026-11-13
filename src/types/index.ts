export type TabKey = 'checklist' | 'progress' | 'doodle' | 'sticker' | 'community';

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type SoundVolume = 'mute' | 'soft' | 'medium' | 'loud'; // 꺼짐, 약, 중, 강

export interface StageInfo {
  id: StageId;
  name: string;
  sub: string;
  tag: string;
  target: string;
  badge: string;
  desc: string;
}

export interface Mission {
  t: string;
  s: string;
  rest?: boolean;
  goal?: boolean;
}

export interface Week {
  n: string;
  t: string;
  from: number;
  to: number;
}

export interface AnimalFriend {
  id: string;
  e: string;
  name: string;
  say: string;
}

export interface PetGrowthState {
  level: number; // 1 to 5
  exp: number; // 0 to 100
  totalExp: number;
  happiness: number; // 0 to 100
  berriesCount: number; // Letter berries available to feed
  heartsCount?: number; // Optional compatibility
  lastFed?: string;
  stageName: string;
}

export interface BoardTheme {
  id: string;
  name: string;
  sub: string;
  bg: string;
  cardBg: string;
  deco: string[];
  pack: string[];
}

export interface PlacedSticker {
  d: string; // yyyy-mm-dd
  e: string; // emoji
  rare?: boolean;
  r: number; // rotation deg
  bg?: string;
  memo?: string;
}

export interface StickerBoardState {
  name: string;
  childAge: string; // '5세' | '6세' | '7세'
  friend: string;
  theme: string;
  wish: string;
  msg: string;
  oneStickerPerDay: boolean; // Setting: limit 1 sticker per calendar day
  stickers: PlacedSticker[];
  stamped: boolean;
  doneDate: string | null;
}

export type MasteryLevel = 0 | 1 | 2 | 3; // 0: None, 1: 알아봄, 2: 소리냄, 3: 혼자읽음

export interface ProgressState {
  [key: string]: MasteryLevel;
}

export type TracingCategory =
  | 'name'
  | 'consonant'
  | 'vowel'
  | 'double'
  | 'complex_vowel'
  | 'animal'
  | 'food'
  | 'family'
  | 'custom';

export interface TracingItem {
  id: string;
  category: TracingCategory;
  label: string;
  soundText: string;
  phonetic: string;
  meaning?: string;
  emoji?: string;
  strokesHint?: string;
}

export interface SavedDoodle {
  id: string;
  title: string;
  dataUrl: string;
  createdAt: number;
  author: string;
}

// 30-Day Daily Mom Diary
export interface DailyMomDiary {
  day: number; // 1 to 30
  date: string; // yyyy-mm-dd
  content: string;
  mood: string; // emoji
  photoUrl?: string;
  audioUrl?: string; // Voice recording Data URL (WebM/WAV)
  audioDuration?: number; // Duration in seconds
  updatedAt: number;
}

export interface CommunityComment {
  id: string;
  author: string;
  content: string;
  date: string;
  password?: string; // 4-digit PIN for deletion
  isAdmin?: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  childAge: string;
  category: 'success' | 'talk' | 'doodle' | 'tip' | 'event';
  title: string;
  content: string;
  doodleImg?: string;
  date: string;
  likes: number;
  cheeredByMe: boolean;
  cheerType?: 'heart' | 'clap' | 'sparkle';
  comments: CommunityComment[];
  tags: string[];
  pinned?: boolean;
  password?: string; // 4-digit PIN
  isAdmin?: boolean;
}
