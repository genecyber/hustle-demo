/**
 * useEmblemAuth hook
 *
 * Re-exported from EmblemAuthProvider for convenience.
 * Can be imported from either location:
 *
 * @example
 * ```tsx
 * import { useEmblemAuth } from '@/hooks/useEmblemAuth';
 * // or
 * import { useEmblemAuth } from '@/providers/EmblemAuthProvider';
 * ```
 */
export { useEmblemAuth } from '../providers/EmblemAuthProvider';

// Also export the provider and reset function for completeness
export { EmblemAuthProvider, resetAuthSDK } from '../providers/EmblemAuthProvider';

// Re-export auth types for convenience
export type {
  AuthSession,
  AuthUser,
  VaultInfo,
  EmblemAuthConfig,
  EmblemAuthContextValue,
  EmblemAuthProviderProps,
} from '../types';
