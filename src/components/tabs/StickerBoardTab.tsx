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
  const [showAlreadyPulledModal, setShowAlreadyPulledModal] = useState(false);

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

  // Draw today's sticker (strictly 1 sticker per day by default)
  const handlePullSticker = (forceBonus: boolean = false) => {
    if (count >= 30) {
      setShowCertificate(true);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const alreadyPulledToday = stickers.some((s) => s.d === todayStr);

    if (alreadyPulledToday && !forceBonus) {
      playSfx('tap');
      setShowAlreadyPulledModal(true);
      return;
    }

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
      onRewardExp(10);

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

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-4 pb-8 space-y-5 box-border overflow-x-hidden">
      {/* Reset Success Toast */}
      {resetSuccessNotice && (
        <div className="p-3.5 rounded-2xl bg-[#f0f9ed] border-2 border-[#a3e635] text-[#1e6a34] font-jua text-xs sm:text-sm flex items-center justify-between shadow-md animate-pop">
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
      <div className="w-full max-w-full box-border overflow-hidden bg-gradient-to-br from-[#FFFFFF] to-[#FFF8F0] rounded-3xl p-4 sm:p-5 border-2 border-[#F4E3D3] shadow-[0_8px_24px_rgba(218,178,142,0.14)] space-y-3">
        {/* Row 1: Identity & Settings Button */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF4D9] to-[#FFE7B8] border border-[#F7D794] flex items-center justify-center text-3xl shadow-2xs flex-none">
              {currentFriend.e}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-jua text-base sm:text-lg text-[#2D2825] leading-snug break-keep truncate">
                {boardState.name || '우리 아이'}의 칭찬판
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-jua text-[#7A6F66] mt-0.5 tabular-nums">
                <span className="text-[#D95338] font-bold">{count}/30칸</span>
                <span aria-hidden="true" className="text-[#C8B9AA]">·</span>
                <span>{boardState.childAge || '5세'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playSfx('tap');
              onOpenSettings();
            }}
            className="min-h-[44px] flex-none px-3.5 py-2 rounded-2xl bg-[#FFF4E6] hover:bg-[#FFE9CF] border border-[#F7D7B5] flex items-center gap-1.5 text-xs font-jua text-[#D95338] transition-all shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer"
            title="아이 이름, 소원, 캐릭터, 테마 설정"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>설정 변경</span>
          </button>
        </div>

        {/* Row 2: Dedicated Full-Width Wish Box (Clean 1~2 line keep-all wrapping) */}
        <div className="w-full box-border rounded-2xl bg-[#FFF8F1] border border-[#F5E1CE] px-3.5 py-2.5 flex items-start gap-2">
          <span className="text-sm leading-relaxed shrink-0" aria-hidden="true">🎁</span>
          <p
            className="min-w-0 flex-1 text-[13px] sm:text-sm font-hand text-[#5C534B] leading-relaxed break-keep line-clamp-2"
            title={boardState.wish || '엄마와의 특별 소원'}
          >
            <span className="font-jua text-xs text-[#8A7B6E] mr-1.5">우리 아이 소원</span>
            <span className="font-bold text-[#D95338]">"{boardState.wish || '엄마와의 특별 소원'}"</span>
          </p>
        </div>

        {/* Row 3: Clear Settings Summary Footer */}
        <div className="pt-2 border-t border-[#F4E7DA] flex items-center justify-between gap-3 text-[11px] sm:text-xs font-hand text-[#7A6F66] leading-relaxed">
          <span className="shrink-0 whitespace-nowrap">
            🐾 친구 <b className="text-[#4F4740]">{currentFriend.name}</b>
          </span>
          <span className="min-w-0 text-right break-keep truncate">
            💬 <b className="text-[#D95338]">"{boardState.msg || '끝까지 화이팅!'}"</b>
          </span>
        </div>
      </div>

      {/* Symmetrical 3x2 Theme Switcher Grid (Zero edge clipping on mobile!) */}
      <div className="w-full max-w-full box-border bg-white/95 rounded-3xl p-3.5 border border-[#F2E5D8] shadow-[0_6px_20px_rgba(218,178,142,0.10)] space-y-2.5">
        <div className="flex items-center justify-between text-xs font-jua text-[#7A6F66] px-0.5">
          <span>🎨 보드판 테마 바꾸기</span>
          <span className="text-[#D95338] bg-[#FFF0EB] px-2 py-0.5 rounded-full text-[11px]">{currentTheme.name}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => handleSelectTheme(th.id)}
              className={`min-h-[42px] px-2 py-2 rounded-2xl text-[11px] sm:text-xs font-jua transition-all flex items-center justify-center gap-1 border-2 cursor-pointer active:scale-95 ${
                boardState.theme === th.id
                  ? 'bg-white text-[#D95338] border-[#E76F51] shadow-[0_4px_12px_rgba(231,111,81,0.16)] ring-2 ring-[#E76F51]/20'
                  : 'bg-[#FFFDF9] text-[#5C534B] border-[#EFE3D5] hover:border-[#F4A261]'
              }`}
            >
              <span className="shrink-0">{th.deco[0]}</span>
              <span className="truncate">{th.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Sticker Board Canvas Card */}
      <div
        className="w-full max-w-full box-border rounded-3xl p-4 sm:p-5 border-2 border-white ring-2 ring-[#F2E2D2] shadow-[0_12px_30px_rgba(218,178,142,0.18)] relative overflow-hidden transition-all duration-300"
        style={{ background: currentTheme.bg }}
      >
        {/* Floating Theme Background Decorations */}
        <div className="absolute inset-0 pointer-events-none select-none opacity-25 flex justify-between p-3 text-3xl">
          {currentTheme.deco.map((d, i) => (
            <span key={i} className="animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
              {d}
            </span>
          ))}
        </div>

        {/* Board Header inside (Bright pastel joyful contrast across all themes) */}
        <div className="relative z-10 text-center pb-3 border-b border-black/10 space-y-1">
          <div className="inline-block px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-jua text-[#2D2825] shadow-2xs border border-white">
            {currentTheme.name} 🗺️
          </div>
          <h3 className="font-jua text-xl sm:text-2xl text-[#2D2825] drop-shadow-2xs">
            {boardState.name || '아이'}의 30일 모험 보드
          </h3>
          <p className="text-xs font-hand text-[#5C534B] break-keep">
            매일 한글 미션 하고 칭찬 스티커를 1칸씩 모아요! (칸을 누르면 바꿀 수 있어요)
          </p>
        </div>

        {/* 30 Circular/Square Sticker Slots (Always clean 5x6 symmetrical grid) */}
        <div className="relative z-10 grid grid-cols-5 gap-2 sm:gap-2.5 pt-4">
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
                className={`aspect-square min-h-[48px] rounded-2xl flex items-center justify-center transition-all relative ${
                  sticker
                    ? 'shadow-[0_4px_10px_rgba(0,0,0,0.06)] border-2 border-white/90 hover:scale-105 cursor-pointer active:scale-95'
                    : isNext
                    ? 'border-2 border-dashed border-[#E76F51] bg-white/95 ring-2 ring-[#FFD166]/70 hover:scale-105 shadow-sm cursor-pointer'
                    : 'border-2 border-dashed border-black/15 bg-white/65 opacity-85'
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
                      sticker.rare ? 'filter drop-shadow-[0_0_6px_rgba(242,193,78,0.85)]' : ''
                    }`}
                  >
                    {sticker.e}
                  </span>
                ) : (
                  <span
                    className={`text-xs font-jua ${
                      isNext ? 'text-[#D95338] font-bold' : 'text-[#6D635B] font-bold'
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
        <div className="relative z-10 mt-5 pt-3 border-t border-black/10 flex items-center justify-between text-xs font-hand text-[#4F4740]">
          <span>🌟 레어 스티커 확률 UP!</span>
          <span className="font-bold text-[#2D2825]">
            {count >= 30 ? '🎉 30칸 완주 달성!' : `${30 - count}칸 남았어요`}
          </span>
        </div>
      </div>

      {/* Pull Sticker Action Bar with ample bottom clearance */}
      <div className="space-y-3 pt-1">
        {!isCompleted ? (
          (() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const alreadyPulledToday = stickers.some((s) => s.d === todayStr);

            if (alreadyPulledToday) {
              return (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('tap');
                      setShowAlreadyPulledModal(true);
                    }}
                    className="w-full min-h-[54px] py-4 px-4 rounded-2xl bg-[#f0f9ed] hover:bg-[#e4f5de] border-2 border-[#84cc16] text-[#1e6a34] font-jua text-base sm:text-lg shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#237d3d] shrink-0" />
                    <span>오늘의 스티커 완료! 🌟 ({count}/30)</span>
                  </button>
                  <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-[#7A6F66] font-hand text-center">
                    <span>💡 하루 1장씩 꾸준히 모아요!</span>
                    <button
                      type="button"
                      onClick={() => handlePullSticker(true)}
                      className="min-h-[44px] px-4 py-2 rounded-2xl bg-white border border-[#F3DFCE] text-[#D95338] font-jua hover:bg-[#FFF5F2] active:scale-95 transition-all cursor-pointer shadow-2xs"
                    >
                      엄마 보너스 스티커 1장 더 붙이기 ✨
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                onClick={() => handlePullSticker(false)}
                disabled={isPulling}
                className="w-full min-h-[56px] py-4 px-4 rounded-2xl bg-gradient-to-r from-[#E76F51] to-[#F4845F] hover:from-[#D95D40] hover:to-[#E76F51] text-white font-jua text-base sm:text-xl shadow-[0_8px_20px_rgba(231,111,81,0.28)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform shrink-0" />
                <span>{isPulling ? '두근두근 뽑는 중...' : `오늘의 칭찬 스티커 뽑기 (${count + 1}/30)`}</span>
              </button>
            );
          })()
        ) : (
          <button
            onClick={() => {
              playSfx('fan');
              setShowCertificate(true);
            }}
            className="w-full min-h-[56px] py-4 px-4 rounded-2xl bg-gradient-to-r from-[#FFD166] to-[#F7B801] text-[#2D2825] font-jua text-lg sm:text-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 animate-glow cursor-pointer"
          >
            🏆 30일 완성! 엄마의 소원권 확인하기
          </button>
        )}

        {/* Structured Bottom Control Panel (Mobile Thumb-Friendly >=46px Hitboxes) */}
        <div className="w-full box-border bg-white/95 rounded-3xl p-3 border border-[#F2E5D8] shadow-[0_6px_18px_rgba(218,178,142,0.10)] space-y-2.5">
          {/* Primary Mode Toggle Row */}
          <button
            type="button"
            onClick={toggleOnePerDay}
            className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-all active:scale-[0.99] cursor-pointer ${
              boardState.oneStickerPerDay
                ? 'bg-[#FFF6EC] border-[#F5D6B8] text-[#5C4938] hover:bg-[#FFF0E0]'
                : 'bg-[#FFFDF9] border-[#EFE3D5] text-[#5C534B] hover:border-[#F4A261]'
            }`}
            title="하루에 스티커 1개씩만 붙이도록 안내합니다"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-[#E76F51] shrink-0" />
              <span className="font-jua text-xs sm:text-sm truncate">
                {boardState.oneStickerPerDay ? '1일 1스티커 규칙 켜짐' : '자유 뽑기 모드 켜짐'}
              </span>
            </div>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-xl font-jua text-[11px] whitespace-nowrap transition-colors ${
                boardState.oneStickerPerDay
                  ? 'bg-[#E76F51] text-white shadow-2xs'
                  : 'bg-[#EFE7DE] text-[#5C534B]'
              }`}
            >
              {boardState.oneStickerPerDay ? '1일 1회 ON' : '자유 모드'}
            </span>
          </button>

          {/* Secondary Board Actions Grid */}
          <div className={`grid gap-2 ${count > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {count > 0 && (
              <button
                type="button"
                onClick={handleUndoSticker}
                className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[#FFF4F0] hover:bg-[#FFE9E1] border border-[#FAD1C2] text-[#D95338] font-jua text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                title="방금 붙인 스티커 1개를 취소합니다"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>마지막 1개 취소</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                setShowRestartModal(true);
              }}
              className="min-h-[46px] px-3 py-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-[#FFF5EC] border border-[#EFE3D5] hover:border-[#F4A261] text-[#5C534B] font-jua text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              title="새로운 30일 모험판으로 처음부터 다시 시작합니다"
            >
              <RotateCcw className="w-4 h-4 text-[#E76F51] shrink-0" />
              <span>모험 새로 시작하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Already Pulled Today Friendly Modal */}
      {showAlreadyPulledModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowAlreadyPulledModal(false)}
        >
          <div
            className="bg-[#fbf8f2] border-2 border-[#eedfc9] rounded-3xl p-5 sm:p-6 max-w-xs w-full box-border overflow-hidden text-center space-y-3.5 shadow-2xl animate-pop relative font-body"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playSfx('tap');
                setShowAlreadyPulledModal(false);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playSfx('tap');
                setShowAlreadyPulledModal(false);
              }}
              className="absolute top-3 right-3 z-30 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] shadow-2xs active:scale-95 transition-all cursor-pointer"
              aria-label="닫기"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mx-auto shadow-2xs">
              🌟
            </div>

            <div className="space-y-1">
              <h3 className="font-jua text-lg text-[#1b1917]">
                오늘의 스티커를 이미 붙였어요!
              </h3>
              <p className="text-xs text-[#78350f] font-hand leading-relaxed">
                하루에 하나씩 차근차근 모으는 게 진짜 멋진 한글 대장이에요! 칭찬 스티커는 내일 새로운 놀이를 하고 또 붙여볼까요? 💖
              </p>
            </div>

            <div className="space-y-2 pt-1 font-jua">
              <button
                onClick={() => setShowAlreadyPulledModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white text-xs shadow-md transition-all active:scale-95"
              >
                네! 내일 또 올게요! ✨
              </button>
              <button
                onClick={() => {
                  setShowAlreadyPulledModal(false);
                  handlePullSticker(true);
                }}
                className="w-full py-2 rounded-xl bg-white border border-[#eedfc9] text-[#8a8178] hover:text-[#c9502f] text-xs transition-colors"
              >
                엄마 특별 보너스 스티커 1개 더 허용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guaranteed In-App Restart Modal (Zero dependency on native alert/confirm) */}
      {showRestartModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowRestartModal(false)}
        >
          <div
            className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl p-5 sm:p-6 max-w-sm w-full box-border overflow-hidden text-center space-y-3.5 shadow-2xl animate-pop relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playSfx('tap');
                setShowRestartModal(false);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playSfx('tap');
                setShowRestartModal(false);
              }}
              className="absolute top-3 right-3 z-30 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] shadow-2xs active:scale-95 transition-all cursor-pointer"
              aria-label="닫기"
              title="닫기"
            >
              <X className="w-5 h-5" />
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedSlotIndex(null)}
        >
          <div
            className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl p-5 max-w-sm w-full box-border overflow-hidden max-h-[90vh] flex flex-col text-center space-y-3.5 shadow-2xl animate-pop relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playSfx('tap');
                setSelectedSlotIndex(null);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playSfx('tap');
                setSelectedSlotIndex(null);
              }}
              className="absolute top-3 right-3 z-30 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] shadow-2xs active:scale-95 transition-all cursor-pointer"
              aria-label="닫기"
              title="닫기"
            >
              <X className="w-5 h-5" />
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
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2.5 bg-white rounded-2xl border border-[#eedfc9]">
                {[...currentTheme.pack, ...RARE_STICKERS].slice(0, 12).map((emo, i) => (
                  <button
                    key={i}
                    onClick={() => handleReplaceSlotSticker(selectedSlotIndex, emo)}
                    className="min-h-[44px] rounded-xl bg-[#faf8f5] hover:bg-[#fdf3e4] active:scale-95 text-2xl flex items-center justify-center transition-all border border-[#eee6db]"
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleDeleteSlotSticker(selectedSlotIndex)}
                className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-white border border-[#F5B8A6] text-[#D95338] font-jua text-xs hover:bg-[#FFF5F2] transition-colors"
              >
                스티커 비우기
              </button>
              <button
                onClick={() => setSelectedSlotIndex(null)}
                className="min-h-[44px] py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#E76F51] to-[#F4845F] text-white font-jua text-xs hover:from-[#D95D40] hover:to-[#E76F51] transition-colors shadow-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Wish Coupon & Certificate Modal */}
      {showCertificate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => {
            playSfx('tap');
            setShowCertificate(false);
          }}
        >
          <div
            className="bg-[#fbf8f2] border-4 border-[#f2c14e] rounded-3xl w-full max-w-md box-border overflow-hidden max-h-[90vh] flex flex-col shadow-2xl p-5 sm:p-6 text-center animate-pop relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playSfx('tap');
                setShowCertificate(false);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playSfx('tap');
                setShowCertificate(false);
              }}
              className="absolute top-3 right-3 z-30 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white/95 hover:bg-white border border-[#f2d084] flex items-center justify-center text-[#7A6F66] hover:text-[#2D2825] shadow-xs active:scale-95 transition-all cursor-pointer"
              aria-label="인증서 모달 닫기"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-y-auto overflow-x-hidden flex-1 space-y-4 box-border">
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
                  const child = boardState.name || '우리 아이';
                  const wish = boardState.wish || '엄마와의 특별한 소원';
                  const msg = boardState.msg || '30일 동안 정말 멋졌어! 엄마가 꼭 들어줄게!';
                  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${child}_30일완주_특별소원권</title>
  <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Jua&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Noto Sans KR', sans-serif; padding: 20px; background: #fff; text-align: center; }
    .coupon { border: 4px dashed #c9502f; border-radius: 24px; padding: 30px; background: #fffaf5; max-width: 600px; margin: 30px auto; }
    h1 { font-family: 'Jua', sans-serif; font-size: 32px; color: #1b1917; margin: 8px 0; }
    .wish-box { background: #fdf3e4; border: 2px solid #eedfc9; border-radius: 16px; padding: 16px; font-family: 'Jua', sans-serif; font-size: 26px; color: #c9502f; margin: 16px 0; }
    .msg { font-family: 'Gaegu', cursive; font-size: 20px; color: #4a443e; margin: 14px 0; }
    .footer { display: flex; justify-content: space-between; border-top: 1px solid #eedfc9; padding-top: 12px; font-family: 'Gaegu', cursive; font-size: 16px; color: #8a8178; }
  </style>
</head>
<body>
  <div class="coupon">
    <div style="font-family:'Jua',sans-serif; color:#c9502f; font-size:14px;">✂️ [가위로 오려서 쓰는] 30일 완주 특별 소원권</div>
    <h1>🎉 ${child}의 소원권</h1>
    <div style="font-family:'Gaegu',cursive; font-size:16px; color:#8a8178;">30일 동안 엄마랑 함께한 멋진 약속 증서</div>
    <div class="wish-box">"${wish}"</div>
    <div class="msg">"${msg}"</div>
    <div class="footer">
      <span>발행일: ${new Date().toLocaleDateString('ko-KR')}</span>
      <span>발행인: 사랑하는 엄마 (확인 완료)</span>
    </div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>
</body>
</html>`;
                  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const win = window.open(url, '_blank');
                  if (!win) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${child}_30일완주_특별소원권.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                  try { window.print(); } catch(e) {}
                }}
                className="w-full py-3 rounded-2xl bg-[#c9502f] text-white font-jua text-base shadow-md hover:bg-[#b84324] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>소원권 인쇄 &amp; 새 창 열기 🖨️</span>
              </button>
              <button
                onClick={() => {
                  playSfx('fan');
                  const child = boardState.name || '우리 아이';
                  const wish = boardState.wish || '엄마와의 특별한 소원';
                  const msg = boardState.msg || '30일 동안 정말 멋졌어! 엄마가 꼭 들어줄게!';
                  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${child}_소원권</title><link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Jua&display=swap" rel="stylesheet"><style>@page{size:A4 portrait;margin:15mm;}body{font-family:'Jua',sans-serif;padding:30px;text-align:center;}.box{border:3px dashed #c9502f;padding:24px;border-radius:20px;background:#fffdf9;}</style></head><body><div class="box"><h1>🎉 ${child}의 소원권</h1><h2>"${wish}"</h2><p style="font-family:'Gaegu',cursive;font-size:20px;">"${msg}"</p><p>발행인: 사랑하는 엄마</p></div><script>window.onload=function(){setTimeout(function(){window.print();},400);};</script></body></html>`;
                  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${child}_소원권_A4.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="w-full py-2.5 rounded-2xl bg-[#fdf3e4] hover:bg-[#faebd4] text-[#c9502f] border border-[#f3dfc6] font-jua text-sm flex items-center justify-center gap-1.5"
              >
                <span>💾 소원권 A4 파일 다운로드</span>
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="w-full py-2 rounded-2xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm"
              >
                닫기
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
