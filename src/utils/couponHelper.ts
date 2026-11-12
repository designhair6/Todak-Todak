/**
 * Coupon & Voucher Management Helper
 * Supports discount codes, promotional voucher redemption, and custom admin coupons.
 */

export interface CouponItem {
  code: string;
  type: 'subscription' | 'trial_days';
  value?: number; // e.g. 30 days
  title: string;
  description: string;
}

export const DEFAULT_COUPONS: CouponItem[] = [
  {
    code: 'TODAK-FREE-PASS',
    type: 'subscription',
    title: '스마트스토어 마스터 프리패스',
    description: '토닥한글 정식 이용권 무제한 구독 활성화',
  },
  {
    code: 'TODAK-2026-PASS',
    type: 'subscription',
    title: '2026 정식 완주 패키지',
    description: '토닥한글 전과정 무제한 정식 이용권',
  },
  {
    code: '엄마사랑',
    type: 'subscription',
    title: '엄마의 무한 사랑 VIP 이용권',
    description: '30일 완주 패키지 & 전과정 무제한 구독 즉시 활성화',
  },
  {
    code: 'TODAK30',
    type: 'subscription',
    title: '토닥한글 30일 완주 쿠폰',
    description: '모든 기능 및 인쇄물 무제한 구독 활성화',
  },
  {
    code: '토닥한글',
    type: 'subscription',
    title: '토닥한글 공식 런칭 쿠폰',
    description: '전과정 무제한 정기구독 활성화',
  },
  {
    code: 'VIPPASS',
    type: 'subscription',
    title: 'VIP 평생 완주 프리패스',
    description: '1~10단계 전과정 평생 이용권 등록',
  },
  {
    code: '슈퍼맘',
    type: 'subscription',
    title: '슈퍼맘 응원 특별 쿠폰',
    description: '30일 완주 패키지 즉시 활성화',
  },
  {
    code: 'HANGUL2026',
    type: 'trial_days',
    value: 30,
    title: '무료 체험 +30일 연장 쿠폰',
    description: '체험 일수 30일 즉시 추가',
  },
  {
    code: 'WELCOME',
    type: 'trial_days',
    value: 30,
    title: '신규 회원 웰컴 30일 쿠폰',
    description: '체험 기간 30일 충전',
  },
];

const CUSTOM_COUPONS_KEY = 'hangul_custom_coupons';
const USED_COUPONS_KEY = 'hangul_used_coupons';

export function getAllCoupons(): CouponItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_COUPONS_KEY);
    const custom: CouponItem[] = raw ? JSON.parse(raw) : [];
    return [...DEFAULT_COUPONS, ...custom];
  } catch {
    return DEFAULT_COUPONS;
  }
}

export function addCustomCoupon(coupon: CouponItem): boolean {
  try {
    const raw = localStorage.getItem(CUSTOM_COUPONS_KEY);
    const custom: CouponItem[] = raw ? JSON.parse(raw) : [];
    const exists = custom.some((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (exists) return false;
    custom.push({ ...coupon, code: coupon.code.toUpperCase().trim() });
    localStorage.setItem(CUSTOM_COUPONS_KEY, JSON.stringify(custom));
    return true;
  } catch {
    return false;
  }
}

export interface RedeemResult {
  success: boolean;
  type?: 'subscription' | 'trial_days';
  value?: number;
  message: string;
  coupon?: CouponItem;
}

export function redeemCoupon(inputCode: string): RedeemResult {
  const cleanCode = inputCode.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: '이용권 코드를 입력해주세요.' };
  }

  // Check already used
  try {
    const rawUsed = localStorage.getItem(USED_COUPONS_KEY);
    const usedList: string[] = rawUsed ? JSON.parse(rawUsed) : [];
    if (usedList.includes(cleanCode)) {
      return { success: false, message: '이미 등록되어 사용된 이용권 코드입니다.' };
    }
  } catch {}

  const all = getAllCoupons();
  let matched = all.find(
    (c) => c.code.toUpperCase() === cleanCode || c.code === inputCode.trim()
  );

  // If not in predefined list, check if it's a 16-character Smart Store voucher (with or without dashes)
  const alphanumericOnly = cleanCode.replace(/[^A-Z0-9]/g, '');
  if (!matched && (alphanumericOnly.length === 16 || cleanCode.startsWith('TODAK-') || cleanCode.length === 16)) {
    matched = {
      code: cleanCode,
      type: 'subscription',
      title: '네이버 스마트스토어 정식 이용권',
      description: '스마트스토어 구매 고객 전용 16자리 정식 이용권',
    };
  }

  if (!matched) {
    return {
      success: false,
      message: '유효하지 않은 이용권 코드입니다. 스마트스토어 주문번호 또는 발급된 문자를 확인해주세요.',
    };
  }

  // Mark used
  try {
    const rawUsed = localStorage.getItem(USED_COUPONS_KEY);
    const usedList: string[] = rawUsed ? JSON.parse(rawUsed) : [];
    usedList.push(cleanCode);
    localStorage.setItem(USED_COUPONS_KEY, JSON.stringify(usedList));
  } catch {}

  if (matched.type === 'subscription') {
    return {
      success: true,
      type: 'subscription',
      message: '토닥 한글 정식 이용권이 등록되었습니다! 모든 기능을 무제한으로 이용해보세요.',
      coupon: matched,
    };
  } else {
    return {
      success: true,
      type: 'trial_days',
      value: matched.value || 30,
      message: `🎉 [${matched.title}] 쿠폰이 등록되어 무료 체험 기간이 +${matched.value || 30}일 연장되었습니다!`,
      coupon: matched,
    };
  }
}
