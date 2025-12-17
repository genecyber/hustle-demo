/**
 * Auth Types for Emblem Auth SDK integration
 * These types mirror the EmblemAuthSDK types for use in React components
 */

import type { EmblemAuthSDK } from 'emblem-auth-sdk';

/**
 * User information from the authenticated session
 */
export interface AuthUser {
  identifier: string;
  vaultId: string;
  evmAddress?: string;
  solanaAddress?: string;
}

/**
 * Authenticated session returned by the Auth SDK
 */
export interface AuthSession {
  user: AuthUser;
  authToken: string;
  refreshToken?: string;
  expiresAt: number;
  appId: string;
  scope?: string;
}

/**
 * Vault information retrieved after authentication
 */
export interface VaultInfo {
  vaultId: string;
  evmAddress?: string;
  solanaAddress?: string;
  hederaAccountId?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration options for EmblemAuthProvider
 */
export interface EmblemAuthConfig {
  /** Application ID registered with Emblem */
  appId: string;
  /** API endpoint URL (defaults to production) */
  apiUrl?: string;
  /** Auth modal URL (defaults to production) */
  modalUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Context value exposed by EmblemAuthProvider
 */
export interface EmblemAuthContextValue {
  // State
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  vaultInfo: VaultInfo | null;

  // Derived from session
  vaultId: string | null;
  walletAddress: string | null;

  // Actions
  openAuthModal: () => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<AuthSession | null>;

  // For Hustle integration (internal use)
  authSDK: EmblemAuthSDK | null;
}

/**
 * Props for EmblemAuthProvider component
 */
export interface EmblemAuthProviderProps extends EmblemAuthConfig {
  children: React.ReactNode;
}
