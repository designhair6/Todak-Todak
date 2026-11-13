import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Heart,
  Sparkles,
  BookOpen,
  Mic,
  Play,
  Pause,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import { DailyMomDiary, Mission, StageId } from '../types';
import { STAGE_MISSIONS } from '../data/hangulData';
import { playSfx } from '../utils/sound';

interface FootprintCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  currentStage: StageId;
  completedDays: number[];
  completedDates: Record<string, string>; // key: 's1_d1', val: 'YYYY-MM-DD'
  diaries: Record<number, DailyMomDiary>;
  onOpenDiary: (day: number) => void;
}

export const FootprintCalendarModal: React.FC<FootprintCalendarModalProps> = ({
  isOpen,
  onClose,
  childName,
  currentStage,
  completedDays,
  completedDates,
  diaries,
  onOpenDiary,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    playSfx('tap');
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    playSfx('tap');
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    playSfx('tap');
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Find missions completed on a specific YYYY-MM-DD
  const getActivitiesForDate = (dateStr: string) => {
    const matchedDays: { stage: number; day: number; mission: Mission; diary?: DailyMomDiary }[] = [];

    // Check through all stages in completedDates
    Object.entries(completedDates).forEach(([key, dStr]) => {
      if (dStr === dateStr) {
        const match = key.match(/s(\d+)_d(\d+)/);
        if (match) {
          const stg = Number(match[1]);
          const dayNum = Number(match[2]);
          const stageMissions = STAGE_MISSIONS[stg as StageId] || STAGE_MISSIONS[1];
          const mission = stageMissions[dayNum - 1] || { t: `D+${dayNum} 놀이`, s: '한글 탐험' };
          matchedDays.push({
            stage: stg,
            day: dayNum,
            mission,
            diary: diaries[dayNum],
          });
        }
      }
    });

    // Also check diaries whose date matches dateStr
    Object.values(diaries).forEach((diary) => {
      if (diary.date === dateStr) {
        const already = matchedDays.find((m) => m.day === diary.day);
        if (!already) {
          const stageMissions = STAGE_MISSIONS[currentStage] || STAGE_MISSIONS[1];
          const mission = stageMissions[diary.day - 1] || { t: `D+${diary.day} 일기`, s: '성장 기록' };
          matchedDays.push({
            stage: currentStage,
            day: diary.day,
            mission,
            diary,
          });
        }
      }
    });

    return matchedDays;
  };

  const selectedActivities = getActivitiesForDate(selectedDateStr);

  const togglePlayAudio = (url: string) => {
    if (playingAudioUrl === url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingAudioUrl(url);
      audio.play().catch(() => {
        setPlayingAudioUrl(null);
      });
      audio.onended = () => {
        setPlayingAudioUrl(null);
      };
    }
  };

  // Total completed days in this month
  let monthCompletedCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (getActivitiesForDate(dStr).length > 0) {
      monthCompletedCount++;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fcfaf7] border-2 border-[#e4dccf] rounded-3xl w-full max-w-lg max-h-[92vh] box-border overflow-hidden shadow-2xl flex flex-col relative font-body">
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-white border-b border-[#eedfc9] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#fff2ec] border border-[#fcd2c0] flex items-center justify-center text-lg shrink-0">
              🐾
            </div>
            <div className="min-w-0">
              <h2 className="font-jua text-base sm:text-lg text-[#1b1917] truncate">
                {childName || '아이'}의 발자국 달력
              </h2>
              <p className="text-[11px] text-[#8a8178] font-hand break-keep">
                함께 웃은 날만 도장 쾅! 🐾
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              playSfx('tap');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-[#f6f1e7] hover:bg-[#ebd9c7] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-4 box-border">
          {/* Calendar Month Navigation */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#e4dccf] shadow-2xs">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-[#faf6ee] text-[#4a443e] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="font-jua text-base sm:text-lg text-[#1b1917]">
                {year}년 {month + 1}월
              </span>
              <button
                onClick={goToToday}
                className="ml-2 text-[10px] font-jua px-2 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] border border-[#f3dfc6] hover:bg-[#fce9d0]"
              >
                오늘
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-[#faf6ee] text-[#4a443e] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Monthly Warm Encouragement Banner */}
          <div className="bg-gradient-to-r from-[#fff7ed] to-[#fef3c7] p-3 rounded-2xl border border-[#fed7aa] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌟</span>
              <div>
                <span className="font-jua text-[#9a3412] block">
                  이번 달 함께한 날: <b className="text-base text-[#c9502f]">{monthCompletedCount}</b>일
                </span>
                <span className="text-[11px] text-[#78350f] font-hand">
                  {monthCompletedCount >= 15
                    ? '와! 대단해요! 반 이상 신나게 함께했어요 🥳'
                    : monthCompletedCount >= 5
                    ? '매일 10분, 작은 발자국이 모여 큰 실력이 돼요 🌱'
                    : '조급해하지 마세요. 오늘부터 하나씩 찍어볼까요? 💖'}
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#e4dccf] shadow-2xs space-y-2">
            {/* Days of Week */}
            <div className="grid grid-cols-7 text-center font-jua text-xs text-[#8a8178] pb-1 border-b border-[#f0ebe1]">
              <span className="text-red-500">일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span className="text-blue-500">토</span>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
              {/* Empty leading days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 sm:h-12" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDateStr === dateStr;
                const isToday =
                  new Date().toISOString().split('T')[0] === dateStr;
                const acts = getActivitiesForDate(dateStr);
                const hasCompleted = acts.length > 0;
                const hasVoice = acts.some((a) => a.diary?.audioUrl);

                return (
                  <button
                    key={dayNum}
                    onClick={() => {
                      playSfx('tap');
                      setSelectedDateStr(dateStr);
                    }}
                    className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-between py-1 px-0.5 transition-all relative border ${
                      isSelected
                        ? 'border-[#c9502f] bg-[#fdf3e4] shadow-xs ring-2 ring-[#c9502f]/25 z-10'
                        : hasCompleted
                        ? 'border-[#fbd8c9] bg-[#fff5f0] hover:bg-[#ffebe3]'
                        : 'border-transparent hover:bg-[#faf7f2]'
                    }`}
                  >
                    <span
                      className={`text-xs font-jua leading-none ${
                        isToday
                          ? 'text-[#c9502f] font-bold underline'
                          : 'text-[#4a443e]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Stamp or Empty gentle indicator */}
                    {hasCompleted ? (
                      <div className="flex items-center gap-0.5">
                        <span className="text-sm sm:text-base leading-none">
                          🐾
                        </span>
                        {hasVoice && (
                          <span className="text-[9px] leading-none" title="아이 목소리 있음">
                            🎙️
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-transparent leading-none">
                        ·
                      </span>
                    )}

                    {hasCompleted && (
                      <span className="text-[8px] font-bold text-[#c9502f] leading-none">
                        완료!
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details Panel */}
          <div className="bg-white p-4 rounded-2xl border border-[#e4dccf] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#f0ebe1] pb-2">
              <div className="flex items-center gap-1.5 font-jua text-sm text-[#1b1917]">
                <CalendarIcon className="w-4 h-4 text-[#c9502f]" />
                <span>{selectedDateStr} 탐험 기록</span>
              </div>
              <span className="text-xs font-hand text-[#8a8178]">
                {selectedActivities.length > 0
                  ? `총 ${selectedActivities.length}개 완료`
                  : '휴식의 날'}
              </span>
            </div>

            {selectedActivities.length > 0 ? (
              <div className="space-y-3">
                {selectedActivities.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#faf8f5] rounded-xl border border-[#eedfc9] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-[#c9502f] text-white font-jua text-xs">
                          {act.stage}단계 D+{act.day}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-[#1b1917]">
                          {act.mission.t}
                        </span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                    </div>

                    <p className="text-xs text-[#8a8178] font-hand">
                      {act.mission.s}
                    </p>

                    {/* Diary entry if exists */}
                    {act.diary && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e4dccf] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-jua text-[#c9502f] flex items-center gap-1">
                            <span>{act.diary.mood}</span>
                            <span>엄마의 한줄 일기</span>
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              onOpenDiary(act.day);
                            }}
                            className="text-[11px] text-[#8a8178] hover:text-[#c9502f] underline font-jua"
                          >
                            일기 수정
                          </button>
                        </div>
                        <p className="text-xs text-[#4a443e] font-hand whitespace-pre-wrap leading-relaxed">
                          "{act.diary.content}"
                        </p>

                        {/* Child Voice Recording Playback */}
                        {act.diary.audioUrl && (
                          <div className="pt-1 border-t border-[#f0ebe1] flex items-center justify-between">
                            <span className="text-[11px] font-jua text-[#ea580c] flex items-center gap-1">
                              <Mic className="w-3.5 h-3.5 text-[#ea580c]" />
                              <span>아이의 생생 목소리</span>
                            </span>
                            <button
                              onClick={() => togglePlayAudio(act.diary!.audioUrl!)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-jua transition-all ${
                                playingAudioUrl === act.diary.audioUrl
                                  ? 'bg-[#ea580c] text-white shadow-xs'
                                  : 'bg-[#ffedd5] text-[#9a3412] hover:bg-[#fed7aa]'
                              }`}
                            >
                              {playingAudioUrl === act.diary.audioUrl ? (
                                <>
                                  <Pause className="w-3 h-3" /> 멈추기
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 fill-[#9a3412]" /> 목소리 듣기 ▶
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-2 bg-[#faf8f5] rounded-xl border border-dashed border-[#e4dccf]">
                <Coffee className="w-6 h-6 text-[#b8860b] mx-auto opacity-70" />
                <p className="font-jua text-sm text-[#4a443e]">
                  이 날은 푹 쉬며 신나게 놀았던 날이에요 ☕
                </p>
                <p className="text-xs text-[#8a8178] font-hand max-w-xs mx-auto">
                  쉬어가는 날도 아이에게는 소중한 휴식이에요. 부담 없이 오늘부터 천천히 한 걸음씩 걸어가요!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-[#eedfc9] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8a8178] font-hand">
          <span className="break-keep">💡 달력을 눌러 추억을 확인해요</span>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              playSfx('tap');
              onClose();
            }}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#c9502f] text-white font-jua hover:bg-[#b84324] transition-colors active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
