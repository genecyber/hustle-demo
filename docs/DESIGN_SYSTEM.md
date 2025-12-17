# Hustle Design System

A comprehensive theming system using CSS Custom Properties (CSS Variables) for easy customization.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [CSS Variables Reference](#css-variables-reference)
- [Theming Examples](#theming-examples)
- [Using Tokens in Code](#using-tokens-in-code)
- [Presets](#presets)

---

## Overview

The Hustle component library uses **semantic design tokens** implemented as CSS Custom Properties. This means:

- **Zero configuration** - Components work out-of-the-box with a dark theme
- **Easy customization** - Override any variable in your CSS
- **No wrapper required** - No ThemeProvider needed
- **Framework agnostic** - Works with any CSS approach (plain CSS, Tailwind, styled-components, etc.)

### What are Semantic Tokens?

Semantic tokens describe **purpose**, not appearance:

| Semantic (Good) | Non-semantic (Avoid) |
|-----------------|---------------------|
| `--hustle-color-bg-primary` | `--dark-blue` |
| `--hustle-color-text-secondary` | `--gray-500` |
| `--hustle-color-accent-success` | `--green` |

This makes theming intuitive - change "what things mean" rather than hunting for specific colors.

---

## Quick Start

### Default Theme (Dark)

Components work immediately with no setup:

```tsx
import { HustleChat, ConnectButton } from 'hustle-react';

// Just use the components - dark theme is built-in
<ConnectButton />
<HustleChat showSettings />
```

### Custom Theme

Override any CSS variable in your stylesheet:

```css
/* styles.css */
:root {
  /* Light theme example */
  --hustle-color-bg-primary: #ffffff;
  --hustle-color-bg-secondary: #f5f5f5;
  --hustle-color-bg-tertiary: #e5e5e5;
  --hustle-color-text-primary: #1a1a1a;
  --hustle-color-text-secondary: #666666;
  --hustle-color-border-primary: #e0e0e0;
}
```

### Scoped Theming

Apply different themes to different sections:

```css
/* Dark theme for chat section */
.chat-section {
  --hustle-color-bg-primary: #0b0d10;
  --hustle-color-text-primary: #e6eef8;
}

/* Light theme for settings */
.settings-section {
  --hustle-color-bg-primary: #ffffff;
  --hustle-color-text-primary: #1a1a1a;
}
```

---

## CSS Variables Reference

### Colors

#### Backgrounds

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-color-bg-primary` | `#0b0d10` | Main app background |
| `--hustle-color-bg-secondary` | `#12161b` | Card/section background |
| `--hustle-color-bg-tertiary` | `#1a1f25` | Input/button background |
| `--hustle-color-bg-hover` | `#252b33` | Hover state background |
| `--hustle-color-bg-overlay` | `rgba(0,0,0,0.7)` | Modal overlay |

#### Borders

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-color-border-primary` | `#222b35` | Card borders |
| `--hustle-color-border-secondary` | `#333` | Input/button borders |
| `--hustle-color-border-hover` | `#444` | Hover state borders |

#### Text

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-color-text-primary` | `#e6eef8` | Primary text |
| `--hustle-color-text-secondary` | `#8892a4` | Secondary/muted text |
| `--hustle-color-text-tertiary` | `#6b7280` | Tertiary/disabled text |
| `--hustle-color-text-inverse` | `#fff` | Text on colored backgrounds |

#### Accent Colors

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-color-accent-primary` | `#4c9aff` | Links, active states |
| `--hustle-color-accent-primary-hover` | `#7bb6ff` | Primary hover |
| `--hustle-color-accent-primary-bg` | `rgba(76,154,255,0.1)` | Primary background |
| `--hustle-color-accent-success` | `#10b981` | Connected, success |
| `--hustle-color-accent-success-hover` | `#34d399` | Success hover |
| `--hustle-color-accent-success-bg` | `rgba(16,185,129,0.1)` | Success background |
| `--hustle-color-accent-warning` | `#f59e0b` | Warning states |
| `--hustle-color-accent-warning-bg` | `rgba(245,158,11,0.1)` | Warning background |
| `--hustle-color-accent-error` | `#dc2626` | Error states |
| `--hustle-color-accent-error-hover` | `#ef4444` | Error hover |
| `--hustle-color-accent-error-bg` | `rgba(239,68,68,0.1)` | Error background |

#### Message Colors

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-color-msg-user` | `#1e3a5f` | User message bubble |
| `--hustle-color-msg-assistant` | `#1a2633` | Assistant message bubble |

### Typography

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-font-family` | System fonts | Primary font family |
| `--hustle-font-family-mono` | `"SF Mono", Monaco, monospace` | Monospace font |
| `--hustle-font-size-xs` | `11px` | Extra small text |
| `--hustle-font-size-sm` | `13px` | Small text |
| `--hustle-font-size-md` | `14px` | Body text |
| `--hustle-font-size-lg` | `16px` | Large text |
| `--hustle-font-size-xl` | `18px` | Extra large text |
| `--hustle-font-weight-normal` | `400` | Normal weight |
| `--hustle-font-weight-medium` | `500` | Medium weight |
| `--hustle-font-weight-semibold` | `600` | Semibold weight |
| `--hustle-font-line-height-tight` | `1.3` | Tight line height |
| `--hustle-font-line-height-normal` | `1.5` | Normal line height |
| `--hustle-font-line-height-relaxed` | `1.7` | Relaxed line height |

### Spacing

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-space-xs` | `4px` | Extra small |
| `--hustle-space-sm` | `8px` | Small |
| `--hustle-space-md` | `12px` | Medium |
| `--hustle-space-lg` | `16px` | Large |
| `--hustle-space-xl` | `20px` | Extra large |
| `--hustle-space-xxl` | `24px` | 2x Extra large |

### Border Radius

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-radius-sm` | `4px` | Small radius |
| `--hustle-radius-md` | `6px` | Medium radius |
| `--hustle-radius-lg` | `8px` | Large radius |
| `--hustle-radius-xl` | `12px` | Extra large radius |
| `--hustle-radius-pill` | `20px` | Pill shape |
| `--hustle-radius-full` | `50%` | Circle |

### Shadows

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-shadow-sm` | `0 2px 8px rgba(0,0,0,0.2)` | Small shadow |
| `--hustle-shadow-md` | `0 4px 16px rgba(0,0,0,0.3)` | Medium shadow |
| `--hustle-shadow-lg` | `0 8px 32px rgba(0,0,0,0.4)` | Large shadow |
| `--hustle-shadow-xl` | `0 16px 48px rgba(0,0,0,0.5)` | Extra large shadow |

### Transitions

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-transition-fast` | `0.15s ease` | Fast animations |
| `--hustle-transition-normal` | `0.2s ease` | Normal animations |
| `--hustle-transition-slow` | `0.3s ease` | Slow animations |

### Z-Index

| Variable | Default | Description |
|----------|---------|-------------|
| `--hustle-z-dropdown` | `100` | Dropdowns |
| `--hustle-z-modal` | `1000` | Modals |
| `--hustle-z-fullscreen` | `1000` | Fullscreen mode |
| `--hustle-z-modal-over-fullscreen` | `10000` | Modal over fullscreen |

---

## Theming Examples

### Light Theme

```css
:root {
  /* Backgrounds */
  --hustle-color-bg-primary: #ffffff;
  --hustle-color-bg-secondary: #f8fafc;
  --hustle-color-bg-tertiary: #f1f5f9;
  --hustle-color-bg-hover: #e2e8f0;
  --hustle-color-bg-overlay: rgba(0, 0, 0, 0.5);

  /* Borders */
  --hustle-color-border-primary: #e2e8f0;
  --hustle-color-border-secondary: #cbd5e1;
  --hustle-color-border-hover: #94a3b8;

  /* Text */
  --hustle-color-text-primary: #0f172a;
  --hustle-color-text-secondary: #475569;
  --hustle-color-text-tertiary: #94a3b8;

  /* Messages */
  --hustle-color-msg-user: #dbeafe;
  --hustle-color-msg-assistant: #f1f5f9;

  /* Shadows (lighter for light theme) */
  --hustle-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --hustle-shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --hustle-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

### Brand Colors

```css
:root {
  /* Your brand blue */
  --hustle-color-accent-primary: #0066cc;
  --hustle-color-accent-primary-hover: #0052a3;
  --hustle-color-accent-primary-bg: rgba(0, 102, 204, 0.1);

  /* Your brand green */
  --hustle-color-accent-success: #00a86b;
  --hustle-color-accent-success-bg: rgba(0, 168, 107, 0.1);
}
```

### Custom Font

```css
:root {
  --hustle-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --hustle-font-family-mono: 'Fira Code', 'SF Mono', monospace;
}
```

### Compact Mode

```css
.compact-chat {
  --hustle-space-xs: 2px;
  --hustle-space-sm: 4px;
  --hustle-space-md: 8px;
  --hustle-space-lg: 12px;
  --hustle-font-size-md: 13px;
  --hustle-radius-lg: 6px;
}
```

---

## Using Tokens in Code

### Importing Tokens

```typescript
import { tokens, defaultTokens, cssVariables } from 'hustle-react';

// tokens - CSS var() references with fallbacks
tokens.colors.bgPrimary
// → "var(--hustle-color-bg-primary, #0b0d10)"

// defaultTokens - Raw values (no CSS vars)
defaultTokens.colors.bgPrimary
// → "#0b0d10"

// cssVariables - Full :root stylesheet string
console.log(cssVariables);
// → ":root { --hustle-color-bg-primary: #0b0d10; ... }"
```

### Using in Inline Styles

```tsx
import { tokens } from 'hustle-react';

function MyComponent() {
  return (
    <div style={{
      background: tokens.colors.bgSecondary,
      color: tokens.colors.textPrimary,
      padding: tokens.spacing.lg,
      borderRadius: tokens.radius.lg,
    }}>
      Styled with tokens
    </div>
  );
}
```

### Using with styled-components

```tsx
import styled from 'styled-components';
import { tokens } from 'hustle-react';

const Card = styled.div`
  background: ${tokens.colors.bgSecondary};
  border: 1px solid ${tokens.colors.borderPrimary};
  border-radius: ${tokens.radius.xl};
  padding: ${tokens.spacing.lg};
`;
```

### Using with Tailwind (arbitrary values)

```tsx
<div className={`
  bg-[var(--hustle-color-bg-secondary)]
  text-[var(--hustle-color-text-primary)]
  p-[var(--hustle-space-lg)]
  rounded-[var(--hustle-radius-lg)]
`}>
  Styled with Tailwind + CSS vars
</div>
```

---

## Presets

Pre-built style objects for common patterns:

```typescript
import { presets } from 'hustle-react';

// Available presets
presets.base        // Base typography
presets.card        // Card container
presets.input       // Input field
presets.button      // Button base
presets.buttonPrimary   // Primary button
presets.buttonSecondary // Secondary button
presets.buttonIcon  // Icon button
presets.mono        // Monospace text
presets.label       // Form label

// Usage
<div style={presets.card}>
  <input style={presets.input} />
  <button style={{...presets.button, ...presets.buttonPrimary}}>
    Submit
  </button>
</div>
```

---

## Best Practices

1. **Use semantic variables** - Override `--hustle-color-accent-primary` not individual component colors

2. **Scope themes when needed** - Apply variables to containers for section-specific themes

3. **Test contrast** - Ensure text remains readable when changing backgrounds

4. **Keep consistency** - If you change `accent-primary`, consider updating `accent-primary-hover` and `accent-primary-bg` too

5. **Use the cascade** - CSS variables inherit, so set them at the highest appropriate level

---

## Browser Support

CSS Custom Properties are supported in all modern browsers:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

For older browsers, the fallback values are baked into each `var()` call.
