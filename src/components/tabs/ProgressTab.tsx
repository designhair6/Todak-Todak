import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, Sparkles, RotateCcw, ChevronRight, X } from 'lucide-react';
import { CHO, JUNG, NAMES, syl } from '../../data/hangulData';
import { MasteryLevel, ProgressState, SoundVolume } from '../../types';
import { JAMO_NAME_MAP, playSfx, speakKorean } from '../../utils/sound';
import { playParentPraiseVoice, getParentVoiceMission } from '../../utils/parentVoiceHelper';

interface ProgressTabProps {
  progress: ProgressState;
  onUpdateProgress: (id: string, level: MasteryLevel) => void;
  onResetProgress: () => void;
  onRewardExp: (amount: number) => void;
  childName: string;
  onOpenParentVoice?: () => void;
  soundVolume: SoundVolume;
  onSelectVolume: (vol: SoundVolume) => void;
  clickVoiceEnabled: boolean;
  onToggleClickVoice: (next?: boolean) => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  progress,
  onUpdateProgress,
  onResetProgress,
  onRewardExp,
  childName,
  onOpenParentVoice,
  soundVolume,
  onSelectVolume,
  clickVoiceEnabled,
  onToggleClickVoice,
}) => {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [touchActionMode, setTouchActionMode] = useState<'check' | 'listen'>('check');
  const [lastSpokenLabel, setLastSpokenLabel] = useState<string | null>(null);
  const [praiseNotice, setPraiseNotice] = useState<string | null>(null);
  const [practiceDeck, setPracticeDeck] = useState<Array<{ id: string; ch: string; sub: string }>>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceResults, setPracticeResults] = useState<Array<{ id: string; ch: string; ok: boolean }>>([]);
  const [practiceDone, setPracticeDone] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Statistics (Count all active progress so checked items are immediately reflected in big numbers!)
  const consDone = CHO.filter((_, i) => progress[`c${i}`] === 3).length;
  const consIng = CHO.filter((_, i) => progress[`c${i}`] === 1 || progress[`c${i}`] === 2).length;
  const consActive = consDone + consIng;

  const gaDone = CHO.filter((_, ci) => progress[`s${ci}_0`] === 3).length;
  const gaIng = CHO.filter((_, ci) => progress[`s${ci}_0`] === 1 || progress[`s${ci}_0`] === 2).length;
  const gaActive = gaDone + gaIng;

  let totalDone = 0;
  let totalIng = 0;
  CHO.forEach((_, ci) => {
    JUNG.forEach((_, ji) => {
      const lvl = progress[`s${ci}_${ji}`] || 0;
      if (lvl === 3) totalDone++;
      else if (lvl === 1 || lvl === 2) totalIng++;
    });
  });
  const totalActive = totalDone + totalIng;

  // Weighted progress calculation reflecting learning steps
  const pointsEarned = (consDone * 3 + consIng * 1.5) + (totalDone * 3 + totalIng * 1.5);
  const maxPoints = 154 * 3;
  const overallScore = Math.min(100, Math.round((pointsEarned / maxPoints) * 100));

  const isVoiceAudible = clickVoiceEnabled && soundVolume !== 'mute';

  const triggerCharVoice = (text: string, forceSpeak = false) => {
    if (soundVolume === 'mute') return;
    if (!forceSpeak && !clickVoiceEnabled) return;
    const displayVoice = JAMO_NAME_MAP[text] || text;
    setLastSpokenLabel(displayVoice);
    speakKorean(text);
  };

  const handleCharCellClick = (id: string, label: string) => {
    if (touchActionMode === 'listen') {
      // Listen-only mode: speak clearly without altering mastery checkmarks
      triggerCharVoice(label, true);
      return;
    }

    const current = progress[id] || 0;
    const next = ((current + 1) % 4) as MasteryLevel;
    onUpdateProgress(id, next);

    if (next === 3) {
      if (!isVoiceAudible) playSfx('pop');
      onRewardExp(2); // Pet exp reward
      confetti({
        particleCount: 15,
        spread: 45,
        origin: { y: 0.8 },
      });
    } else if (next > 0 && !isVoiceAudible) {
      playSfx('tap');
    }

    // Speak Korean letter clearly when click-voice setting is active
    triggerCharVoice(label);
  };

  const handleHeaderJamoClick = (text: string) => {
    if (!isVoiceAudible && touchActionMode !== 'listen') {
      playSfx('tap');
      return;
    }
    triggerCharVoice(text, touchActionMode === 'listen');
  };

  const [practiceCategory, setPracticeCategory] = useState<'all' | 'cons' | 'vowel' | 'syl' | 'word'>('all');

  // Start Shuffle Practice with customizable categories
  const startPractice = (categoryOverride?: 'all' | 'cons' | 'vowel' | 'syl' | 'word') => {
    playSfx('pop');
    const cat = categoryOverride || practiceCategory;
    const pool: Array<{ id: string; ch: string; sub: string }> = [];

    // Consonants (ㄱ ~ ㅎ)
    const consItems = CHO.map((c, i) => ({ id: `c${i}`, ch: c, sub: NAMES[i] }));
    
    // Vowels (ㅏ ~ ㅣ)
    const vowelNames = ['아', '야', '어', '여', '오', '요', '우', '유', '으', '이'];
    const vowelItems = JUNG.map((v, i) => ({ id: `v${i}`, ch: v, sub: `모음 ${vowelNames[i]}` }));

    // Syllables (가 ~ 하, 고 ~ 호 등 주요 결합)
    const sylItems: Array<{ id: string; ch: string; sub: string }> = [];
    CHO.forEach((_, ci) => {
      [0, 2, 4, 6, 8, 9].forEach((ji) => {
        sylItems.push({ id: `s${ci}_${ji}`, ch: syl(ci, ji), sub: '음절 소리' });
      });
    });

    // Toddler favorite words
    const wordList = [
      { ch: '나비', sub: '훨훨 나는' },
      { ch: '나무', sub: '초록초록' },
      { ch: '사자', sub: '어흥 멋진' },
      { ch: '모자', sub: '머리에 쏙' },
      { ch: '하마', sub: '입이 큰' },
      { ch: '오리', sub: '꽥꽥 귀여운' },
      { ch: '기린', sub: '목이 긴' },
      { ch: '토끼', sub: '깡충깡충' },
      { ch: '포도', sub: '달콤한 보라' },
      { ch: '아기', sub: '사랑스러운' },
    ];
    const wordItems = wordList.map((w, i) => ({ id: `w${i}`, ch: w.ch, sub: w.sub }));

    if (cat === 'cons') {
      pool.push(...consItems);
    } else if (cat === 'vowel') {
      pool.push(...vowelItems);
    } else if (cat === 'syl') {
      pool.push(...sylItems);
    } else if (cat === 'word') {
      pool.push(...wordItems);
    } else {
      // 'all' : Balanced mix of consonants, vowels, syllables, and words!
      pool.push(
        ...consItems.slice(0, 7),
        ...vowelItems.slice(0, 5),
        ...sylItems.slice(0, 10),
        ...wordItems.slice(0, 6)
      );
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 8);
    setPracticeDeck(shuffled);
    setPracticeIndex(0);
    setPracticeResults([]);
    setPracticeDone(false);
    setPracticeOpen(true);
  };

  const handlePracticeAnswer = (ok: boolean) => {
    const currentCard = practiceDeck[practiceIndex];
    const newResults = [...practiceResults, { ...currentCard, ok }];
    setPracticeResults(newResults);

    if (ok) {
      playSfx('pop');
      const voiceConfig = getParentVoiceMission();
      playParentPraiseVoice({
        childName,
        letter: currentCard?.ch,
      });
      setPraiseNotice(
        voiceConfig.audioUrl
          ? `💖 엄마/아빠 목소리: "${voiceConfig.recordingScript}"`
          : `💖 "${voiceConfig.fallbackTTS}"`
      );
      setTimeout(() => setPraiseNotice(null), 3500);
    } else {
      playSfx('tap');
    }

    if (practiceIndex + 1 >= practiceDeck.length) {
      setPracticeDone(true);
      playSfx('fan');
      onRewardExp(10); // Pet reward!
      confetti({ particleCount: 35, spread: 70 });
    } else {
      setPracticeIndex(practiceIndex + 1);
    }
  };

  const applyPracticeUpgrades = () => {
    playSfx('success');
    practiceResults.filter((r) => r.ok).forEach((r) => {
      if (r.id.startsWith('c') || r.id.startsWith('s')) {
        const cur = progress[r.id] || 0;
        onUpdateProgress(r.id, Math.min(3, cur + 1) as MasteryLevel);
      }
    });
    setPracticeOpen(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-5 pt-4 sm:pt-5 pb-6 space-y-5 box-border overflow-x-hidden">
      {/* Header with sufficient clearance */}
      <div className="text-center space-y-2 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf3e4] border border-[#f3dfc6] text-xs font-bold text-[#c9502f] font-jua">
          <Sparkles className="w-3.5 h-3.5" />
          한눈에 보는 한글 진도표
        </div>
        <h1 className="text-2xl sm:text-3xl font-jua text-[#1b1917] leading-snug break-keep">
          우리 <span className="text-[#c9502f]">{childName || '아이'}</span>는<br />
          어디까지 뗐을까요?
        </h1>
        <p className="text-xs sm:text-sm text-[#8a8178] font-hand break-keep">
          터치할 때마다 ① 알아봄 → ② 소리 냄 → ③ 혼자 읽음으로 올라가요
        </p>
      </div>

      {/* Progress Score 3 Warm Pastel Cards with Active Learning Count */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-gradient-to-br from-[#fff2ec] to-[#fde2d8] border border-[#f7cdbf] text-[#1b1917] rounded-2xl p-3 sm:p-4 text-center shadow-xs">
          <div className="text-[11px] sm:text-xs text-[#c9502f] font-bold font-jua">ㄱ ~ ㅎ 기본 자음</div>
          <div className="font-jua text-2xl sm:text-3xl text-[#b84324] mt-1">
            {consActive} <span className="text-xs sm:text-sm text-[#8a8178]">/ 14</span>
          </div>
          <div className="text-[10px] text-[#8a8178] font-hand mt-0.5">
            {consDone > 0 ? `완료 ${consDone} • 진행 ${consIng}` : `진행 중 ${consIng}개`}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#fef8e7] to-[#fdf0cf] border border-[#f9e0a2] text-[#1b1917] rounded-2xl p-3 sm:p-4 text-center shadow-xs">
          <div className="text-[11px] sm:text-xs text-[#b8860b] font-bold font-jua">가 ~ 하 첫 소리</div>
          <div className="font-jua text-2xl sm:text-3xl text-[#d48b04] mt-1">
            {gaActive} <span className="text-xs sm:text-sm text-[#8a8178]">/ 14</span>
          </div>
          <div className="text-[10px] text-[#8a8178] font-hand mt-0.5">
            {gaDone > 0 ? `완료 ${gaDone} • 진행 ${gaIng}` : `진행 중 ${gaIng}개`}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#edf7f1] to-[#d8efe2] border border-[#bedfc9] text-[#1b1917] rounded-2xl p-3 sm:p-4 text-center shadow-xs">
          <div className="text-[11px] sm:text-xs text-[#2b7a4b] font-bold font-jua">전체 음절 결합</div>
          <div className="font-jua text-2xl sm:text-3xl text-[#1e6138] mt-1">
            {totalActive} <span className="text-xs sm:text-sm text-[#8a8178]">/ 140</span>
          </div>
          <div className="text-[10px] text-[#8a8178] font-hand mt-0.5">
            {totalDone > 0 ? `완료 ${totalDone} • 진행 ${totalIng}` : `진행 중 ${totalIng}개`}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-[#8a8178]">
          <span>전체 진도율</span>
          <span>{overallScore}% 달성 중</span>
        </div>
        <div className="h-3 w-full bg-[#e4dccf] rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#f0a88e] to-[#c9502f] rounded-full transition-all duration-500"
            style={{ width: `${Math.max(3, overallScore)}%` }}
          />
        </div>
      </div>

      {/* 3 Step Legend */}
      <div className="w-full max-w-full box-border overflow-hidden grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-[#e4dccf] text-xs">
        <div className="space-y-1 text-center">
          <div className="w-7 h-7 rounded-lg border border-[#c9502f] bg-[#fff5f2] text-[#c9502f] font-jua flex items-center justify-center mx-auto text-sm">
            ✓
          </div>
          <div className="font-bold text-[#1b1917]">① 알아봄</div>
          <p className="text-[10px] text-[#8a8178] font-hand">"가 어딨어?" 짚음</p>
        </div>
        <div className="space-y-1 text-center border-x border-[#f0ebe1] px-1">
          <div className="w-7 h-7 rounded-lg bg-[#f3c6b4] text-[#1b1917] font-jua flex items-center justify-center mx-auto text-sm shadow-xs">
            가
          </div>
          <div className="font-bold text-[#1b1917]">② 소리 냄</div>
          <p className="text-[10px] text-[#8a8178] font-hand">보여주면 먼저 읽음</p>
        </div>
        <div className="space-y-1 text-center">
          <div className="w-7 h-7 rounded-lg bg-[#c9502f] text-white font-jua flex items-center justify-center mx-auto text-sm shadow-xs">
            가
          </div>
          <div className="font-bold text-[#1b1917]">③ 혼자 읽음</div>
          <p className="text-[10px] text-[#8a8178] font-hand">섞어도 바로 읽음</p>
        </div>
      </div>

      {/* Practice Button (Flashcards Quiz) */}
      <button
        onClick={() => startPractice()}
        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#fdf3e4] to-[#fce4cc] border border-[#f5d7b5] shadow-xs hover:shadow-md transition-all active:scale-[0.98] group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#c9502f] text-white font-jua text-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            가
          </div>
          <div className="text-left">
            <h3 className="font-jua text-base sm:text-lg text-[#1b1917]">
              🎲 섞어서 읽기 연습 (플래시 퀴즈)
            </h3>
            <p className="text-xs text-[#8a8178] font-hand">
              체크한 글자들을 카드로 섞어 맞혀보고 바로 진도에 올려요!
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#c9502f] group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Click Voice & Volume Settings Control Bar */}
      <div className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-3.5 sm:p-4 border border-[#e4dccf] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isVoiceAudible
                  ? 'bg-[#fff5f2] text-[#c9502f] border border-[#fbd8ce]'
                  : 'bg-stone-100 text-stone-400 border border-stone-200'
              }`}
            >
              {isVoiceAudible ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="font-jua text-xs sm:text-sm text-[#1b1917] flex items-center gap-1.5 flex-wrap">
                <span>글자 클릭 시 목소리 듣기</span>
                {lastSpokenLabel && isVoiceAudible && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    "{lastSpokenLabel}" 재생
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#8a8178] font-hand">
                {isVoiceAudible
                  ? '자음·모음·글자를 누르면 한글 소리를 읽어줘요'
                  : soundVolume === 'mute'
                  ? '전체 음량이 꺼짐 상태예요 (아래에서 켜기)'
                  : '소리 없이 진도만 체크하는 중이에요'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextEnabled = !isVoiceAudible;
              if (nextEnabled && soundVolume === 'mute') {
                onSelectVolume('medium');
              }
              onToggleClickVoice(nextEnabled);
              if (nextEnabled) {
                setLastSpokenLabel('가');
                speakKorean('가');
              }
            }}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl font-jua text-xs border transition-all active:scale-95 shrink-0 whitespace-nowrap ${
              isVoiceAudible
                ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-2xs'
                : 'bg-[#faf8f5] text-[#6b6257] border-[#e4dccf] hover:border-[#c9502f]/40'
            }`}
          >
            {isVoiceAudible ? '🔊 켜짐' : '🔇 꺼짐'}
          </button>
        </div>

        {/* Mode & Volume Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f0ebe1]">
          <div className="flex items-center gap-1 bg-[#faf8f5] p-1 rounded-xl border border-[#e4dccf]">
            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                setTouchActionMode('check');
              }}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg font-jua text-[11px] transition-all whitespace-nowrap ${
                touchActionMode === 'check'
                  ? 'bg-white text-[#c9502f] shadow-2xs border border-[#fbd8ce]'
                  : 'text-[#8a8178]'
              }`}
            >
              ✅ 체크+소리
            </button>
            <button
              type="button"
              onClick={() => {
                if (soundVolume === 'mute') onSelectVolume('medium');
                if (!clickVoiceEnabled) onToggleClickVoice(true);
                setTouchActionMode('listen');
                playSfx('pop');
              }}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg font-jua text-[11px] transition-all whitespace-nowrap ${
                touchActionMode === 'listen'
                  ? 'bg-[#c9502f] text-white shadow-2xs'
                  : 'text-[#8a8178]'
              }`}
            >
              🔊 소리만 듣기
            </button>
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: 'mute', label: '꺼짐' },
                { id: 'soft', label: '약' },
                { id: 'medium', label: '중' },
                { id: 'loud', label: '강' },
              ] as { id: SoundVolume; label: string }[]
            ).map((v) => (
              <button
                type="button"
                key={v.id}
                onClick={() => onSelectVolume(v.id)}
                className={`min-h-[30px] px-2 py-1 rounded-lg font-jua text-[11px] border transition-all whitespace-nowrap ${
                  soundVolume === v.id
                    ? v.id === 'mute'
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-[#1b1917] text-white border-[#1b1917]'
                    : 'bg-[#faf8f5] text-[#8a8178] border-[#e4dccf] hover:border-[#c9502f]/40'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: 14 Consonants */}
      <div className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ebe1] pb-2">
          <h2 className="font-jua text-base sm:text-lg text-[#1b1917] flex flex-wrap items-center gap-1.5">
            <span>① 자음 ㄱ ~ ㅎ</span>
            <span
              className={`text-[11px] font-hand font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                isVoiceAudible || touchActionMode === 'listen'
                  ? 'text-[#c9502f] bg-[#fff5f2] border-[#fbd8ce]'
                  : 'text-stone-500 bg-stone-100 border-stone-200'
              }`}
            >
              {isVoiceAudible || touchActionMode === 'listen'
                ? '터치해 소리 듣기 🔊'
                : '무음 체크 모드 🔇'}
            </span>
          </h2>
          <span className="text-xs font-bold text-[#c9502f] font-jua whitespace-nowrap shrink-0">{consDone} / 14</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {CHO.map((c, i) => {
            const lvl = progress[`c${i}`] || 0;
            const name = NAMES[i];
            return (
              <button
                type="button"
                key={i}
                onClick={() => handleCharCellClick(`c${i}`, name)}
                className={`min-h-[58px] py-1.5 rounded-2xl flex flex-col items-center justify-center font-jua text-xl transition-all active:scale-90 border relative ${
                  lvl === 3
                    ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-xs'
                    : lvl === 2
                    ? 'bg-[#f3c6b4] text-[#1b1917] border-[#e9a88f]'
                    : lvl === 1
                    ? 'bg-[#fff5f2] text-[#c9502f] border-[#c9502f]'
                    : 'bg-[#faf8f5] text-[#1b1917] border-[#e4dccf] hover:border-[#c9502f]/40'
                }`}
                title={`${name} (${c}) - 터치하여 소리 듣기`}
              >
                <span className="leading-none">{c}</span>
                {lvl === 1 && (
                  <span className="absolute top-1 right-1.5 text-[9px] font-bold">✓</span>
                )}
                <span className={`text-[11px] font-hand font-bold mt-1 ${lvl === 3 ? 'text-white/90' : 'text-[#8a8178]'}`}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Syllable Matrix (가 ~ 하 and Vowels) */}
      <div className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ebe1] pb-2">
          <div className="min-w-0">
            <h2 className="font-jua text-base sm:text-lg text-[#1b1917] flex flex-wrap items-center gap-1.5">
              <span>② 가 ~ 하, 가갸표</span>
              <span
                className={`text-[11px] font-normal font-jua px-2 py-0.5 rounded-full border whitespace-nowrap ${
                  isVoiceAudible || touchActionMode === 'listen'
                    ? 'text-[#c9502f] bg-[#fff5f2] border-[#fbd8ce]'
                    : 'text-stone-500 bg-stone-100 border-stone-200'
                }`}
              >
                {isVoiceAudible || touchActionMode === 'listen' ? '소리 터치 🔊' : '무음 모드 🔇'}
              </span>
            </h2>
            <p className="text-xs text-[#8a8178] font-hand mt-0.5 break-keep">
              표를 좌우로 밀어 10가지 모음 결합을 확인하세요
            </p>
          </div>
          <span className="text-xs font-bold text-[#c9502f] font-jua shrink-0 whitespace-nowrap">{totalDone} / 140</span>
        </div>

        {/* Scrollable Matrix with Fixed/Sticky Consonant Column */}
        <div className="border border-[#e4dccf] rounded-2xl bg-[#faf8f5] overflow-hidden">
          {/* Top Scroll Hint Banner */}
          <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-1.5 bg-[#f5ede2] border-b border-[#e4dccf] text-[11px] text-[#6b6257] font-hand">
            <span className="font-bold text-[#c9502f]">
              👈 좌우로 밀어서 전체 모음 보기 👉
            </span>
            <span className="text-[10px] text-[#8a8178]">
              글자를 누르면 소리가 나요!
            </span>
          </div>

          <div className="overflow-x-auto overscroll-x-contain scrollbar-thin scrollbar-thumb-stone-300 p-2">
            <table className="border-collapse font-jua text-center min-w-full">
              <thead>
                <tr>
                  {/* Sticky Top-Left Corner Header */}
                  <th className="sticky left-0 z-30 bg-[#f4ebe0] border border-[#e4dccf] p-1.5 text-xs text-[#71695f] font-bold rounded-l-lg shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[52px] w-[52px]">
                    자\모
                  </th>
                  {JUNG.map((j, ji) => (
                    <th
                      key={ji}
                      className="p-1 min-w-[42px] w-[42px]"
                    >
                      <button
                        type="button"
                        onClick={() => handleHeaderJamoClick(j)}
                        className={`w-full py-1 rounded-md text-xs transition-transform active:scale-90 border ${
                          ji === 0
                            ? 'bg-[#fdf3e4] text-[#c9502f] border-[#fbd8ce] font-bold'
                            : 'bg-white text-[#8a8178] border-[#e4dccf] hover:text-[#c9502f]'
                        }`}
                        title={`모음 ${j} 소리 듣기`}
                      >
                        {j}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CHO.map((c, ci) => (
                  <tr key={ci}>
                    {/* Sticky Left Consonant Header Cell */}
                    <td className="sticky left-0 z-20 bg-[#fdfaf5] border border-[#e4dccf] p-1 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] min-w-[52px] w-[52px]">
                      <button
                        type="button"
                        onClick={() => handleHeaderJamoClick(NAMES[ci])}
                        className="w-full py-1 px-1 rounded-lg bg-white border border-[#eedfc9] hover:border-[#c9502f] text-center transition-all active:scale-95 group"
                        title={`${NAMES[ci]} (${c}) 소리 듣기`}
                      >
                        <span className="block text-sm font-bold text-[#1b1917] group-hover:text-[#c9502f]">
                          {c}
                        </span>
                        <span className="block text-[9px] font-hand text-[#8a8178] scale-90 leading-none">
                          {NAMES[ci].slice(0, 2)}
                        </span>
                      </button>
                    </td>

                    {/* Syllable Cells */}
                    {JUNG.map((_, ji) => {
                      const id = `s${ci}_${ji}`;
                      const ch = syl(ci, ji);
                      const lvl = progress[id] || 0;
                      const isFirstCol = ji === 0;

                      return (
                        <td key={ji} className="p-0.5 min-w-[46px] w-[46px]">
                          <button
                            type="button"
                            onClick={() => handleCharCellClick(id, ch)}
                            className={`w-full h-11 rounded-xl text-base flex items-center justify-center transition-all active:scale-90 border relative ${
                              lvl === 3
                                ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-2xs font-bold'
                                : lvl === 2
                                ? 'bg-[#f3c6b4] text-[#1b1917] border-[#e9a88f]'
                                : lvl === 1
                                ? 'bg-[#fff5f2] text-[#c9502f] border-[#c9502f]'
                                : isFirstCol
                                ? 'bg-[#fff9f4] text-[#1b1917] border-[#eedfc9] font-bold hover:border-[#c9502f]/40'
                                : 'bg-white text-[#4a443e] border-[#e8dfd3] opacity-90 hover:opacity-100 hover:border-[#c9502f]/40'
                            }`}
                            title={`${ch} (터치하여 진도 체크 및 소리 듣기)`}
                          >
                            <span>{ch}</span>
                            {lvl === 1 && (
                              <span className="absolute top-0.5 right-0.5 text-[8px] font-bold">✓</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="text-center pt-2">
        <button
          onClick={() => {
            playSfx('tap');
            setShowResetConfirmModal(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs text-[#8a8178] hover:text-[#c9502f] transition-colors py-2 px-3 rounded-xl bg-white border border-[#e4dccf]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          진도표 전체 초기화
        </button>
      </div>

      {/* In-App Confirmation Modal: 정말 진도표를 초기화할까요? */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs box-border overflow-hidden shadow-2xl p-5 sm:p-6 text-center space-y-4 animate-pop">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div>
              <h3 className="font-jua text-lg text-[#1b1917]">
                정말 초기화 할까요?
              </h3>
              <p className="text-xs text-[#8a8178] font-hand mt-1">
                자음(ㄱ~ㅎ)과 음절표(가~하)에서 체크한 모든 진도와 별점이 초기화됩니다. 계속 진행하시겠습니까?
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  playSfx('tap');
                  setShowResetConfirmModal(false);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-xs hover:bg-[#faf8f5]"
              >
                취소
              </button>
              <button
                onClick={() => {
                  playSfx('erase');
                  onResetProgress();
                  setShowResetConfirmModal(false);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-jua text-xs shadow-md"
              >
                초기화 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Modal Drawer */}
      {practiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-sm box-border overflow-hidden flex flex-col max-h-[90vh] shadow-2xl p-4 sm:p-6 text-center animate-pop relative">
            <div className="overflow-y-auto overflow-x-hidden flex-1 space-y-3.5 box-border">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#eedfc9]">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-jua text-[#c9502f] text-left">
                <span>카드 {practiceIndex + 1}/{practiceDeck.length}</span>
                <span className="text-[#8a8178]">•</span>
                <span className="text-[#4a443e]">
                  {practiceCategory === 'cons' ? '자음(ㄱ~ㅎ)' : practiceCategory === 'vowel' ? '모음(ㅏ~ㅣ)' : practiceCategory === 'syl' ? '음절(가~하)' : practiceCategory === 'word' ? '동물·사물 낱말' : '전체 믹스'}
                </span>
              </div>
              <button
                onClick={() => {
                  playSfx('tap');
                  setPracticeOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] hover:bg-[#f6f1e7] transition-all shrink-0"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Pills inside Practice Modal */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: '🎲 전체' },
                { id: 'cons', label: 'ㄱ 자음' },
                { id: 'vowel', label: 'ㅏ 모음' },
                { id: 'syl', label: '가 음절' },
                { id: 'word', label: '🦋 낱말' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    const newCat = c.id as any;
                    setPracticeCategory(newCat);
                    startPractice(newCat);
                  }}
                  className={`min-h-[36px] text-xs font-jua px-3 py-1.5 rounded-full transition-all whitespace-nowrap shrink-0 ${
                    practiceCategory === c.id
                      ? 'bg-[#c9502f] text-white shadow-xs'
                      : 'bg-white text-[#8a8178] border border-[#e4dccf] hover:bg-[#f6f1e7]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Parent Voice Mission Praise Banner / Settings Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 text-xs font-jua">
              <div className="flex items-center gap-1.5 text-rose-800">
                <span className="text-base">🎙️</span>
                <span>정답 시 부모님 칭찬 재생</span>
              </div>
              {onOpenParentVoice && (
                <button
                  onClick={onOpenParentVoice}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-[#c9502f] border border-rose-300 text-[11px] font-jua active:scale-95 whitespace-nowrap"
                >
                  설정/녹음
                </button>
              )}
            </div>

            {/* Praise Toast Notice when answer is correct */}
            {praiseNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-jua text-center animate-fadeIn shadow-xs flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="break-keep">{praiseNotice}</span>
              </div>
            )}

            {!practiceDone ? (
              <>
                {/* Big Flashcard */}
                <div className="bg-white rounded-3xl border-2 border-[#e4dccf] p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center min-h-[170px] relative">
                  {practiceDeck[practiceIndex]?.sub && (
                    <span className="text-xs font-hand text-[#8a8178] mb-1">
                      {practiceDeck[practiceIndex].sub}
                    </span>
                  )}
                  <span className="text-6xl font-jua text-[#1b1917] tracking-wider animate-pop">
                    {practiceDeck[practiceIndex]?.ch}
                  </span>
                  <button
                    onClick={() => speakKorean(practiceDeck[practiceIndex]?.ch)}
                    className="mt-3 min-h-[40px] flex items-center gap-1.5 text-xs text-[#c9502f] bg-[#fdf3e4] hover:bg-[#fce9d0] px-4 py-1.5 rounded-full font-jua transition-all active:scale-95"
                  >
                    <Volume2 className="w-4 h-4" /> 소리 듣기
                  </button>
                </div>

                <p className="text-xs text-[#8a8178] font-hand break-keep">
                  아이가 글자를 보고 소리 내어 읽었나요?
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handlePracticeAnswer(false)}
                    className="min-h-[52px] py-3 rounded-2xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-base hover:bg-[#f6f1e7] active:scale-95 transition-all"
                  >
                    아직이에요
                  </button>
                  <button
                    onClick={() => handlePracticeAnswer(true)}
                    className="min-h-[52px] py-3 rounded-2xl bg-[#c9502f] text-white font-jua text-base shadow-md hover:bg-[#b84324] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    읽었어요! 🎉
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 py-2">
                <div className="w-16 h-16 rounded-full bg-[#fdf3e4] border-2 border-[#f2c14e] text-3xl flex items-center justify-center mx-auto animate-bounce">
                  🏆
                </div>
                <div>
                  <h3 className="font-jua text-xl text-[#1b1917]">
                    {practiceResults.filter((r) => r.ok).length}개 성공!
                  </h3>
                  <p className="text-xs text-[#8a8178] font-hand mt-1">
                    다마고치 경험치 +10 획득! 진도표에 한 단계 올릴까요?
                  </p>
                </div>

                {/* Badges of read letters */}
                <div className="flex flex-wrap justify-center gap-1.5 p-3 bg-white rounded-2xl border border-[#e4dccf]">
                  {practiceResults.map((r, i) => (
                    <span
                      key={i}
                      className={`w-8 h-8 rounded-lg font-jua flex items-center justify-center text-sm ${
                        r.ok
                          ? 'bg-[#c9502f] text-white'
                          : 'bg-[#f6f1e7] text-[#8a8178] opacity-60'
                      }`}
                    >
                      {r.ch}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={applyPracticeUpgrades}
                    className="w-full py-3 rounded-2xl bg-[#c9502f] text-white font-jua text-base shadow-md hover:bg-[#b84324] active:scale-95 transition-all"
                  >
                    읽은 글자 진도표에 반영하기!
                  </button>
                  <button
                    onClick={() => startPractice()}
                    className="w-full py-2.5 rounded-2xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm hover:bg-[#f6f1e7]"
                  >
                    한 번 더 연습하기 🎲
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
