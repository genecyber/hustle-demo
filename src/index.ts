/**
 * Emblem Auth + Hustle SDK React Integration
 *
 * A set of React hooks and components for integrating Emblem Auth
 * and Hustle Incognito SDK into React/Next.js applications.
 *
 * @example Basic setup
 * ```tsx
 * import {
 *   EmblemAuthProvider,
 *   HustleProvider,
 *   ConnectButton,
 *   HustleChat,
 * } from '@hustle-demo/sdk';
 *
 * function App() {
 *   return (
 *     <EmblemAuthProvider appId="your-app-id">
 *       <HustleProvider>
 *         <ConnectButton />
 *         <HustleChat />
 *       </HustleProvider>
 *     </EmblemAuthProvider>
 *   );
 * }
 * ```
 */

// ============================================================================
// Providers
// ============================================================================

export {
  EmblemAuthProvider,
  useEmblemAuth,
  resetAuthSDK,
} from './providers/EmblemAuthProvider';

export {
  HustleProvider,
  useHustle,
} from './providers/HustleProvider';

// ============================================================================
// Components
// ============================================================================

export { ConnectButton } from './components/ConnectButton';
export type { ConnectButtonProps } from './components/ConnectButton';

export { AuthStatus } from './components/AuthStatus';
export type { AuthStatusProps } from './components/AuthStatus';

export { HustleChat } from './components/HustleChat';
export type { HustleChatProps } from './components/HustleChat';

// ============================================================================
// Hooks (re-exports for convenience)
// ============================================================================

// Already exported from providers, but also available from hooks directory
export * from './hooks/useEmblemAuth';
export * from './hooks/useHustle';
export { usePlugins } from './hooks/usePlugins';
export type { UsePluginsReturn } from './hooks/usePlugins';

// ============================================================================
// Types
// ============================================================================

export type {
  // Auth types
  AuthUser,
  AuthSession,
  VaultInfo,
  EmblemAuthConfig,
  EmblemAuthContextValue,
  EmblemAuthProviderProps,

  // Hustle types
  ChatMessage,
  ToolCall,
  ToolResult,
  Attachment,
  Model,
  ChatOptions,
  StreamOptions,
  StreamChunk,
  ChatResponse,
  ToolStartEvent,
  ToolEndEvent,
  StreamEndEvent,
  HustleConfig,
  HustleContextValue,
  HustleProviderProps,

  // Plugin types
  JSONSchema,
  JSONSchemaProperty,
  ClientToolDefinition,
  ToolExecutor,
  HustleRequest,
  ProcessedResponse,
  ErrorContext,
  PluginHooks,
  HustlePlugin,
  StoredPlugin,
  HydratedPlugin,
} from './types';

// ============================================================================
// Utilities
// ============================================================================

export {
  truncateAddress,
  copyToClipboard,
  generateId,
  decodeJwtPayload,
  isJwtExpired,
  formatFileSize,
  debounce,
  STORAGE_KEYS,
  DEFAULTS,
  // Plugin utilities
  pluginRegistry,
  registerKnownPlugin,
  getKnownPlugins,
  hydratePlugin,
} from './utils';

// ============================================================================
// Plugins
// ============================================================================

export {
  availablePlugins,
  getAvailablePlugin,
  predictionMarketPlugin,
  migrateFunPlugin,
} from './plugins';
export type { AvailablePlugin } from './plugins';
