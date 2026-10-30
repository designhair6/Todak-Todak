import React, { useState } from 'react';
import {
  Volume2,
  Volume1,
  VolumeX,
  Printer,
  Gift,
  Sparkles,
  Heart,
  Puzzle,
  Settings,
  ChevronDown,
  Crown,
  Lock,
  Check,
} from 'lucide-react';
import { AnimalFriend, BoardTheme, PetGrowthState, SoundVolume } from '../types';
import { playSfx } from '../utils/sound';

interface HeaderProps {
  childName: string;
  childAge: string;
  friend: AnimalFriend;
  theme: BoardTheme;
  petState: PetGrowthState;
  soundVolume: SoundVolume;
  onCycleVolume: () => void;
  onOpenTrial: () => void;
  onOpenPrint: () => void;
  onOpenPetModal: () => void;
  onOpenSoundBlend: () => void;
  onEditProfile: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  trialDaysLeft: number;
  isSubscribed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  childName,
  childAge,
  friend,
  petState,
  soundVolume,
  onCycleVolume,
  onOpenTrial,
  onOpenPrint,
  onOpenPetModal,
  onOpenSoundBlend,
  onEditProfile,
  onOpenAdmin,
  isAdmin,
  trialDaysLeft,
  isSubscribed = false,
}) => {
  const petIcon = petState.level === 1 ? '🥚' : petState.level === 2 ? '🐣' : friend.e;

  const renderVolumeIcon = () => {
    switch (soundVolume) {
      case 'loud':
        return <Volume2 className="w-4 h-4 text-emerald-600" />;
      case 'medium':
        return <Volume1 className="w-4 h-4 text-amber-600" />;
      case 'soft':
      default:
        return <Volume1 className="w-4 h-4 text-stone-400" />;
    }
  };

  const isLocked = trialDaysLeft <= 0 && !isSubscribed;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#EFE8DE] px-3 sm:px-4 py-2 flex items-center justify-between sticky top-0 z-40 transition-all">
      {/* Brand & Child Identity (Left - Non-shrinking, clean single line) */}
      <div
        onClick={() => {
          playSfx('pop');
          if (isLocked) {
            onOpenTrial();
          } else {
            onEditProfile();
          }
        }}
        className="flex items-center gap-2 cursor-pointer group shrink-0 min-w-0"
        title="아이 프로필 & 설정"
      >
        {/* Brand Icon */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#F4A261] to-[#E76F51] p-1 shadow-2xs flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
          <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
            <path
              d="M7 8C7 6.89543 7.89543 6 9 6H23C24.1046 6 25 6.89543 25 8V12C25 13.1046 24.1046 14 23 14H18V24C18 25.1046 17.1046 26 16 26H12C10.8954 26 10 25.1046 10 24V14H9C7.89543 14 7 13.1046 7 12V8Z"
              fill="white"
              fillOpacity="0.95"
            />
            <circle cx="23" cy="21" r="4.5" fill="#FEF08A" />
            <path
              d="M23 18.5C23.5 19.5 24.5 20 25.5 20C24.5 21 23.5 21.5 23 22.5C22.5 21.5 21.5 21 20.5 20C21.5 20 22.5 19.5 23 18.5Z"
              fill="#E76F51"
            />
          </svg>
        </div>

        {/* Brand Name (Clean & Elegant) */}
        <div className="flex items-center min-w-0">
          <span className="font-jua text-lg sm:text-xl text-[#2D2825] tracking-tight whitespace-nowrap">
            토닥한글
          </span>
        </div>
      </div>

      {/* Right Action Tools: Clean, Compact, Never-wrapping items */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 1. Pet Character Pill */}
        <button
          onClick={() => {
            playSfx('pet');
            if (isLocked) {
              onOpenTrial();
            } else {
              onOpenPetModal();
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#F2F7F2] to-[#E4F0E3] hover:from-[#E3EFE2] border border-[#CFE1CE] text-[#3D664E] text-xs font-jua shadow-2xs active:scale-95 transition-all"
          title="다마고치 캐릭터 키우기"
        >
          <span className="text-sm">{petIcon}</span>
          <span className="font-bold">Lv.{petState.level}</span>
        </button>

        {/* 2. Sound Volume: Compact Icon Button (No wrapping text!) */}
        <button
          onClick={() => {
            playSfx('tap');
            onCycleVolume();
          }}
          className="w-8 h-8 rounded-xl bg-white hover:bg-[#F5EFEB] border border-[#EFE8DE] flex items-center justify-center transition-all active:scale-95 shadow-2xs"
          title={`소리 크기: ${soundVolume === 'soft' ? '약' : soundVolume === 'medium' ? '중' : '강'} (클릭하여 변경)`}
        >
          {renderVolumeIcon()}
        </button>

        {/* 3. Optional Desktop Quick Tools (Hidden on narrow mobile to keep header clean) */}
        <button
          onClick={() => {
            playSfx('pop');
            if (isLocked) {
              onOpenTrial();
            } else {
              onOpenSoundBlend();
            }
          }}
          className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#FFF1ED] hover:bg-[#FFE5DE] border border-[#FCD5CB] text-[#E76F51] text-xs font-jua transition-all active:scale-95 shadow-2xs"
          title="자음+모음 소리 합체 놀이"
        >
          <Puzzle className="w-3.5 h-3.5" />
          <span>소리합체</span>
        </button>

        <button
          onClick={() => {
            playSfx('tap');
            if (isLocked) {
              onOpenTrial();
            } else {
              onOpenPrint();
            }
          }}
          className="hidden md:flex w-8 h-8 rounded-xl bg-white hover:bg-[#F5EFEB] border border-[#EFE8DE] text-[#2D2825] items-center justify-center transition-all active:scale-95 shadow-2xs"
          title="A4 진도표, 30일 완주 상장 출력"
        >
          <Printer className="w-3.5 h-3.5 text-[#E76F51]" />
        </button>

        {/* 4. 30-Day Free Trial / Subscription Badge */}
        <button
          onClick={() => {
            playSfx('tap');
            onOpenTrial();
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-2xs active:scale-95 transition-all whitespace-nowrap ${
            isSubscribed
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
              : trialDaysLeft <= 0
              ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-600 animate-pulse'
              : 'bg-gradient-to-r from-[#FFF1ED] to-[#FFE8E1] hover:from-[#FDE0D7] border-[#FCD5CB] text-[#E76F51]'
          }`}
          title="30일 무료 체험 및 결제 상태"
        >
          {isSubscribed ? (
            <>
              <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
              <span className="font-jua text-[11px]">구독중</span>
            </>
          ) : trialDaysLeft <= 0 ? (
            <>
              <Lock className="w-3 h-3 text-red-600 stroke-[2.5]" />
              <span className="font-jua text-[11px] text-red-600">결제필요</span>
            </>
          ) : (
            <>
              <Gift className="w-3.5 h-3.5 text-[#E76F51]" />
              <span className="font-jua text-[11px]">D-{trialDaysLeft}</span>
            </>
          )}
        </button>

        {/* 5. Settings / More Menu Gear Button (Clean single entry) */}
        <button
          onClick={() => {
            playSfx('pop');
            onEditProfile();
          }}
          className="w-8 h-8 rounded-xl bg-white hover:bg-[#F5EFEB] border border-[#EFE8DE] flex items-center justify-center text-[#7D736A] hover:text-[#1b1917] transition-all active:scale-95 shadow-2xs"
          title="아이 프로필 & 설정"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
