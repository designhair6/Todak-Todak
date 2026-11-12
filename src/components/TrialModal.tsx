import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  Sparkles,
  Lock,
  Crown,
  Check,
  AlertTriangle,
  ExternalLink,
  ShoppingBag,
  Ticket,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import { playSfx } from '../utils/sound';
import { redeemCoupon } from '../utils/couponHelper';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysLeft: number;
  onExtendTrial: (days?: number) => void;
  isSubscribed?: boolean;
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
  onUpdateSubscribed?: (status: boolean) => void;
  onSetDaysLeft?: (days: number) => void;
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
  onUpdateSubscribed,
  onSetDaysLeft,
  isAdmin = false,
  onOpenAdmin,
}) => {
  const [voucherInput, setVoucherInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [testNotice, setTestNotice] = useState<string | null>(null);
  const [showLockWarning, setShowLockWarning] = useState(false);

  // Stored voucher info
  const registeredVoucher = typeof window !== 'undefined'
    ? localStorage.getItem('hangul_voucher_code') || (isSubscribed ? 'TODAK-FREE-PASS' : null)
    : null;

  if (!isOpen) return null;

  const isMandatoryLock = daysLeft <= 0 && !isSubscribed;

  const showToast = (msg: string) => {
    setTestNotice(msg);
    setTimeout(() => setTestNotice(null), 3500);
  };

  // Close attempt handler
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

  // Open SmartStore sales page in new tab
  const handleOpenSmartStore = () => {
    playSfx('tap');
    window.open('https://smartstore.naver.com', '_blank', 'noopener,noreferrer');
  };

  // Handle Voucher Code Submission
  const handleRegisterCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const clean = voucherInput.trim().toUpperCase();

    // 1. Empty check
    if (!clean) {
      playSfx('pop');
      setErrorMessage('이용권 코드를 입력해주세요.');
      return;
    }

    // 2. Validate via helper (supports TODAK-FREE-PASS, 16-character codes, and default coupons)
    const result = redeemCoupon(clean);

    if (result.success) {
      playSfx('fan');
      confetti({ particleCount: 80, spread: 85, origin: { y: 0.5 } });

      // Save subscription in localStorage and state
      try {
        localStorage.setItem('hangul_is_subscribed', 'true');
        localStorage.setItem('hangul_voucher_code', clean);
        localStorage.setItem('hangul_voucher_registered_at', new Date().toISOString());
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      onSubscribe('yearly');
      if (onUpdateSubscribed) onUpdateSubscribed(true);
      if (onSetDaysLeft) onSetDaysLeft(30);

      const successMsg = '토닥 한글 정식 이용권이 등록되었습니다! 모든 기능을 무제한으로 이용해보세요.';
      setSuccessMessage(successMsg);
      setShowSuccessPopup(true);
      setVoucherInput('');

      // Auto close modal after showing celebratory popup
      setTimeout(() => {
        setShowSuccessPopup(false);
        onClose();
      }, 2400);
    } else {
      playSfx('pop');
      // If code didn't match, show the requested exact message
      setErrorMessage(
        result.message || '유효하지 않은 이용권 코드입니다. 스마트스토어 주문번호 또는 발급된 문자를 확인해주세요.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-sm sm:max-w-md mx-auto overflow-hidden shadow-2xl animate-pop relative flex flex-col max-h-[90vh] my-auto">
        
        {/* Close Button (absolute top-3 right-3 p-2 for safe touch target) */}
        {!isMandatoryLock ? (
          <button
            type="button"
            onClick={handleAttemptClose}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 hover:bg-white border border-[#e4dccf] text-[#8a8178] hover:text-[#1b1917] transition-all shadow-xs active:scale-95"
            aria-label="닫기"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        ) : isAdmin ? (
          <button
            type="button"
            onClick={() => {
              playSfx('tap');
              onClose();
            }}
            className="absolute top-3 right-3 z-20 px-2.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-jua flex items-center gap-1 shadow-2xs active:scale-95"
            title="관리자 권한으로 닫기"
          >
            <Crown className="w-3 h-3 text-amber-700" />
            <span>관리자 닫기</span>
          </button>
        ) : null}

        {/* Modal Top Header (Vertical column center layout: icon -> badge -> title -> guide) */}
        <div
          className={`p-4 sm:p-6 pb-3 sm:pb-4 flex flex-col items-center text-center border-b transition-colors ${
            isSubscribed
              ? 'bg-gradient-to-b from-[#eafaf1] to-[#fbf8f2] border-[#bbf7d0]'
              : isMandatoryLock
              ? 'bg-gradient-to-b from-[#fee2e2] via-[#fff1f2] to-[#fbf8f2] border-[#fecaca]'
              : 'bg-gradient-to-b from-[#fbeee4] to-[#fbf8f2] border-[#eedfc9]'
          }`}
        >
          {/* Header Icon (w-12 h-12 mb-2) */}
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white shadow-md mb-2 shrink-0 ${
              isSubscribed
                ? 'bg-[#16a34a]'
                : isMandatoryLock
                ? 'bg-[#dc2626] animate-pulse'
                : 'bg-[#c9502f]'
            }`}
          >
            {isSubscribed ? (
              <Crown className="w-6 h-6 stroke-[2.5]" />
            ) : isMandatoryLock ? (
              <Lock className="w-6 h-6" />
            ) : (
              <Ticket className="w-6 h-6 animate-bounce" />
            )}
          </div>

          {/* Status Badge */}
          <div
            className={`inline-block text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full mb-2 font-jua break-keep text-center ${
              isSubscribed
                ? 'bg-[#16a34a]/15 text-[#16a34a]'
                : isMandatoryLock
                ? 'bg-red-600/15 text-red-600'
                : 'bg-[#03C75A]/15 text-[#039945]'
            }`}
          >
            {isSubscribed
              ? '👑 정식 이용권 등록 완료'
              : isMandatoryLock
              ? '🔒 30일 무료 체험 종료 (이용권 등록 필요)'
              : '🛒 네이버 스마트스토어 연동 이용권'}
          </div>

          {/* Main Title */}
          <h2 className="text-lg sm:text-xl font-jua text-[#1b1917] tracking-tight break-keep text-center leading-snug">
            {isSubscribed ? (
              <span>
                토닥 한글 <span className="text-[#16a34a]">정식 이용권 이용 중입니다!</span> ✨
              </span>
            ) : (
              <span>
                토닥 한글 <span className="text-[#c9502f]">정식 이용권 등록</span>
              </span>
            )}
          </h2>

          {/* Guide Text */}
          <p className="text-xs text-[#6d635b] font-hand mt-1.5 max-w-xs sm:max-w-sm mx-auto leading-relaxed break-keep text-center">
            {isSubscribed
              ? '1~10단계 300개 전과정 미션, 맞춤 낱말 낙서보드, A4 인쇄 도안을 무제한으로 이용하고 계십니다.'
              : '네이버 스마트스토어에서 이용권을 구매하신 후 발급받은 16자리 이용권 코드를 입력해주세요.'}
          </p>
        </div>

        {/* Toast Notice */}
        {testNotice && (
          <div className="bg-[#1b1917] text-white px-4 py-2 text-xs font-jua text-center border-b border-white/20 animate-fadeIn flex items-center justify-center gap-2 break-keep">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span>{testNotice}</span>
          </div>
        )}

        {/* Lock Warning if tried to close when locked */}
        {showLockWarning && (
          <div className="p-2.5 bg-red-100 border-b border-red-200 text-red-800 text-center text-xs font-jua animate-pop break-keep">
            ⚠️ 30일 무료 체험이 종료되었습니다. 네이버 스마트스토어에서 발급받은 이용권 코드를 등록해주세요.
          </div>
        )}

        {/* Success Popup Modal Overlay */}
        {showSuccessPopup && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 sm:p-6 text-center max-w-xs sm:max-w-sm w-full border-2 border-emerald-300 shadow-2xl animate-pop space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <Sparkles className="w-7 h-7 animate-spin" />
              </div>
              <h3 className="font-jua text-lg sm:text-xl text-[#1b1917]">등록 완료! 🎉</h3>
              <p className="text-xs sm:text-sm text-stone-700 font-body leading-relaxed break-keep">
                토닥 한글 정식 이용권이 등록되었습니다! 모든 기능을 무제한으로 이용해보세요.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessPopup(false);
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-jua text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                신나게 한글놀이 시작하기 ✨
              </button>
            </div>
          </div>
        )}

        {/* Body Content (Responsive & Scrollable, p-4 sm:p-6) */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1 font-body">

          {/* VIEW 1: Already Subscribed (정식 이용권 활성화 상태) */}
          {isSubscribed ? (
            <div className="space-y-3">
              <div className="p-3.5 sm:p-4 bg-white rounded-2xl border-2 border-emerald-200 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-100 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                      👑
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-jua text-sm sm:text-base text-[#1b1917] truncate">토닥한글 정식 이용권</h4>
                      <p className="text-[10px] sm:text-[11px] text-[#8a8178] font-hand truncate">
                        코드: <span className="font-mono text-emerald-700 font-bold">{registeredVoucher || 'TODAK-FREE-PASS'}</span>
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold font-jua shrink-0">
                    인증 완료
                  </span>
                </div>

                {/* Benefits List (1 column on small phones, 2 columns on tablet/desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 sm:p-2.5 bg-[#fcfdfa] rounded-xl border border-stone-200 flex items-center gap-2">
                    <span className="text-base shrink-0">📋</span>
                    <div className="min-w-0">
                      <span className="font-jua text-stone-800 block leading-tight">1~10단계 300일 미션</span>
                      <span className="text-[10px] text-stone-500 font-hand">전과정 자유 학습</span>
                    </div>
                  </div>
                  <div className="p-2 sm:p-2.5 bg-[#fcfdfa] rounded-xl border border-stone-200 flex items-center gap-2">
                    <span className="text-base shrink-0">🎨</span>
                    <div className="min-w-0">
                      <span className="font-jua text-stone-800 block leading-tight">자음·모음 낙서보드</span>
                      <span className="text-[10px] text-stone-500 font-hand">획순 & 단어 쓰기</span>
                    </div>
                  </div>
                  <div className="p-2 sm:p-2.5 bg-[#fcfdfa] rounded-xl border border-stone-200 flex items-center gap-2">
                    <span className="text-base shrink-0">🎙️</span>
                    <div className="min-w-0">
                      <span className="font-jua text-stone-800 block leading-tight">엄마아빠 목소리 칭찬</span>
                      <span className="text-[10px] text-stone-500 font-hand">정답 시 맞춤 육성</span>
                    </div>
                  </div>
                  <div className="p-2 sm:p-2.5 bg-[#fcfdfa] rounded-xl border border-stone-200 flex items-center gap-2">
                    <span className="text-base shrink-0">🖨️</span>
                    <div className="min-w-0">
                      <span className="font-jua text-stone-800 block leading-tight">A4 진도표 & 상장 인쇄</span>
                      <span className="text-[10px] text-stone-500 font-hand">고화질 학습 도안</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: SmartStore Voucher Registration (신규 등록 및 만료 잠금 해제) */
            <div className="space-y-3.5">
              
              {/* STEP 1: SmartStore Purchase CTA Button (단독 가로 100% 풀위스 블록) */}
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-jua text-[#1b1917] px-0.5">
                  <span className="flex items-center gap-1 text-[#039945]">
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <span>STEP 1. 아직 이용권이 없으신가요?</span>
                  </span>
                  <span className="text-[11px] font-hand text-[#8a8178]">
                    구매 즉시 문자/알림 발송
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenSmartStore}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#03C75A] to-[#02b350] hover:from-[#02b350] hover:to-[#029e46] text-white font-jua text-sm sm:text-base shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 group border border-emerald-400"
                >
                  <span>스마트스토어에서 이용권 구매하기 &gt;</span>
                  <ExternalLink className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>

              {/* STEP 2: Voucher Code Input Form (모바일 최적화) */}
              <div className="p-3.5 sm:p-4 bg-white rounded-2xl border-2 border-[#eedfc9] shadow-xs space-y-2.5">
                <div className="flex flex-col gap-0.5 px-0.5">
                  <div className="flex items-center gap-1.5 font-jua text-xs text-[#c9502f]">
                    <Ticket className="w-3.5 h-3.5 shrink-0" />
                    <span>STEP 2. 발급받은 이용권 코드 입력</span>
                  </div>
                  <span className="text-[11px] font-hand text-[#8a8178] break-keep">
                    16자리 코드 등록 시 즉시 모든 기능 잠금 해제
                  </span>
                </div>

                <form onSubmit={handleRegisterCode} className="space-y-2">
                  <div className="flex flex-row w-full gap-2 items-center">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => {
                        setVoucherInput(e.target.value);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      placeholder="이용권 코드 입력 (예: TODAK-2026-XXXX)"
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-[#e4dccf] bg-[#faf8f5] focus:bg-white font-mono text-xs text-[#1b1917] outline-none focus:border-[#c9502f] focus:ring-2 focus:ring-[#c9502f]/20 transition-all placeholder:text-[#a89f91]"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    <button
                      type="submit"
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-[#c9502f] hover:bg-[#b54122] text-white font-jua text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>코드 등록</span>
                    </button>
                  </div>
                </form>

                {/* Error Message Notice */}
                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-jua flex items-start gap-1.5 animate-fadeIn break-keep">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span className="leading-snug">{errorMessage}</span>
                  </div>
                )}

                {/* Success Message Notice */}
                {successMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-jua flex items-center gap-1.5 animate-fadeIn break-keep">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="leading-snug">{successMessage}</span>
                  </div>
                )}
              </div>

              {/* How it works info card */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#fdfaf5] border border-[#eedfc9] space-y-1.5 text-xs text-[#6d635b]">
                <div className="font-jua text-xs text-[#1b1917] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-[#c9502f] shrink-0" />
                  <span>이용권 등록 절차 안내</span>
                </div>
                <div className="space-y-1 font-hand text-[11px] text-[#7d736a] leading-relaxed break-keep">
                  <p>1. 위 <b>[스마트스토어에서 이용권 구매하기]</b> 버튼을 눌러 주문을 완료합니다.</p>
                  <p>2. 주문 완료 시 문자로 전송된 <b>16자리 이용권 코드</b>를 복사합니다.</p>
                  <p>3. 코드 입력란에 붙여넣고 <b>[코드 등록]</b>을 누르면 즉시 모든 기능이 열립니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer (Mobile Optimized) */}
        {isSubscribed ? (
          <div className="p-3 sm:p-4 bg-white border-t border-[#eedfc9]">
            <button
              type="button"
              onClick={() => {
                playSfx('tap');
                onClose();
              }}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-jua text-base shadow-lg hover:shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>확인하고 한글놀이 이어하기</span>
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-4 bg-white border-t border-[#eedfc9] flex flex-col items-center gap-2 text-center">
            {/* Free Trial Link */}
            <button
              type="button"
              onClick={() => {
                if (isMandatoryLock) {
                  showToast('⚠️ 무료 체험 기간이 만료되었습니다. 이용권 코드를 등록해주세요.');
                } else {
                  playSfx('tap');
                  onClose();
                }
              }}
              className="text-xs text-[#8a8178] hover:text-[#c9502f] font-jua transition-colors underline underline-offset-4 active:scale-95 break-keep"
            >
              아직 고민 중이신가요? <span className="font-bold text-[#c9502f]">[무료 체험 계속하기]</span>
            </button>

            {/* KakaoTalk Channel inquiry text */}
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#8a8178] font-hand break-keep">
              <MessageCircle className="w-3 h-3 text-[#ffcd00] fill-[#fee500] shrink-0" />
              <span>단체 구매 및 문의: <b>카카오톡 채널 @토닥한글</b></span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
