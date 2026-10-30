import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Gift,
  CheckCircle2,
  Heart,
  Sparkles,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  Award,
  Lock,
  Unlock,
  Crown,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { playSfx } from '../utils/sound';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysLeft: number;
  onExtendTrial: (days?: number) => void;
  isSubscribed?: boolean;
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export const TrialModal: React.FC<TrialModalProps> = ({
  isOpen,
  onClose,
  daysLeft,
  onExtendTrial,
  isSubscribed = false,
  onSubscribe,
  isAdmin = false,
  onOpenAdmin,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'kakao' | 'naver' | 'google' | 'bank'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLockWarning, setShowLockWarning] = useState(false);

  if (!isOpen) return null;

  const isMandatoryLock = daysLeft <= 0 && !isSubscribed;

  // Attempt to close modal
  const handleAttemptClose = () => {
    if (isMandatoryLock) {
      playSfx('tap');
      setShowLockWarning(true);
      setTimeout(() => setShowLockWarning(false), 3000);
      return;
    }
    playSfx('tap');
    onClose();
  };

  // Simulated Payment Checkout
  const handleExecutePayment = () => {
    setIsProcessing(true);
    playSfx('pop');

    setTimeout(() => {
      setIsProcessing(false);
      playSfx('fan');
      confetti({ particleCount: 70, spread: 85, origin: { y: 0.5 } });
      onSubscribe(selectedPlan);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-pop relative flex flex-col max-h-[92vh]">
        
        {/* Close Button (Disabled or warns when mandatory locked) */}
        {!isMandatoryLock ? (
          <button
            onClick={handleAttemptClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] transition-all"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        ) : isAdmin ? (
          <button
            onClick={() => {
              playSfx('tap');
              onClose();
            }}
            className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-jua flex items-center gap-1 shadow-2xs"
            title="관리자 권한으로 닫기"
          >
            <Crown className="w-3 h-3 text-amber-700" />
            <span>관리자 닫기</span>
          </button>
        ) : null}

        {/* Modal Header */}
        <div
          className={`p-6 pb-4 text-center border-b transition-colors ${
            isSubscribed
              ? 'bg-gradient-to-b from-[#eafaf1] to-[#fbf8f2] border-[#bbf7d0]'
              : isMandatoryLock
              ? 'bg-gradient-to-b from-[#fee2e2] via-[#fff1f2] to-[#fbf8f2] border-[#fecaca]'
              : 'bg-gradient-to-b from-[#fbeee4] to-[#fbf8f2] border-[#eedfc9]'
          }`}
        >
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-md mb-2.5 ${
              isSubscribed
                ? 'bg-[#16a34a]'
                : isMandatoryLock
                ? 'bg-[#dc2626] animate-pulse'
                : 'bg-[#c9502f]'
            }`}
          >
            {isSubscribed ? (
              <Check className="w-8 h-8" />
            ) : isMandatoryLock ? (
              <Lock className="w-7 h-7" />
            ) : (
              <Gift className="w-8 h-8 animate-bounce" />
            )}
          </div>

          <div
            className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-1 font-jua ${
              isSubscribed
                ? 'bg-[#16a34a]/15 text-[#16a34a]'
                : isMandatoryLock
                ? 'bg-red-600/15 text-red-600'
                : 'bg-[#c9502f]/10 text-[#c9502f]'
            }`}
          >
            {isSubscribed
              ? '정기 구독 활성화됨'
              : isMandatoryLock
              ? '🔒 30일 무료 체험 종료 (결제 필요)'
              : '30일 엄마표 한글 마스터 무료 체험'}
          </div>

          <h2 className="text-xl sm:text-2xl font-jua text-[#1b1917]">
            {isSubscribed ? (
              <span>
                <span className="text-[#16a34a]">정기 구독 이용 중</span>입니다! ✨
              </span>
            ) : isMandatoryLock ? (
              <span>
                30일 무료 체험이 <span className="text-red-600">만료되었습니다</span>
              </span>
            ) : (
              <span>
                부담 없이 <span className="text-[#c9502f]">30일간 무료</span>로 쓰세요!
              </span>
            )}
          </h2>

          <p className="text-xs text-[#8a8178] font-hand mt-1">
            {isSubscribed
              ? '10단계 전과정 및 일기 인쇄, 낙서보드가 무제한으로 열려 있습니다.'
              : isMandatoryLock
              ? '아이의 소중한 한글 배움과 30일 성장 기록을 계속 이어가려면 이용권을 결제해주세요.'
              : '"요즘 비싼 학습지 구독 너무 많잖아요. 아이가 진짜 좋아하는지 먼저 무료로 확인하세요."'}
          </p>
        </div>

        {/* Days Left Bar / Lock Status Bar */}
        <div
          className={`px-5 py-2.5 border-b flex items-center justify-between text-xs font-jua ${
            isSubscribed
              ? 'bg-[#f0fdf4] border-[#dcfce7] text-[#16a34a]'
              : isMandatoryLock
              ? 'bg-[#fef2f2] border-[#fee2e2] text-red-700'
              : 'bg-[#f5ecdd] border-[#e4dccf] text-[#4a443e]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isSubscribed ? (
              <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            ) : isMandatoryLock ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#c9502f]" />
            )}
            <span>
              {isSubscribed
                ? '정기 구독 혜택 적용 중'
                : isMandatoryLock
                ? '체험 기간 종료 (D-0)'
                : '무료 체험 카운트다운'}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold">
            {isSubscribed ? (
              <span className="text-emerald-700">무제한 이용</span>
            ) : isMandatoryLock ? (
              <span className="text-red-600 font-jua">0일 남음 (만료)</span>
            ) : (
              <span className="text-[#c9502f] font-jua">{daysLeft}일 남음</span>
            )}
          </div>
        </div>

        {/* Lock warning if user attempted to close without paying */}
        {showLockWarning && (
          <div className="p-2.5 bg-red-100 border-b border-red-200 text-red-800 text-center text-xs font-jua animate-pop">
            ⚠️ 30일 무료 체험이 종료되어 결제 후 앱을 계속 이용하실 수 있습니다.
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 font-body">
          {/* Subscription Tier Cards */}
          <div className="space-y-2">
            <h3 className="font-jua text-xs sm:text-sm text-[#1b1917] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#c9502f]" />
              {isMandatoryLock ? '계속 이용할 요금제를 선택해주세요' : '정기 이용권 안내'}
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#fdf3e4] border-[#c9502f] shadow-sm scale-102'
                    : 'bg-white border-[#e4dccf] hover:border-[#eedfc9]'
                }`}
              >
                <div className="flex justify-between items-center text-[11px] font-bold text-[#8a8178]">
                  <span>월간 구독</span>
                  <span className="text-[#c9502f]">부담 제로</span>
                </div>
                <div className="font-jua text-lg sm:text-xl text-[#c9502f] mt-0.5">
                  월 3,900원
                </div>
                <p className="text-[10px] text-[#8a8178] font-hand">
                  커피 1잔 가격으로 10단계 전과정 무제한
                </p>
              </div>

              {/* Yearly Plan */}
              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'bg-[#fdf3e4] border-[#c9502f] shadow-sm scale-102'
                    : 'bg-white border-[#e4dccf] hover:border-[#eedfc9]'
                }`}
              >
                <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-md bg-[#c9502f] text-white text-[9px] font-jua">
                  38% 할인
                </span>
                <div className="flex justify-between items-center text-[11px] font-bold text-[#8a8178]">
                  <span>연간 구독</span>
                </div>
                <div className="font-jua text-lg sm:text-xl text-[#c9502f] mt-0.5">
                  연 29,000원
                </div>
                <p className="text-[10px] text-[#8a8178] font-hand">
                  월 2,416원꼴 + 종이 출력 워크북 지원
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selector (When paying/locked) */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#4a443e] block">결제 수단 선택 (웹 직접 결제 지원)</span>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-jua">
              {[
                { key: 'card', label: '💳 신용카드' },
                { key: 'kakao', label: '🟡 카카오페이' },
                { key: 'naver', label: '🟢 네이버페이' },
                { key: 'bank', label: '🏦 무통장입금' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key as any)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all ${
                    paymentMethod === m.key
                      ? 'border-[#c9502f] bg-[#fdf3e4] text-[#c9502f] font-bold shadow-2xs'
                      : 'border-[#e4dccf] bg-white text-[#8a8178]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {paymentMethod === 'bank' && (
              <div className="p-2.5 rounded-xl bg-[#fdfaf5] border border-[#eedfc9] text-[11px] font-hand text-[#78350f] space-y-0.5">
                <p className="font-bold font-jua text-[#c9502f]">🏦 무통장 입금 안내 (앱스토어 승인 불필요)</p>
                <p>• 입금 계좌: 카카오뱅크 3333-01-2345678 (예금주: 토닥한글)</p>
                <p>• 입금 후 회원 ID(<b>sia_mom</b>)를 관리자에게 알려주시면 즉시 승인됩니다.</p>
              </div>
            )}
          </div>

          {/* 5 Core Benefits Summary */}
          <div className="space-y-2">
            <h4 className="font-jua text-xs text-[#1b1917] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#437a22]" />
              구독 시 열리는 모든 프리미엄 기능
            </h4>
            <ul className="space-y-1.5 text-xs text-[#4a443e]">
              <li className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#ece3d4]">
                <span>📋</span>
                <span className="font-jua">1~10단계 300개 한글 놀이 미션 & 성장 일기장</span>
              </li>
              <li className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#ece3d4]">
                <span>🎨</span>
                <span className="font-jua">54종 글자 따라쓰기 & 크레파스 낙서보드 무제한</span>
              </li>
              <li className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#ece3d4]">
                <span>🌟</span>
                <span className="font-jua">30일 칭찬 스티커판, 소원권 & 다마고치 친구들</span>
              </li>
              <li className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#ece3d4]">
                <span>🖨️</span>
                <span className="font-jua">A4 실물 진도표, 30일 완주 상장, 도안 인쇄</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#fff9ea] border border-[#f5dd9f] p-3 rounded-2xl text-[11px] text-[#6c5421] font-hand leading-relaxed">
            💡 결제는 안전하게 암호화되어 진행되며, 원하실 때 언제든지 해지하실 수 있습니다.
          </div>
        </div>

        {/* Modal Footer with Direct Payment Action */}
        <div className="p-4 bg-white border-t border-[#eedfc9] flex items-center justify-between gap-3">
          {/* Admin Controls on Lock Screen */}
          {isAdmin ? (
            <button
              onClick={() => {
                playSfx('fan');
                onExtendTrial(30);
              }}
              className="text-[11px] font-bold text-[#c9502f] hover:underline flex items-center gap-1"
              title="관리자 권한으로 30일 무료 체험 즉시 충전"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>👑 30일 무료 연장</span>
            </button>
          ) : onOpenAdmin ? (
            <button
              onClick={onOpenAdmin}
              className="text-[10px] text-[#8a8178] hover:text-[#1b1917] font-jua"
            >
              관리자 모드
            </button>
          ) : (
            <span className="text-[11px] text-[#8a8178] font-hand">
              {isSubscribed ? '구독 이용 중' : isMandatoryLock ? '체험 만료' : `D-${daysLeft} 남음`}
            </span>
          )}

          {isSubscribed ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-jua text-sm shadow-md active:scale-95 transition-all"
            >
              확인 (닫기)
            </button>
          ) : isMandatoryLock ? (
            <button
              onClick={handleExecutePayment}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 animate-glow disabled:opacity-75"
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing
                ? '결제 처리 중...'
                : `${selectedPlan === 'monthly' ? '월 3,900원' : '연 29,000원'} 결제하고 계속하기`}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecutePayment}
                disabled={isProcessing}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#fef3c7] to-[#fde68a] text-[#b45309] border border-[#fcd34d] font-jua text-xs hover:bg-[#fde68a] transition-all"
              >
                {selectedPlan === 'monthly' ? '월 3,900원' : '연 29,000원'} 구독하기
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs shadow-xs active:scale-95 transition-all"
              >
                무료 체험 계속하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
