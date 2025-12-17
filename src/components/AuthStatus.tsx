'use client';

import React, { useState, useCallback } from 'react';
import { useEmblemAuth } from '../providers/EmblemAuthProvider';

/**
 * Props for AuthStatus component
 */
export interface AuthStatusProps {
  /** Additional CSS classes */
  className?: string;
  /** Show expandable vault details */
  showVaultInfo?: boolean;
  /** Show logout button */
  showLogout?: boolean;
  /** Compact mode - less padding, smaller text */
  compact?: boolean;
}

/**
 * Truncate address for display
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * AuthStatus - Displays current authentication status and vault info
 *
 * @example Basic usage
 * ```tsx
 * <AuthStatus />
 * ```
 *
 * @example With vault info and logout
 * ```tsx
 * <AuthStatus showVaultInfo showLogout />
 * ```
 *
 * @example Compact mode
 * ```tsx
 * <AuthStatus compact />
 * ```
 */
export function AuthStatus({
  className = '',
  showVaultInfo = false,
  showLogout = false,
  compact = false,
}: AuthStatusProps) {
  const {
    isAuthenticated,
    isLoading,
    walletAddress,
    vaultId,
    vaultInfo,
    logout,
  } = useEmblemAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback(async (field: string, value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    }
  }, []);

  // Not authenticated - show nothing or disconnected state
  if (!isAuthenticated) {
    if (isLoading) {
      return (
        <div className={`inline-flex items-center gap-2 text-gray-500 ${className}`}>
          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className={compact ? 'text-xs' : 'text-sm'}>Connecting...</span>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2 text-gray-400 ${className}`}>
        <span className={`inline-block w-2 h-2 rounded-full bg-gray-400`} />
        <span className={compact ? 'text-xs' : 'text-sm'}>Not connected</span>
      </div>
    );
  }

  // Authenticated - show status
  const padding = compact ? 'px-2 py-1' : 'px-3 py-2';
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={`relative ${className}`}>
      {/* Connected indicator */}
      <button
        type="button"
        onClick={() => showVaultInfo && setIsExpanded(!isExpanded)}
        className={`
          inline-flex items-center gap-2 ${padding} rounded-lg
          bg-green-50 text-green-700 border border-green-200
          ${showVaultInfo ? 'cursor-pointer hover:bg-green-100' : 'cursor-default'}
          transition-colors
        `}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span className={textSize}>Connected</span>
        <span className={`${textSize} font-mono opacity-75`}>
          {truncateAddress(walletAddress || '')}
        </span>
        {showVaultInfo && (
          <span className={`${textSize} opacity-50`}>
            {isExpanded ? '▲' : '▼'}
          </span>
        )}
      </button>

      {/* Logout button */}
      {showLogout && (
        <button
          type="button"
          onClick={logout}
          className={`
            ml-2 ${padding} rounded-lg ${textSize}
            text-gray-500 hover:text-gray-700 hover:bg-gray-100
            transition-colors
          `}
          title="Disconnect"
        >
          ⏻
        </button>
      )}

      {/* Vault info dropdown */}
      {showVaultInfo && isExpanded && (
        <div className={`
          absolute top-full left-0 mt-1 z-50
          bg-white rounded-lg shadow-lg border border-gray-200
          min-w-[280px] ${textSize}
        `}>
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 font-medium text-gray-600 uppercase text-xs tracking-wide">
            Vault Information
          </div>

          <div className="p-3 space-y-3">
            {/* Vault ID */}
            <InfoRow
              label="Vault ID"
              value={`#${vaultId}`}
              onCopy={() => handleCopy('vaultId', vaultId || '')}
              isCopied={copiedField === 'vaultId'}
            />

            {/* Connected Wallet */}
            <InfoRow
              label="Connected Wallet"
              value={walletAddress || ''}
              displayValue={truncateAddress(walletAddress || '')}
              onCopy={() => handleCopy('wallet', walletAddress || '')}
              isCopied={copiedField === 'wallet'}
              mono
            />

            {/* Vault EVM Address */}
            {vaultInfo?.evmAddress && (
              <InfoRow
                label="Vault EVM Address"
                value={vaultInfo.evmAddress}
                displayValue={truncateAddress(vaultInfo.evmAddress)}
                onCopy={() => handleCopy('evmAddress', vaultInfo.evmAddress!)}
                isCopied={copiedField === 'evmAddress'}
                mono
              />
            )}

            {/* Vault Solana Address */}
            {vaultInfo?.solanaAddress && (
              <InfoRow
                label="Vault Solana Address"
                value={vaultInfo.solanaAddress}
                displayValue={truncateAddress(vaultInfo.solanaAddress)}
                onCopy={() => handleCopy('solAddress', vaultInfo.solanaAddress!)}
                isCopied={copiedField === 'solAddress'}
                mono
              />
            )}

            {/* Hedera Account */}
            {vaultInfo?.hederaAccountId && (
              <InfoRow
                label="Hedera Account"
                value={vaultInfo.hederaAccountId}
                onCopy={() => handleCopy('hedera', vaultInfo.hederaAccountId!)}
                isCopied={copiedField === 'hedera'}
              />
            )}

            {/* Created At */}
            {vaultInfo?.createdAt && (
              <InfoRow
                label="Created"
                value={new Date(vaultInfo.createdAt).toLocaleDateString()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper component for info rows
 */
interface InfoRowProps {
  label: string;
  value: string;
  displayValue?: string;
  onCopy?: () => void;
  isCopied?: boolean;
  mono?: boolean;
}

function InfoRow({ label, value, displayValue, onCopy, isCopied, mono }: InfoRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-gray-500 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>
          {displayValue || value}
        </span>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className={`
              px-2 py-0.5 text-xs rounded
              ${isCopied
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
              transition-colors
            `}
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

export default AuthStatus;
