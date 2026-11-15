import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Heart,
  Sparkles,
  Apple,
  Volume2,
  Mic,
  CheckCircle2,
  Share2,
  MessageCircle,
  Trophy,
} from 'lucide-react';
import { AnimalFriend, PetGrowthState } from '../types';
import { FRIENDS, PET_QUIZZES, getPetLevelData } from '../data/hangulData';
import { playSfx, speakKorean } from '../utils/sound';

interface PetGrowthModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: AnimalFriend;
  petState: PetGrowthState;
  onUpdatePet: (updater: (prev: PetGrowthState) => PetGrowthState) => void;
  childName: string;
  onGoToCommunity?: () => void;
  onSharePetLevel?: () => void;
  onSelectFriend?: (friendId: string) => void;
}

// Pure natural cheer lines (display can have warm tone; speakKorean strips emojis automatically)
function getCheerLines(friendId: string, name: string): string[] {
  const child = (name || '').trim() || '우리 아이';

  if (friendId === 'princess') {
    return [
      `${child}야, 반짝이는 용기를 보내줄게! 오늘도 파이팅!`,
      `티아라보다 ${child}의 글 읽는 목소리가 훨씬 더 예뻐!`,
      `우리 예쁜 ${child}! 오늘도 씩씩하게 한글 탐험 출발해볼까?`,
      `하트 고마워! 네 사랑 덕분에 내가 더 환하게 빛나고 있어!`,
      `${child}가 한글을 읽을 때마다 우리 왕국에 예쁜 무지개가 피어나!`,
      `천천히 또박또박 읽는 ${child}는 세상에서 제일 멋진 보석이야!`,
      `사랑해 ${child}야! 오늘 미션도 우리 둘이 즐겁게 해내자!`,
      `은방울처럼 맑고 고운 ${child}의 목소리가 너무 좋아!`,
    ];
  }

  if (friendId === 'prince') {
    return [
      `${child}야, 용기의 방패를 들고 함께 멋진 한글 왕국을 지키자!`,
      `와아! 씩씩하게 글자 읽는 ${child}가 내 최고의 영웅이야!`,
      `하트 파워 충전 완료! 오늘도 힘차게 출발하자!`,
      `멋지다 멋져! ${child}의 우렁찬 목소리가 정말 최고야!`,
      `두려워하지 마! ${child} 곁에는 언제나 든든한 내가 함께 있어!`,
      `글자 하나씩 정복할 때마다 우리 왕국에 기쁨이 넘쳐나요!`,
      `${child} 대장님과 함께라면 어떤 글자도 문제없어!`,
      `포기하지 않는 ${child}의 눈빛이 황금빛처럼 빛나요!`,
    ];
  }

  return [
    `${child}야, 사랑해! 네가 있어서 나는 매일매일 제일 행복해!`,
    `간질간질 헤헤! ${child}의 따뜻한 손길이 너무 좋아!`,
    `틀려도 괜찮아, 천천히 소리 내면 ${child}는 이미 한글 박사님!`,
    `오늘도 글자 하나 쏙! 내일은 두 배로 똑똑해질 거야!`,
    `엄마랑 함께 웃으며 배우는 ${child}의 모습이 제일 멋져!`,
    `하트 뿅뿅! 힘이 불끈불끈 솟아나요!`,
    `포기하지 않고 씩씩하게 해내는 네가 진짜 자랑스러워!`,
    `냠냠 맛있는 열매를 먹었더니 키가 쑥 자란 것 같아!`,
    `${child}야, 넌 밤하늘 별처럼 반짝이는 특별한 아이야!`,
    `내가 항상 곁에서 응원할게! 우리 ${child} 파이팅!`,
  ];
}

export const PetGrowthModal: React.FC<PetGrowthModalProps> = ({
  isOpen,
  onClose,
  friend,
  petState,
  onUpdatePet,
  childName,
  onGoToCommunity,
  onSharePetLevel,
  onSelectFriend,
}) => {
  const [floatingHeart, setFloatingHeart] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [feedPopText, setFeedPopText] = useState<string | null>(null);
  const [levelUpBanner, setLevelUpBanner] = useState<number | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Daily Quiz state
  const todayStr = new Date().toISOString().split('T')[0];
  const [quizDoneToday, setQuizDoneToday] = useState(() => {
    return localStorage.getItem('hangul_pet_quiz_date') === todayStr;
  });

  // Dynamic Cheering text
  const [speechBubbleText, setSpeechBubbleText] = useState<string>(() => {
    const list = getCheerLines(friend.id, childName);
    return list[0];
  });
  const [lastSpeechIdx, setLastSpeechIdx] = useState(0);

  // Mini quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [hasRepeatedVoice, setHasRepeatedVoice] = useState(false);

  if (!isOpen) return null;

  // Real-time level calculation up to Lv. 10,000
  const petData = getPetLevelData(petState.totalExp);
  const currentLevel = petData.level;
  const currentStageName = petData.stageName;
  const nextReq = petData.nextReqExp;
  const expPercent = Math.round(petData.progressPercent);
  const expRemaining = Math.max(0, nextReq - petState.totalExp);

  const berries = petState.berriesCount ?? 50;
  const quiz = PET_QUIZZES[currentQuizIdx % PET_QUIZZES.length];

  const getPetDisplay = () => {
    const isPrincess = friend.id === 'princess';
    const isPrince = friend.id === 'prince';
    const tier = Math.min(5, Math.max(1, petState.level));

    if (isPrincess) {
      switch (tier) {
        case 1:
          return { emoji: '🥚', badge: '1단계 보석 요람 알', title: '보석 알 속에서 잠자는 아기 공주님' };
        case 2:
          return { emoji: '👶', badge: '2단계 아기 공주님', title: '예쁜 옹알이를 시작한 아기 공주님' };
        case 3:
          return { emoji: '👸', badge: '3단계 호기심 공주님', title: '한글 동화책을 읽는 공주님' };
        case 4:
          return { emoji: '👸', badge: '4단계 마법 티아라 공주님', title: '별빛 요술봉을 든 지혜로운 공주님' };
        case 5:
        default:
          return { emoji: '👸', badge: '한글 여왕 공주님', title: '황금 왕관을 쓴 빛나는 공주님' };
      }
    }

    if (isPrince) {
      switch (tier) {
        case 1:
          return { emoji: '🥚', badge: '1단계 용기의 요람 알', title: '용기의 알 속에서 잠자는 아기 왕자님' };
        case 2:
          return { emoji: '👶', badge: '2단계 아기 왕자님', title: '씩씩하게 방긋 웃는 아기 왕자님' };
        case 3:
          return { emoji: '🤴', badge: '3단계 호기심 왕자님', title: '글자 지도를 펼친 씩씩한 왕자님' };
        case 4:
          return { emoji: '🤴', badge: '4단계 용기의 탐험 왕자님', title: '황금 망토를 두른 탐험 왕자님' };
        case 5:
        default:
          return { emoji: '🤴', badge: '한글 국왕 왕자님', title: '황금 왕관을 쓴 늠름한 왕자님' };
      }
    }

    switch (tier) {
      case 1:
        return { emoji: '🥚', badge: '1단계 알', title: '알 속에서 잠자는 중' };
      case 2:
        return { emoji: '🐣', badge: '2단계 아기 삐약이', title: '방금 알을 깨고 나온 아기' };
      case 3:
        return { emoji: friend.e, badge: '3단계 호기심쟁이', title: `${friend.name} 친구` };
      case 4:
        return { emoji: friend.e, badge: '4단계 탐험가', title: `씩씩한 ${friend.name} 탐험가` };
      case 5:
      default:
        return { emoji: friend.e, badge: '한글 마스터', title: `황금 왕관 ${friend.name}` };
    }
  };

  const petDisplay = getPetDisplay();

  const triggerNewCheer = (skipSpeak = false) => {
    const list = getCheerLines(friend.id, childName);
    let nextIdx = Math.floor(Math.random() * list.length);
    if (nextIdx === lastSpeechIdx && list.length > 1) {
      nextIdx = (nextIdx + 1) % list.length;
    }
    setLastSpeechIdx(nextIdx);
    const chosenCheer = list[nextIdx];
    setSpeechBubbleText(chosenCheer);
    if (!skipSpeak) {
      speakKorean(chosenCheer, false);
    }
  };

  const triggerLevelUpShow = (newLevel: number) => {
    setLevelUpBanner(newLevel);
    playSfx('levelup');
    confetti({ particleCount: 75, spread: 85, origin: { y: 0.45 } });
    setTimeout(() => {
      confetti({ particleCount: 45, angle: 60, spread: 55, origin: { x: 0.1, y: 0.55 } });
      confetti({ particleCount: 45, angle: 120, spread: 55, origin: { x: 0.9, y: 0.55 } });
    }, 180);
    setTimeout(() => {
      setLevelUpBanner((prev) => (prev === newLevel ? null : prev));
    }, 3200);
  };

  const MAX_DAILY_STROKE_EXP = 5;
  const getTodayStrokeCount = (): number => {
    try {
      const raw = localStorage.getItem('hangul_pet_stroke_daily');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return parsed?.date === todayStr ? Number(parsed.count || 0) : 0;
    } catch {
      return 0;
    }
  };

  const handlePetFriend = () => {
    setNoticeMessage(null);
    playSfx('pet');
    setFloatingHeart(true);
    setFeedPopText('+1 EXP 💖');
    setTimeout(() => setFloatingHeart(false), 950);
    setTimeout(() => setFeedPopText(null), 950);

    const usedStrokes = getTodayStrokeCount();
    const canGainStrokeExp = usedStrokes < MAX_DAILY_STROKE_EXP;
    const gainedExp = canGainStrokeExp ? 1 : 0;

    if (canGainStrokeExp) {
      try {
        localStorage.setItem(
          'hangul_pet_stroke_daily',
          JSON.stringify({ date: todayStr, count: usedStrokes + 1 })
        );
      } catch {}
    } else {
      setFeedPopText('사랑 듬뿍 💕');
    }

    const predictedNextLevel = getPetLevelData(petState.totalExp + gainedExp).level;
    const didLevelUp = predictedNextLevel > petState.level;

    onUpdatePet((prev) => {
      const newHappiness = Math.min(100, prev.happiness + 10);
      const nextTotalExp = prev.totalExp + gainedExp;
      const { level: newLevel, stageName } = getPetLevelData(nextTotalExp);

      if (newLevel > prev.level) {
        triggerLevelUpShow(newLevel);
        setNoticeMessage(`🎉 레벨 ${newLevel} 달성! ${stageName}로 자랐어요!`);
        speakKorean(`와아! ${childName || '친구'}야, 나 레벨 ${newLevel}로 자랐어! 고마워!`);
      } else if (!canGainStrokeExp) {
        setNoticeMessage('💖 오늘 쓰다듬기 경험치 5회를 다 모았어요! 열매와 한글 공부로 더 자라요!');
      }

      return {
        ...prev,
        happiness: newHappiness,
        totalExp: nextTotalExp,
        level: newLevel,
        stageName,
      };
    });

    triggerNewCheer(didLevelUp);
  };

  const handleFeedLetter = () => {
    if (isEating) return;

    if (berries <= 0) {
      playSfx('tap');
      setNoticeMessage('🍇 글자 열매가 없어요! 아래 오늘의 글자 퀴즈를 풀면 열매 5개를 바로 받아요!');
      setQuizOpen(true);
      return;
    }

    setNoticeMessage(null);
    setIsEating(true);
    setFloatingHeart(true);
    setFeedPopText('+10 EXP 🍇✨');
    playSfx('kiss');

    confetti({
      particleCount: 22,
      spread: 50,
      startVelocity: 22,
      origin: { y: 0.45 },
      colors: ['#F472B6', '#FBBF24', '#34D399', '#FB7185'],
    });

    setTimeout(() => {
      setIsEating(false);
      setFloatingHeart(false);
      setFeedPopText(null);
      onUpdatePet((prev) => {
        const nextBerries = Math.max(0, (prev.berriesCount ?? 50) - 1);
        const nextTotalExp = prev.totalExp + 10;
        const { level: newLevel, stageName } = getPetLevelData(nextTotalExp);

        if (newLevel > prev.level) {
          triggerLevelUpShow(newLevel);
          setNoticeMessage(`🎉 축하해요! 레벨 ${newLevel} (${stageName})로 성장했어요!`);
          speakKorean(`와아! ${childName || '친구'}야, 나 레벨 ${newLevel}로 자랐어! 고마워!`);
        } else {
          setSpeechBubbleText(`냠냠! 글자 열매 진짜 달콤해! 고마워 ${childName || '친구'}야!`);
          speakKorean('냠냠! 글자 열매 너무 맛있다!');
        }

        return {
          ...prev,
          berriesCount: nextBerries,
          totalExp: nextTotalExp,
          level: newLevel,
          stageName,
          happiness: Math.min(100, prev.happiness + 20),
        };
      });
    }, 450);
  };

  const handleSelectQuizOption = (idx: number) => {
    setSelectedOption(idx);
    const correct = idx === quiz.correct;
    setIsAnswerCorrect(correct);
    if (correct) {
      playSfx('pop');
      speakKorean(`${quiz.answerText}! 정답이야!`);
    } else {
      playSfx('tap');
      speakKorean('다시 한 번 생각해보자!');
    }
  };

  const handleCompleteVoiceRepeat = () => {
    playSfx('fan');
    confetti({ particleCount: 45, spread: 70 });
    setHasRepeatedVoice(true);

    localStorage.setItem('hangul_pet_quiz_date', todayStr);
    setQuizDoneToday(true);

    onUpdatePet((prev) => {
      const nextBerries = (prev.berriesCount ?? 0) + 5;
      const nextTotalExp = prev.totalExp + 15;
      const { level: newLevel, stageName } = getPetLevelData(nextTotalExp);

      if (newLevel > prev.level) {
        triggerLevelUpShow(newLevel);
        setNoticeMessage(`🎉 레벨 ${newLevel} 달성! 열매 5개도 받았어요!`);
      }

      return {
        ...prev,
        berriesCount: nextBerries,
        totalExp: nextTotalExp,
        level: newLevel,
        stageName,
      };
    });

    setNoticeMessage('🎉 오늘의 퀴즈 완료! 글자 열매 5개 + 경험치 15 획득!');
    setTimeout(() => {
      setCurrentQuizIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerCorrect(null);
      setHasRepeatedVoice(false);
      setQuizOpen(false);
    }, 1300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-[#FFFDF8] to-[#FFF6EA] border-2 border-[#EADBC8] rounded-3xl w-full max-w-md box-border shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden relative animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* COMPACT FIXED HEADER + FRIEND SWITCHER */}
        <div className="px-3.5 pt-3 pb-2.5 sm:px-4 border-b border-[#F1E2CF] bg-white/95 flex-none relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playSfx('tap');
              onClose();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              playSfx('tap');
              onClose();
            }}
            className="absolute top-2.5 right-2.5 z-30 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-[#FFF7EE] hover:bg-[#FDE8D3] border border-[#EBD5BE] flex items-center justify-center text-[#786D62] hover:text-[#1b1917] transition-all shadow-2xs active:scale-95 cursor-pointer"
            aria-label="닫기"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 pr-12">
            <span className="w-8 h-8 rounded-xl bg-[#FFF0E6] border border-[#F8D0BC] flex items-center justify-center text-lg shrink-0">
              🏡
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-jua text-[#1b1917] truncate">
                {friend.name}의 비밀 놀이터
              </h2>
              <p className="text-[11px] font-hand text-[#857A6E] truncate">
                한글 공부를 할수록 {friend.name}가 쑥쑥 자라나요!
              </p>
            </div>
          </div>

          {onSelectFriend && (
            <div className="flex items-center gap-1.5 overflow-x-auto snap-x snap-mandatory no-scrollbar pt-2">
              {FRIENDS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    onSelectFriend(f.id);
                    setSpeechBubbleText(getCheerLines(f.id, childName)[0]);
                  }}
                  className={`snap-center min-h-[44px] px-2.5 py-1.5 rounded-2xl font-jua flex items-center gap-1.5 flex-none transition-all active:scale-95 ${
                    friend.id === f.id
                      ? 'bg-[#FFF0EA] text-[#D95338] border-2 border-[#E76F51] shadow-2xs'
                      : 'bg-[#FAF6F0] text-[#5E554D] border border-[#EAE0D3] hover:border-[#E76F51]/50'
                  }`}
                >
                  <span className="text-xl leading-none select-none">{f.e}</span>
                  <span className="text-xs whitespace-nowrap">{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SCROLLABLE BODY WITH ZERO-SCROLL STICKY ONE-TOUCH ACTION DOCK */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-2.5 sm:px-4 space-y-2.5 scrollbar-thin pb-5 text-center box-border">
          {/* Dynamic Speech Bubble (Tap for clean voice) */}
          <button
            type="button"
            onClick={() => triggerNewCheer()}
            className="w-full text-left bg-white border border-[#EEDCC8] rounded-2xl px-3 py-2 shadow-2xs hover:border-[#E76F51] transition-all flex items-center justify-between gap-2 active:scale-[0.99]"
            title="누르면 새로운 응원 목소리가 나와요!"
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-4 h-4 text-[#E76F51] shrink-0" />
              <p className="text-xs font-jua text-[#2D2825] leading-snug break-keep">
                {speechBubbleText}
              </p>
            </div>
            <Volume2 className="w-4 h-4 text-[#E76F51] shrink-0" />
          </button>

          {/* Animated Tamagotchi Stage */}
          <div
            className={`relative rounded-3xl px-4 py-3 border-2 transition-all duration-300 overflow-hidden ${
              levelUpBanner
                ? 'bg-gradient-to-b from-[#FFF9D6] via-[#FFF2C6] to-[#FFE7B8] border-amber-400 shadow-lg'
                : isEating
                ? 'bg-gradient-to-b from-[#FFF4EB] via-[#FFE9DC] to-[#FFF5EC] border-[#F4A261] shadow-md'
                : 'bg-gradient-to-b from-[#FDF5EB] to-[#FFFDF9] border-[#EBD8C3] shadow-inner'
            }`}
          >
            {/* Level-Up Celebration Banner */}
            {levelUpBanner && (
              <div className="mb-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-jua text-xs shadow-sm animate-bounce">
                <Trophy className="w-3.5 h-3.5" />
                <span>LEVEL UP! Lv.{levelUpBanner} 성장 완료!</span>
              </div>
            )}

            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <button
                type="button"
                onClick={handlePetFriend}
                className={`w-28 h-28 rounded-full bg-white border-4 flex items-center justify-center text-6xl shadow-md cursor-pointer transition-all duration-300 active:scale-90 ${
                  isEating
                    ? 'animate-bounce scale-110 border-amber-400 ring-4 ring-amber-300/60 shadow-[0_0_26px_rgba(251,191,36,0.65)]'
                    : floatingHeart
                    ? 'scale-105 border-rose-300 ring-4 ring-rose-200/70 shadow-[0_0_22px_rgba(244,63,94,0.35)]'
                    : 'animate-float border-[#EEDFC9] hover:scale-105'
                }`}
                title="친구를 톡톡 쓰다듬어주세요!"
              >
                <span className="select-none">{petDisplay.emoji}</span>
              </button>

              {petState.level >= 5 && (
                <span className="absolute -top-1 text-2xl animate-bounce pointer-events-none">👑</span>
              )}
              {friend.id === 'princess' && petState.level >= 4 && (
                <span className="absolute bottom-1 right-1 text-xl pointer-events-none">🪄</span>
              )}
              {friend.id === 'prince' && petState.level >= 4 && (
                <span className="absolute bottom-1 right-1 text-xl pointer-events-none">⚔️</span>
              )}

              {/* Burst Hearts & +EXP Popup */}
              {floatingHeart && (
                <div className="absolute -top-2 inset-x-0 flex justify-center gap-2.5 text-2xl animate-pop pointer-events-none">
                  <span>{isEating ? '🍇' : '💖'}</span>
                  <span>✨</span>
                  <span>{isEating ? '💖' : '💕'}</span>
                </div>
              )}
              {feedPopText && (
                <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-[#E76F51] text-white font-jua text-[11px] shadow-md animate-pop pointer-events-none">
                  {feedPopText}
                </div>
              )}
            </div>

            <div className="mt-1">
              <h3 className="font-jua text-sm sm:text-base text-[#1b1917] break-keep">
                {petDisplay.title}
              </h3>
            </div>
          </div>

          {/* STICKY CHARACTER STATUS BAR + ONE-TOUCH FEED / PET BUTTONS */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border-2 border-[#F1D8C2] shadow-[0_6px_18px_rgba(231,111,81,0.12)] space-y-2.5">
            {/* Compact Status & EXP Bar */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between gap-1.5 text-xs font-jua">
                <span className="text-[#D95338] truncate">
                  Lv.{currentLevel} · {currentStageName}
                </span>
                <div className="flex items-center gap-2 shrink-0 text-[11px]">
                  <span className="text-purple-700 font-bold">🍇 {berries}개</span>
                  <span className="text-rose-600 font-bold">💖 {petState.happiness}%</span>
                </div>
              </div>
              <div className="h-3 w-full bg-[#EFE5D8] rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#FBBF24] via-[#F4845F] to-[#D95338] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(6, expPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-hand text-[#857A6E]">
                <span>{petData.isMaxLevel ? '최고 레벨 달성!' : `다음 레벨까지 ${expRemaining} EXP`}</span>
                <span>{expPercent}%</span>
              </div>
            </div>

            {/* One-Touch Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePetFriend}
                className="min-h-[48px] flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-[#FFF5F2] hover:bg-[#FFE8E1] border-2 border-[#F5B8A6] text-[#C9502F] font-jua text-sm shadow-2xs active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-[#C9502F] shrink-0" />
                <span>쓰다듬기 💖</span>
              </button>

              <button
                type="button"
                onClick={handleFeedLetter}
                disabled={isEating}
                className={`min-h-[48px] flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl font-jua text-sm shadow-md active:scale-95 transition-all disabled:opacity-70 whitespace-nowrap cursor-pointer ${
                  berries > 0
                    ? 'bg-gradient-to-r from-[#E76F51] to-[#D95338] hover:from-[#D95D40] hover:to-[#C4452B] text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Apple className="w-4 h-4 shrink-0" />
                <span>{berries > 0 ? '열매 먹이기 🍇' : '열매 받기 🍇'}</span>
              </button>
            </div>
          </div>

          {/* Notice Banner */}
          {noticeMessage && (
            <div className="p-2.5 rounded-2xl bg-[#FFF9EA] border border-[#F5DD9F] text-[#6C5421] text-xs font-jua animate-pop break-keep">
              {noticeMessage}
            </div>
          )}

          {/* Social Share Card: Share Pet Level to Community */}
          {(onSharePetLevel || onGoToCommunity) && (
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                if (onSharePetLevel) {
                  onSharePetLevel();
                } else {
                  onClose();
                  onGoToCommunity?.();
                }
              }}
              className="w-full min-h-[46px] p-3 rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#F3E8FF] hover:from-[#E4EEFF] hover:to-[#EAD8FF] border border-[#D8C8FA] flex items-center justify-between gap-2 text-left active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-white border border-[#DFD2FA] flex items-center justify-center text-lg shrink-0">
                  {petDisplay.emoji}
                </span>
                <div className="min-w-0">
                  <div className="font-jua text-xs text-[#2D2825] truncate">
                    우리 {friend.name} (Lv.{currentLevel}) 광장에 자랑하기
                  </div>
                  <div className="text-[10px] font-hand text-[#6D5F8A] truncate">
                    게시물에 내 다마고치 뱃지를 달고 칭찬 열매도 주고받아요!
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white text-[#6B21A8] border border-[#E2D4FA] font-jua text-[11px] shrink-0 whitespace-nowrap">
                <Share2 className="w-3 h-3" /> 자랑하기
              </span>
            </button>
          )}

          {/* Letter Berry Quiz Section (Daily 1-Time Limit) */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#E4DCCF] text-left space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-jua text-xs sm:text-sm text-[#1b1917] flex items-center gap-1.5">
                <span>🍇</span>
                오늘의 글자 퀴즈 (열매 +5개)
              </h4>
              {quizDoneToday ? (
                <span className="text-[11px] font-jua text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  오늘 완료 ✨
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playSfx('tap');
                    setQuizOpen(!quizOpen);
                  }}
                  className="text-xs font-jua text-[#C9502F] hover:underline shrink-0"
                >
                  {quizOpen ? '접기 ▲' : '퀴즈 풀기 ▼'}
                </button>
              )}
            </div>

            {quizDoneToday ? (
              <div className="p-2.5 rounded-xl bg-[#F0F9ED] border border-[#C1E7BA] text-center text-xs font-jua text-[#237D3D] space-y-0.5">
                <p>오늘의 글자 퀴즈를 풀고 열매 5개를 받았어요!</p>
                <p className="text-[10px] font-hand text-[#327844]">내일 새로운 퀴즈로 열매 5개를 또 받을 수 있어요</p>
              </div>
            ) : (
              quizOpen && (
                <div className="pt-2 border-t border-[#F0EBE1] space-y-2.5 animate-fadeIn">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-jua text-sm text-[#1b1917]">Q. {quiz.question}</p>
                    <button
                      type="button"
                      onClick={() => speakKorean(quiz.sound)}
                      className="flex-none p-1.5 rounded-xl bg-[#FDF3E4] text-[#C9502F] hover:bg-[#FAE2C1] transition-colors"
                      title="소리 듣기"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {quiz.options.map((opt, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleSelectQuizOption(i)}
                        className={`py-2 rounded-xl font-jua text-base border transition-all ${
                          selectedOption === i
                            ? i === quiz.correct
                              ? 'bg-[#437A22] text-white border-[#437A22] shadow-sm'
                              : 'bg-red-500 text-white border-red-500'
                            : 'bg-[#FAF8F5] text-[#1b1917] border-[#E4DCCF] hover:border-[#C9502F]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {isAnswerCorrect && (
                    <div className="bg-[#F0F9ED] border border-[#C1E7BA] p-3 rounded-xl space-y-2 text-center animate-pop">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#237D3D] font-jua">
                        <CheckCircle2 className="w-4 h-4" />
                        정답! "{quiz.sound}" 소리가 나요!
                      </div>
                      <button
                        type="button"
                        onClick={handleCompleteVoiceRepeat}
                        disabled={hasRepeatedVoice}
                        className="w-full min-h-[42px] py-2 px-3 rounded-xl bg-[#237D3D] text-white font-jua text-xs shadow-xs hover:bg-[#1E6A34] active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        큰소리로 따라 말했어요! (열매 +5개 받기 🍇)
                      </button>
                    </div>
                  )}
                </div>
              )
            )}

            <p className="text-[10px] text-[#8A8178] font-hand">
              💡 글자 열매는 <b>오늘의 퀴즈(+5개)</b>와 <b>30일 체크리스트(+3개)</b>에서 모을 수 있어요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
