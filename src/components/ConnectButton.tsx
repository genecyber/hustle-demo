'use client';

import React, { useCallback, useState } from 'react';
import { useEmblemAuth } from '../providers/EmblemAuthProvider';
import { tokens, presets, animations } from '../styles';

/**
 * Props for ConnectButton component
 */
export interface ConnectButtonProps {
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Custom content when disconnected */
  connectLabel?: React.ReactNode;
  /** Custom content while loading */
  loadingLabel?: React.ReactNode;
  /** Callback after successful connection */
  onConnect?: () => void;
  /** Callback after disconnection */
  onDisconnect?: () => void;
  /** Show vault info dropdown when connected */
  showVaultInfo?: boolean;
  /** Disable the button */
  disabled?: boolean;
}

/**
 * Truncate wallet address for display
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
const styles = {
  wrapper: {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },

  button: {
    ...presets.button,
    padding: `${tokens.spacing.sm} ${tokens.spacing.xl}`,
  } as React.CSSProperties,

  disconnected: {
    background: tokens.colors.bgTertiary,
    color: tokens.colors.textPrimary,
    borderColor: tokens.colors.borderSecondary,
  } as React.CSSProperties,

  disconnectedHover: {
    background: tokens.colors.bgHover,
    borderColor: tokens.colors.borderHover,
  } as React.CSSProperties,

  connected: {
    background: 'transparent',
    color: tokens.colors.accentSuccess,
    borderColor: tokens.colors.accentSuccess,
    borderRadius: tokens.radius.pill,
  } as React.CSSProperties,

  connectedHover: {
    background: tokens.colors.accentSuccessBg,
  } as React.CSSProperties,

  loading: {
    background: tokens.colors.borderSecondary,
    color: tokens.colors.textSecondary,
    cursor: 'wait',
  } as React.CSSProperties,

  disabled: {
    background: tokens.colors.borderSecondary,
    color: tokens.colors.textTertiary,
    cursor: 'not-allowed',
    opacity: 0.5,
  } as React.CSSProperties,

  icon: {
    fontSize: tokens.typography.fontSizeLg,
  } as React.CSSProperties,

  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: tokens.radius.full,
    animation: 'hustle-spin 0.8s linear infinite',
  } as React.CSSProperties,

  address: {
    ...presets.mono,
    color: tokens.colors.textPrimary,
  } as React.CSSProperties,

  dot: {
    color: tokens.colors.textSecondary,
  } as React.CSSProperties,

  check: {
    color: tokens.colors.accentSuccess,
  } as React.CSSProperties,

  arrow: {
    fontSize: '10px',
    color: tokens.colors.textSecondary,
    marginLeft: tokens.spacing.xs,
  } as React.CSSProperties,

  // Disconnect button
  disconnectBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'transparent',
    border: `1px solid ${tokens.colors.borderSecondary}`,
    borderRadius: tokens.radius.lg,
    color: tokens.colors.textSecondary,
    cursor: 'pointer',
    fontSize: '16px',
    transition: `all ${tokens.transitions.normal}`,
  } as React.CSSProperties,

  disconnectBtnHover: {
    borderColor: tokens.colors.accentError,
    color: tokens.colors.accentError,
  } as React.CSSProperties,

  // Vault info dropdown
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: tokens.spacing.xs,
    background: tokens.colors.bgPrimary,
    border: `1px solid ${tokens.colors.accentSuccess}`,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing.lg,
    minWidth: '300px',
    zIndex: tokens.zIndex.dropdown,
    boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${tokens.colors.accentSuccessBg}`,
  },

  dropdownHeader: {
    fontSize: tokens.typography.fontSizeXs,
    fontWeight: tokens.typography.fontWeightSemibold,
    color: tokens.colors.textSecondary,
    letterSpacing: '0.5px',
    marginBottom: tokens.spacing.lg,
    textTransform: 'uppercase' as const,
  },

  dropdownRow: {
    marginBottom: tokens.spacing.md,
  },

  dropdownLabel: {
    display: 'block',
    fontSize: tokens.typography.fontSizeXs,
    color: tokens.colors.textTertiary,
    marginBottom: tokens.spacing.xs,
  },

  dropdownValueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },

  dropdownValue: {
    fontSize: tokens.typography.fontSizeMd,
    color: tokens.colors.textPrimary,
    fontWeight: tokens.typography.fontWeightMedium,
    flex: 1,
  },

  dropdownValueMono: {
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
 * ConnectButton - A button to trigger Emblem Auth connection
 * When connected, shows vault info dropdown and separate disconnect button
 */
export function ConnectButton({
  className = '',
  style,
  connectLabel = 'Connect',
  loadingLabel = 'Connecting...',
  onConnect,
  onDisconnect,
  showVaultInfo = true,
  disabled = false,
}: ConnectButtonProps) {
  const {
    isAuthenticated,
    isLoading,
    walletAddress,
    vaultId,
    openAuthModal,
    logout,
  } = useEmblemAuth();

  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [disconnectHovered, setDisconnectHovered] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyHovered, setCopyHovered] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (disabled) return;

    if (!isAuthenticated && !isLoading) {
      await openAuthModal();
      onConnect?.();
    }
    // When connected, clicking toggles dropdown (handled by hover)
  }, [disabled, isAuthenticated, isLoading, openAuthModal, onConnect]);

  const handleDisconnect = useCallback(() => {
    logout();
    onDisconnect?.();
    setShowDropdown(false);
  }, [logout, onDisconnect]);

  const handleCopy = useCallback(async (field: string, value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    }
  }, []);

  // Build style based on state
  let buttonStyle: React.CSSProperties = { ...styles.button };
  let content: React.ReactNode = connectLabel;

  if (disabled) {
    buttonStyle = { ...buttonStyle, ...styles.disconnected, ...styles.disabled };
  } else if (isLoading) {
    buttonStyle = { ...buttonStyle, ...styles.disconnected, ...styles.loading };
    content = (
      <>
        <span style={styles.spinner} />
        {loadingLabel}
      </>
    );
  } else if (isAuthenticated) {
    buttonStyle = { ...buttonStyle, ...styles.connected };
    if (isHovered || showDropdown) {
      buttonStyle = { ...buttonStyle, ...styles.connectedHover };
    }
    const truncated = truncateAddress(walletAddress || '');

    content = (
      <>
        <span style={styles.check}>✓</span>
        <span>Connected</span>
        <span style={styles.dot}>•</span>
        <span style={styles.address}>{truncated}</span>
        <span style={styles.arrow}>▾</span>
      </>
    );
  } else {
    buttonStyle = { ...buttonStyle, ...styles.disconnected };
    if (isHovered) {
      buttonStyle = { ...buttonStyle, ...styles.disconnectedHover };
    }
    content = (
      <>
        <span style={styles.icon}>→</span>
        {connectLabel}
      </>
    );
  }

  // Merge with passed style
  if (style) {
    buttonStyle = { ...buttonStyle, ...style };
  }

  // Render copy button helper
  const renderCopyBtn = (field: string, value: string) => {
    const isCopied = copiedField === field;
    const isHover = copyHovered === field;
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleCopy(field, value); }}
        style={{
          ...styles.copyBtn,
          ...(isCopied ? styles.copyBtnCopied : isHover ? styles.copyBtnHover : {}),
        }}
        onMouseEnter={() => setCopyHovered(field)}
        onMouseLeave={() => setCopyHovered(null)}
      >
        {isCopied ? 'Copied!' : 'Copy'}
      </button>
    );
  };

  return (
    <>
      <style>{animations}</style>
      <div
        style={styles.wrapper}
        onMouseEnter={() => isAuthenticated && showVaultInfo && setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        {/* Main button */}
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isLoading}
          className={className}
          style={buttonStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {content}
        </button>

        {/* Disconnect button (only when authenticated) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleDisconnect}
            style={{
              ...styles.disconnectBtn,
              ...(disconnectHovered ? styles.disconnectBtnHover : {}),
            }}
            onMouseEnter={() => setDisconnectHovered(true)}
            onMouseLeave={() => setDisconnectHovered(false)}
            title="Disconnect"
          >
            ⏻
          </button>
        )}

        {/* Vault info dropdown */}
        {isAuthenticated && showVaultInfo && showDropdown && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>Vault Information</div>

            {/* Vault ID */}
            <div style={styles.dropdownRow}>
              <span style={styles.dropdownLabel}>Vault ID</span>
              <div style={styles.dropdownValueRow}>
                <span style={styles.dropdownValue}>#{vaultId}</span>
                {renderCopyBtn('vaultId', vaultId || '')}
              </div>
            </div>

            {/* Connected Wallet */}
            <div style={{ ...styles.dropdownRow, marginBottom: 0 }}>
              <span style={styles.dropdownLabel}>Connected Wallet</span>
              <div style={styles.dropdownValueRow}>
                <span style={{ ...styles.dropdownValue, ...styles.dropdownValueMono }}>
                  {walletAddress}
                </span>
                {renderCopyBtn('wallet', walletAddress || '')}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ConnectButton;
