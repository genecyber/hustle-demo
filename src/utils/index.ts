/**
 * Utility functions for Emblem Auth + Hustle SDK integration
 */

/**
 * Truncate a wallet address for display
 * @example truncateAddress('0x1234567890abcdef1234567890abcdef12345678') => '0x1234...5678'
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Copy text to clipboard
 * @returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Decode JWT payload (without verification)
 * @returns Decoded payload object or null if invalid
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT is expired
 * @returns true if expired or invalid, false if valid
 */
export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Format file size for display
 * @example formatFileSize(1024) => '1 KB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Storage keys for persistence
 */
export const STORAGE_KEYS = {
  AUTH_SESSION: 'emblem_auth_session',
  HUSTLE_SETTINGS: 'hustle_settings',
  CHAT_HISTORY: 'hustle_chat_history',
  PLUGINS: 'hustle-plugins',
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  HUSTLE_API_URL: 'https://agenthustle.ai',
  EMBLEM_API_URL: 'https://api.emblemvault.ai',
  EMBLEM_MODAL_URL: 'https://emblemvault.ai/connect',
} as const;

// Plugin registry
export {
  pluginRegistry,
  hydratePlugin,
} from './pluginRegistry';
