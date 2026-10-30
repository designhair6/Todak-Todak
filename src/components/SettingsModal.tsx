import React, { useState } from 'react';
import { X, Heart, Sparkles, Check, Crown } from 'lucide-react';
import { FRIENDS, THEMES, WISHES } from '../data/hangulData';
import { AnimalFriend, BoardTheme, StickerBoardState } from '../types';
import { playSfx } from '../utils/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardState: StickerBoardState;
  onSave: (name: string, childAge: string, friendId: string, themeId: string, wish: string, msg: string) => void;
  onOpenAdmin?: () => void;
  onOpenPrint?: () => void;
  onOpenSoundBlend?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  boardState,
  onSave,
  onOpenAdmin,
  onOpenPrint,
  onOpenSoundBlend,
}) => {
  const [name, setName] = useState(boardState.name || '시아');
  const [childAge, setChildAge] = useState(boardState.childAge || '5세');
  const [selectedFriend, setSelectedFriend] = useState(boardState.friend || 'bear');
  const [selectedTheme, setSelectedTheme] = useState(boardState.theme || 'home');
  const [selectedWish, setSelectedWish] = useState(boardState.wish || WISHES[0]);
  const [customWish, setCustomWish] = useState('');
  const [msg, setMsg] = useState(boardState.msg || '30일 동안 정말 멋졌어! 엄마가 꼭 들어줄게!');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSfx('fan');
    const finalWish = customWish.trim() || selectedWish;
    onSave(name.trim() || '우리 아이', childAge, selectedFriend, selectedTheme, finalWish, msg.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-left space-y-4 animate-pop max-h-[92vh] flex flex-col relative">
        <button
          onClick={() => {
            playSfx('tap');
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="border-b border-[#eedfc9] pb-2">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] text-xs font-jua mb-1">
            아이와 함께 맞춰봐요!
          </div>
          <h2 className="text-xl font-jua text-[#1b1917]">아이 프로필 & 약속 설정</h2>
          <p className="text-xs text-[#8a8178] font-hand">
            5세부터 7세까지 우리 아이 연령과 관심사에 딱 맞게 조절해요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 font-body">
          {/* Member Account ID Card (For Gift Granting & Web Billing Reference) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF9EE] to-[#FFF3DF] border border-[#F6D8A6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-jua text-[#8a5d1b] flex items-center gap-1">
                <span>👤</span>
                <span>내 회원 계정 정보</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-[#b45309] font-jua border border-[#fed7aa]">
                대표 계정
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/95 p-2 rounded-xl border border-[#eedfc9]">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-[#1b1917]">sia_mom</span>
                  <span className="text-[10px] text-[#8a8178] font-hand">(시아맘)</span>
                </div>
                <p className="text-[10px] text-[#78716c] font-hand">designhair6@gmail.com</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx('pop');
                  navigator.clipboard?.writeText('sia_mom');
                  alert('회원 ID (sia_mom)가 클립보드에 복사되었습니다!');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#fdf3e4] hover:bg-[#fbe7ce] text-[#c9502f] text-[11px] font-jua border border-[#f5d7b5] active:scale-95 transition-transform"
              >
                ID 복사
              </button>
            </div>
            <p className="text-[10px] text-[#8a5d1b] font-hand leading-tight">
              💡 선물(글자열매, 하트)을 받거나 웹 직접 결제를 신청하실 때 위 회원 ID(<b>sia_mom</b>)를 관리자에게 전달해주세요.
            </p>
          </div>

          {/* 1. Child Name & Age (5세, 6세, 7세) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1b1917] block">
                아이 이름 / 별명
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예) 시아, 민준이"
                maxLength={8}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#e4dccf] text-sm text-[#1b1917] font-jua focus:border-[#c9502f] outline-none bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1b1917] block">
                아이 나이 (5~7세)
              </label>
              <div className="grid grid-cols-3 gap-1">
                {['5세', '6세', '7세'].map((age) => (
                  <button
                    type="button"
                    key={age}
                    onClick={() => {
                      playSfx('tap');
                      setChildAge(age);
                    }}
                    className={`py-2 rounded-xl text-xs font-jua border transition-all ${
                      childAge === age
                        ? 'bg-[#c9502f] text-white border-[#c9502f] shadow-xs'
                        : 'bg-white text-[#4a443e] border-[#e4dccf]'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Companion Animal Friend */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1917] block">
              2. 함께 모험할 다마고치 동물 친구
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FRIENDS.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => {
                    playSfx('pop');
                    setSelectedFriend(f.id);
                  }}
                  className={`p-2 rounded-2xl border text-center transition-all ${
                    selectedFriend === f.id
                      ? 'border-[#c9502f] bg-[#fff5f2] shadow-xs scale-105'
                      : 'border-[#e4dccf] bg-white hover:border-[#c9502f]/40'
                  }`}
                >
                  <span className="text-2xl block">{f.e}</span>
                  <span className="text-xs font-jua text-[#1b1917] mt-0.5 block">
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sticker Board Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1917] block">
              3. 스티커 보드 모험 테마
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => {
                    playSfx('tap');
                    setSelectedTheme(t.id);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    selectedTheme === t.id
                      ? 'border-[#c9502f] bg-[#fff5f2] shadow-xs'
                      : 'border-[#e4dccf] bg-white hover:border-[#c9502f]/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-base mb-0.5">
                    {t.pack.slice(0, 3).join('')}
                  </div>
                  <span className="font-jua text-xs text-[#1b1917] block">{t.name}</span>
                  <span className="text-[10px] text-[#8a8178] font-hand">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Child's Wish when 30 are done */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1917] block">
              4. 30칸 다 채우면 엄마가 들어줄 소원
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WISHES.map((w, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    playSfx('tap');
                    setSelectedWish(w);
                    setCustomWish('');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-hand border transition-all ${
                    selectedWish === w && !customWish
                      ? 'bg-[#1b1917] text-white border-[#1b1917]'
                      : 'bg-white text-[#4a443e] border-[#e4dccf]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customWish}
              onChange={(e) => setCustomWish(e.target.value)}
              placeholder="직접 쓰기 (예: 알라딘 요술램프 사기)"
              maxLength={25}
              className="w-full px-3 py-2 rounded-xl border border-[#e4dccf] text-xs bg-white text-[#1b1917] focus:border-[#c9502f] outline-none"
            />
          </div>

          {/* 5. Mom's message */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1b1917] block">
              5. 소원권에 들어갈 엄마의 약속 한마디
            </label>
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              maxLength={35}
              required
              className="w-full px-3 py-2 rounded-xl border border-[#e4dccf] text-xs bg-white text-[#1b1917] focus:border-[#c9502f] outline-none"
            />
          </div>

          {/* Quick Shortcuts: Print Center & Sound Blend */}
          {(onOpenPrint || onOpenSoundBlend) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onOpenPrint && (
                <button
                  type="button"
                  onClick={() => {
                    playSfx('tap');
                    onClose();
                    onOpenPrint();
                  }}
                  className="p-2.5 rounded-xl bg-white border border-[#e4dccf] hover:bg-[#faf8f5] text-left flex items-center gap-2 transition-all active:scale-95"
                >
                  <span className="text-lg">🖨️</span>
                  <div>
                    <span className="font-jua text-xs text-[#1b1917] block">학습지·상장 출력</span>
                    <span className="text-[10px] text-[#8a8178] font-hand">A4 인쇄 도안</span>
                  </div>
                </button>
              )}

              {onOpenSoundBlend && (
                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    onClose();
                    onOpenSoundBlend();
                  }}
                  className="p-2.5 rounded-xl bg-[#fff5f2] border border-[#fcd5cb] hover:bg-[#ffece6] text-left flex items-center gap-2 transition-all active:scale-95"
                >
                  <span className="text-lg">🧩</span>
                  <div>
                    <span className="font-jua text-xs text-[#c9502f] block">소리합체 놀이방</span>
                    <span className="text-[10px] text-[#8a8178] font-hand">자음+모음 결합</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* 6. Admin Entry for Creator */}
          {onOpenAdmin && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-none">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-jua text-xs text-amber-950">서비스 관리자 콘솔 (대표님 전용)</p>
                  <p className="text-[10px] text-amber-800 font-hand">30일 체험일수 조절, 커뮤니티 검수, 백업</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx('pop');
                  onClose();
                  onOpenAdmin();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-jua text-[11px] shadow-2xs flex-none"
              >
                관리자 열기 👑
              </button>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-white border border-[#e4dccf] text-[#8a8178] font-jua text-sm"
            >
              닫기
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-md"
            >
              설정 저장하기 ✨
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
