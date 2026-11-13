import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Volume2, Heart, ArrowRight, RefreshCw, Star } from 'lucide-react';
import { CHO, JUNG, NAMES, syl } from '../data/hangulData';
import { playSfx, speakKorean } from '../utils/sound';

interface SoundBlendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardExp: (amount: number) => void;
}

export const SoundBlendingModal: React.FC<SoundBlendingModalProps> = ({
  isOpen,
  onClose,
  onRewardExp,
}) => {
  const [selectedChoIdx, setSelectedChoIdx] = useState<number>(0); // ㄱ
  const [selectedJungIdx, setSelectedJungIdx] = useState<number>(0); // ㅏ
  const [isBlending, setIsBlending] = useState(false);
  const [hasBlended, setHasBlended] = useState(false);

  if (!isOpen) return null;

  const currentCho = CHO[selectedChoIdx];
  const currentChoName = NAMES[selectedChoIdx];
  const currentJung = JUNG[selectedJungIdx];
  const resultSyllable = syl(selectedChoIdx, selectedJungIdx);

  const handleBlend = () => {
    setIsBlending(true);
    playSfx('pop');

    setTimeout(() => {
      setIsBlending(false);
      setHasBlended(true);
      playSfx('kiss');
      confetti({ particleCount: 35, spread: 65, origin: { y: 0.6 } });
      onRewardExp(3);

      // Speak combination formula
      speakKorean(`${currentChoName}의 ${currentCho}... ${currentJung}... 합쳐서 ${resultSyllable}!`);
    }, 450);
  };

  const sampleWords: Record<string, string[]> = {
    가: ['가방', '가수', '가위'],
    나: ['나비', '나무', '나라'],
    다: ['다람쥐', '달팽이', '다리'],
    라: ['라면', '라디오', '라쿤'],
    마: ['마음', '마차', '마을'],
    바: ['바다', '바나나', '바구니'],
    사: ['사자', '사과', '사탕'],
    아: ['아기', '아이', '아빠'],
    자: ['자동차', '자전거', '자석'],
    차: ['기차', '차표', '차조'],
    카: ['카메라', '카드', '카레'],
    타: ['타조', '타자기', '타이어'],
    파: ['파도', '파인애플', '파마'],
    하: ['하마', '하늘', '하트'],
    고: ['고양이', '고구마', '고래'],
    노: ['노래', '노을', '노랑'],
    도: ['도토리', '도시락', '도마'],
    로: ['로봇', '로켓', '로션'],
    모: ['모자', '모래', '모기'],
    보: ['보물', '보자기', '보석'],
    소: ['소리', '소방차', '소풍'],
    오: ['오리', '오이', '오렌지'],
    조: ['조개', '조각', '조끼'],
    호: ['호랑이', '호박', '호수'],
    구: ['구름', '구두', '구슬'],
    누: ['눈사람', '누나', '누에'],
    두: ['두더지', '두부', '두건'],
    루: ['루비', '루돌프', '루프'],
    무: ['무지개', '무궁화', '무당벌레'],
    부: ['부엉이', '부채', '부츠'],
    수: ['수박', '수영장', '수건'],
    우: ['우산', '우주선', '우유'],
    주: ['주스', '주머니', '주사기'],
    후: ['후추', '후라이', '후드'],
  };

  const words = sampleWords[resultSyllable] || [`${resultSyllable}로 시작하는 말`];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-lg box-border shadow-2xl text-center animate-pop max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Close Button */}
        <button
          onClick={() => {
            playSfx('tap');
            onClose();
          }}
          className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="border-b border-[#eedfc9] px-4 pt-4 pb-2.5 sm:px-6 sm:pt-5 text-center flex-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf3e4] text-[#c9502f] text-xs font-jua mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            자음 + 모음 소리 뽀뽀 놀이
          </div>
          <h2 className="text-xl sm:text-2xl font-jua text-[#1b1917]">
            글자 합체 소리 연구소 🧪
          </h2>
          <p className="text-xs text-[#8a8178] font-hand">
            자음과 모음이 만나면 어떤 소리가 탄생할까요?
          </p>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 box-border">

        {/* Interactive Combination Stage */}
        <div className="bg-white rounded-3xl p-3.5 sm:p-5 border-2 border-[#e4dccf] shadow-inner space-y-4">
          <div className="flex items-center justify-center gap-1.5 sm:gap-3">
            {/* Consonant Card */}
            <button
              type="button"
              onClick={() => speakKorean(`${currentChoName}의 ${currentCho}`)}
              className={`flex-1 max-w-[92px] h-24 rounded-2xl bg-[#faf8f5] border-2 border-[#eedfc9] flex flex-col items-center justify-center shadow-xs cursor-pointer transition-transform active:scale-95 ${
                isBlending ? 'translate-x-2 scale-105' : 'hover:scale-105'
              }`}
              title="소리 듣기"
            >
              <span className="text-[10px] font-hand text-[#8a8178]">{currentChoName}</span>
              <span className="text-3xl sm:text-4xl font-jua text-[#1b1917] mt-0.5">{currentCho}</span>
              <span className="text-[10px] text-[#c9502f]">🔊 듣기</span>
            </button>

            {/* Plus / Kiss Icon */}
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#fff5f2] border border-[#f5b8a6] text-[#c9502f] flex items-center justify-center flex-none">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#c9502f]" />
            </div>

            {/* Vowel Card */}
            <button
              type="button"
              onClick={() => speakKorean(currentJung)}
              className={`flex-1 max-w-[92px] h-24 rounded-2xl bg-[#faf8f5] border-2 border-[#eedfc9] flex flex-col items-center justify-center shadow-xs cursor-pointer transition-transform active:scale-95 ${
                isBlending ? '-translate-x-2 scale-105' : 'hover:scale-105'
              }`}
              title="소리 듣기"
            >
              <span className="text-[10px] font-hand text-[#8a8178]">모음</span>
              <span className="text-3xl sm:text-4xl font-jua text-[#c9502f] mt-0.5">{currentJung}</span>
              <span className="text-[10px] text-[#c9502f]">🔊 듣기</span>
            </button>

            <ArrowRight className="w-4 h-4 text-[#8a8178] flex-none" />

            {/* Result Syllable Card */}
            <button
              type="button"
              onClick={() => speakKorean(resultSyllable)}
              className={`flex-1 max-w-[104px] h-24 rounded-2xl bg-gradient-to-b from-[#fdf3e4] to-[#fce3cc] border-2 border-[#f5d7b5] flex flex-col items-center justify-center shadow-md relative cursor-pointer active:scale-95 ${
                hasBlended ? 'animate-pop' : ''
              }`}
              title="클릭하여 완성 글자 소리 듣기"
            >
              <span className="text-[10px] font-jua text-[#c9502f]">완성</span>
              <span className="text-4xl sm:text-5xl font-jua text-[#1b1917] leading-none">{resultSyllable}</span>
              <div className="absolute -bottom-2.5 px-2 py-0.5 rounded-full bg-[#c9502f] text-white text-[10px] font-jua flex items-center gap-1 shadow-xs whitespace-nowrap">
                <Volume2 className="w-3 h-3" /> 듣기
              </div>
            </button>
          </div>

          {/* Words containing this syllable */}
          <div className="pt-3 border-t border-[#f0ebe1] flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[#8a8178] font-hand">낱말:</span>
            {words.map((w, i) => (
              <button
                type="button"
                key={i}
                onClick={() => speakKorean(w)}
                className="min-h-[34px] text-xs font-jua px-2.5 py-1 rounded-xl bg-[#fdfaf5] border border-[#eedfc9] text-[#1b1917] cursor-pointer hover:bg-[#fff5f2] active:scale-95 transition-all flex items-center gap-1"
              >
                <span>{w}</span>
                <span className="text-[10px] text-[#c9502f]">🔊</span>
              </button>
            ))}
          </div>
        </div>

        {/* Consonant Selector (44px touch targets) */}
        <div className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-jua text-[#4a443e]">1. 첫소리 자음</span>
            <span className="text-[11px] text-[#c9502f] font-bold font-jua">{currentChoName}</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1.5">
            {CHO.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  playSfx('tap');
                  setSelectedChoIdx(i);
                  setHasBlended(false);
                  speakKorean(c);
                }}
                className={`w-11 h-11 rounded-xl font-jua text-lg flex items-center justify-center flex-none border transition-all active:scale-95 ${
                  selectedChoIdx === i
                    ? 'bg-[#1b1917] text-white border-[#1b1917] shadow-sm scale-105'
                    : 'bg-white text-[#1b1917] border-[#e4dccf] hover:border-[#1b1917]/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Vowel Selector (44px touch targets) */}
        <div className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-jua text-[#4a443e]">2. 가운데 모음</span>
            <span className="text-[11px] text-[#c9502f] font-bold font-jua">{currentJung}</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1.5">
            {JUNG.map((j, i) => (
              <button
                key={i}
                onClick={() => {
                  playSfx('tap');
                  setSelectedJungIdx(i);
                  setHasBlended(false);
                  speakKorean(j);
                }}
                className={`w-11 h-11 rounded-xl font-jua text-lg flex items-center justify-center flex-none border transition-all active:scale-95 ${
                  selectedJungIdx === i
                    ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-sm scale-105'
                    : 'bg-white text-[#1b1917] border-[#e4dccf] hover:border-[#c9502f]/40'
                }`}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        {/* Blend Action Button */}
        <div className="pt-2 pb-1">
          <button
            onClick={handleBlend}
            disabled={isBlending}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#c9502f] to-[#e6603a] hover:from-[#b84324] hover:to-[#d04e28] text-white font-jua text-base sm:text-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>{currentCho} + {currentJung} 소리 합체! (EXP +3)</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
