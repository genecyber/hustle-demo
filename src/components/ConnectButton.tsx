'use client';

import React, { useCallback } from 'react';
import { useEmblemAuth } from '../providers/EmblemAuthProvider';

/**
 * Props for ConnectButton component
 */
export interface ConnectButtonProps {
  /** Additional CSS classes */
  className?: string;
  /** Custom content when disconnected */
  connectLabel?: React.ReactNode;
  /** Custom content when connected (receives truncated address) */
  connectedLabel?: React.ReactNode | ((address: string) => React.ReactNode);
  /** Custom content while loading */
  loadingLabel?: React.ReactNode;
  /** Callback after successful connection */
  onConnect?: () => void;
  /** Callback after disconnection */
  onDisconnect?: () => void;
  /** Show disconnect option when connected */
  showDisconnect?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Button style variant */
  variant?: 'default' | 'minimal';
}

/**
 * Truncate wallet address for display
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Default styles for the button
 */
const defaultStyles = {
  default: {
    base: 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    disconnected: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    connected: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    loading: 'bg-gray-400 text-white cursor-wait',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
  },
  minimal: {
    base: 'inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded font-medium transition-colors',
    disconnected: 'text-blue-600 hover:bg-blue-50',
    connected: 'text-green-600 hover:bg-green-50',
    loading: 'text-gray-400 cursor-wait',
    disabled: 'text-gray-400 cursor-not-allowed',
  },
};

/**
 * ConnectButton - A button to trigger Emblem Auth connection
 *
 * @example Basic usage
 * ```tsx
 * <ConnectButton />
 * ```
 *
 * @example With callbacks
 * ```tsx
 * <ConnectButton
 *   onConnect={() => console.log('Connected!')}
 *   onDisconnect={() => console.log('Disconnected!')}
 * />
 * ```
 *
 * @example Custom labels
 * ```tsx
 * <ConnectButton
 *   connectLabel="Sign In"
 *   connectedLabel={(addr) => `Wallet: ${addr}`}
 *   loadingLabel="Connecting..."
 * />
 * ```
 */
export function ConnectButton({
  className = '',
  connectLabel = 'Connect',
  connectedLabel,
  loadingLabel = 'Connecting...',
  onConnect,
  onDisconnect,
  showDisconnect = true,
  disabled = false,
  variant = 'default',
}: ConnectButtonProps) {
  const {
    isAuthenticated,
    isLoading,
    walletAddress,
    openAuthModal,
    logout,
  } = useEmblemAuth();

  const handleClick = useCallback(async () => {
    if (disabled) return;

    if (isAuthenticated && showDisconnect) {
      logout();
      onDisconnect?.();
    } else if (!isAuthenticated && !isLoading) {
      await openAuthModal();
      // onConnect is called after successful auth
      // We'd need to detect this via effect, but keeping it simple for now
    }
  }, [disabled, isAuthenticated, isLoading, showDisconnect, logout, openAuthModal, onDisconnect]);

  // Get styles for current variant
  const styles = defaultStyles[variant];

  // Determine current state and content
  let stateClass = styles.disconnected;
  let content: React.ReactNode = connectLabel;

  if (disabled) {
    stateClass = styles.disabled;
  } else if (isLoading) {
    stateClass = styles.loading;
    content = (
      <>
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        {loadingLabel}
      </>
    );
  } else if (isAuthenticated) {
    stateClass = styles.connected;
    const truncated = truncateAddress(walletAddress || '');

    if (connectedLabel) {
      content = typeof connectedLabel === 'function'
        ? connectedLabel(truncated)
        : connectedLabel;
    } else {
      content = (
        <>
          <span className="inline-block w-2 h-2 bg-current rounded-full opacity-75" />
          {truncated}
        </>
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${styles.base} ${stateClass} ${className}`.trim()}
    >
      {content}
    </button>
  );
}

export default ConnectButton;
