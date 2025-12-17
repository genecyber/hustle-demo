'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { EmblemAuthSDK } from 'emblem-auth-sdk';
import type {
  AuthSession,
  VaultInfo,
  EmblemAuthContextValue,
  EmblemAuthProviderProps,
} from '../types';

/**
 * Global SDK instance to prevent multiple initializations
 * This is important for React strict mode and hot reloading
 */
let globalSDKInstance: EmblemAuthSDK | null = null;
let isSDKInitializing = false;

/**
 * Auth context - undefined when not within provider
 */
const EmblemAuthContext = createContext<EmblemAuthContextValue | undefined>(undefined);

/**
 * EmblemAuthProvider - Provides authentication state and actions to the app
 *
 * This is a first-class citizen - it has no dependency on Hustle SDK.
 * The Hustle SDK depends on this provider for authentication.
 *
 * @example
 * ```tsx
 * <EmblemAuthProvider
 *   appId="your-app-id"
 *   apiUrl="https://dev-api.emblemvault.ai"
 *   modalUrl="https://dev-auth.emblemvault.ai/connect"
 * >
 *   <App />
 * </EmblemAuthProvider>
 * ```
 */
export function EmblemAuthProvider({
  children,
  appId,
  apiUrl,
  modalUrl,
  debug = false,
}: EmblemAuthProviderProps) {
  // State
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [authSDK, setAuthSDK] = useState<EmblemAuthSDK | null>(globalSDKInstance);

  // Track if we've initialized
  const initialized = useRef(false);

  // Debug logger
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[EmblemAuth] ${message}`, ...args);
      }
    },
    [debug]
  );

  /**
   * Fetch vault info after authentication
   */
  const fetchVaultInfo = useCallback(
    async (sdk: EmblemAuthSDK) => {
      try {
        const info = await sdk.getVaultInfo();
        if (info) {
          setVaultInfo(info);
          log('Vault info loaded:', info);
        }
      } catch (err) {
        log('Failed to fetch vault info:', err);
      }
    },
    [log]
  );

  /**
   * Handle successful authentication
   */
  const handleAuthSuccess = useCallback(
    (newSession: AuthSession, sdk: EmblemAuthSDK) => {
      log('Auth success - session:', newSession);
      setSession(newSession);
      setIsAuthenticated(true);
      setIsLoading(false);
      setError(null);
      fetchVaultInfo(sdk);
    },
    [log, fetchVaultInfo]
  );

  /**
   * Handle authentication error
   */
  const handleAuthError = useCallback(
    (err: Error) => {
      log('Auth error:', err);
      setError(err);
      setIsLoading(false);
      setIsAuthenticated(false);
      setSession(null);
    },
    [log]
  );

  /**
   * Handle session expiration
   */
  const handleSessionExpired = useCallback(() => {
    log('Session expired');
    setSession(null);
    setIsAuthenticated(false);
    setVaultInfo(null);
  }, [log]);

  /**
   * Initialize the SDK
   */
  useEffect(() => {
    // Prevent double initialization
    if (initialized.current || globalSDKInstance || isSDKInitializing) {
      if (globalSDKInstance && !authSDK) {
        setAuthSDK(globalSDKInstance);
        // Check for existing session
        const existingSession = globalSDKInstance.getSession();
        if (existingSession) {
          handleAuthSuccess(existingSession, globalSDKInstance);
        }
      }
      return;
    }

    initialized.current = true;
    isSDKInitializing = true;
    log('Initializing SDK with appId:', appId);

    // Create SDK instance
    const sdk = new EmblemAuthSDK({
      appId,
      apiUrl,
      modalUrl,
      onSuccess: (newSession) => {
        handleAuthSuccess(newSession as AuthSession, sdk);
      },
      onError: (err) => {
        handleAuthError(err);
      },
    });

    // Store globally and locally
    globalSDKInstance = sdk;
    isSDKInitializing = false;
    setAuthSDK(sdk);

    // Check for existing session
    const existingSession = sdk.getSession();
    if (existingSession) {
      log('Found existing session');
      handleAuthSuccess(existingSession as AuthSession, sdk);
    }

    // Subscribe to session events
    const handleSessionUpdate = (updatedSession: AuthSession | null) => {
      if (updatedSession) {
        setSession(updatedSession);
        setIsAuthenticated(true);
      } else {
        handleSessionExpired();
      }
    };

    sdk.on('session', handleSessionUpdate);
    sdk.on('sessionExpired', handleSessionExpired);

    // Cleanup
    return () => {
      sdk.off('session', handleSessionUpdate);
      sdk.off('sessionExpired', handleSessionExpired);
    };
  }, [appId, apiUrl, modalUrl, log, handleAuthSuccess, handleAuthError, handleSessionExpired, authSDK]);

  /**
   * Open the auth modal
   */
  const openAuthModal = useCallback(async () => {
    if (!authSDK) {
      setError(new Error('Auth SDK not initialized'));
      return;
    }

    log('Opening auth modal');
    setIsLoading(true);
    setError(null);

    try {
      await authSDK.openAuthModal();
      // Success is handled by onSuccess callback
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err : new Error('Failed to open auth modal'));
    }
  }, [authSDK, log]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(() => {
    if (!authSDK) return;

    log('Logging out');
    authSDK.logout();
    setSession(null);
    setIsAuthenticated(false);
    setVaultInfo(null);
    setError(null);
  }, [authSDK, log]);

  /**
   * Refresh the current session
   */
  const refreshSession = useCallback(async (): Promise<AuthSession | null> => {
    if (!authSDK) return null;

    log('Refreshing session');
    try {
      const refreshedSession = await authSDK.refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession as AuthSession);
        setIsAuthenticated(true);
        return refreshedSession as AuthSession;
      }
      return null;
    } catch (err) {
      log('Failed to refresh session:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh session'));
      return null;
    }
  }, [authSDK, log]);

  // Derived values
  const vaultId = session?.user?.vaultId ?? null;
  const walletAddress = session?.user?.evmAddress ?? null;

  // Context value
  const value: EmblemAuthContextValue = {
    // State
    session,
    isAuthenticated,
    isLoading,
    error,
    vaultInfo,

    // Derived
    vaultId,
    walletAddress,

    // Actions
    openAuthModal,
    logout,
    refreshSession,

    // For Hustle integration
    authSDK,
  };

  return (
    <EmblemAuthContext.Provider value={value}>
      {children}
    </EmblemAuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within EmblemAuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, openAuthModal, logout } = useEmblemAuth();
 *
 *   return isAuthenticated
 *     ? <button onClick={logout}>Logout</button>
 *     : <button onClick={openAuthModal}>Connect</button>;
 * }
 * ```
 */
export function useEmblemAuth(): EmblemAuthContextValue {
  const context = useContext(EmblemAuthContext);
  if (context === undefined) {
    throw new Error('useEmblemAuth must be used within an EmblemAuthProvider');
  }
  return context;
}

/**
 * Reset the global SDK instance (useful for testing)
 */
export function resetAuthSDK(): void {
  globalSDKInstance = null;
  isSDKInitializing = false;
}
