import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Ticket,
  CheckCircle2,
  Sparkles,
  Crown,
  Clock,
  ArrowRight,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { playSfx } from '../utils/sound';
import { redeemCoupon, RedeemResult } from '../utils/couponHelper';

interface CouponRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtendDays: (days: number) => void;
  onActivateLifetime: () => void;
}

export const CouponRedeemModal: React.FC<CouponRedeemModalProps> = ({
  isOpen,
  onClose,
  onExtendDays,
  onActivateLifetime,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<RedeemResult | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = redeemCoupon(couponInput);
    if (!result.success) {
      playSfx('pop');
      setErrorMsg(result.message);
      return;
    }

    playSfx('fan');
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.55 } });
    setSuccessResult(result);

    if (result.type === 'trial_days') {
      onExtendDays(result.value || 30);
    } else if (result.type === 'subscription') {
      onActivateLifetime();
    }
  };

  const handleApplyPreset = (code: string) => {
    playSfx('tap');
    setCouponInput(code);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn font-body">
      <div className="bg-[#fbf8f2] border-2 border-[#eedfc9] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-6 text-left space-y-4 animate-pop relative">
        {/* Close Button */}
        <button
          onClick={() => {
            playSfx('tap');
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] transition-colors"
          title="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-13 h-13 rounded-2xl bg-[#fff5ee] border border-[#fcd8cd] text-[#c9502f] flex items-center justify-center mx-auto shadow-2xs">
            <Ticket className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ffede6] text-[#c9502f] inline-block font-jua">
            네이버 스마트스토어 &amp; 선물 쿠폰
          </span>
          <h2 className="text-xl font-jua text-[#1b1917]">
            이용권 시리얼 번호 등록
          </h2>
          <p className="text-xs text-[#8a8178] font-hand">
            스마트스토어 결제 후 카카오톡/문자로 받으신 시리얼 코드를 입력해주세요.
          </p>
        </div>

        {/* SUCCESS VIEW */}
        {successResult ? (
          <div className="p-4 bg-white rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3 text-center animate-pop">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 font-jua">
                {successResult.type === 'trial_days' ? '🎁 체험 기간 연장 쿠폰 등록 완료' : '👑 무제한 정기구독 패스 등록 완료'}
              </span>
              <h3 className="font-jua text-lg text-[#1b1917]">
                {successResult.coupon?.title || successResult.message}
              </h3>
              <p className="text-xs text-stone-600 font-hand leading-relaxed">
                {successResult.type === 'trial_days'
                  ? `무료 체험 기간 +${successResult.value || 30}일이 즉시 충전되었습니다! 즐거운 한글 놀이를 계속하세요.`
                  : '축하합니다! 10단계 300일 전과정과 A4 인쇄가 무제한으로 잠금 해제되었습니다.'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono">
              쿠폰 코드: <b>{successResult.coupon?.code || '적용완료'}</b>
            </div>

            <button
              onClick={() => {
                playSfx('tap');
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-jua text-sm shadow-md transition-all active:scale-95"
            >
              한글 놀이 바로 시작하기! 👉
            </button>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4a443e] block">
                시리얼 코드 (8자리)
              </label>
              <input
                type="text"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                autoFocus
                placeholder="예: TODAK-8821"
                maxLength={24}
                className="w-full text-center py-3 px-4 rounded-2xl border-2 border-[#e4dccf] bg-white font-mono text-base tracking-widest text-[#1b1917] outline-none focus:border-[#c9502f] uppercase shadow-inner"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-jua text-center animate-shake">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-base shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>쿠폰 등록하고 잠금 해제하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 1-Click Test Simulation Box */}
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-jua text-amber-900">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  대표님 테스트용 1초 원클릭 번호:
                </span>
                <span className="text-[10px] text-amber-700 font-hand">클릭 시 자동 입력</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 font-jua text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('TODAK-3DAY')}
                  className="py-2 px-2.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center justify-center gap-1 text-[11px] transition-colors shadow-2xs"
                  title="3일 무료 체험권"
                >
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>3일권 (TODAK-3DAY)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('TODAK-8821')}
                  className="py-2 px-2.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-[#c9502f] flex items-center justify-center gap-1 text-[11px] transition-colors shadow-2xs font-bold"
                  title="평생 무제한 완주권"
                >
                  <Crown className="w-3 h-3 text-[#c9502f]" />
                  <span>평생권 (TODAK-8821)</span>
                </button>
              </div>
            </div>

            {/* SmartStore Process Guide */}
            <div className="pt-1 text-[11px] text-[#8a8178] font-hand space-y-1">
              <div className="flex items-center gap-1 font-bold text-stone-600">
                <HelpCircle className="w-3 h-3 text-stone-500" />
                <span>이용권 코드는 어떻게 받나요?</span>
              </div>
              <p className="leading-relaxed">
                네이버 스마트스토어에서 결제가 완료되면, 네이버 시스템에서 주문 즉시 카카오톡 알림톡으로 8자리 시리얼 코드를 자동 전송해 드립니다.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
