/**
 * Plugin Types for Hustle SDK
 *
 * These types define the plugin system that allows extending the AI
 * with custom client-side tools.
 *
 * Executor functions are serialized as strings (executorCode) for localStorage
 * persistence and reconstituted at runtime via new Function().
 *
 * SECURITY TODO: Add `signature` field to SerializedPlugin for cryptographic
 * verification of plugin code before execution. This should use asymmetric
 * signing (e.g., Ed25519) where plugins are signed by trusted publishers
 * and verified before eval/Function execution.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/verify
 */

/**
 * JSON Schema type for tool parameters
 */
export interface JSONSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  description?: string;
}

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
  default?: unknown;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

/**
 * Tool definition sent to server for AI registration
 */
export interface ClientToolDefinition {
  /** Unique tool name (used by AI to call the tool) */
  name: string;
  /** Description of what the tool does (shown to AI) */
  description: string;
  /** JSON Schema for tool arguments */
  parameters: JSONSchema;
}

/**
 * Serialized tool definition (stored in localStorage)
 * Contains executorCode as a string for persistence
 */
export interface SerializedToolDefinition extends ClientToolDefinition {
  /**
   * Stringified executor function body for persistence.
   * Reconstituted at runtime via new Function().
   *
   * FIXME: Add signature verification before execution
   */
  executorCode?: string;
}

/**
 * Function that executes the tool client-side
 */
export type ToolExecutor = (args: Record<string, unknown>) => Promise<unknown>;

/**
 * Request object passed to beforeRequest hook
 */
export interface HustleRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  tools?: ClientToolDefinition[];
  [key: string]: unknown;
}

/**
 * Response object passed to afterResponse hook
 */
export interface ProcessedResponse {
  content: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }>;
  [key: string]: unknown;
}

/**
 * Error context passed to onError hook
 */
export interface ErrorContext {
  phase: 'request' | 'stream' | 'tool_execution';
  toolName?: string;
  args?: Record<string, unknown>;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /** Called when plugin is registered */
  onRegister?: () => void | Promise<void>;
  /** Called before each request (can modify request) */
  beforeRequest?: (req: HustleRequest) => HustleRequest | Promise<HustleRequest>;
  /** Called after response is processed */
  afterResponse?: (res: ProcessedResponse) => void | Promise<void>;
  /** Called when an error occurs */
  onError?: (error: Error, context: ErrorContext) => void | Promise<void>;
}

/**
 * Serialized plugin hooks (stored in localStorage)
 * Contains hook function bodies as strings for persistence
 *
 * FIXME: Add signature verification before execution
 */
export interface SerializedHooks {
  /** Stringified onRegister function */
  onRegisterCode?: string;
  /** Stringified beforeRequest function */
  beforeRequestCode?: string;
  /** Stringified afterResponse function */
  afterResponseCode?: string;
  /** Stringified onError function */
  onErrorCode?: string;
}

/**
 * Plugin definition
 */
export interface HustlePlugin {
  /** Unique plugin identifier */
  name: string;
  /** Semantic version */
  version: string;
  /** Optional description */
  description?: string;
  /** Tool schemas sent to server for AI registration */
  tools?: ClientToolDefinition[];
  /** Local execution functions (keyed by tool name) */
  executors?: Record<string, ToolExecutor>;
  /** Lifecycle hooks */
  hooks?: PluginHooks;
}

/**
 * Plugin with enabled state (stored in localStorage)
 * Tools include executorCode for function persistence
 *
 * FIXME: Add `signature?: string` for cryptographic verification
 */
export interface StoredPlugin {
  /** Unique plugin identifier */
  name: string;
  /** Semantic version */
  version: string;
  /** Optional description */
  description?: string;
  /** Tool schemas with serialized executorCode */
  tools?: SerializedToolDefinition[];
  /** Serialized lifecycle hooks */
  hooksCode?: SerializedHooks;
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Timestamp when plugin was installed */
  installedAt?: string;
}

/**
 * Plugin with hydrated executors (ready for use)
 */
export interface HydratedPlugin extends StoredPlugin {
  /** Restored executor functions */
  executors?: Record<string, ToolExecutor>;
  /** Restored hooks */
  hooks?: PluginHooks;
}
