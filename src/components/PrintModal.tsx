import React, { useState } from 'react';
import { X, Printer, FileText, CheckCircle2, Heart, BookOpen, Award, Sparkles } from 'lucide-react';
import { CHO, JUNG, syl, MISSIONS, WEEKS, THEMES } from '../data/hangulData';
import { DailyMomDiary } from '../types';
import { playSfx } from '../utils/sound';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  childAge: string;
  diaries: Record<number, DailyMomDiary>;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  childName,
  childAge,
  diaries,
}) => {
  const [printType, setPrintType] = useState<'chart' | 'diary' | 'certificate' | 'sticker_sheet'>('chart');
  const [stickerThemeIdx, setStickerThemeIdx] = useState(0);

  if (!isOpen) return null;

  const handlePrint = () => {
    playSfx('fan');
    window.print();
  };

  const writtenDays = Object.keys(diaries).map(Number).sort((a, b) => a - b);
  const selectedTheme = THEMES[stickerThemeIdx % THEMES.length];

  // Consonant list with sample words for the poster
  const CONSONANTS_INFO = [
    { char: 'ㄱ', name: '기역', word: '기린', emoji: '🦒' },
    { char: 'ㄴ', name: '니은', word: '나비', emoji: '🦋' },
    { char: 'ㄷ', name: '디귿', word: '다람쥐', emoji: '🐿️' },
    { char: 'ㄹ', name: '리을', word: '라디오', emoji: '📻' },
    { char: 'ㅁ', name: '미음', word: '모자', emoji: '🧢' },
    { char: 'ㅂ', name: '비읍', word: '바나나', emoji: '🍌' },
    { char: 'ㅅ', name: '시옷', word: '사자', emoji: '🦁' },
    { char: 'ㅇ', name: '이응', word: '오리', emoji: '🦆' },
    { char: 'ㅈ', name: '지읒', word: '자동차', emoji: '🚗' },
    { char: 'ㅊ', name: '치읓', word: '치즈', emoji: '🧀' },
    { char: 'ㅋ', name: '키읗', word: '코끼리', emoji: '🐘' },
    { char: 'ㅌ', name: '티읕', word: '토끼', emoji: '🐰' },
    { char: 'ㅍ', name: '피읖', word: '포도', emoji: '🍇' },
    { char: 'ㅎ', name: '히읗', word: '하마', emoji: '🦛' },
  ];

  const VOWELS_INFO = [
    { char: 'ㅏ', sound: '아', word: '아이', emoji: '👶' },
    { char: 'ㅑ', sound: '야', word: '야구', emoji: '⚾' },
    { char: 'ㅓ', sound: '어', word: '어머니', emoji: '👩' },
    { char: 'ㅕ', sound: '여', word: '여우', emoji: '🦊' },
    { char: 'ㅗ', sound: '오', word: '오이', emoji: '🥒' },
    { char: 'ㅛ', sound: '요', word: '요리', emoji: '🍳' },
    { char: 'ㅜ', sound: '우', word: '우유', emoji: '🥛' },
    { char: 'ㅠ', sound: '유', word: '유리', emoji: '🪟' },
    { char: 'ㅡ', sound: '으', word: '으뜸', emoji: '👍' },
    { char: 'ㅣ', sound: '이', word: '이야기', emoji: '📖' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn print:p-0 print:bg-white print:static">
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full">
        {/* Modal Top Bar (hidden on print) */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-[#e4dccf] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#c9502f]" />
            <h2 className="font-jua text-base sm:text-lg text-[#1b1917]">
              종이로 출력하기 (A4 프린트 &amp; PDF 저장)
            </h2>
          </div>
          <button
            onClick={() => {
              playSfx('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#f6f1e7] hover:bg-[#ebd9c7] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Tab Selector Buttons: 자음·모음판, 일기장 책, 완주 상장, 스티커판 도안 */}
        <div className="grid grid-cols-4 border-b border-[#e4dccf] bg-[#f5ecdd] p-1.5 sm:p-2 gap-1 sm:gap-1.5 print:hidden">
          {[
            { id: 'chart', label: '🔤 자음·모음판' },
            { id: 'diary', label: '📖 일기장 책' },
            { id: 'certificate', label: '🏆 완주 상장' },
            { id: 'sticker_sheet', label: '🌟 스티커판 도안' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playSfx('tap');
                setPrintType(tab.id as typeof printType);
              }}
              className={`py-2 px-1 sm:px-3 rounded-xl font-jua text-xs sm:text-sm text-center transition-all truncate ${
                printType === tab.id
                  ? 'bg-white text-[#c9502f] shadow-xs font-bold'
                  : 'text-[#8a8178] hover:text-[#1b1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Printable Preview Container with ample padding to avoid cutoff */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 bg-white text-[#1b1917] print:p-2 print:overflow-visible font-body">

          {/* 1. 한글 자음·모음판 (벽/냉장고 부착용 A4 포스터) */}
          {printType === 'chart' && (
            <div className="space-y-4">
              <div className="flex items-end justify-between border-b-2 border-[#1b1917] pb-2 text-center sm:text-left">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#fdf3e4] border border-[#f3dfc6] text-xs font-bold text-[#c9502f] font-jua mb-1">
                    벽 &amp; 냉장고 부착용 매일 한글 포스터
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-jua text-[#1b1917]">
                    🔤 {childName || '우리 아이'}의 한글 자음·모음 탐험판
                  </h1>
                </div>
                <div className="text-right text-xs font-hand text-[#8a8178] hidden sm:block">
                  손가락으로 콕콕 짚으며 소리내어 읽어요! ✨
                </div>
              </div>

              {/* 기본 자음 14자 */}
              <div className="border border-[#1b1917] rounded-2xl p-3 bg-[#fffdf9] space-y-2">
                <div className="flex items-center justify-between border-b border-[#e4dccf] pb-1">
                  <span className="font-jua text-sm text-[#c9502f] flex items-center gap-1.5">
                    <span>① 기본 자음 14자</span>
                    <span className="text-[11px] font-normal text-[#8a8178]">(기역부터 히읗까지)</span>
                  </span>
                  <span className="text-[11px] font-hand text-[#8a8178]">
                    입과 목구멍의 모양을 본떠 만들었어요
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {CONSONANTS_INFO.map((item) => (
                    <div
                      key={item.char}
                      className="border border-[#e4dccf] rounded-xl p-1.5 text-center bg-white shadow-2xs hover:border-[#c9502f] transition-colors"
                    >
                      <div className="font-jua text-2xl sm:text-3xl text-[#1b1917] leading-none mb-1">
                        {item.char}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-[#c9502f] font-jua">
                        {item.name}
                      </div>
                      <div className="text-[9px] text-[#8a8178] font-hand flex items-center justify-center gap-0.5">
                        <span>{item.emoji}</span>
                        <span>{item.word}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 기본 모음 10자 */}
              <div className="border border-[#1b1917] rounded-2xl p-3 bg-[#fffdf9] space-y-2">
                <div className="flex items-center justify-between border-b border-[#e4dccf] pb-1">
                  <span className="font-jua text-sm text-[#2b6cb0] flex items-center gap-1.5">
                    <span>② 기본 모음 10자</span>
                    <span className="text-[11px] font-normal text-[#8a8178]">(하늘 • 땅 • 사람의 조화)</span>
                  </span>
                  <span className="text-[11px] font-hand text-[#8a8178]">
                    입을 크게 벌리고 예쁜 소리를 내요
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
                  {VOWELS_INFO.map((item) => (
                    <div
                      key={item.char}
                      className="border border-[#e4dccf] rounded-xl p-1.5 text-center bg-white shadow-2xs hover:border-[#2b6cb0] transition-colors"
                    >
                      <div className="font-jua text-2xl sm:text-3xl text-[#1b1917] leading-none mb-1">
                        {item.char}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-[#2b6cb0] font-jua">
                        [{item.sound}]
                      </div>
                      <div className="text-[9px] text-[#8a8178] font-hand flex items-center justify-center gap-0.5">
                        <span>{item.emoji}</span>
                        <span>{item.word}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 소리 결합 미니 가갸표 (대표 자음 ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ, ㅈ, ㅎ) */}
              <div className="border border-[#1b1917] rounded-2xl p-3 bg-[#faf8f5] space-y-2">
                <div className="flex items-center justify-between border-b border-[#e4dccf] pb-1">
                  <span className="font-jua text-xs sm:text-sm text-[#1b1917]">
                    ③ 소리 합체표 (자음 + 모음 = 글자!)
                  </span>
                  <span className="text-[11px] font-hand text-[#8a8178]">
                    예: ㄱ + ㅏ = '가'
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f0ebe1] text-[#1b1917] font-jua">
                        <th className="p-1 border border-[#e4dccf] text-[10px]">자\모</th>
                        {['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'].map((m) => (
                          <th key={m} className="p-1 border border-[#e4dccf] text-xs font-bold text-[#2b6cb0]">
                            {m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-jua text-[11px]">
                      {['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ'].map((c) => {
                        const cIdx = CHO.indexOf(c);
                        return (
                          <tr key={c} className="hover:bg-white/80">
                            <td className="p-1 border border-[#e4dccf] font-bold text-[#c9502f] bg-[#fbf8f2]">
                              {c}
                            </td>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((vIdx) => (
                              <td key={vIdx} className="p-1 border border-[#e4dccf] text-[#1b1917]">
                                {syl(cIdx, vIdx)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 하단 칭찬 서명 */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1b1917] font-hand text-xs text-[#8a8178]">
                <span>"엄마와 함께 짚어보며 하루 한 글자씩 알아가요!"</span>
                <span className="text-[#1b1917] font-bold">
                  칭찬 도장 찍는 곳: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                </span>
              </div>
            </div>
          )}

          {printType === 'diary' && (
            <div className="space-y-5">
              <div className="flex items-end justify-between border-b-2 border-[#1b1917] pb-3 text-center sm:text-left">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#fdf3e4] border border-[#f3dfc6] text-xs font-bold text-[#c9502f] font-jua mb-1">
                    세상에 단 하나뿐인 추억 선물
                  </div>
                  <h1 className="text-2xl font-jua text-[#1b1917]">
                    📖 {childName || '아이'}와 함께한 엄마의 30일 한글 일기장
                  </h1>
                  <p className="text-xs text-[#8a8178] font-hand">
                    아이: {childName || '우리 아이'} ({childAge || '5세'}) • 기록한 일기 {writtenDays.length}편
                  </p>
                </div>
                <div className="text-right text-xs font-hand text-[#8a8178] hidden sm:block">
                  엄마의 따뜻한 손글씨 기록
                </div>
              </div>

              {writtenDays.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8a8178] font-hand border-2 border-dashed border-[#e4dccf] rounded-2xl">
                  아직 기록된 날짜별 일기가 없습니다.<br />
                  30일 체크 화면에서 각 일차를 터치하여 일기를 작성해보세요!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {writtenDays.map((dNum) => {
                    const entry = diaries[dNum];
                    const mission = MISSIONS[dNum - 1] || { t: '한글 놀이', s: '' };

                    return (
                      <div
                        key={dNum}
                        className="border border-[#1b1917] rounded-xl p-3.5 bg-[#faf8f5] space-y-1.5 break-inside-avoid"
                      >
                        <div className="flex items-center justify-between border-b border-[#e4dccf] pb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-jua text-sm text-[#c9502f]">D+{dNum}</span>
                            <span className="text-sm">{entry.mood}</span>
                            <span className="text-[11px] font-bold text-[#1b1917] truncate max-w-[120px]">
                              {mission.t}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8a8178] font-hand">{entry.date}</span>
                        </div>
                        <p className="text-xs text-[#4a443e] font-hand whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>
                        {entry.photoUrl && (
                          <img
                            src={entry.photoUrl}
                            alt="일기 사진"
                            className="max-h-24 rounded-lg object-contain mx-auto border border-[#e4dccf] bg-white"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t border-[#1b1917] text-center font-hand text-xs text-[#8a8178]">
                "매일 10분, 너와 함께 눈 맞추며 웃었던 소중한 시간들을 평생 간직할게." - 사랑하는 엄마가
              </div>
            </div>
          )}

          {/* Official 30-Day Completion Certificate (고품질 골드 상장) */}
          {printType === 'certificate' && (
            <div className="p-8 sm:p-10 border-8 border-double border-[#d4972d] rounded-3xl bg-gradient-to-b from-[#fffefc] via-[#fffdf7] to-[#fffaf0] text-center space-y-6 relative overflow-hidden my-2 shadow-inner">
              {/* Corner Ornaments */}
              <div className="absolute top-3 left-3 text-2xl text-[#d4972d]">⚜️</div>
              <div className="absolute top-3 right-3 text-2xl text-[#d4972d]">⚜️</div>
              <div className="absolute bottom-3 left-3 text-2xl text-[#d4972d]">⚜️</div>
              <div className="absolute bottom-3 right-3 text-2xl text-[#d4972d]">⚜️</div>

              {/* Header Badge & Title */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-xs font-bold text-[#b45309] font-jua">
                  <span>✨ 제 2026 - 30 일 완주 공식 인증서 ✨</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-jua text-[#1b1917] tracking-widest drop-shadow-xs">
                  상&nbsp;&nbsp;&nbsp;&nbsp;장
                </h1>
                <p className="text-sm font-bold text-[#c9502f] font-jua">
                  🏆 슈퍼 한글 탐험 마스터 상 🏆
                </p>
              </div>

              {/* Mascot Icons Row */}
              <div className="flex justify-center gap-4 text-3xl select-none">
                <span>🐻</span>
                <span>🦁</span>
                <span>🐰</span>
                <span>🐱</span>
                <span>🦖</span>
              </div>

              {/* Recipient Details */}
              <div className="bg-white/80 p-4 rounded-2xl border border-[#eedfc9] max-w-md mx-auto space-y-1.5 font-jua text-left text-base shadow-xs">
                <div className="flex justify-between items-center border-b border-[#f0ebe1] pb-1.5">
                  <span className="text-[#8a8178] text-sm">성&nbsp;&nbsp;&nbsp;&nbsp;명:</span>
                  <span className="text-2xl text-[#c9502f] font-bold">{childName || '우리 아이'}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[#8a8178] text-sm">연&nbsp;&nbsp;&nbsp;&nbsp;령:</span>
                  <span className="text-base text-[#1b1917]">{childAge || '5세'} 어린이</span>
                </div>
              </div>

              {/* Commendation Body */}
              <p className="font-hand text-base sm:text-lg leading-relaxed text-[#1b1917] max-w-lg mx-auto whitespace-pre-line py-2">
                위 어린이는 엄마와 함께한 30일 동안<br />
                매일 포기하지 않고 씩씩하고 즐겁게 놀며<br />
                아름다운 한글의 소리와 글자 모양을 훌륭하게 깨쳤으므로<br />
                온 가족의 큰 사랑과 넘치는 자랑스러움을 담아<br />
                이 빛나는 상장을 수여합니다.
              </p>

              {/* Golden Seal Stamp & Signatures */}
              <div className="pt-4 flex items-center justify-between px-6 max-w-md mx-auto">
                <div className="text-left font-hand text-xs text-[#8a8178] space-y-0.5">
                  <div>수여일: {new Date().toLocaleDateString('ko-KR')}</div>
                  <div>장소: 우리 집 따뜻한 공부 책상</div>
                  <div className="text-[#c9502f] font-bold">평생 칭찬 보증 ✨</div>
                </div>

                {/* Royal Gold Seal */}
                <div className="w-22 h-22 rounded-full border-4 border-[#d4972d] bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#b45309] flex flex-col items-center justify-center font-jua shadow-md transform -rotate-6">
                  <span className="text-2xl">👑</span>
                  <span className="text-[11px] font-bold">최고예요!</span>
                  <span className="text-[9px] text-[#92400e]">엄마의 사랑</span>
                </div>
              </div>

              <div className="pt-3 font-jua text-lg sm:text-xl text-[#1b1917] border-t border-[#eedfc9]">
                수여인: 세상에서 가장 너를 사랑하는 <span className="text-[#c9502f]">엄마 &amp; 아빠</span> 💖
              </div>
            </div>
          )}

          {/* Printable 30-Slot Sticker Board Sheets with Cut-out Coupon */}
          {printType === 'sticker_sheet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1b1917] pb-3 print:hidden">
                <div>
                  <h2 className="font-jua text-lg text-[#1b1917]">
                    A4 칭찬 스티커판 실물 도안 출력
                  </h2>
                  <p className="text-xs text-[#8a8178] font-hand">
                    원하는 테마를 골라 A4 종이로 뽑아 냉장고나 아이 방에 붙여주세요!
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {THEMES.slice(0, 3).map((t, idx) => (
                    <button
                      key={t.id}
                      onClick={() => setStickerThemeIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl font-jua text-xs border transition-all ${
                        stickerThemeIdx === idx
                          ? 'bg-[#c9502f] text-white border-[#c9502f]'
                          : 'bg-white text-[#4a443e] border-[#e4dccf]'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Printable Board Sheet Canvas */}
              <div className="p-6 border-4 border-[#1b1917] rounded-3xl bg-white text-center space-y-4">
                <div className="space-y-1">
                  <div className="inline-block px-3 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] font-jua text-xs">
                    {selectedTheme.name} 🗺️
                  </div>
                  <h1 className="text-2xl font-jua text-[#1b1917]">
                    {childName || '우리 아이'}의 30일 칭찬 스티커 모험판
                  </h1>
                  <p className="text-xs text-[#8a8178] font-hand">
                    하루 10분 한글 미션을 완료하고 칭찬 스티커를 1칸씩 붙여요!
                  </p>
                </div>

                {/* 30 Circular Slots Grid */}
                <div className="grid grid-cols-6 gap-2.5 max-w-lg mx-auto py-2">
                  {Array.from({ length: 30 }, (_, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-2xl border-2 border-dashed border-[#1b1917] flex flex-col items-center justify-center text-xs font-jua bg-[#faf8f5]"
                    >
                      <span className="text-gray-400 text-xs font-bold">{idx + 1}</span>
                      <span className="text-[10px] text-gray-300">★</span>
                    </div>
                  ))}
                </div>

                {/* Cut-out Official Wish Coupon at bottom */}
                <div className="pt-3 border-t-2 border-dashed border-[#c9502f] mt-4 p-3 bg-[#fff9f5] rounded-2xl text-left space-y-1">
                  <div className="flex items-center justify-between text-xs font-jua text-[#c9502f]">
                    <span>✂️ [가위로 오려서 쓰는] 30일 완주 특별 소원권</span>
                    <span>No. 2026-HAPPY</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#1b1917]">
                    <span>약속 내용: ___________________________________</span>
                    <span className="text-right font-hand text-[11px] text-[#8a8178]">엄마 서명: _______</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] font-hand text-[#8a8178] px-2">
                  <span>30칸 완주 시 소원권을 오려서 아이에게 선물하세요!</span>
                  <span>발행인: 사랑하는 엄마</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions (hidden on print) */}
        <div className="p-4 bg-white border-t border-[#e4dccf] flex items-center justify-between gap-3 print:hidden">
          <p className="text-xs text-[#8a8178] font-hand">
            💡 브라우저 인쇄 창에서 'PDF로 저장' 또는 프린터를 선택하세요.
          </p>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            지금 인쇄하기
          </button>
        </div>
      </div>
    </div>
  );
};
