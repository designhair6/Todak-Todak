export interface UserIdentity {
  userId: string;
  userNickname: string;
  userEmail: string;
}

const USER_ID_KEY = 'hangul_user_id';
const USER_NICKNAME_KEY = 'hangul_user_nickname';
const USER_EMAIL_KEY = 'hangul_user_email';

const ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generateUniqueUserId(prefix = 'todak'): string {
  const cleanPrefix =
    prefix
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8) || 'todak';
  let suffix = '';
  const arr = new Uint32Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (let i = 0; i < 6; i++) {
      suffix += ID_ALPHABET[arr[i] % ID_ALPHABET.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      suffix += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
    }
  }
  return `${cleanPrefix}_${suffix}`;
}

export function isValidUserIdFormat(id: string): boolean {
  return /^[a-zA-Z0-9_-]{3,64}$/.test(id.trim());
}

/**
 * Ensures each device/user gets a unique persistent member ID on first visit,
 * without hardcoding the creator's ID or personal email.
 */
export function getOrCreateUserIdentity(childNameFallback = '우리 아이'): UserIdentity {
  if (typeof window === 'undefined') {
    return {
      userId: 'todak_guest',
      userNickname: '토닥맘',
      userEmail: '',
    };
  }

  let storedId = '';
  let storedNickname = '';
  let storedEmail = '';

  try {
    storedId = (localStorage.getItem(USER_ID_KEY) || '').trim();
    storedNickname = (localStorage.getItem(USER_NICKNAME_KEY) || '').trim();
    storedEmail = (localStorage.getItem(USER_EMAIL_KEY) || '').trim();
  } catch {}

  if (!storedId || !isValidUserIdFormat(storedId)) {
    storedId = generateUniqueUserId('todak');
    try {
      localStorage.setItem(USER_ID_KEY, storedId);
    } catch {}
  }

  if (!storedNickname) {
    const cleanChild = childNameFallback.trim();
    storedNickname =
      cleanChild && cleanChild !== '우리 아이' ? `${cleanChild}맘` : '토닥맘';
    try {
      localStorage.setItem(USER_NICKNAME_KEY, storedNickname);
    } catch {}
  }

  return {
    userId: storedId,
    userNickname: storedNickname,
    userEmail: storedEmail,
  };
}

export function saveUserIdentity(next: UserIdentity): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_ID_KEY, next.userId.trim());
    localStorage.setItem(USER_NICKNAME_KEY, next.userNickname.trim());
    localStorage.setItem(USER_EMAIL_KEY, next.userEmail.trim());
  } catch {}
}
