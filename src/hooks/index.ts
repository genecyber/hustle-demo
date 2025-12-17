/**
 * Hook exports
 */

export { useEmblemAuth, EmblemAuthProvider, resetAuthSDK } from './useEmblemAuth';
export { useHustle, HustleProvider } from './useHustle';

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
  ToolCategory,
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
} from '../types';
