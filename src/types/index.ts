/**
 * Type exports for Emblem Auth + Hustle SDK integration
 */

// Auth types
export type {
  AuthUser,
  AuthSession,
  VaultInfo,
  EmblemAuthConfig,
  EmblemAuthContextValue,
  EmblemAuthProviderProps,
} from './auth';

// Hustle types
export type {
  ChatMessage,
  ToolCall,
  ToolResult,
  Attachment,
  Model,
  ChatOptions,
  StreamOptions,
  StreamChunk,
  StreamWithResponse,
  ChatResponse,
  ToolStartEvent,
  ToolEndEvent,
  StreamEndEvent,
  HustleConfig,
  HustleContextValue,
  HustleProviderProps,
} from './hustle';

// Plugin types
export type {
  JSONSchema,
  JSONSchemaProperty,
  ClientToolDefinition,
  SerializedToolDefinition,
  ToolExecutor,
  HustleRequest,
  ProcessedResponse,
  ErrorContext,
  PluginHooks,
  SerializedHooks,
  HustlePlugin,
  StoredPlugin,
  HydratedPlugin,
} from './plugin';
