'use client';

import React, { useState, useCallback } from 'react';
import { useEmblemAuth } from '../providers/EmblemAuthProvider';
import { tokens, presets, animations } from '../styles';

/**
 * Props for AuthStatus component
 */
export interface AuthStatusProps {
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Show expandable vault details */
  showVaultInfo?: boolean;
  /** Show logout button */
  showLogout?: boolean;
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

// Styles using design tokens
const s = {
  container: {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    fontFamily: tokens.typography.fontFamily,
  },
  disconnected: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontSizeMd,
  },
  dot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.textTertiary,
  },
  dotConnected: {
    backgroundColor: tokens.colors.accentSuccess,
  },
  spinner: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    border: `2px solid ${tokens.colors.textSecondary}`,
    borderTopColor: 'transparent',
    borderRadius: tokens.radius.full,
    animation: 'hustle-spin 0.8s linear infinite',
  },
  logoutBtn: {
    ...presets.buttonIcon,
    border: `1px solid ${tokens.colors.borderSecondary}`,
    borderRadius: tokens.radius.lg,
    transition: `all ${tokens.transitions.normal}`,
  } as React.CSSProperties,
  logoutBtnHover: {
    borderColor: tokens.colors.accentError,
    color: tokens.colors.accentError,
  },
  vaultInfoWrapper: {
    position: 'relative' as const,
  },
  vaultInfo: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: tokens.spacing.sm,
    background: tokens.colors.bgSecondary,
    border: `1px solid ${tokens.colors.borderPrimary}`,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    minWidth: '380px',
    zIndex: tokens.zIndex.dropdown,
    boxShadow: tokens.shadows.lg,
  },
  vaultInfoHeader: {
    fontSize: tokens.typography.fontSizeXs,
    fontWeight: tokens.typography.fontWeightSemibold,
    color: tokens.colors.textSecondary,
    letterSpacing: '0.5px',
    marginBottom: tokens.spacing.lg,
    textTransform: 'uppercase' as const,
  },
  vaultInfoRow: {
    marginBottom: tokens.spacing.md,
  },
  vaultLabel: {
    display: 'block',
    fontSize: '12px',
    color: tokens.colors.textTertiary,
    marginBottom: tokens.spacing.xs,
  },
  vaultValueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  vaultValue: {
    fontSize: tokens.typography.fontSizeMd,
    color: tokens.colors.textPrimary,
    fontWeight: tokens.typography.fontWeightMedium,
    flex: 1,
  },
  vaultValueMono: {
    ...presets.mono,
    wordBreak: 'break-all' as const,
  },
  copyBtn: {
    background: 'transparent',
    border: `1px solid ${tokens.colors.borderSecondary}`,
    color: tokens.colors.textSecondary,
    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
    borderRadius: tokens.radius.sm,
    cursor: 'pointer',
    fontSize: tokens.typography.fontSizeXs,
    transition: `all ${tokens.transitions.normal}`,
    whiteSpace: 'nowrap' as const,
  },
  copyBtnHover: {
    background: tokens.colors.bgHover,
    borderColor: tokens.colors.accentPrimary,
    color: tokens.colors.accentPrimary,
  },
  copyBtnCopied: {
    background: tokens.colors.accentSuccess,
    borderColor: tokens.colors.accentSuccess,
    color: tokens.colors.textInverse,
  },
};

/**
 * AuthStatus - Displays current authentication status and vault info
 */
export function AuthStatus({
  className = '',
  style,
  showVaultInfo = false,
  showLogout = false,
}: AuthStatusProps) {
  const {
    isAuthenticated,
    isLoading,
    walletAddress,
    vaultId,
    vaultInfo,
    logout,
  } = useEmblemAuth();

  const [isHovered, setIsHovered] = useState(false);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyHovered, setCopyHovered] = useState<string | null>(null);

  const handleCopy = useCallback(async (field: string, value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    }
  }, []);

  // Not authenticated
  if (!isAuthenticated) {
    if (isLoading) {
      return (
        <>
          <style>{animations}</style>
          <div className={className} style={{ ...s.disconnected, ...style }}>
            <span style={s.spinner} />
            <span>Connecting...</span>
          </div>
        </>
      );
    }

    return (
      <div className={className} style={{ ...s.disconnected, ...style }}>
        <span style={s.dot} />
        <span>Not connected</span>
      </div>
    );
  }

  // Authenticated
  return (
    <>
      <style>{animations}</style>
      <div className={className} style={{ ...s.container, ...style }}>
        {/* Vault info wrapper for hover effect */}
        <div
          style={s.vaultInfoWrapper}
          onMouseEnter={() => showVaultInfo && setIsHovered(true)}
          onMouseLeave={() => showVaultInfo && setIsHovered(false)}
        >
          {/* Connected indicator - just a dot */}
          <span style={{ ...s.dot, ...s.dotConnected }} title="Connected" />

          {/* Vault info dropdown on hover */}
          {showVaultInfo && isHovered && (
            <div style={s.vaultInfo}>
              <div style={s.vaultInfoHeader}>Vault Information</div>

              {/* Vault ID */}
              <div style={s.vaultInfoRow}>
                <span style={s.vaultLabel}>Vault ID</span>
                <div style={s.vaultValueRow}>
                  <span style={s.vaultValue}>#{vaultId}</span>
                  <CopyButton
                    field="vaultId"
                    value={vaultId || ''}
                    copiedField={copiedField}
                    copyHovered={copyHovered}
                    setCopyHovered={setCopyHovered}
                    onCopy={handleCopy}
                  />
                </div>
              </div>

              {/* Connected Wallet */}
              <div style={s.vaultInfoRow}>
                <span style={s.vaultLabel}>Connected Wallet</span>
                <div style={s.vaultValueRow}>
                  <span style={{ ...s.vaultValue, ...s.vaultValueMono }}>{walletAddress}</span>
                  <CopyButton
                    field="wallet"
                    value={walletAddress || ''}
                    copiedField={copiedField}
                    copyHovered={copyHovered}
                    setCopyHovered={setCopyHovered}
                    onCopy={handleCopy}
                  />
                </div>
              </div>

              {/* EVM Address */}
              {vaultInfo?.evmAddress && (
                <div style={s.vaultInfoRow}>
                  <span style={s.vaultLabel}>Vault EVM Address</span>
                  <div style={s.vaultValueRow}>
                    <span style={{ ...s.vaultValue, ...s.vaultValueMono }}>{vaultInfo.evmAddress}</span>
                    <CopyButton
                      field="evmAddress"
                      value={vaultInfo.evmAddress}
                      copiedField={copiedField}
                      copyHovered={copyHovered}
                      setCopyHovered={setCopyHovered}
                      onCopy={handleCopy}
                    />
                  </div>
                </div>
              )}

              {/* Solana Address */}
              {vaultInfo?.solanaAddress && (
                <div style={s.vaultInfoRow}>
                  <span style={s.vaultLabel}>Vault Solana Address</span>
                  <div style={s.vaultValueRow}>
                    <span style={{ ...s.vaultValue, ...s.vaultValueMono }}>{vaultInfo.solanaAddress}</span>
                    <CopyButton
                      field="solAddress"
                      value={vaultInfo.solanaAddress}
                      copiedField={copiedField}
                      copyHovered={copyHovered}
                      setCopyHovered={setCopyHovered}
                      onCopy={handleCopy}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout button */}
        {showLogout && (
          <button
            type="button"
            onClick={logout}
            style={{
              ...s.logoutBtn,
              ...(logoutHovered ? s.logoutBtnHover : {}),
            }}
            onMouseEnter={() => setLogoutHovered(true)}
            onMouseLeave={() => setLogoutHovered(false)}
            title="Disconnect"
          >
            ⏻
          </button>
        )}
      </div>
    </>
  );
}

// Copy button helper
interface CopyButtonProps {
  field: string;
  value: string;
  copiedField: string | null;
  copyHovered: string | null;
  setCopyHovered: (field: string | null) => void;
  onCopy: (field: string, value: string) => void;
}

function CopyButton({ field, value, copiedField, copyHovered, setCopyHovered, onCopy }: CopyButtonProps) {
  const isCopied = copiedField === field;
  const isHovered = copyHovered === field;

  return (
    <button
      type="button"
      onClick={() => onCopy(field, value)}
      style={{
        ...s.copyBtn,
        ...(isCopied ? s.copyBtnCopied : isHovered ? s.copyBtnHover : {}),
      }}
      onMouseEnter={() => setCopyHovered(field)}
      onMouseLeave={() => setCopyHovered(null)}
    >
      {isCopied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default AuthStatus;
