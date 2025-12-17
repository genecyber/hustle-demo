/**
 * Hook exports
 */

export { useEmblemAuth, EmblemAuthProvider, resetAuthSDK } from './useEmblemAuth';
export { useHustle, HustleProvider } from './useHustle';
export { usePlugins } from './usePlugins';

// Re-export types for convenience
export type {
  AuthSession,
  AuthUser,
  VaultInfo,
  EmblemAuthConfig,
  EmblemAuthContextValue,
  EmblemAuthProviderProps,
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
  HustlePlugin,
  StoredPlugin,
  HydratedPlugin,
  ClientToolDefinition,
  ToolExecutor,
} from '../types';

export type { UsePluginsReturn } from './usePlugins';
