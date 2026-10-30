import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Award,
  Gift,
  Settings,
  Heart,
  RotateCcw,
  Star,
  CheckCircle2,
  Share2,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { FRIENDS, RARE_STICKERS, THEMES, WISHES } from '../../data/hangulData';
import { AnimalFriend, BoardTheme, PlacedSticker, StickerBoardState } from '../../types';
import { playSfx } from '../../utils/sound';

interface StickerBoardTabProps {
  boardState: StickerBoardState;
  onUpdateBoardState: (updater: (prev: StickerBoardState) => StickerBoardState) => void;
  onOpenSettings: () => void;
  onRewardExp: (amount: number) => void;
  completedDaysCount: number;
  onResetChecklistDays?: () => void;
}

export const StickerBoardTab: React.FC<StickerBoardTabProps> = ({
  boardState,
  onUpdateBoardState,
  onOpenSettings,
  onRewardExp,
  completedDaysCount,
  onResetChecklistDays,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pulledSticker, setPulledSticker] = useState<PlacedSticker | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // In-app restart confirmation modal (no window.confirm, zero iframe blockage!)
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [includeChecklistReset, setIncludeChecklistReset] = useState(true);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);

  const currentTheme: BoardTheme =
    THEMES.find((t) => t.id === boardState.theme) || THEMES[0];
  const currentFriend: AnimalFriend =
    FRIENDS.find((f) => f.id === boardState.friend) || FRIENDS[0];

  const stickers = boardState.stickers || [];
  const count = stickers.length;
  const isCompleted = count >= 30;

  // Change Theme Quick Switcher
  const handleSelectTheme = (themeId: any) => {
    playSfx('tap');
    onUpdateBoardState((prev) => {
      const next = { ...prev, theme: themeId };
      try {
        localStorage.setItem('hangul_sticker_board', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Modify or replace single sticker in slot
  const handleReplaceSlotSticker = (slotIdx: number, newEmoji: string) => {
    playSfx('stick');
    onUpdateBoardState((prev) => {
      const next = [...prev.stickers];
      if (next[slotIdx]) {
        next[slotIdx] = {
          ...next[slotIdx],
          e: newEmoji,
        };
      }
      const updated = { ...prev, stickers: next };
      try {
        localStorage.setItem('hangul_sticker_board', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedSlotIndex(null);
  };

  // Delete single sticker from slot
  const handleDeleteSlotSticker = (slotIdx: number) => {
    playSfx('erase');
    onUpdateBoardState((prev) => {
      const next = prev.stickers.filter((_, idx) => idx !== slotIdx);
      const updated = {
        ...prev,
        stickers: next,
        stamped: next.length >= 30,
        doneDate: next.length >= 30 ? prev.doneDate : null,
      };
      try {
        localStorage.setItem('hangul_sticker_board', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedSlotIndex(null);
  };

  // Draw today's sticker
  const handlePullSticker = () => {
    if (count >= 30) {
      setShowCertificate(true);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const alreadyPulledToday = stickers.some((s) => s.d === todayStr);

    setIsPulling(true);
    playSfx('pop');

    // Simulate cute rolling animation
    setTimeout(() => {
      const isRare = Math.random() < 0.22;
      const emojiPool = isRare ? RARE_STICKERS : currentTheme.pack;
      const emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
      const rotation = Math.floor(Math.random() * 24) - 12; // -12 to +12 deg
      const bgColors = ['#fff1c7', '#fde0dc', '#efe6fb', '#dfe9f6', '#e2f2dc', '#fbe7ee'];
      const bg = bgColors[Math.floor(Math.random() * bgColors.length)];

      const newSticker: PlacedSticker = {
        d: todayStr,
        e: emoji,
        rare: isRare,
        r: rotation,
        bg,
      };

      setPulledSticker(newSticker);
      setIsPulling(false);

      // Reward Pet EXP!
      onRewardExp(25);

      if (isRare) {
        playSfx('rare');
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
      } else {
        playSfx('stick');
        confetti({ particleCount: 20, spread: 50, origin: { y: 0.7 } });
      }

      onUpdateBoardState((prev) => {
        const nextStickers = [...prev.stickers, newSticker];
        const updated = {
          ...prev,
          stickers: nextStickers,
          stamped: nextStickers.length >= 30,
          doneDate:
            nextStickers.length >= 30
              ? new Date().toLocaleDateString('ko-KR')
              : prev.doneDate,
        };
        try {
          localStorage.setItem('hangul_sticker_board', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }, 500);
  };

  // Undo last sticker (smooth & reliable)
  const handleUndoSticker = () => {
    if (stickers.length === 0) return;
    playSfx('erase');
    onUpdateBoardState((prev) => {
      const next = [...prev.stickers];
      next.pop();
      const updated = {
        ...prev,
        stickers: next,
        stamped: next.length >= 30,
        doneDate: next.length >= 30 ? prev.doneDate : null,
      };
      try {
        localStorage.setItem('hangul_sticker_board', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleOnePerDay = () => {
    playSfx('tap');
    onUpdateBoardState((prev) => {
      const updated = {
        ...prev,
        oneStickerPerDay: !prev.oneStickerPerDay,
      };
      try {
        localStorage.setItem('hangul_sticker_board', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Guaranteed, foolproof restart logic without window.confirm or alert
  const handleExecuteRestart = () => {
    playSfx('fan');
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });

    // 1. Reset board stickers
    onUpdateBoardState((prev) => {
      const resetState: StickerBoardState = {
        ...prev,
        stickers: [],
        stamped: false,
        doneDate: null,
      };
      try {
        localStorage.setItem('hangul_sticker_board', JSON.stringify(resetState));
      } catch {}
      return resetState;
    });

    // 2. Optionally reset checklist days as well
    if (includeChecklistReset && onResetChecklistDays) {
      onResetChecklistDays();
    }

    setShowRestartModal(false);
    setResetSuccessNotice(true);
    setTimeout(() => {
      setResetSuccessNotice(false);
    }, 3500);
  };

  const isDarkTheme = currentTheme.id === 'space';

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5 pb-32">
      {/* Reset Success Toast */}
      {resetSuccessNotice && (
        <div className="p-3 rounded-2xl bg-[#f0f9ed] border-2 border-[#a3e635] text-[#1e6a34] font-jua text-xs sm:text-sm flex items-center justify-between shadow-md animate-pop">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#237d3d] flex-none" />
            <span>🎉 30일 모험판이 깨끗하게 리셋되었습니다! 1일차부터 새롭게 출발해요!</span>
          </div>
          <button
            onClick={() => setResetSuccessNotice(false)}
            className="text-xs text-[#237d3d] hover:font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e4dccf] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#fdf3e4] border border-[#f3dfc6] flex items-center justify-center text-3xl shadow-2xs flex-none">
              {currentFriend.e}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-jua text-base sm:text-lg text-[#1b1917]">
                  {boardState.name || '우리 아이'}의 30일 칭찬판
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fbe7e1] text-[#c9502f]">
                  {count}/30 모음
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f3f0e6] text-[#4a443e]">
                  {boardState.childAge || '5~7세'}
                </span>
              </div>
              <p className="text-xs text-[#8a8178] font-hand mt-0.5">
                약속 소원: <span className="font-bold text-[#c9502f]">"{boardState.wish || '엄마와의 특별 소원'}"</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playSfx('tap');
              onOpenSettings();
            }}
            className="flex-none px-3 py-2 rounded-xl bg-[#fdf3e4] hover:bg-[#fbe7d0] border border-[#eedfc9] flex items-center gap-1.5 text-xs font-jua text-[#c9502f] transition-all shadow-2xs active:scale-95"
            title="아이 이름, 소원, 캐릭터, 테마 설정"
          >
            <Settings className="w-4 h-4" />
            <span>설정 변경</span>
          </button>
        </div>

        {/* Clear Settings Summary Bar */}
        <div className="pt-2 border-t border-[#f0ebe1] flex items-center justify-between text-[11px] font-hand text-[#8a8178] flex-wrap gap-1">
          <span>🐾 탐험 친구: <b>{currentFriend.name} ({currentFriend.e})</b></span>
          <span>💬 엄마의 응원: <b>"{boardState.msg || '끝까지 화이팅!'}"</b></span>
        </div>
      </div>

      {/* Real-time Theme Bar (숲속, 우주, 캔디랜드, 바다 등 6종) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-jua text-[#8a8178]">
          <span>🎨 보드판 테마 바꾸기:</span>
          <span className="text-[#c9502f]">{currentTheme.name}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => handleSelectTheme(th.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-jua flex-none transition-all flex items-center gap-1.5 border ${
                boardState.theme === th.id
                  ? 'bg-white text-[#c9502f] border-[#c9502f] shadow-xs scale-105'
                  : 'bg-[#faf8f5] text-[#4a443e] border-[#e4dccf] hover:border-[#c9502f]/40'
              }`}
            >
              <span>{th.deco[0]}</span>
              <span>{th.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Sticker Board Canvas Card */}
      <div
        className="rounded-3xl p-5 border-2 border-[#e4dccf] shadow-md relative overflow-hidden transition-all duration-300"
        style={{ background: currentTheme.bg }}
      >
        {/* Floating Theme Background Decorations */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-20 flex justify-between p-3 text-3xl">
          {currentTheme.deco.map((d, i) => (
            <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
              {d}
            </span>
          ))}
        </div>

        {/* Board Header inside (Adapts to light vs dark theme with crisp contrast) */}
        <div className={`relative z-10 text-center pb-3 border-b space-y-1 ${isDarkTheme ? 'border-white/20' : 'border-black/10'}`}>
          <div className={`inline-block px-3 py-1 rounded-full backdrop-blur-xs text-xs font-jua shadow-2xs ${
            isDarkTheme ? 'bg-white/20 text-white border border-white/30' : 'bg-white/80 text-[#1b1917]'
          }`}>
            {currentTheme.name} 🗺️
          </div>
          <h3 className={`font-jua text-2xl drop-shadow-xs ${isDarkTheme ? 'text-white' : 'text-[#1b1917]'}`}>
            {boardState.name || '아이'}의 30일 모험 보드
          </h3>
          <p className={`text-xs font-hand ${isDarkTheme ? 'text-white/90' : 'text-[#4a443e]'}`}>
            매일 한글 미션 하고 칭찬 스티커를 1칸씩 모아요! (칸을 누르면 스티커를 바꿀 수 있어요)
          </p>
        </div>

        {/* 30 Circular Sticker Slots (5 rows x 6 columns) */}
        <div className="relative z-10 grid grid-cols-6 gap-2 sm:gap-2.5 pt-4">
          {Array.from({ length: 30 }, (_, idx) => {
            const sticker = stickers[idx];
            const isNext = idx === count && !isCompleted;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (sticker) {
                    playSfx('tap');
                    setSelectedSlotIndex(idx);
                  } else if (isNext) {
                    handlePullSticker();
                  }
                }}
                className={`aspect-square rounded-2xl flex items-center justify-center transition-all relative ${
                  sticker
                    ? 'shadow-xs hover:scale-110 cursor-pointer active:scale-95'
                    : isNext
                    ? 'border-2 border-dashed border-[#f2c14e] bg-white/85 animate-pulse hover:scale-105 shadow-xs'
                    : isDarkTheme
                    ? 'border-2 border-dashed border-white/40 bg-white/15 hover:border-white/70'
                    : 'border-2 border-dashed border-black/15 bg-white/40 opacity-70'
                }`}
                style={{
                  backgroundColor: sticker?.bg || undefined,
                  transform: sticker ? `rotate(${sticker.r}deg)` : undefined,
                }}
                title={sticker ? `${idx + 1}일차: ${sticker.e} (클릭하여 변경/삭제)` : `${idx + 1}번째 칸`}
              >
                {sticker ? (
                  <span
                    className={`text-2xl sm:text-3xl select-none ${
                      sticker.rare ? 'filter drop-shadow-[0_0_6px_rgba(242,193,78,0.8)]' : ''
                    }`}
                  >
                    {sticker.e}
                  </span>
                ) : (
                  <span
                    className={`text-xs font-jua ${
                      isNext
                        ? 'text-[#c9502f] font-bold'
                        : isDarkTheme
                        ? 'text-white font-bold drop-shadow-xs'
                        : 'text-black/50 font-bold'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}

                {/* Rare Sticker Shine badge */}
                {sticker?.rare && (
                  <span className="absolute -top-1 -right-1 text-[10px]">✨</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Board Bottom Message */}
        <div className={`relative z-10 mt-5 pt-3 border-t flex items-center justify-between text-xs font-hand ${
          isDarkTheme ? 'border-white/20 text-white/95' : 'border-black/10 text-[#4a443e]'
        }`}>
          <span>🌟 레어 스티커 확률 UP!</span>
          <span className="font-bold">
            {count >= 30 ? '🎉 30칸 완주 달성!' : `${30 - count}칸 남았어요`}
          </span>
        </div>
      </div>

      {/* Pull Sticker Action Bar with ample bottom clearance */}
      <div className="space-y-3 pt-1">
        {!isCompleted ? (
          <button
            onClick={handlePullSticker}
            disabled={isPulling}
            className="w-full py-4 px-4 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-lg sm:text-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {isPulling ? '두근두근 스티커 뽑는 중...' : `오늘의 칭찬 스티커 콕! 뽑기 (${count + 1}/30)`}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => {
                playSfx('fan');
                setShowCertificate(true);
              }}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#f2c14e] to-[#e69b00] text-[#1b1917] font-jua text-lg sm:text-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 animate-glow"
            >
              🏆 30일 완성! 엄마의 소원권 확인하기
            </button>
            <button
              onClick={() => {
                playSfx('tap');
                setShowRestartModal(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-white border-2 border-[#f2c14e] text-[#c9502f] font-jua text-sm shadow-xs hover:bg-[#fffdf7] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> 30일 모험 새로 시작하기 (새 판으로 도전)
            </button>
          </div>
        )}

        {/* Action Controls below main button */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#8a8178] px-1 gap-2 pt-1">
          <div className="flex items-center gap-2">
            {count > 0 && (
              <button
                onClick={handleUndoSticker}
                className="flex items-center gap-1 text-[#c9502f] hover:text-[#b84324] font-jua transition-colors py-1 px-2.5 rounded-lg bg-[#fff5f2] border border-[#fcd2c0] active:scale-95"
                title="방금 붙인 스티커 1개를 취소합니다"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 마지막 1개 취소
              </button>
            )}

            <button
              onClick={() => {
                playSfx('tap');
                setShowRestartModal(true);
              }}
              className="flex items-center gap-1 hover:text-[#c9502f] text-[#4a443e] font-jua transition-colors py-1 px-2.5 rounded-lg bg-white border border-[#e4dccf] hover:border-[#c9502f]/40 active:scale-95"
              title="새로운 30일 모험판으로 처음부터 다시 시작합니다"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#c9502f]" /> 30일 모험 새로 시작하기
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleOnePerDay}
              className={`text-[11px] font-jua px-2.5 py-1 rounded-full border transition-all ${
                boardState.oneStickerPerDay
                  ? 'bg-[#fdf3e4] text-[#c9502f] border-[#f3dfc6]'
                  : 'bg-white text-[#8a8178] border-[#e4dccf]'
              }`}
              title="하루에 스티커 1개씩만 붙이도록 안내합니다"
            >
              {boardState.oneStickerPerDay ? '1일 1스티커: ON' : '자유 뽑기 모드'}
            </button>
          </div>
        </div>
      </div>

      {/* Guaranteed In-App Restart Modal (Zero dependency on native alert/confirm) */}
      {showRestartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl p-5 sm:p-6 max-w-sm w-full text-center space-y-3.5 shadow-2xl animate-pop relative">
            <button
              onClick={() => setShowRestartModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178]"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#fdf3e4] border border-[#f3dfc6] flex items-center justify-center text-3xl mx-auto shadow-2xs">
              🌟
            </div>

            <div className="space-y-1">
              <h3 className="font-jua text-lg sm:text-xl text-[#1b1917]">
                30일 모험을 새로 시작할까요?
              </h3>
              <p className="text-xs text-[#8a8178] font-hand leading-relaxed">
                현재 붙어있는 스티커판을 깨끗이 비우고 1일차부터 새로운 마음으로 도전합니다!
              </p>
            </div>

            {/* Optional checkbox to reset checklist as well */}
            {onResetChecklistDays && (
              <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-[#eedfc9] text-xs font-jua text-[#4a443e] cursor-pointer hover:bg-[#fff9f2] transition-colors">
                <input
                  type="checkbox"
                  checked={includeChecklistReset}
                  onChange={(e) => setIncludeChecklistReset(e.target.checked)}
                  className="rounded text-[#c9502f] focus:ring-[#c9502f]"
                />
                <span>30일 체크리스트 진도도 함께 1일차로 리셋</span>
              </label>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowRestartModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm hover:bg-[#faf8f5]"
              >
                취소
              </button>
              <button
                onClick={handleExecuteRestart}
                className="py-2.5 px-4 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md active:scale-95 transition-all"
              >
                네, 새 판 시작!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Click Inspector Modal (Replace or Delete specific slot sticker) */}
      {selectedSlotIndex !== null && stickers[selectedSlotIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl p-5 max-w-sm w-full text-center space-y-3.5 shadow-2xl animate-pop relative">
            <button
              onClick={() => setSelectedSlotIndex(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178]"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] font-jua">
                {selectedSlotIndex + 1}번째 스티커 칸
              </span>
              <h3 className="font-jua text-lg text-[#1b1917]">
                스티커 수정 또는 교체
              </h3>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#eedfc9] flex items-center justify-center text-4xl mx-auto shadow-inner">
              {stickers[selectedSlotIndex]?.e}
            </div>

            {/* Fast Emoji Replacement Palette */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-jua text-[#8a8178] block">
                다른 스티커로 바꾸기:
              </span>
              <div className="grid grid-cols-8 gap-1 p-2 bg-white rounded-2xl border border-[#eedfc9]">
                {[...currentTheme.pack, ...RARE_STICKERS].slice(0, 16).map((emo, i) => (
                  <button
                    key={i}
                    onClick={() => handleReplaceSlotSticker(selectedSlotIndex, emo)}
                    className="w-8 h-8 rounded-xl bg-[#faf8f5] hover:bg-[#fdf3e4] hover:scale-110 text-xl flex items-center justify-center transition-all border border-[#eee6db]"
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleDeleteSlotSticker(selectedSlotIndex)}
                className="py-2.5 px-3 rounded-2xl bg-white border border-[#f5b8a6] text-[#c9502f] font-jua text-xs hover:bg-[#fff5f2] transition-colors"
              >
                이 스티커 삭제 (비우기)
              </button>
              <button
                onClick={() => setSelectedSlotIndex(null)}
                className="py-2.5 px-3 rounded-2xl bg-[#1b1917] text-white font-jua text-xs hover:bg-black transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Wish Coupon & Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf8f2] border-4 border-[#f2c14e] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-pop relative">
            <div className="w-16 h-16 rounded-full bg-[#fdf3e4] border-2 border-[#f2c14e] text-3xl flex items-center justify-center mx-auto shadow-md">
              👑
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#c9502f] uppercase tracking-wider font-jua">
                공식 30일 완주 인증서
              </span>
              <h2 className="text-2xl font-jua text-[#1b1917]">
                🎉 {boardState.name || '우리 아이'}의 소원권
              </h2>
              <p className="text-xs text-[#8a8178] font-hand">
                30일 동안 엄마랑 함께한 멋진 약속 증서
              </p>
            </div>

            {/* Official Coupon Ticket */}
            <div className="bg-white rounded-2xl p-5 border-2 border-dashed border-[#e4dccf] space-y-3 relative shadow-inner">
              <div className="text-xs font-hand text-[#8a8178]">
                이 소원권을 제시하면 엄마가 약속한 소원을 들어줍니다!
              </div>

              <div className="py-3 px-4 bg-[#fdf3e4] rounded-xl border border-[#eedfc9] font-jua text-xl text-[#c9502f]">
                "{boardState.wish || '엄마와의 특별한 소원'}"
              </div>

              <p className="text-xs text-[#4a443e] font-hand italic">
                "{boardState.msg || '30일 동안 정말 멋졌어! 엄마가 꼭 들어줄게!'}"
              </p>

              <div className="pt-2 flex items-center justify-between text-xs text-[#8a8178] border-t border-[#f0ebe1]">
                <span>발행인: 사랑하는 엄마</span>
                <span className="font-bold text-[#1b1917] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#437a22]" /> 확인 완료
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  playSfx('fan');
                  window.print();
                }}
                className="w-full py-3 rounded-2xl bg-[#c9502f] text-white font-jua text-base shadow-md hover:bg-[#b84324] active:scale-95"
              >
                소원권 인쇄하여 아이 손에 쥐여주기 🖨️
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="w-full py-2.5 rounded-2xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
