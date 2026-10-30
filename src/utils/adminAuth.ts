/**
 * Admin Authentication & Security Helper
 * Manages admin PIN verification, update, and persistent authorization.
 * Note: Never expose the PIN in the UI or in public alerts.
 */

const ADMIN_ACTIVE_KEY = 'hangul_admin_active';
const ADMIN_PIN_KEY = 'hangul_admin_pin';
const DEFAULT_INITIAL_PIN = '7777';

/**
 * Returns the currently configured admin PIN.
 */
export function getStoredAdminPin(): string {
  try {
    return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_INITIAL_PIN;
  } catch {
    return DEFAULT_INITIAL_PIN;
  }
}

/**
 * Validates entered PIN against stored PIN.
 */
export function verifyAdminPin(inputPin: string): boolean {
  if (!inputPin) return false;
  const currentPin = getStoredAdminPin();
  const trimmed = inputPin.trim();
  // Support current PIN or initial PIN fallback
  return trimmed === currentPin || (trimmed === DEFAULT_INITIAL_PIN && currentPin === DEFAULT_INITIAL_PIN);
}

/**
 * Updates the admin PIN securely in localStorage.
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
