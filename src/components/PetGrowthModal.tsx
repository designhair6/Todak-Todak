import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Heart,
  Sparkles,
  Award,
  Apple,
  Volume2,
  Mic,
  CheckCircle2,
  Smile,
  Crown,
  ChevronRight,
  MessageCircle,
  Shield,
  Wand2,
} from 'lucide-react';
import { AnimalFriend, PetGrowthState } from '../types';
import { FRIENDS, PET_LEVELS, PET_QUIZZES, getPetLevelData } from '../data/hangulData';
import { playSfx, speakKorean } from '../utils/sound';

interface PetGrowthModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: AnimalFriend;
  petState: PetGrowthState;
  onUpdatePet: (updater: (prev: PetGrowthState) => PetGrowthState) => void;
  childName: string;
  onGoToCommunity?: () => void;
  onSelectFriend?: (friendId: string) => void;
}

// Cheer lines pool generator
function getCheerLines(friendId: string, name: string): string[] {
  const child = name || '우리 아이';

  if (friendId === 'princess') {
    return [
      `${child}야, 마법 요술봉으로 반짝이는 용기를 보내줄게! 🪄💖`,
      `반짝반짝 티아라보다 ${child}의 글 읽는 목소리가 훨씬 더 예뻐! 👑`,
      `우리 예쁜 ${child} 공주님! 오늘도 씩씩하게 한글 탐험 출발해볼까? 🌸`,
      `하트 고마워! 네 사랑을 받아서 내 드레스가 더 환하게 빛나고 있어! ✨`,
      `${child}가 한글을 읽을 때마다 우리 왕국에 예쁜 무지개가 피어나! 🌈`,
      `천천히 또박또박 읽는 ${child}는 세상에서 제일 빛나는 보석이야! 💎`,
      `사랑해 ${child}야! 오늘 미션도 우리 둘이 즐겁게 해내자! 💕`,
      `샤랄라~ 사랑의 마법 가루 퐁퐁! 오늘도 힘내자! 🧚‍♀️`,
      `${child}의 목소리는 은방울처럼 맑고 고와요! 고마워! 🔔`,
      `와아! ${child}랑 함께 공부하니까 하나도 어렵지 않고 신나! 🎀`,
    ];
  }

  if (friendId === 'prince') {
    return [
      `${child}야, 용기의 검을 들고 함께 멋진 한글 왕국을 지키자! ⚔️🏰`,
      `와아! 씩씩하게 글자 읽는 ${child}가 내 최고의 영웅이야! 🌟`,
      `하트 파워 충전 완료! 앞으로 으라차차 힘차게 돌격! 💪`,
      `멋지다 멋져! ${child}의 쩌렁쩌렁한 목소리가 온 성안에 울려 퍼져! 🛡️`,
      `두려워하지 마! ${child} 곁에는 언제나 든든한 내가 함께 있어! 🏇`,
      `글자 하나씩 정복할 때마다 우리 왕국에 기쁨이 넘쳐나요! 👑`,
      `${child}야, 오늘도 씩씩한 네 모습에 내가 반해버렸어! 최고야! 🔥`,
      `힘차게 전진! ${child} 대장님과 함께라면 어떤 글자도 문제없어! 🚩`,
      `우와 힘이 불끈! ${child}의 응원 덕분에 백 배로 든든해졌어! 🦁`,
      `포기하지 않는 ${child}의 눈빛이 황금빛처럼 빛나요! 파이팅! ✨`,
    ];
  }

  return [
    `${child}야, 사랑해! 네가 있어서 나는 매일매일 제일 행복해! 💖`,
    `간질간질~ 헤헤헤! ${child}의 따뜻한 손길이 너무 좋아! 폭 안아줄래! 🥰`,
    `틀려도 괜찮아, 천천히 소리 내면 ${child}는 이미 한글 박사님! 🎓`,
    `오늘도 글자 하나 쏙! 내일은 두 배로 똑똑해질 거야! 🚀`,
    `엄마랑 함께 웃으며 배우는 ${child}의 모습이 제일 멋져! 🌈`,
    `하트 뿅뿅! 힘이 불끈불끈 솟아나요! 으라차차! 💪`,
    `포기하지 않고 씩씩하게 해내는 네가 진짜 자랑스러워! 👏`,
    `냠냠~ 맛있는 사랑을 먹었더니 키가 1cm 더 자란 것 같아! 🍓`,
    `${child}야, 넌 밤하늘 별처럼 반짝이는 특별한 아이야! ✨`,
    `우와! 방금 읽은 소리 진짜 맑고 우렁찼어! 최고야! 🎺`,
    `내가 항상 곁에서 응원할게! 우리 ${child} 파이팅! 🥳`,
    `네 미소를 보면 힘든 것도 사르르 녹아내려! 고마워! 🍯`,
    `한 걸음 한 걸음 천천히 걷다 보면 30일 완주가 코앞이야! 🐾`,
    `사랑의 하트 파워 가득! ${child}야 오늘도 제일 많이 사랑해! 💖`,
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
  onSelectFriend,
}) => {
  const [floatingHeart, setFloatingHeart] = useState(false);
  const [isEating, setIsEating] = useState(false);
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
  const expPercent = petData.progressPercent;

  const berries = petState.berriesCount ?? 5;

  const quiz = PET_QUIZZES[currentQuizIdx % PET_QUIZZES.length];

  // Evolution display for Princess, Prince, and animal companions
  const getPetDisplay = () => {
    const isPrincess = friend.id === 'princess';
    const isPrince = friend.id === 'prince';
    const tier = Math.min(5, Math.max(1, petState.level));

    if (isPrincess) {
      switch (tier) {
        case 1:
          return { emoji: '🥚', badge: '1단계 보석 요람 알 💎', title: '보석 알 속에서 잠자는 아기 공주님 🥚' };
        case 2:
          return { emoji: '👶', badge: '2단계 아기 공주님 🎀', title: '예쁜 옹알이를 시작한 아기 공주님 👶' };
        case 3:
          return { emoji: '👸', badge: '3단계 호기심 공주님 💖', title: '한글 동화책을 읽는 사랑스러운 공주님 👸' };
        case 4:
          return { emoji: '👸', badge: '4단계 마법 티아라 공주님 🪄', title: '별빛 요술봉을 든 지혜로운 공주님 🪄' };
        case 5:
        default:
          return { emoji: '👸', badge: '5단계 한글 여왕 공주님 👑', title: '황금 왕관을 쓴 빛나는 한글 여왕 공주님 👑' };
      }
    }

    if (isPrince) {
      switch (tier) {
        case 1:
          return { emoji: '🥚', badge: '1단계 용기의 요람 알 🛡️', title: '용기의 알 속에서 잠자는 아기 왕자님 🥚' };
        case 2:
          return { emoji: '👶', badge: '2단계 아기 왕자님 🌟', title: '씩씩하게 방긋 웃는 아기 왕자님 👶' };
        case 3:
          return { emoji: '🤴', badge: '3단계 호기심 왕자님 🗡️', title: '글자 지도를 펼친 씩씩한 왕자님 🤴' };
        case 4:
          return { emoji: '🤴', badge: '4단계 용기의 탐험 왕자님 🧭', title: '황금 망토를 두른 용감한 탐험 왕자님 🧭' };
        case 5:
        default:
          return { emoji: '🤴', badge: '5단계 한글 국왕 왕자님 👑', title: '황금 왕관을 쓴 늠름한 한글 국왕 왕자님 👑' };
      }
    }

    switch (tier) {
      case 1:
        return { emoji: '🥚', badge: '1단계 알', title: '알 속에서 잠자는 중 🥚' };
      case 2:
        return { emoji: '🐣', badge: '2단계 아기 삐약이', title: '방금 알을 깨고 나온 아기 🐣' };
      case 3:
        return { emoji: friend.e, badge: '3단계 호기심쟁이', title: `${friend.name} 친구 🎒` };
      case 4:
        return { emoji: friend.e, badge: '4단계 탐험가', title: `씩씩한 ${friend.name} 탐험가 🧭` };
      case 5:
      default:
        return { emoji: friend.e, badge: '5단계 한글 마스터', title: `황금 왕관 ${friend.name} 👑` };
    }
  };

  const petDisplay = getPetDisplay();

  // Trigger randomized warm cheering dialogue
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

  // Pet action: Stroke / Love (+1 EXP capped at 5 strokes per day, unlimited affection)
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
    setTimeout(() => setFloatingHeart(false), 900);

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
    }

    const predictedNextLevel = getPetLevelData(petState.totalExp + gainedExp).level;
    const didLevelUp = predictedNextLevel > petState.level;

    onUpdatePet((prev) => {
      const newHappiness = Math.min(100, prev.happiness + 10);
      const nextTotalExp = prev.totalExp + gainedExp;
      const { level: newLevel, stageName } = getPetLevelData(nextTotalExp);

      if (newLevel > prev.level) {
        playSfx('levelup');
        confetti({ particleCount: 50, spread: 75, origin: { y: 0.5 } });
        setNoticeMessage(`🎉 와아! 축하해요! 레벨 ${newLevel} (${stageName})로 성장했어요! ✨`);
        speakKorean(`와아! ${childName || '친구'}야 나 레벨 ${newLevel}로 성장했어! 고마워!`, false);
      } else if (!canGainStrokeExp) {
        setNoticeMessage('💖 오늘 쓰다듬기 경험치(5회)를 다 모았어요! 한글 학습과 글자 열매로 더 크게 자라요!');
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

  // Pet action: Feed letter fruit (Consumes 1 berry, +10 EXP)
  const handleFeedLetter = () => {
    if (isEating) return;

    if (berries <= 0) {
      playSfx('tap');
      setNoticeMessage('글자 열매가 다 떨어졌어요! 🍇 아래 오늘의 글자 퀴즈를 풀고 열매 5개를 받아보세요!');
      setQuizOpen(true);
      return;
    }

    setNoticeMessage(null);
    setIsEating(true);
    playSfx('pop');

    setTimeout(() => {
      setIsEating(false);
      onUpdatePet((prev) => {
        const nextBerries = Math.max(0, (prev.berriesCount ?? 5) - 1);
        const nextTotalExp = prev.totalExp + 10;
        const { level: newLevel, stageName } = getPetLevelData(nextTotalExp);

        if (newLevel > prev.level) {
          playSfx('levelup');
          confetti({ particleCount: 60, spread: 80, origin: { y: 0.5 } });
          setNoticeMessage(`🎉 와아! 축하해요! 레벨 ${newLevel} (${stageName})로 성장했어요! 🚀`);
          speakKorean(`와아! ${childName || '친구'}야 나 레벨 ${newLevel}로 성장했어! 고마워!`, false);
        } else {
          speakKorean('냠냠! 글자 열매 너무 맛있다!', false);
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
    }, 400);
  };

  // Quiz: Check answer
  const handleSelectQuizOption = (idx: number) => {
    setSelectedOption(idx);
    const correct = idx === quiz.correct;
    setIsAnswerCorrect(correct);
    if (correct) {
      playSfx('pop');
      speakKorean(`${quiz.answerText}! 정답이야! 소리 듣고 따라 해봐!`);
    } else {
      playSfx('tap');
      speakKorean('다시 한 번 생각해보자!');
    }
  };

  // Quiz: Complete voice repeat & reward 5 berries + 15 EXP! (Daily 1-time limit)
  const handleCompleteVoiceRepeat = () => {
    playSfx('fan');
    confetti({ particleCount: 40, spread: 70 });
    setHasRepeatedVoice(true);

    // Save daily 1-time quiz completion
    localStorage.setItem('hangul_pet_quiz_date', todayStr);
    setQuizDoneToday(true);

    onUpdatePet((prev) => {
      const nextBerries = (prev.berriesCount ?? 0) + 5;
      const nextTotalExp = prev.totalExp + 15;
      const { level: newLevel, stageName } = getPetLevelData(nextTotalExp);

      if (newLevel > prev.level) {
        playSfx('levelup');
        confetti({ particleCount: 50, spread: 75 });
        setNoticeMessage(`🎉 와아! 축하해요! 레벨 ${newLevel} (${stageName})로 성장했어요! ✨`);
      }

      return {
        ...prev,
        berriesCount: nextBerries,
        totalExp: nextTotalExp,
        level: newLevel,
        stageName,
      };
    });

    setNoticeMessage('🎉 오늘의 퀴즈 완료! 글자 열매 5개 + 경험치 +15 획득! 🍇');
    setTimeout(() => {
      setCurrentQuizIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerCorrect(null);
      setHasRepeatedVoice(false);
      setQuizOpen(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Outer Modal Container with strict max-height and flex-col to avoid cutting off bottom */}
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-md box-border shadow-2xl flex flex-col max-h-[88vh] overflow-hidden relative animate-pop">
        
        {/* FIXED HEADER */}
        <div className="px-4 pt-3.5 pb-3 sm:px-5 sm:pt-4 border-b border-[#eedfc9] bg-white/80 flex-none relative">
          <button
            onClick={() => {
              playSfx('tap');
              onClose();
            }}
            className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] text-xs font-jua">
              <Sparkles className="w-3.5 h-3.5" />
              다마고치 친구
            </div>
            <h2 className="text-lg sm:text-xl font-jua text-[#1b1917]">
              {friend.name}의 방 🏡
            </h2>

            {/* Horizontal Snap Carousel Friend Switcher (5-7yo finger-friendly >=72px) */}
            {onSelectFriend && (
              <div className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1.5 px-1.5">
                {FRIENDS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      playSfx('pop');
                      onSelectFriend(f.id);
                      setSpeechBubbleText(getCheerLines(f.id, childName)[0]);
                    }}
                    className={`snap-center min-w-[72px] min-h-[72px] px-2.5 py-2 rounded-2xl font-jua flex flex-col items-center justify-center gap-1 flex-none transition-all active:scale-95 shadow-sm ${
                      friend.id === f.id
                        ? 'bg-[#fff5f2] text-[#c9502f] border-2 border-orange-500 ring-2 ring-orange-500/20'
                        : 'bg-white text-[#4a443e] border border-[#e4dccf] hover:border-orange-300'
                    }`}
                  >
                    <span className="text-3xl leading-none select-none">{f.e}</span>
                    <span className="text-xs whitespace-nowrap">{f.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Berries Bar */}
            <div className="flex items-center justify-center text-xs font-jua">
              <span className="px-3.5 py-1 rounded-full bg-[#f6edfd] border border-[#e0c4f7] text-[#6b21a8] flex items-center gap-1.5 shadow-2xs">
                <span>🍇 글자 열매:</span>
                <b className="text-sm text-[#7e22ce]">{berries}개</b>
              </span>
            </div>
          </div>
        </div>

        {/* SCROLLABLE BODY (Never clipped, comfortable scrolling on all devices) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-5 sm:py-4 space-y-3.5 scrollbar-thin pb-8 text-center box-border">
          
          {/* Notice Message if any */}
          {noticeMessage && (
            <div className="p-2.5 rounded-2xl bg-[#fff9ea] border border-[#f5dd9f] text-[#6c5421] text-xs font-hand animate-pop">
              {noticeMessage}
            </div>
          )}

          {/* Dynamic Interactive Speech Bubble (Changes on tap!) */}
          <div
            onClick={() => triggerNewCheer()}
            className="cursor-pointer bg-white border-2 border-[#eedfc9] rounded-2xl p-2.5 sm:p-3 shadow-xs hover:border-[#c9502f] transition-all relative group"
            title="캐릭터를 누르면 신나고 따뜻한 힘찬 응원을 들려줘요!"
          >
            <div className="flex items-center justify-between text-[11px] text-[#c9502f] font-jua mb-1">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {friend.name}의 한마디 (탭하면 새로운 대사!)
              </span>
              <Volume2 className="w-3.5 h-3.5 text-[#c9502f] group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-xs sm:text-sm font-jua text-[#1b1917] leading-relaxed">
              "{speechBubbleText}"
            </p>
          </div>

          {/* Pet Stage Avatar Showcase */}
          <div className="relative bg-gradient-to-b from-[#fdf6ec] to-[#fbf8f2] rounded-3xl p-4 sm:p-5 border-2 border-[#e4dccf] shadow-inner space-y-2.5">
            {/* Level badge */}
            <div className="inline-block px-3 py-0.5 rounded-full bg-white border border-[#eedfc9] text-xs font-bold font-jua text-[#c9502f]">
              {petDisplay.badge} (Lv.{petState.level})
            </div>

            {/* Big Animated Pet Avatar (>=128px) */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <button
                type="button"
                onClick={handlePetFriend}
                className={`w-32 h-32 rounded-full bg-white border-4 border-[#eedfc9] flex items-center justify-center text-6xl shadow-md cursor-pointer transition-transform active:scale-95 hover:scale-105 ${
                  isEating ? 'animate-bounce' : 'animate-float'
                }`}
                title="친구를 톡톡 쓰다듬어주세요!"
              >
                <span className="select-none">{petDisplay.emoji}</span>
              </button>

              {/* Special Level 5+ Crown / Tiara */}
              {petState.level >= 5 && (
                <span className="absolute -top-2 text-3xl">👑</span>
              )}

              {/* Princess special wand badge or Prince sword badge */}
              {friend.id === 'princess' && petState.level >= 4 && (
                <span className="absolute bottom-1 right-1 text-2xl">🪄</span>
              )}
              {friend.id === 'prince' && petState.level >= 4 && (
                <span className="absolute bottom-1 right-1 text-2xl">⚔️</span>
              )}

              {/* Floating Heart Particles */}
              {floatingHeart && (
                <div className="absolute -top-3 inset-x-0 flex justify-center gap-3 text-3xl animate-pop pointer-events-none">
                  <span>💖</span>
                  <span>✨</span>
                  <span>💕</span>
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <h3 className="font-jua text-base sm:text-lg text-[#1b1917] break-keep">
                {petDisplay.title}
              </h3>
              <p className="text-xs text-[#8a8178] font-hand break-keep">
                친구를 터치하면 하트가 뿅뿅 올라가요!
              </p>
            </div>

            {/* Thick Kid-Friendly Experience Bar */}
            <div className="space-y-1.5 pt-1 text-left">
              <div className="flex flex-wrap justify-between gap-1 text-xs font-bold text-[#8a8178]">
                <span>Lv.{currentLevel} · {currentStageName}</span>
                <span>
                  {petData.isMaxLevel ? '최고 레벨 👑' : `${petState.totalExp} / ${nextReq} EXP`}
                </span>
              </div>
              <div className="h-4 w-full bg-[#e4dccf] rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#f2c14e] to-[#c9502f] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(6, expPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pet Interaction Action Buttons (>=48px) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handlePetFriend}
              className="min-h-[48px] flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-white border-2 border-[#f5b8a6] text-[#c9502f] font-jua text-sm shadow-xs hover:bg-[#fff5f2] active:scale-95 transition-all whitespace-nowrap"
              title="친구를 톡톡 쓰다듬어 사랑을 전해요"
            >
              <Heart className="w-4 h-4 fill-[#c9502f] shrink-0" />
              <span>쓰다듬기 💖</span>
            </button>

            <button
              onClick={handleFeedLetter}
              disabled={isEating}
              className="min-h-[48px] flex items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md active:scale-95 transition-all disabled:opacity-70 whitespace-nowrap"
              title="글자 열매 1개를 먹여요"
            >
              <Apple className="w-4 h-4 shrink-0" />
              <span>열매 먹이기 🍇</span>
            </button>
          </div>

          {/* Letter Berry Quiz Section (Daily 1-Time Limit) */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#e4dccf] text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-jua text-xs sm:text-sm text-[#1b1917] flex items-center gap-1.5">
                <span>🍇</span>
                오늘의 글자 퀴즈 (하루 1회 열매 5개!)
              </h4>
              {quizDoneToday ? (
                <span className="text-[11px] font-jua text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  오늘 완료 ✨
                </span>
              ) : (
                <button
                  onClick={() => {
                    playSfx('tap');
                    setQuizOpen(!quizOpen);
                  }}
                  className="text-xs font-jua text-[#c9502f] hover:underline"
                >
                  {quizOpen ? '접기 ▲' : '퀴즈 시작 ▼'}
                </button>
              )}
            </div>

            {quizDoneToday ? (
              <div className="p-2.5 rounded-xl bg-[#f0f9ed] border border-[#c1e7ba] text-center text-xs font-jua text-[#237d3d] space-y-0.5">
                <p>🎉 오늘의 글자 퀴즈를 모두 맞히고 열매 5개를 받았어요!</p>
                <p className="text-[10px] font-hand text-[#327844]">내일 새로운 퀴즈로 열매 5개를 또 받을 수 있어요 🌙</p>
              </div>
            ) : quizOpen && (
              <div className="pt-2 border-t border-[#f0ebe1] space-y-2.5 animate-fadeIn">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-jua text-sm text-[#1b1917]">
                    Q. {quiz.question}
                  </p>
                  <button
                    onClick={() => speakKorean(quiz.sound)}
                    className="flex-none p-1.5 rounded-xl bg-[#fdf3e4] text-[#c9502f] hover:bg-[#fae2c1] transition-colors"
                    title="소리 듣기"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 3 Options */}
                <div className="grid grid-cols-3 gap-2">
                  {quiz.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectQuizOption(i)}
                      className={`py-2 rounded-xl font-jua text-base border transition-all ${
                        selectedOption === i
                          ? i === quiz.correct
                            ? 'bg-[#437a22] text-white border-[#437a22] shadow-sm'
                            : 'bg-red-500 text-white border-red-500'
                          : 'bg-[#faf8f5] text-[#1b1917] border-[#e4dccf] hover:border-[#c9502f]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* If right answer, show follow-along repeat button */}
                {isAnswerCorrect && (
                  <div className="bg-[#f0f9ed] border border-[#c1e7ba] p-3 rounded-xl space-y-2 text-center animate-pop">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#237d3d] font-jua">
                      <CheckCircle2 className="w-4 h-4" />
                      정답! "{quiz.sound}" 소리가 나요!
                    </div>
                    <button
                      onClick={handleCompleteVoiceRepeat}
                      disabled={hasRepeatedVoice}
                      className="w-full py-2 px-3 rounded-xl bg-[#237d3d] text-white font-jua text-xs shadow-xs hover:bg-[#1e6a34] active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      큰소리로 따라 말했어요! (오늘 열매 +5개 받기 🍇)
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="text-[10px] text-[#8a8178] font-hand">
              💡 글자 열매는 <b>하루 1번 퀴즈(+5개)</b>, <b>30일 미션 완료(+3개)</b>로 쑥쑥 모을 수 있어요!
            </p>
          </div>
        </div>

        {/* FIXED FOOTER WITH FULL-WIDTH CLOSE BUTTON */}
        <div className="p-3 sm:p-4 border-t border-[#eedfc9] bg-white/90 flex-none">
          <button
            onClick={() => {
              playSfx('tap');
              onClose();
            }}
            className="w-full min-h-[48px] py-3 rounded-2xl bg-[#1b1917] hover:bg-black text-white font-jua text-sm shadow-sm active:scale-95 transition-all"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
