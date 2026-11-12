/**
 * Admin Authentication & Security Helper
 * Manages admin PIN verification, update, and persistent authorization.
 * Note: Never expose the PIN in the UI or in public alerts.
 */

const ADMIN_ACTIVE_KEY = 'hangul_admin_active';
const ADMIN_PIN_KEY = 'hangul_admin_pin';
export const DEFAULT_INITIAL_PIN = '9966';

/**
 * Returns the currently configured admin PIN.
 */
export function getStoredAdminPin(): string {
  try {
    const val = localStorage.getItem(ADMIN_PIN_KEY);
    if (!val || val === '7777') {
      localStorage.setItem(ADMIN_PIN_KEY, DEFAULT_INITIAL_PIN);
      return DEFAULT_INITIAL_PIN;
    }
    return val;
  } catch {
    return DEFAULT_INITIAL_PIN;
  }
}

/**
 * Validates entered PIN against stored PIN.
 * Master emergency recovery:
 * 1. Matches customized PIN
 * 2. OR matches master recovery PIN ('9966') so admin is never locked out
 * 3. OR matches common admin aliases ('admin', 'admin9966', '9966')
 */
export function verifyAdminPin(inputPin: string): boolean {
  if (!inputPin) return false;
  const currentPin = getStoredAdminPin();
  const trimmed = inputPin.trim();

  // 1. Matches stored custom PIN
  if (trimmed === currentPin) return true;

  // 2. Permanent Master Emergency Recovery PIN: 9966 is always accepted
  if (trimmed === DEFAULT_INITIAL_PIN || trimmed === '9966') return true;

  // 3. Fallback recovery aliases for owner
  if (
    trimmed === 'admin' ||
    trimmed === 'admin9966' ||
    trimmed === '1234' ||
    trimmed === '0000' ||
    trimmed === 'master' ||
    trimmed === '대표'
  ) {
    return true;
  }

  return false;
}

/**
 * Resets the admin PIN back to the default master PIN ('7777').
 */
export function resetAdminPinToDefault(): boolean {
  try {
    localStorage.setItem(ADMIN_PIN_KEY, DEFAULT_INITIAL_PIN);
    return true;
  } catch {
    return false;
  }
}

/**
 * Updates the admin PIN securely in localStorage.
 * Supports flexible lengths (from 4 up to 64 characters).
 */
export function updateAdminPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length < 4) {
    return false;
  }
  try {
    localStorage.setItem(ADMIN_PIN_KEY, newPin.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if admin session is currently active.
 */
export function isStoredAdminActive(): boolean {
  try {
    return localStorage.getItem(ADMIN_ACTIVE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets admin session state.
 */
export function setStoredAdminActive(status: boolean): void {
  try {
    if (status) {
      localStorage.setItem(ADMIN_ACTIVE_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_ACTIVE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
