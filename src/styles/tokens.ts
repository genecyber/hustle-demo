/**
 * Design Tokens for Hustle React Components
 *
 * These tokens use CSS Custom Properties (CSS Variables) for easy theming.
 * Override any variable in your CSS to customize the theme:
 *
 * @example
 * ```css
 * :root {
 *   --hustle-color-bg-primary: #ffffff;
 *   --hustle-color-text-primary: #1a1a1a;
 * }
 * ```
 */

// ============================================================================
// Default Token Values
// ============================================================================
const defaults = {
  colors: {
    // Backgrounds
    bgPrimary: '#0b0d10',
    bgSecondary: '#12161b',
    bgTertiary: '#1a1f25',
    bgHover: '#252b33',
    bgOverlay: 'rgba(0, 0, 0, 0.7)',

    // Borders
    borderPrimary: '#222b35',
    borderSecondary: '#333',
    borderHover: '#444',

    // Text
    textPrimary: '#e6eef8',
    textSecondary: '#8892a4',
    textTertiary: '#6b7280',
    textInverse: '#fff',

    // Accent - Primary (blue)
    accentPrimary: '#4c9aff',
    accentPrimaryHover: '#7bb6ff',
    accentPrimaryBg: 'rgba(76, 154, 255, 0.1)',

    // Accent - Success (green)
    accentSuccess: '#10b981',
    accentSuccessHover: '#34d399',
    accentSuccessBg: 'rgba(16, 185, 129, 0.1)',

    // Accent - Warning (yellow/orange)
    accentWarning: '#f59e0b',
    accentWarningBg: 'rgba(245, 158, 11, 0.1)',

    // Accent - Error (red)
    accentError: '#dc2626',
    accentErrorHover: '#ef4444',
    accentErrorBg: 'rgba(239, 68, 68, 0.1)',

    // Messages
    msgUser: '#1e3a5f',
    msgAssistant: '#1a2633',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: '"SF Mono", Monaco, monospace',
    fontSizeXs: '11px',
    fontSizeSm: '13px',
    fontSizeMd: '14px',
    fontSizeLg: '16px',
    fontSizeXl: '18px',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightSemibold: '600',
    lineHeightTight: '1.3',
    lineHeightNormal: '1.5',
    lineHeightRelaxed: '1.7',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },

  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    pill: '20px',
    full: '50%',
  },

  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.2)',
    md: '0 4px 16px rgba(0,0,0,0.3)',
    lg: '0 8px 32px rgba(0,0,0,0.4)',
    xl: '0 16px 48px rgba(0,0,0,0.5)',
  },

  // Glow effects (for enhanced themes)
  glows: {
    primary: 'rgba(76, 154, 255, 0.4)',
    success: 'rgba(16, 185, 129, 0.4)',
    error: 'rgba(239, 68, 68, 0.4)',
    ambient: 'rgba(76, 154, 255, 0.08)',
  },

  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },

  zIndex: {
    dropdown: '100',
    modal: '1000',
    fullscreen: '1000',
    modalOverFullscreen: '10000',
  },
};

// ============================================================================
// CSS Variable Name Generator
// ============================================================================
function toVarName(category: string, key: string): string {
  // Convert camelCase to kebab-case
  const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `--hustle-${category}-${kebab}`;
}

// ============================================================================
// CSS Variables Stylesheet (inject this once in your app)
// ============================================================================
function generateCSSVariables(): string {
  const lines: string[] = [':root {'];

  // Colors
  for (const [key, value] of Object.entries(defaults.colors)) {
    lines.push(`  ${toVarName('color', key)}: ${value};`);
  }

  // Typography
  for (const [key, value] of Object.entries(defaults.typography)) {
    lines.push(`  ${toVarName('font', key)}: ${value};`);
  }

  // Spacing
  for (const [key, value] of Object.entries(defaults.spacing)) {
    lines.push(`  ${toVarName('space', key)}: ${value};`);
  }

  // Radius
  for (const [key, value] of Object.entries(defaults.radius)) {
    lines.push(`  ${toVarName('radius', key)}: ${value};`);
  }

  // Shadows
  for (const [key, value] of Object.entries(defaults.shadows)) {
    lines.push(`  ${toVarName('shadow', key)}: ${value};`);
  }

  // Glows
  for (const [key, value] of Object.entries(defaults.glows)) {
    lines.push(`  ${toVarName('glow', key)}: ${value};`);
  }

  // Transitions
  for (const [key, value] of Object.entries(defaults.transitions)) {
    lines.push(`  ${toVarName('transition', key)}: ${value};`);
  }

  // Z-Index
  for (const [key, value] of Object.entries(defaults.zIndex)) {
    lines.push(`  ${toVarName('z', key)}: ${value};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * CSS Variables stylesheet - inject this in your app's <head> or include in your CSS
 * Contains all default token values as CSS custom properties
 */
export const cssVariables = generateCSSVariables();

// ============================================================================
// Token Accessors (use CSS var() with fallback to default)
// ============================================================================
function createColorTokens() {
  const result: Record<string, string> = {};
  for (const [key, defaultValue] of Object.entries(defaults.colors)) {
    result[key] = `var(${toVarName('color', key)}, ${defaultValue})`;
  }
  return result as typeof defaults.colors;
}

function createTypographyTokens() {
  const result: Record<string, string | number> = {};
  for (const [key, defaultValue] of Object.entries(defaults.typography)) {
    result[key] = `var(${toVarName('font', key)}, ${defaultValue})`;
  }
  return result as unknown as {
    fontFamily: string;
    fontFamilyMono: string;
    fontSizeXs: string;
    fontSizeSm: string;
    fontSizeMd: string;
    fontSizeLg: string;
    fontSizeXl: string;
    fontWeightNormal: number;
    fontWeightMedium: number;
    fontWeightSemibold: number;
    lineHeightTight: number;
    lineHeightNormal: number;
    lineHeightRelaxed: number;
  };
}

function createSpacingTokens() {
  const result: Record<string, string> = {};
  for (const [key, defaultValue] of Object.entries(defaults.spacing)) {
    result[key] = `var(${toVarName('space', key)}, ${defaultValue})`;
  }
  return result as typeof defaults.spacing;
}

function createRadiusTokens() {
  const result: Record<string, string> = {};
  for (const [key, defaultValue] of Object.entries(defaults.radius)) {
    result[key] = `var(${toVarName('radius', key)}, ${defaultValue})`;
  }
  return result as typeof defaults.radius;
}

function createShadowTokens() {
  const result: Record<string, string> = {};
  for (const [key, defaultValue] of Object.entries(defaults.shadows)) {
    result[key] = `var(${toVarName('shadow', key)}, ${defaultValue})`;
  }
  return result as typeof defaults.shadows;
}

function createGlowTokens() {
  const result: Record<string, string> = {};
  for (const [key, defaultValue] of Object.entries(defaults.glows)) {
    result[key] = `var(${toVarName('glow', key)}, ${defaultValue})`;
  }
  return result as typeof defaults.glows;
}

function createTransitionTokens() {
  const result: Record<string, string> = {};
  for (const [key, defaultValue] of Object.entries(defaults.transitions)) {
    result[key] = `var(${toVarName('transition', key)}, ${defaultValue})`;
  }
  return result as typeof defaults.transitions;
}

function createZIndexTokens() {
  const result: Record<string, number> = {};
  for (const [key, defaultValue] of Object.entries(defaults.zIndex)) {
    // z-index needs to be a number for React inline styles
    // We keep the default value as number, CSS var override still works
    result[key] = parseInt(defaultValue, 10);
  }
  return result as { dropdown: number; modal: number; fullscreen: number; modalOverFullscreen: number };
}

// ============================================================================
// Exported Tokens (use these in components)
// ============================================================================
export const tokens = {
  colors: createColorTokens(),
  typography: createTypographyTokens(),
  spacing: createSpacingTokens(),
  radius: createRadiusTokens(),
  shadows: createShadowTokens(),
  glows: createGlowTokens(),
  transitions: createTransitionTokens(),
  zIndex: createZIndexTokens(),
};

export type Tokens = typeof tokens;

/**
 * Raw default values (without CSS var() wrapper)
 * Use this if you need the actual values, not CSS variable references
 */
export const defaultTokens = defaults;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a token value by path (e.g., 'colors.bgPrimary')
 */
export function getTokenValue(path: string): string | number | undefined {
  const parts = path.split('.');
  let current: unknown = tokens;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current as string | number | undefined;
}

/**
 * Create a themed style object
 */
export function createStyle(mapping: Record<string, string>): React.CSSProperties {
  const result: Record<string, unknown> = {};

  for (const [cssProp, tokenPath] of Object.entries(mapping)) {
    const value = getTokenValue(tokenPath);
    if (value !== undefined) {
      result[cssProp] = value;
    }
  }

  return result as React.CSSProperties;
}

// ============================================================================
// Common Style Presets
// ============================================================================
export const presets = {
  base: {
    fontFamily: tokens.typography.fontFamily,
    fontSize: tokens.typography.fontSizeMd,
    lineHeight: tokens.typography.lineHeightNormal,
    color: tokens.colors.textPrimary,
  } as React.CSSProperties,

  card: {
    background: tokens.colors.bgSecondary,
    border: `1px solid ${tokens.colors.borderPrimary}`,
    borderRadius: tokens.radius.xl,
  } as React.CSSProperties,

  input: {
    background: tokens.colors.bgTertiary,
    border: `1px solid ${tokens.colors.borderSecondary}`,
    borderRadius: tokens.radius.lg,
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSizeMd,
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    outline: 'none',
    transition: `border-color ${tokens.transitions.normal}`,
  } as React.CSSProperties,

  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
    borderRadius: tokens.radius.lg,
    fontSize: tokens.typography.fontSizeMd,
    fontWeight: tokens.typography.fontWeightMedium,
    cursor: 'pointer',
    transition: `all ${tokens.transitions.normal}`,
    border: `1px solid ${tokens.colors.borderSecondary}`,
    outline: 'none',
  } as React.CSSProperties,

  buttonPrimary: {
    background: tokens.colors.accentPrimary,
    color: tokens.colors.textInverse,
    borderColor: tokens.colors.accentPrimary,
  } as React.CSSProperties,

  buttonSecondary: {
    background: tokens.colors.bgTertiary,
    color: tokens.colors.textPrimary,
    borderColor: tokens.colors.borderSecondary,
  } as React.CSSProperties,

  buttonIcon: {
    width: '36px',
    height: '36px',
    padding: 0,
    // background inherited from global button styles
    color: tokens.colors.textSecondary,
  } as React.CSSProperties,

  mono: {
    fontFamily: tokens.typography.fontFamilyMono,
    fontSize: tokens.typography.fontSizeSm,
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: tokens.typography.fontSizeXs,
    color: tokens.colors.textTertiary,
    marginBottom: tokens.spacing.xs,
  } as React.CSSProperties,
};

// ============================================================================
// Animation Keyframes
// ============================================================================

/**
 * Animation keyframes only (no CSS variable defaults)
 * Use this in components to avoid overriding consumer theme customizations
 */
export const animations = `
@keyframes hustle-spin {
  to { transform: rotate(360deg); }
}
@keyframes hustle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes hustle-glow {
  0%, 100% {
    opacity: 1;
    text-shadow: 0 0 4px ${defaults.colors.accentPrimaryBg};
  }
  50% {
    opacity: 0.6;
    text-shadow: 0 0 8px ${defaults.colors.accentPrimary};
  }
}
`;

/**
 * @deprecated Use `animations` instead. This includes CSS variable defaults
 * which can override consumer theme customizations.
 */
export const keyframes = `
${cssVariables}
${animations}
`;

export default tokens;
