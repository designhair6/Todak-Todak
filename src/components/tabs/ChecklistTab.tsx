import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Flame,
  Calendar,
  Award,
  Sparkles,
  Heart,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Printer,
  Edit3,
  Mic,
  Play,
  Pause,
} from 'lucide-react';
import { STAGES, STAGE_MISSIONS, STAGE_WEEKS } from '../../data/hangulData';
import { StageId, DailyMomDiary, Mission, Week } from '../../types';
import { playSfx, speakKorean } from '../../utils/sound';
import { playParentPraiseVoice } from '../../utils/parentVoiceHelper';
import { DailyDiaryModal } from '../DailyDiaryModal';

interface ChecklistTabProps {
  currentStage: StageId;
  onChangeStage: (stage: StageId) => void;
  completedDays: number[];
  onToggleDay: (day: number) => void;
  onResetDays: () => void;
  diaries: Record<number, DailyMomDiary>;
  onSaveDiary: (diary: DailyMomDiary) => void;
  onDeleteDiary: (day: number) => void;
  onOpenPrintBook: () => void;
  onGoToStickers: () => void;
  onRewardExp: (amount: number) => void;
  onOpenSoundBlend?: () => void;
  onOpenCalendar?: () => void;
  completedDates?: Record<string, string>;
  childName: string;
  unlockedStages?: StageId[];
  onUnlockStage?: (stage: StageId) => void;
  onCompleteAllDays?: () => void;
  onOpenParentVoice?: () => void;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  currentStage,
  onChangeStage,
  completedDays,
  onToggleDay,
  onResetDays,
  diaries,
  onSaveDiary,
  onDeleteDiary,
  onOpenPrintBook,
  onGoToStickers,
  onRewardExp,
  onOpenSoundBlend,
  onOpenCalendar,
  completedDates = {},
  childName,
  unlockedStages = [1],
  onUnlockStage,
  onCompleteAllDays,
  onOpenParentVoice,
}) => {
  const [showPromptForSticker, setShowPromptForSticker] = useState<number | null>(null);
  const [selectedDiaryDay, setSelectedDiaryDay] = useState<number | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'voice' | 'diary'>('voice');
  const [inlinePlayingDay, setInlinePlayingDay] = useState<number | null>(null);
  const inlineAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [lockedStagePrompt, setLockedStagePrompt] = useState<typeof STAGES[0] | null>(null);
  const [showStageCompleteModal, setShowStageCompleteModal] = useState(false);

  const handleToggleInlineVoice = (dayNum: number, audioUrl: string) => {
    if (inlinePlayingDay === dayNum) {
      if (inlineAudioRef.current) {
        inlineAudioRef.current.pause();
        inlineAudioRef.current = null;
      }
      setInlinePlayingDay(null);
      return;
    }

    if (inlineAudioRef.current) {
      inlineAudioRef.current.pause();
      inlineAudioRef.current = null;
    }

    try {
      playSfx('tap');
      const audio = new Audio(audioUrl);
      inlineAudioRef.current = audio;
      audio.onended = () => {
        setInlinePlayingDay(null);
        inlineAudioRef.current = null;
      };
      audio.onerror = () => {
        setInlinePlayingDay(null);
        inlineAudioRef.current = null;
      };
      audio.play().catch(() => {
        setInlinePlayingDay(null);
      });
      setInlinePlayingDay(dayNum);
    } catch {
      setInlinePlayingDay(null);
    }
  };

  const stageInfo = STAGES.find((s) => s.id === currentStage) || STAGES[0];
  const missions: Mission[] = STAGE_MISSIONS[currentStage as StageId] || STAGE_MISSIONS[1];
  const weeks: Week[] = STAGE_WEEKS[currentStage as StageId] || STAGE_WEEKS[1];

  const completedCount = completedDays.length;
  const remainingCount = 30 - completedCount;

  const handleAdvanceToNextStage = () => {
    if (currentStage >= 10) return;
    const nextStage = (currentStage + 1) as StageId;
    playSfx('levelup');
    confetti({ particleCount: 50, spread: 80 });
    if (onUnlockStage) {
      onUnlockStage(nextStage);
    }
    onChangeStage(nextStage);
    setShowStageCompleteModal(false);
    speakKorean(`축하해요! ${nextStage}단계 모험을 시작해요!`);
  };

  // Streak calculation
  let longestStreak = 0;
  let currentRun = 0;
  for (let d = 1; d <= 30; d++) {
    if (completedDays.includes(d)) {
      currentRun++;
      if (currentRun > longestStreak) longestStreak = currentRun;
    } else {
      currentRun = 0;
    }
  }

  const handleDayClick = (day: number) => {
    const isNowCompleted = !completedDays.includes(day);
    onToggleDay(day);

    if (isNowCompleted) {
      playSfx('pop');
      playParentPraiseVoice({
        childName,
        letter: `D+${day}`,
      });
      onRewardExp(12);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#c9502f', '#f2c14e', '#f0a88e', '#457b9d', '#2a9d8f'],
      });

      const nextCompletedCount = completedDays.includes(day) ? completedDays.length : completedDays.length + 1;
      if (day === 30 || nextCompletedCount >= 30) {
        setTimeout(() => {
          setShowStageCompleteModal(true);
          playSfx('fan');
          speakKorean(`축하해요! ${currentStage}단계를 모두 마쳤어요! 다음 단계로 가볼까요?`);
        }, 500);
      } else {
        setShowPromptForSticker(day);
      }
    } else {
      playSfx('tap');
    }
  };

  const writtenCount = Object.keys(diaries).length;

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-4 pb-8 space-y-5 box-border overflow-x-hidden">
      {/* Game Stage Map: 1~10 Stages */}
      <div className="w-full max-w-full box-border overflow-hidden bg-white p-4 rounded-3xl border border-[#F2E5D8] shadow-[0_6px_20px_rgba(218,178,142,0.10)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#f0ebd9]">
          <div className="flex items-center gap-1.5 font-jua text-sm text-[#1b1917]">
            <span>🗺️</span>
            <span>한글 모험 지도 (1~10단계)</span>
          </div>
          <span className="text-[11px] font-bold text-[#c9502f] font-jua bg-[#fff4f0] border border-[#fcd8cd] px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
            현재 {currentStage}단계 · {stageInfo.badge} {stageInfo.tag}
          </span>
        </div>

        {/* 10-Stage Grid Map: 5 columns x 2 rows */}
        <div className="grid grid-cols-5 gap-1.5 font-jua">
          {STAGES.map((stg) => {
            const isActive = currentStage === stg.id;
            const isUnlocked = unlockedStages.includes(stg.id);

            return (
              <button
                key={stg.id}
                onClick={() => {
                  if (isUnlocked) {
                    playSfx('tap');
                    onChangeStage(stg.id);
                  } else {
                    playSfx('pop');
                    setLockedStagePrompt(stg);
                  }
                }}
                className={`min-h-[52px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all border text-center relative active:scale-95 ${
                  isActive
                    ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-md z-10'
                    : !isUnlocked
                    ? 'bg-[#faf8f5] text-[#9e9488] border-[#ebe5dc] opacity-80 hover:opacity-95 cursor-pointer'
                    : 'bg-white text-[#4a443e] border-[#e4dccf] hover:border-[#c9502f]/40 cursor-pointer shadow-2xs'
                }`}
                title={!isUnlocked ? `${stg.id}단계 잠김 (1단계 완료 후 오픈)` : `${stg.id}단계: ${stg.name}`}
              >
                {!isUnlocked && (
                  <span className="absolute top-1 right-1 text-[9px] text-stone-400">
                    🔒
                  </span>
                )}
                {isUnlocked && !isActive && (
                  <span className="absolute top-1 right-1 text-[9px] text-emerald-600 font-bold">
                    ✓
                  </span>
                )}
                <span className={`text-base font-bold leading-none mb-0.5 ${
                  isActive ? 'text-white' : isUnlocked ? 'text-[#c9502f]' : 'text-stone-400'
                }`}>
                  {stg.badge}
                </span>
                <span className="text-[11px] font-bold leading-tight whitespace-nowrap">
                  {stg.id}단계
                </span>
              </button>
            );
          })}
        </div>
        <div className="text-center text-[11px] font-jua text-[#c9502f] pt-0.5 break-keep">
          {completedCount >= 30
            ? '🎉 1단계 완주! 2단계가 열렸어요'
            : '🌱 1단계 30일 완료 시 다음 단계가 열려요'}
        </div>
      </div>

      {/* Current Stage Overview Banner */}
      <div className="w-full max-w-full box-border overflow-hidden bg-gradient-to-r from-[#fdf3e4] to-[#fbebe3] p-4 rounded-3xl border border-[#eedfc9] space-y-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-jua text-base sm:text-lg text-[#1b1917] break-keep">
            {stageInfo.name}
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#c9502f] border border-[#f3dfc6] whitespace-nowrap shrink-0">
            {stageInfo.tag}
          </span>
        </div>
        <p className="text-xs text-[#4a443e] font-hand break-keep">
          {stageInfo.desc}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold text-[#c9502f] pt-0.5">
          <span className="break-keep">🎯 {stageInfo.target}</span>
          <span className="text-[11px] text-[#8a8178] font-hand font-normal whitespace-nowrap">
            완료 <b>{completedCount}</b>/30일 ({Math.round((completedCount / 30) * 100)}%)
          </span>
        </div>

        {/* Stage Advancement Control */}
        {currentStage < 10 && (
          <div className="pt-2 border-t border-[#eedfc9]/60">
            {completedCount >= 30 ? (
              <button
                onClick={handleAdvanceToNextStage}
                className="w-full min-h-[48px] py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-jua text-xs sm:text-sm shadow-md flex flex-wrap items-center justify-between gap-2 transition-all active:scale-[0.98] cursor-pointer animate-pop"
              >
                <span className="flex items-center gap-1.5">
                  <span>🎉</span>
                  <span>30일 완주! {currentStage + 1}단계 열기</span>
                </span>
                <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-hand whitespace-nowrap">
                  출발 👉
                </span>
              </button>
            ) : (
              <div className="py-2 px-3 rounded-2xl bg-white/80 border border-[#eedfc9] flex flex-wrap items-center justify-between gap-2 text-xs font-jua text-[#7D736A]">
                <span className="flex items-center gap-1.5 break-keep">
                  <span>🔒</span>
                  <span>30일 모두 완료 시 다음 단계 오픈</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-[#c9502f] bg-[#fff5f2] px-2 py-0.5 rounded-md border border-[#fcd2c0] whitespace-nowrap shrink-0">
                  {30 - completedCount}일 남음
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parent Voice Mission Banner (5-second praise recording) */}
      <div className="w-full max-w-full box-border overflow-hidden bg-gradient-to-r from-[#fff3eb] via-[#fdf5f0] to-[#fff7f0] border-2 border-dashed border-[#eecbb5] rounded-3xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c9502f] to-[#ea580c] text-white flex items-center justify-center shadow-xs shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-left min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-jua text-sm text-[#1b1917]">
                엄마/아빠 목소리 칭찬
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-jua whitespace-nowrap">
                5초 녹음 💖
              </span>
            </div>
            <p className="text-xs text-[#8a8178] font-hand break-keep">
              아이가 문제를 맞히면 엄마 목소리가 나와요!
            </p>
          </div>
        </div>
        {onOpenParentVoice && (
          <button
            onClick={() => {
              playSfx('tap');
              onOpenParentVoice();
            }}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#c9502f] hover:bg-[#b54122] text-white font-jua text-xs sm:text-sm shadow-xs active:scale-95 shrink-0 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Mic className="w-4 h-4" />
            <span>5초 녹음하기</span>
          </button>
        )}
      </div>

      {/* Sound Blending Play Module Banner */}
      {onOpenSoundBlend && (
        <button
          onClick={() => {
            playSfx('pop');
            onOpenSoundBlend();
          }}
          className="w-full min-h-[60px] p-3.5 rounded-2xl bg-gradient-to-r from-[#ffebe6] via-[#fff3e0] to-[#fef9eb] border border-[#f5b8a6] flex items-center justify-between gap-2 text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white border border-[#f5b8a6] flex items-center justify-center text-xl shadow-2xs group-hover:scale-110 transition-transform flex-none">
              🧩
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 font-jua text-xs sm:text-sm text-[#c9502f]">
                <span>자음+모음 소리 합체 연구소</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#c9502f] text-white whitespace-nowrap">
                  뽀뽀 놀이
                </span>
              </div>
              <p className="text-xs text-[#4a443e] font-hand break-keep mt-0.5">
                ㄱ + ㅏ = 가! 직접 합치고 소리 들어보기
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#c9502f] group-hover:translate-x-0.5 transition-transform flex-none" />
        </button>
      )}

      {/* Score Dashboard - Warm Lovable Pastel Cards (Replaces harsh black cards) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Card 1: 완료한 날 (Warm Apricot / Coral) */}
        <div className="bg-gradient-to-br from-[#fff2ec] to-[#ffe4d8] border border-[#fcd2c0] rounded-2xl p-3 sm:p-4 text-center shadow-xs">
          <div className="text-[11px] sm:text-xs text-[#a84428] font-bold">완료한 날</div>
          <div className="font-jua text-2xl sm:text-3xl text-[#c9502f] mt-1">
            {completedCount} <span className="text-xs sm:text-sm text-[#a84428]/70">/ 30</span>
          </div>
          <div className="text-[10px] text-[#b24828] font-hand mt-0.5 font-bold">
            {completedCount === 30 ? '🎉 전과정 완료!' : `${Math.round((completedCount / 30) * 100)}% 달성`}
          </div>
        </div>

        {/* Card 2: 최장 연속 (Sunshine Yellow / Gold) */}
        <div className="bg-gradient-to-br from-[#fef8e7] to-[#feefc4] border border-[#f9e295] rounded-2xl p-3 sm:p-4 text-center shadow-xs">
          <div className="text-[11px] sm:text-xs text-[#8a5d07] font-bold flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#d97706]" />
            최장 연속
          </div>
          <div className="font-jua text-2xl sm:text-3xl text-[#d97706] mt-1">
            {longestStreak} <span className="text-xs sm:text-sm text-[#8a5d07]/70">일</span>
          </div>
          <div className="text-[10px] text-[#99650d] font-hand mt-0.5 font-bold">매일 10분씩 쑥쑥</div>
        </div>

        {/* Card 3: 성장 일기 (Soft Fresh Mint) */}
        <div className="bg-gradient-to-br from-[#f0f9ed] to-[#dcf3d7] border border-[#c1e7ba] rounded-2xl p-3 sm:p-4 text-center shadow-xs">
          <div className="text-[11px] sm:text-xs text-[#286b35] font-bold">성장 일기</div>
          <div className="font-jua text-2xl sm:text-3xl text-[#237d3d] mt-1">
            {writtenCount} <span className="text-xs sm:text-sm text-[#286b35]/70">편</span>
          </div>
          <div className="text-[10px] text-[#327844] font-hand mt-0.5 font-bold">소중한 추억 책</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-[#8a8178]">
          <span>{currentStage}단계 30일 챌린지</span>
          <span>{completedCount}일 / 30일 완료</span>
        </div>
        <div className="h-3 w-full bg-[#e4dccf] rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#f0a88e] to-[#c9502f] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(4, (completedCount / 30) * 100)}%` }}
          />
        </div>
      </div>

      {/* Sticker Prompt Banner */}
      {showPromptForSticker && (
        <div className="bg-[#fef7eb] border-2 border-[#f2c14e] p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-pop">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <div>
              <p className="font-jua text-sm text-[#1b1917]">
                D+{showPromptForSticker} 완료! 다마고치 경험치 +12!
              </p>
              <p className="text-[11px] text-[#8a8178] font-hand">
                오늘의 칭찬 스티커를 뽑으러 가볼까요?
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSfx('rare');
              setShowPromptForSticker(null);
              onGoToStickers();
            }}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-[#c9502f] text-white font-jua text-xs shadow-xs hover:bg-[#b84324] active:scale-95 transition-all flex-none"
          >
            스티커 뽑기 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Daily Diary Showcase & A4 Print Banner */}
      <div className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#f0ebe1] pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-5 h-5 text-[#c9502f] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-jua text-base text-[#1b1917] break-keep">
                엄마의 30일 한글 성장 일기장
              </h3>
              <p className="text-xs text-[#8a8178] font-hand break-keep">
                날짜별로 기록하고 A4 책자로 인쇄해요
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onOpenCalendar && (
              <button
                onClick={() => {
                  playSfx('tap');
                  onOpenCalendar();
                }}
                className="flex items-center gap-1.5 min-h-[40px] text-xs font-jua text-[#1b1917] bg-[#fbf8f2] hover:bg-[#efe7d8] px-3 py-1.5 rounded-xl border border-[#e4dccf] transition-all active:scale-95 whitespace-nowrap"
                title="이번 달 한글 발자국 달력 보기"
              >
                <Calendar className="w-3.5 h-3.5 text-[#c9502f]" /> 발자국 달력
              </button>
            )}
            <button
              onClick={() => {
                playSfx('tap');
                onOpenPrintBook();
              }}
              className="flex items-center gap-1.5 min-h-[40px] text-xs font-jua text-[#c9502f] bg-[#fdf3e4] hover:bg-[#fce9d0] px-3 py-1.5 rounded-xl border border-[#eedfc9] transition-all active:scale-95 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" /> A4 인쇄
            </button>
          </div>
        </div>

        {/* 30 Days Diary Carousel Quick Navigator */}
        <div className="flex gap-2 overflow-x-auto pb-1.5">
          {Array.from({ length: 30 }, (_, i) => {
            const dayNum = i + 1;
            const hasDiary = !!diaries[dayNum];
            const diaryEntry = diaries[dayNum];

            return (
              <button
                key={dayNum}
                onClick={() => {
                  playSfx('tap');
                  setSelectedDiaryDay(dayNum);
                }}
                className={`flex-none w-14 p-2 rounded-2xl border text-center transition-all ${
                  hasDiary
                    ? 'bg-[#fff5f2] border-[#f5b8a6] shadow-xs'
                    : 'bg-[#faf8f5] border-[#e4dccf] hover:border-[#c9502f]/40'
                }`}
              >
                <span className="text-[11px] font-jua block text-[#8a8178]">
                  D+{dayNum}
                </span>
                <span className="text-lg block mt-0.5">
                  {hasDiary ? diaryEntry.mood : '📝'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weeks & Missions List with Diary Edit Button */}
      <div className="space-y-4">
        {weeks.map((w, wi) => {
          const weekMissions = missions.slice(w.from - 1, w.to);
          const weekCompleted = weekMissions.filter((_, idx) =>
            completedDays.includes(w.from + idx)
          ).length;
          const isWeekFull = weekCompleted === weekMissions.length;

          return (
            <div key={wi} className="w-full max-w-full box-border overflow-hidden bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#f0ebe1] pb-2.5">
                <div>
                  <span className="text-[11px] font-bold text-[#c9502f] uppercase tracking-wider block font-jua">
                    {w.n}
                  </span>
                  <h3 className="font-jua text-base sm:text-lg text-[#1b1917]">
                    {w.t}
                  </h3>
                </div>
                <div
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isWeekFull
                      ? 'bg-[#eef6e2] text-[#437a22]'
                      : 'bg-[#f6f1e7] text-[#8a8178]'
                  }`}
                >
                  {weekCompleted} / {weekMissions.length} {isWeekFull ? '완료! 🏆' : ''}
                </div>
              </div>

              <div className="space-y-2">
                {weekMissions.map((m, idx) => {
                  const dayNum = w.from + idx;
                  const isDone = completedDays.includes(dayNum);
                  const hasDiary = !!diaries[dayNum];

                  return (
                    <div
                      key={dayNum}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all space-y-2.5 ${
                        isDone
                          ? 'bg-[#fbf4ee] border-[#e9bcaf]'
                          : m.goal
                          ? 'bg-[#fff5f5] border-[#f8b4b4]'
                          : m.rest
                          ? 'bg-[#fcf9f2] border-[#ecdcc3]'
                          : 'bg-white border-[#ece3d4]'
                      }`}
                    >
                      {/* Top Tier: Day Badge, Mission Title & Large Check Circle */}
                      <div
                        onClick={() => handleDayClick(dayNum)}
                        className="flex items-center justify-between gap-2.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`font-jua text-xs sm:text-sm px-2.5 py-1 rounded-xl shrink-0 whitespace-nowrap ${
                              isDone
                                ? 'bg-[#c9502f] text-white'
                                : m.goal
                                ? 'bg-[#ffdcd2] text-[#c9502f]'
                                : 'bg-[#f6f1e7] text-[#8a8178]'
                            }`}
                          >
                            D+{dayNum}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`font-bold text-sm sm:text-base break-keep ${
                                  isDone
                                    ? 'text-[#c9502f] line-through opacity-85'
                                    : 'text-[#1b1917]'
                                }`}
                              >
                                {m.t}
                              </span>
                              {m.rest && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#fef3d6] text-[#b8860b] whitespace-nowrap">
                                  쉬는 날 ☕
                                </span>
                              )}
                              {m.goal && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#ffdcd2] text-[#c9502f] whitespace-nowrap">
                                  대망의 목표! 💖
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Large Kid-Friendly Check Circle (>=44px) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDayClick(dayNum);
                          }}
                          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                            isDone
                              ? 'bg-[#c9502f] text-white shadow-sm'
                              : 'border-2 border-[#d6cfc4] bg-[#fdfcf9] hover:border-[#c9502f]'
                          }`}
                          aria-label={`D+${dayNum} 완료 체크`}
                        >
                          {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : null}
                        </button>
                      </div>

                      {/* Bottom Tier: Subtitle Hint + Voice & Diary Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f0ebe1]/80">
                        <p
                          onClick={() => handleDayClick(dayNum)}
                          className="text-xs text-[#8a8178] font-hand break-keep flex-1 min-w-0 cursor-pointer"
                        >
                          {m.s}
                        </p>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasDiary && diaries[dayNum]?.audioUrl ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleInlineVoice(dayNum, diaries[dayNum].audioUrl!);
                                }}
                                className={`min-h-[38px] px-3 py-1.5 rounded-xl border flex items-center gap-1 text-xs font-jua transition-all active:scale-95 whitespace-nowrap ${
                                  inlinePlayingDay === dayNum
                                    ? 'bg-[#ea580c] text-white border-[#ea580c] shadow-xs'
                                    : 'bg-[#fff7ed] hover:bg-[#fed7aa] border-[#fed7aa] text-[#9a3412]'
                                }`}
                                title="아이 목소리 듣기"
                              >
                                {inlinePlayingDay === dayNum ? (
                                  <>
                                    <Pause className="w-3.5 h-3.5" />
                                    <span>정지</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 fill-[#9a3412]" />
                                    <span>목소리</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playSfx('tap');
                                  setModalInitialTab('voice');
                                  setSelectedDiaryDay(dayNum);
                                }}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-orange-50 border border-[#fed7aa] text-[#ea580c] flex items-center justify-center transition-colors active:scale-95"
                                title="다시 녹음하기"
                              >
                                <Mic className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playSfx('tap');
                                setModalInitialTab('voice');
                                setSelectedDiaryDay(dayNum);
                              }}
                              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#fed7aa] bg-[#fffaf5] hover:bg-[#ffedd5] text-[#ea580c] flex items-center gap-1 text-xs font-jua transition-all active:scale-95 whitespace-nowrap"
                              title="아이 목소리 녹음하기"
                            >
                              <Mic className="w-3.5 h-3.5 text-[#ea580c]" />
                              <span>녹음</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSfx('tap');
                              setModalInitialTab('diary');
                              setSelectedDiaryDay(dayNum);
                            }}
                            className={`min-h-[38px] px-3 py-1.5 rounded-xl border flex items-center gap-1 text-xs font-jua transition-all active:scale-95 whitespace-nowrap ${
                              hasDiary && diaries[dayNum]?.content
                                ? 'bg-[#fdf3e4] border-[#eedfc9] text-[#c9502f]'
                                : 'bg-[#faf8f5] border-[#e4dccf] text-[#8a8178] hover:text-[#1b1917]'
                            }`}
                            title="엄마 일기 쓰기"
                          >
                            <span>{hasDiary && diaries[dayNum]?.mood ? diaries[dayNum].mood : '✏️'}</span>
                            <span>일기</span>
                          </button>
                        </div>
                      </div>

                      {dayNum === 30 && currentStage < 10 && completedDays.length >= 30 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceToNextStage();
                            }}
                            className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-jua text-xs shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer animate-pop"
                          >
                            <span>🎉 30일 완주! {currentStage + 1}단계로 이동 👉</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>


      {/* Bottom Action: Reset this stage */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => {
            playSfx('tap');
            setShowResetConfirmModal(true);
          }}
          className="flex items-center gap-1.5 min-h-[42px] text-xs text-[#8a8178] hover:text-[#c9502f] transition-colors py-2 px-3 rounded-xl bg-white border border-[#e4dccf] active:scale-95 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>{currentStage}단계 체크 초기화</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playSfx('tap');
            onGoToStickers();
          }}
          className="min-h-[42px] px-2 font-jua text-sm text-[#c9502f] hover:underline flex items-center gap-1 whitespace-nowrap active:scale-95"
        >
          <span>스티커 보드로 이동하기 🌟</span>
        </button>
      </div>

      {/* In-App Confirmation Modal: 삭제하시겠습니까? */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs box-border overflow-hidden shadow-2xl p-5 sm:p-6 text-center space-y-4 animate-pop">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto text-2xl">
              🗑️
            </div>
            <div>
              <h3 className="font-jua text-lg text-[#1b1917]">
                삭제하시겠습니까?
              </h3>
              <p className="text-xs text-[#8a8178] font-hand mt-1">
                {currentStage}단계 30일 체크 기록이 모두 초기화됩니다. 기록을 삭제하고 처음부터 다시 시작하시겠습니까?
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
                  onResetDays();
                  setShowResetConfirmModal(false);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-jua text-xs shadow-md"
              >
                초기화 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Diary Modal */}
      {selectedDiaryDay !== null && (
        <DailyDiaryModal
          isOpen={true}
          onClose={() => setSelectedDiaryDay(null)}
          day={selectedDiaryDay}
          mission={missions[selectedDiaryDay - 1] || { t: '한글 놀이', s: '' }}
          diary={diaries[selectedDiaryDay]}
          onSaveDiary={(entry) => {
            onSaveDiary(entry);
            onRewardExp(8);
          }}
          onDeleteDiary={onDeleteDiary}
          onOpenPrintBook={onOpenPrintBook}
          childName={childName}
          initialTab={modalInitialTab}
        />
      )}

      {/* Locked Stage Modal: 🔒 단계 잠금 안내 & 학부모 권한 잠금 해제 */}
      {lockedStagePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs box-border overflow-hidden shadow-2xl p-5 sm:p-6 text-center space-y-3.5 animate-pop">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl border border-amber-300 shadow-inner">
              🔒
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-block font-jua">
                {lockedStagePrompt.id}단계 잠김 안내
              </span>
              <h3 className="font-jua text-lg text-[#1b1917]">
                {lockedStagePrompt.name}
              </h3>
              <p className="text-xs text-[#5D534A] font-body leading-relaxed whitespace-pre-line">
                1단계를 모두 체크(30일 완료)해야 다음 단계가 차례대로 열려요!{'\n'}
                1단계 미션을 매일 하나씩 차근차근 완성해볼까요?
              </p>
              <div className="p-3 rounded-2xl bg-white border border-[#eedfc9] text-xs font-jua text-[#c9502f] space-y-0.5">
                <div>현재 1단계 진행도</div>
                <div className="text-base text-[#1b1917] font-bold">
                  {completedCount} <span className="text-xs font-normal text-[#7D736A]">/ 30일 완료</span>
                </div>
                <div className="text-[11px] text-[#c9502f] font-body">
                  (남은 미션: {30 - completedCount}일)
                </div>
              </div>
            </div>
            <div className="pt-1">
              <button
                onClick={() => {
                  playSfx('tap');
                  setLockedStagePrompt(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                🌱 1단계 미션 계속 도전하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Completion Modal: 1단계 완주 축하 및 2단계로 출발 */}
      {showStageCompleteModal && currentStage < 10 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#eedfc9] rounded-3xl w-full max-w-sm box-border overflow-hidden shadow-2xl p-5 sm:p-6 text-center space-y-4 animate-pop">
            <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-600 text-3xl flex items-center justify-center mx-auto animate-bounce shadow-inner">
              👑
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-block">
                {currentStage}단계 완주를 축하합니다! 🎉
              </span>
              <h3 className="font-jua text-xl text-[#1b1917]">
                {stageInfo.name} 정복 완료!
              </h3>
              <p className="text-xs text-[#8a8178] font-hand leading-relaxed">
                정말 대단해요! 14개 자음 모양을 멋지게 모두 마쳤어요.
                이제 2단계: 모음이랑 친해지기 모험이 활짝 열렸습니다! 🗝️
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleAdvanceToNextStage}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c9502f] to-[#e05b38] hover:from-[#b84324] hover:to-[#c9502f] text-white font-jua text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🚀</span>
                <span>{currentStage + 1}단계(모음이랑 친해지기)로 바로 이동!</span>
              </button>
              <button
                onClick={() => setShowStageCompleteModal(false)}
                className="w-full py-2.5 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-xs hover:bg-[#faf8f5]"
              >
                🌱 1단계 머무르며 복습하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
