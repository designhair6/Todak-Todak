import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { getOrCreateUserIdentity, isValidUserIdFormat } from './userIdentity';

export interface ServerVoucher {
  code: string;
  type: 'subscription' | 'trial_days';
  value: number;
  title: string;
  orderNote?: string;
  status: 'unused' | 'used';
  createdBy: string;
  createdAt?: Date | null;
  usedAt?: Date | null;
  redeemedBy?: string;
}

export interface RedeemResult {
  success: boolean;
  reason?: 'empty' | 'invalid_format' | 'not_found' | 'already_used' | 'error';
  type?: 'subscription' | 'trial_days';
  value?: number;
  message: string;
  voucher?: {
    code: string;
    type: 'subscription' | 'trial_days';
    value: number;
    title: string;
  };
}

const VOUCHER_CODE_REGEX = /^[A-Z0-9_-]{4,64}$/;
const RANDOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function normalizeVoucherCode(raw: string): string {
  return raw.trim().replace(/\s+/g, '').toUpperCase();
}

export function isValidVoucherFormat(code: string): boolean {
  return VOUCHER_CODE_REGEX.test(code);
}

export function generateRandomVoucherCode(prefix = 'TDK'): string {
  const cleanPrefix = normalizeVoucherCode(prefix).slice(0, 8) || 'TDK';
  const segment = (len: number) => {
    let out = '';
    const arr = new Uint32Array(len);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
      for (let i = 0; i < len; i++) {
        out += RANDOM_ALPHABET[arr[i] % RANDOM_ALPHABET.length];
      }
    } else {
      for (let i = 0; i < len; i++) {
        out += RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)];
      }
    }
    return out;
  };
  return `${cleanPrefix}-${segment(4)}-${segment(4)}-${segment(4)}`;
}

function toDateOrNull(ts: unknown): Date | null {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts && typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  return null;
}

/**
 * Buyer-facing 1-time voucher verification & redemption (NO login required).
 * Uses an atomic Firestore transaction to check existence + 'unused' status,
 * then immediately locks status = 'used' so codes can never be reused across devices.
 */
export async function redeemVoucherCode(inputCode: string): Promise<RedeemResult> {
  const cleanCode = normalizeVoucherCode(inputCode);
  if (!cleanCode) {
    return {
      success: false,
      reason: 'empty',
      message: '이용권 코드를 입력해주세요.',
    };
  }

  if (!isValidVoucherFormat(cleanCode)) {
    return {
      success: false,
      reason: 'invalid_format',
      message:
        '유효하지 않은 코드 형식입니다. 스마트스토어 주문번호 또는 영문·숫자·하이픈(-) 조합의 발급 코드를 확인해주세요.',
    };
  }

  const voucherPath = `vouchers/${cleanCode}`;
  const voucherRef = doc(db, 'vouchers', cleanCode);

  try {
    const txResult = await runTransaction(db, async (tx) => {
      const snap = await tx.get(voucherRef);
      if (!snap.exists()) {
        return {
          success: false as const,
          reason: 'not_found' as const,
          message:
            '등록되지 않은 이용권 코드입니다. 스마트스토어 주문번호 또는 문자로 받으신 코드를 다시 확인해주세요.',
        };
      }

      const data = snap.data();
      if (data.status !== 'unused') {
        return {
          success: false as const,
          reason: 'already_used' as const,
          message:
            '이미 사용 완료된 이용권 코드입니다. 1회용 코드는 한 번만 등록할 수 있습니다.',
        };
      }

      const identity = getOrCreateUserIdentity();
      const updatePayload: Record<string, unknown> = {
        status: 'used',
        usedAt: serverTimestamp(),
      };
      if (identity.userId && isValidUserIdFormat(identity.userId)) {
        updatePayload.redeemedBy = identity.userId;
      }

      tx.update(voucherRef, updatePayload);

      const voucherType =
        data.type === 'trial_days' ? ('trial_days' as const) : ('subscription' as const);
      const voucherValue =
        typeof data.value === 'number' && data.value >= 1 ? data.value : 365;
      const voucherTitle =
        typeof data.title === 'string' && data.title.trim()
          ? data.title.trim()
          : '토닥 한글 정식 이용권';

      return {
        success: true as const,
        type: voucherType,
        value: voucherValue,
        message:
          voucherType === 'subscription'
            ? '토닥 한글 정식 이용권이 등록되었습니다! 모든 기능을 무제한으로 이용해보세요.'
            : `🎉 [${voucherTitle}] 등록 완료! 무료 체험 기간이 +${voucherValue}일 연장되었습니다.`,
        voucher: {
          code: cleanCode,
          type: voucherType,
          value: voucherValue,
          title: voucherTitle,
        },
      };
    });

    return txResult;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, voucherPath);
  }
}

/**
 * Admin-only real-time subscription to all vouchers.
 */
export function subscribeServerVouchers(
  onData: (vouchers: ServerVoucher[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'vouchers';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ServerVoucher[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          code: String(d.code || docSnap.id),
          type: d.type === 'trial_days' ? 'trial_days' : 'subscription',
          value: typeof d.value === 'number' ? d.value : 365,
          title: String(d.title || '토닥 한글 정식 이용권'),
          orderNote: typeof d.orderNote === 'string' ? d.orderNote : '',
          status: d.status === 'used' ? 'used' : 'unused',
          createdBy: String(d.createdBy || ''),
          createdAt: toDateOrNull(d.createdAt),
          usedAt: toDateOrNull(d.usedAt),
          redeemedBy: typeof d.redeemedBy === 'string' ? d.redeemedBy : '',
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export interface CreateVoucherInput {
  code: string;
  type: 'subscription' | 'trial_days';
  value?: number;
  title?: string;
  orderNote?: string;
}

export async function createServerVoucher(
  input: CreateVoucherInput
): Promise<{ ok: boolean; code?: string; message: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, message: '먼저 Google 관리자 계정으로 연결해주세요.' };
  }

  const cleanCode = normalizeVoucherCode(input.code);
  if (!isValidVoucherFormat(cleanCode)) {
    return {
      ok: false,
      message: '코드는 영문 대문자·숫자·하이픈(-) 4~64자로 입력해주세요.',
    };
  }

  const numericValue =
    input.type === 'trial_days'
      ? Math.min(9999, Math.max(1, Math.round(Number(input.value) || 30)))
      : 365;

  const cleanTitle = (
    input.title?.trim() ||
    (input.type === 'subscription'
      ? '스마트스토어 정식 이용권'
      : `체험 ${numericValue}일 연장권`)
  ).slice(0, 100);

  const cleanNote = input.orderNote?.trim().slice(0, 120) || '';
  const voucherPath = `vouchers/${cleanCode}`;
  const voucherRef = doc(db, 'vouchers', cleanCode);

  try {
    const existingSnap = await getDoc(voucherRef);
    if (existingSnap.exists()) {
      return { ok: false, message: `이미 등록된 코드(${cleanCode})입니다.` };
    }

    const payload: Record<string, unknown> = {
      code: cleanCode,
      type: input.type,
      value: numericValue,
      title: cleanTitle,
      status: 'unused',
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    };
    if (cleanNote) {
      payload.orderNote = cleanNote;
    }

    await setDoc(voucherRef, payload);
    return {
      ok: true,
      code: cleanCode,
      message: `🎉 [${cleanCode}] 코드가 서버 DB에 등록되었습니다.`,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, voucherPath);
  }
}

export async function createBatchServerVouchers(
  count: number,
  options: {
    type: 'subscription' | 'trial_days';
    value?: number;
    title?: string;
    orderNote?: string;
    prefix?: string;
  }
): Promise<{ ok: boolean; codes: string[]; message: string }> {
  const safeCount = Math.min(20, Math.max(1, Math.round(count)));
  const created: string[] = [];

  for (let i = 0; i < safeCount; i++) {
    const code = generateRandomVoucherCode(options.prefix || 'TDK');
    const res = await createServerVoucher({
      code,
      type: options.type,
      value: options.value,
      title: options.title,
      orderNote: options.orderNote,
    });
    if (res.ok && res.code) {
      created.push(res.code);
    }
  }

  return {
    ok: created.length > 0,
    codes: created,
    message:
      created.length > 0
        ? `🎉 1회용 코드 ${created.length}개가 서버 DB에 즉시 발급되었습니다.`
        : '코드 발급에 실패했습니다.',
  };
}

export async function resetServerVoucherStatus(code: string): Promise<void> {
  const cleanCode = normalizeVoucherCode(code);
  const path = `vouchers/${cleanCode}`;
  try {
    await updateDoc(doc(db, 'vouchers', cleanCode), {
      status: 'unused',
      usedAt: deleteField(),
      redeemedBy: deleteField(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteServerVoucher(code: string): Promise<void> {
  const cleanCode = normalizeVoucherCode(code);
  const path = `vouchers/${cleanCode}`;
  try {
    await deleteDoc(doc(db, 'vouchers', cleanCode));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
