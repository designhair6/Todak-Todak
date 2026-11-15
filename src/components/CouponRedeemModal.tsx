import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Ticket,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { playSfx } from '../utils/sound';
import { normalizeVoucherCode, redeemVoucherCode, RedeemResult } from '../utils/couponHelper';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    const clean = normalizeVoucherCode(couponInput);
    if (!clean) {
      playSfx('pop');
      setErrorMsg('이용권 코드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await redeemVoucherCode(clean);
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
        try {
          localStorage.setItem('hangul_is_subscribed', 'true');
          localStorage.setItem('hangul_voucher_code', result.voucher?.code || clean);
          localStorage.setItem('hangul_voucher_registered_at', new Date().toISOString());
        } catch {}
        onActivateLifetime();
      }
    } catch (err) {
      playSfx('pop');
      console.error('Coupon redeem error:', err);
      setErrorMsg('서버 DB 연결 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn font-body">
      <div className="bg-[#fbf8f2] border-2 border-[#eedfc9] rounded-3xl w-full max-w-md box-border overflow-hidden shadow-2xl max-h-[90vh] flex flex-col relative animate-pop">
        <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden text-left space-y-4">
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
          className="absolute top-3 right-3 z-30 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#e4dccf] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] transition-all shadow-2xs active:scale-95 cursor-pointer"
          aria-label="닫기"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 pt-1">
          <div className="w-13 h-13 rounded-2xl bg-[#fff5ee] border border-[#fcd8cd] text-[#c9502f] flex items-center justify-center mx-auto shadow-2xs">
            <Ticket className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ffede6] text-[#c9502f] inline-block font-jua">
            네이버 스마트스토어 &amp; 1회용 이용권
          </span>
          <h2 className="text-xl font-jua text-[#1b1917]">이용권 코드 등록</h2>
          <p className="text-xs text-[#8a8178] font-hand break-keep">
            회원가입 없이 문자·알림톡으로 받으신 1회용 이용권 코드(또는 주문번호)를 입력해주세요.
          </p>
        </div>

        {successResult ? (
          <div className="p-4 bg-white rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3 text-center animate-pop">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 font-jua">
                {successResult.type === 'trial_days'
                  ? '🎁 체험 기간 연장 쿠폰 등록 완료'
                  : '👑 정식 이용권 등록 완료'}
              </span>
              <h3 className="font-jua text-lg text-[#1b1917]">
                {successResult.voucher?.title || successResult.message}
              </h3>
              <p className="text-xs text-stone-600 font-hand leading-relaxed break-keep">
                {successResult.type === 'trial_days'
                  ? `무료 체험 기간 +${successResult.value || 30}일이 즉시 충전되었습니다! 즐거운 한글 놀이를 계속하세요.`
                  : '축하합니다! 10단계 300일 전과정과 A4 인쇄가 무제한으로 잠금 해제되었습니다.'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono">
              인증 코드: <b>{successResult.voucher?.code || '적용완료'}</b>
            </div>

            <button
              type="button"
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
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#4a443e] block">
                이용권 코드 또는 스마트스토어 주문번호
              </label>
              <input
                type="text"
                value={couponInput}
                disabled={isSubmitting}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                autoFocus
                placeholder="예: TDK-A7K9-M2P4-X8Q3"
                maxLength={64}
                className="w-full text-center py-3 px-4 rounded-2xl border-2 border-[#e4dccf] bg-white font-mono text-sm tracking-wider text-[#1b1917] outline-none focus:border-[#c9502f] uppercase shadow-inner disabled:opacity-60"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-jua text-center break-keep">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] disabled:opacity-60 text-white font-jua text-base shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>서버에서 코드 확인 중...</span>
                </>
              ) : (
                <>
                  <span>코드 인증하고 잠금 해제하기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-start gap-2 text-[11px] text-emerald-900 font-hand">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed break-keep">
                서버 DB에서 유효 여부를 즉시 확인하며, 1회 인증 완료된 코드는 다른 기기에서 재사용할 수 없습니다.
              </span>
            </div>

            <div className="pt-1 text-[11px] text-[#8a8178] font-hand space-y-1">
              <div className="flex items-center gap-1 font-bold text-stone-600">
                <HelpCircle className="w-3 h-3 text-stone-500" />
                <span>이용권 코드는 어떻게 받나요?</span>
              </div>
              <p className="leading-relaxed break-keep">
                네이버 스마트스토어 결제 완료 후 판매자가 발송한 1회용 이용권 코드(또는 주문번호)를 입력하시면 회원가입 없이 바로 활성화됩니다.
              </p>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
