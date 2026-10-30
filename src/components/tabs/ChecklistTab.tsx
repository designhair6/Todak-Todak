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
} from 'lucide-react';
import { STAGES, STAGE_MISSIONS, STAGE_WEEKS } from '../../data/hangulData';
import { DailyMomDiary, Mission, StageId } from '../../types';
import { playSfx } from '../../utils/sound';
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
}) => {
  const [showPromptForSticker, setShowPromptForSticker] = useState<number | null>(null);
  const [selectedDiaryDay, setSelectedDiaryDay] = useState<number | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [lockedStagePrompt, setLockedStagePrompt] = useState<typeof STAGES[0] | null>(null);

  const stageInfo = STAGES.find((s) => s.id === currentStage) || STAGES[0];
  const missions = STAGE_MISSIONS[currentStage] || STAGE_MISSIONS[1];
  const weeks = STAGE_WEEKS[currentStage] || STAGE_WEEKS[1];

  const completedCount = completedDays.length;
  const remainingCount = 30 - completedCount;

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
      onRewardExp(20);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#c9502f', '#f2c14e', '#f0a88e', '#457b9d', '#2a9d8f'],
      });
      setShowPromptForSticker(day);
    } else {
      playSfx('tap');
    }
  };

  const writtenCount = Object.keys(diaries).length;

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5 pb-32">
      {/* Game Stage Map: 1~10 Stages (Non-colliding responsive header & sequential padlock progression) */}
      <div className="bg-white p-3.5 rounded-3xl border border-[#e4dccf] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#f0ebd9]">
          <div className="flex items-center gap-1.5 font-jua text-xs text-[#1b1917] shrink-0">
            <span className="text-sm">🗺️</span>
            <span>한글 모험 지도 (1~10단계)</span>
          </div>
          <span className="text-[11px] font-bold text-[#c9502f] font-jua bg-[#fff4f0] border border-[#fcd8cd] px-2.5 py-0.5 rounded-full shrink-0">
            현재 {currentStage}단계 · {stageInfo.badge} {stageInfo.tag}
          </span>
        </div>

        {/* 10-Stage Grid Map: 5 columns x 2 rows with padlocks */}
        <div className="grid grid-cols-5 gap-1.5 font-jua">
          {STAGES.map((stg) => {
            const isActive = currentStage === stg.id;
            const isUnlocked = unlockedStages.includes(stg.id);
            const isAdvanced = stg.id >= 6;

            return (
              <button
                key={stg.id}
                onClick={() => {
                  if (isUnlocked) {
                    playSfx('tap');
                    onChangeStage(stg.id);
                  } else {
                    playSfx('tap');
                    setLockedStagePrompt(stg);
                  }
                }}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all border text-center relative ${
                  isActive
                    ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-md scale-105 z-10'
                    : !isUnlocked
                    ? 'bg-[#f6f2ec]/80 text-[#9e9488] border-[#e2dad0] opacity-85 hover:opacity-100 hover:border-[#c9502f]/40 cursor-pointer'
                    : isAdvanced
                    ? 'bg-[#fcf8ff] text-[#5e4b77] border-[#e6daf5] hover:border-[#c9502f]/40 cursor-pointer'
                    : 'bg-[#faf8f5] text-[#4a443e] border-[#e4dccf] hover:border-[#c9502f]/40 cursor-pointer'
                }`}
                title={!isUnlocked ? `${stg.id}단계 잠김 (터치하여 잠금 해제)` : `${stg.id}단계: ${stg.name}`}
              >
                {isActive && (
                  <span className="absolute -top-1.5 -right-1 text-[10px]">👑</span>
                )}
                {!isUnlocked && (
                  <span className="absolute -top-1.5 -right-1 text-[9px] bg-white border border-[#dcd4c8] rounded-full px-1 shadow-2xs">
                    🔒
                  </span>
                )}
                <span className={`text-base leading-none mb-0.5 ${!isUnlocked ? 'filter grayscale contrast-75 opacity-70' : ''}`}>
                  {stg.badge}
                </span>
                <span className="text-[11px] font-bold leading-tight flex items-center justify-center gap-0.5">
                  {!isUnlocked && <span className="text-[9px]">🔒</span>}
                  {stg.id}단계
                </span>
                <span className={`text-[9px] truncate max-w-full scale-90 ${
                  isActive ? 'text-white/90' : !isUnlocked ? 'text-[#a89f94]' : 'text-[#8a8178]'
                }`}>
                  {stg.tag.slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[10px] font-hand text-[#8a8178] px-1 pt-0.5">
          <span>🌱 1~5단계: 기본 쑥쑥</span>
          <span className="text-[9px] text-[#a69d93]">🔒 순차 잠금 해제 모험</span>
          <span>🚀 6~10단계: 응용 마스터</span>
        </div>
      </div>

      {/* Current Stage Overview Banner */}
      <div className="bg-gradient-to-r from-[#fdf3e4] to-[#fbebe3] p-4 rounded-3xl border border-[#eedfc9] space-y-1 shadow-2xs">
        <div className="flex items-center justify-between">
          <h2 className="font-jua text-base sm:text-lg text-[#1b1917]">
            {stageInfo.name}
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#c9502f] border border-[#f3dfc6]">
            {stageInfo.tag}
          </span>
        </div>
        <p className="text-xs text-[#4a443e] font-hand">
          {stageInfo.desc}
        </p>
        <p className="text-[11px] font-bold text-[#c9502f] pt-0.5">
          🎯 이번 30일 목표: {stageInfo.target}
        </p>
      </div>

      {/* Sound Blending Play Module Banner */}
      {onOpenSoundBlend && (
        <button
          onClick={() => {
            playSfx('pop');
            onOpenSoundBlend();
          }}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#ffebe6] via-[#fff3e0] to-[#fef9eb] border border-[#f5b8a6] flex items-center justify-between text-left shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#f5b8a6] flex items-center justify-center text-xl shadow-2xs group-hover:scale-110 transition-transform flex-none">
              🧩
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-jua text-xs sm:text-sm text-[#c9502f]">
                <span>자음+모음 소리 합체 연구소</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#c9502f] text-white">
                  뽀뽀 놀이
                </span>
              </div>
              <p className="text-[11px] text-[#4a443e] font-hand">
                ㄱ과 ㅏ가 만나면 어떤 소리가 날까? 직접 결합하고 소리 들어보기!
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#c9502f] group-hover:translate-x-0.5 transition-transform flex-none" />
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
                D+{showPromptForSticker} 완료! 다마고치 경험치 +20!
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

      {/* Daily Diary Showcase & A4 Print Banner (User requested!) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#f0ebe1] pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[#c9502f]" />
            <div>
              <h3 className="font-jua text-base text-[#1b1917]">
                엄마의 30일 날짜별 한글 성장 일기장
              </h3>
              <p className="text-[11px] text-[#8a8178] font-hand">
                날짜별로 저장하고, 한 달 뒤 책자처럼 A4 인쇄할 수 있어요!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-none">
            {onOpenCalendar && (
              <button
                onClick={() => {
                  playSfx('tap');
                  onOpenCalendar();
                }}
                className="flex items-center gap-1 text-xs font-jua text-[#1b1917] bg-[#fbf8f2] hover:bg-[#efe7d8] px-2.5 py-1.5 rounded-xl border border-[#e4dccf] transition-all active:scale-95"
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
              className="flex items-center gap-1 text-xs font-jua text-[#c9502f] bg-[#fdf3e4] hover:bg-[#fce9d0] px-2.5 py-1.5 rounded-xl border border-[#eedfc9] transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" /> 인쇄
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
            <div key={wi} className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
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
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                        isDone
                          ? 'bg-[#fbf4ee] border-[#e9bcaf]'
                          : m.goal
                          ? 'bg-[#fff5f5] border-[#f8b4b4]'
                          : m.rest
                          ? 'bg-[#fcf9f2] border-[#ecdcc3]'
                          : 'bg-white border-[#ece3d4]'
                      }`}
                    >
                      {/* Left: Checkmark & Mission info */}
                      <div
                        onClick={() => handleDayClick(dayNum)}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <span
                          className={`font-jua text-xs sm:text-sm px-2 py-1 rounded-lg ${
                            isDone
                              ? 'bg-[#c9502f] text-white'
                              : m.goal
                              ? 'bg-[#ffdcd2] text-[#c9502f]'
                              : 'bg-[#f6f1e7] text-[#8a8178]'
                          }`}
                        >
                          D+{dayNum}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-sm sm:text-base ${
                                isDone
                                  ? 'text-[#c9502f] line-through opacity-85'
                                  : 'text-[#1b1917]'
                              }`}
                            >
                              {m.t}
                            </span>
                            {m.rest && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#fef3d6] text-[#b8860b]">
                                쉬는 날 ☕
                              </span>
                            )}
                            {m.goal && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#ffdcd2] text-[#c9502f] animate-pulse">
                                대망의 목표! 💖
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8a8178] font-hand mt-0.5">
                            {m.s}
                          </p>
                        </div>
                      </div>

                      {/* Right: Diary & Voice trigger & Checkbox */}
                      <div className="flex items-center gap-1.5 flex-none">
                        {/* Diary & Voice recording trigger button */}
                        <button
                          onClick={() => {
                            playSfx('tap');
                            setSelectedDiaryDay(dayNum);
                          }}
                          className={`px-2 py-1.5 rounded-xl border flex items-center gap-1 text-xs font-jua transition-all ${
                            hasDiary
                              ? 'bg-[#fdf3e4] border-[#eedfc9] text-[#c9502f] shadow-2xs'
                              : 'bg-[#faf8f5] border-[#e4dccf] text-[#8a8178] hover:text-[#1b1917]'
                          }`}
                          title="엄마의 일기 쓰기 & 아이 목소리 녹음하기"
                        >
                          <span>{hasDiary ? diaries[dayNum].mood : '✏️'}</span>
                          {hasDiary && diaries[dayNum].audioUrl ? (
                            <span className="text-[11px] text-[#ea580c] font-bold flex items-center gap-0.5">
                              🎙️ 목소리
                            </span>
                          ) : (
                            <span className="text-[11px]">일기</span>
                          )}
                        </button>

                        {/* Check Circle */}
                        <div
                          onClick={() => handleDayClick(dayNum)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            isDone
                              ? 'bg-[#c9502f] text-white shadow-xs scale-105'
                              : 'border-2 border-[#d6cfc4] bg-[#fdfcf9]'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action: Reset this stage */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => {
            playSfx('tap');
            setShowResetConfirmModal(true);
          }}
          className="flex items-center gap-1.5 text-xs text-[#8a8178] hover:text-[#c9502f] transition-colors py-2 px-3 rounded-xl bg-white border border-[#e4dccf]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {currentStage}단계 체크 초기화
        </button>

        <button
          onClick={() => {
            playSfx('tap');
            onGoToStickers();
          }}
          className="font-jua text-sm text-[#c9502f] hover:underline flex items-center gap-1"
        >
          스티커 보드로 이동하기 🌟
        </button>
      </div>

      {/* In-App Confirmation Modal: 삭제하시겠습니까? */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-pop">
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
            onRewardExp(15);
          }}
          onDeleteDiary={onDeleteDiary}
          onOpenPrintBook={onOpenPrintBook}
          childName={childName}
        />
      )}

      {/* Locked Stage Modal: 🔒 단계 잠금 안내 & 학부모 권한 잠금 해제 */}
      {lockedStagePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl p-6 text-center space-y-3.5 animate-pop">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl border border-amber-200 shadow-inner">
              🔒
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-block">
                {lockedStagePrompt.id}단계: {lockedStagePrompt.badge} {lockedStagePrompt.name}
              </span>
              <h3 className="font-jua text-lg text-[#1b1917] pt-0.5">
                아직 잠겨있는 모험 단계예요!
              </h3>
              <p className="text-xs text-[#8a8178] font-hand leading-relaxed">
                앞선 단계를 차근차근 5일 이상 완료하면 다음 모험 단계가 자동으로 열려요! 🗝️
              </p>
              <div className="bg-white/85 p-2.5 rounded-2xl border border-[#ede5d8] text-[11px] text-[#71695f] font-hand text-left space-y-1">
                <div className="font-bold text-[#c9502f] flex items-center gap-1">
                  <span>💡</span>
                  <span>학부모 안심 권한 안내</span>
                </div>
                <p className="leading-snug">
                  아이의 연령(6~7세)이나 이미 아는 단계라면, 언제든 부모님 권한으로 즉시 열어서 시작하실 수 있어요!
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  playSfx('levelup');
                  confetti({ particleCount: 40, spread: 70 });
                  if (onUnlockStage) {
                    onUnlockStage(lockedStagePrompt.id);
                  }
                  onChangeStage(lockedStagePrompt.id);
                  setLockedStagePrompt(null);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#c9502f] to-[#e05b38] hover:from-[#b84324] hover:to-[#c9502f] text-white font-jua text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>🔓</span>
                <span>학부모 권한으로 잠금 풀고 시작</span>
              </button>
              <button
                onClick={() => {
                  playSfx('tap');
                  setLockedStagePrompt(null);
                }}
                className="w-full py-2 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-xs hover:bg-[#faf8f5]"
              >
                🌱 현재 {currentStage}단계 계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
