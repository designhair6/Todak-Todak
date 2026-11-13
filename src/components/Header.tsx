import React, { useState } from 'react';
import {
  Volume2,
  Volume1,
  VolumeX,
  Printer,
  Gift,
  Sparkles,
  Heart,
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
    <header className="w-full max-w-full box-border overflow-hidden bg-white/95 backdrop-blur-md border-b border-[#EFE8DE] px-4 sm:px-5 py-2 flex items-center justify-between gap-2 sticky top-0 z-40 transition-all">
      {/* Brand Identity */}
      <button
        type="button"
        onClick={() => {
          playSfx('pop');
          if (isLocked) {
            onOpenTrial();
          } else {
            onEditProfile();
          }
        }}
        className="flex items-center gap-2 cursor-pointer group shrink-0 min-w-0 min-h-[40px] text-left"
        title="아이 프로필 & 설정"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#F4A261] to-[#E76F51] p-1 shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
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

        <span className="font-jua text-base sm:text-xl text-[#2D2825] tracking-tight whitespace-nowrap">
          토닥한글
        </span>
      </button>

      {/* Right Action Tools: Tactile >=40px buttons, never wraps */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* 1. Pet Character Button */}
        <button
          type="button"
          onClick={() => {
            playSfx('pet');
            if (isLocked) {
              onOpenTrial();
            } else {
              onOpenPetModal();
            }
          }}
          className="h-10 flex items-center gap-1 px-2.5 rounded-2xl bg-gradient-to-r from-[#F2F7F2] to-[#E4F0E3] hover:from-[#E3EFE2] border border-[#CFE1CE] text-[#3D664E] text-xs font-jua shadow-2xs active:scale-95 transition-all whitespace-nowrap shrink-0"
          title="다마고치 친구의 방"
        >
          <span className="text-base leading-none">{petIcon}</span>
          <span className="font-bold">Lv.{petState.level}</span>
        </button>

        {/* 2. Sound Volume */}
        <button
          type="button"
          onClick={() => {
            playSfx('tap');
            onCycleVolume();
          }}
          className="w-10 h-10 rounded-2xl bg-white hover:bg-[#F5EFEB] border border-[#EFE8DE] flex items-center justify-center transition-all active:scale-95 shadow-2xs shrink-0"
          title={`소리 크기: ${soundVolume === 'soft' ? '약' : soundVolume === 'medium' ? '중' : '강'}`}
        >
          {renderVolumeIcon()}
        </button>

        {/* Print shortcut on wider screens */}
        <button
          type="button"
          onClick={() => {
            playSfx('tap');
            if (isLocked) {
              onOpenTrial();
            } else {
              onOpenPrint();
            }
          }}
          className="hidden md:flex w-10 h-10 rounded-2xl bg-white hover:bg-[#F5EFEB] border border-[#EFE8DE] text-[#2D2825] items-center justify-center transition-all active:scale-95 shadow-2xs shrink-0"
          title="A4 학습지·상장 인쇄"
        >
          <Printer className="w-4 h-4 text-[#E76F51]" />
        </button>

        {/* 4. Trial / Subscription */}
        <button
          type="button"
          onClick={() => {
            playSfx('tap');
            onOpenTrial();
          }}
          className={`h-10 flex items-center gap-1 px-2.5 rounded-2xl border text-xs font-bold shadow-2xs active:scale-95 transition-all whitespace-nowrap shrink-0 ${
            isSubscribed
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
              : trialDaysLeft <= 0
              ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-600'
              : 'bg-gradient-to-r from-[#FFF1ED] to-[#FFE8E1] hover:from-[#FDE0D7] border-[#FCD5CB] text-[#E76F51]'
          }`}
          title="이용권 상태 확인"
        >
          {isSubscribed ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span className="font-jua text-xs">구독중</span>
            </>
          ) : trialDaysLeft <= 0 ? (
            <>
              <Lock className="w-3.5 h-3.5 text-red-600 stroke-[2.5]" />
              <span className="font-jua text-xs text-red-600">이용권</span>
            </>
          ) : (
            <>
              <Gift className="w-3.5 h-3.5 text-[#E76F51]" />
              <span className="font-jua text-xs">D-{trialDaysLeft}</span>
            </>
          )}
        </button>

        {/* 5. Settings */}
        <button
          type="button"
          onClick={() => {
            playSfx('pop');
            onEditProfile();
          }}
          className="w-10 h-10 rounded-2xl bg-white hover:bg-[#F5EFEB] border border-[#EFE8DE] flex items-center justify-center text-[#7D736A] hover:text-[#1b1917] transition-all active:scale-95 shadow-2xs shrink-0"
          title="아이 프로필 & 설정"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
