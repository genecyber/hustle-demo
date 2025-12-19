/**
 * Hustle Types for Hustle Incognito SDK integration
 * These types mirror the HustleIncognitoClient types for use in React components
 */

import type { HustleIncognitoClient } from 'hustle-incognito';

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Tool call information
 */
export interface ToolCall {
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
}

/**
 * Tool result information
 */
export interface ToolResult {
  toolCallId: string;
  toolName?: string;
  result: unknown;
}

/**
 * File attachment for chat
 */
export interface Attachment {
  url: string;
  name: string;
  type?: string;
  size?: number;
}

/**
 * Available AI model
 */
export interface Model {
  id: string;
  name: string;
  context_length: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

/**
 * Tool category
 */
export interface ToolCategory {
  id: string;
  title: string;
  description?: string;
}

/**
 * Options for chat requests
 */
export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  systemPrompt?: string;
  overrideSystemPrompt?: boolean;
  attachments?: Attachment[];
}

/**
 * Stream options (extends ChatOptions)
 */
export interface StreamOptions extends ChatOptions {
  processChunks?: boolean;
}

/**
 * Streaming chunk types
 */
export type StreamChunk =
  | { type: 'text'; value: string }
  | { type: 'tool_call'; value: ToolCall }
  | { type: 'tool_result'; value: ToolResult }
  | { type: 'error'; value: { message: string } };

/**
 * Complete chat response
 */
export interface ChatResponse {
  content: string;
  messageId?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  usage?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  reasoning?: {
    thinking?: string;
    categories?: string[];
  };
  devToolsInfo?: {
    toolCount?: number;
    qualifiedCategories?: string[];
  };
  pathInfo?: {
    thresholdReached?: boolean;
    totalTokens?: number;
    threshold?: number;
    messageRetentionCount?: number;
    summary?: string;
    summaryEndIndex?: number;
  };
}

/**
 * Tool start event payload
 */
export interface ToolStartEvent {
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
}

/**
 * Tool end event payload
 */
export interface ToolEndEvent {
  toolCallId: string;
  result: unknown;
}

/**
 * Stream end event payload
 */
export interface StreamEndEvent {
  response: ChatResponse;
}

/**
 * Configuration for HustleProvider
 */
export interface HustleConfig {
  /** Hustle API endpoint */
  hustleApiUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Context value exposed by HustleProvider
 */
export interface HustleContextValue {
  // Instance identifier for scoped storage
  instanceId: string;

  // State
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  models: Model[];

  // Client reference (for advanced use)
  client: HustleIncognitoClient | null;

  // Chat methods
  chat: (options: ChatOptions) => Promise<ChatResponse>;
  chatStream: (options: StreamOptions) => AsyncIterable<StreamChunk>;

  // File upload
  uploadFile: (file: File) => Promise<Attachment>;

  // Data fetching
  loadModels: () => Promise<Model[]>;

  // Settings state
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  skipServerPrompt: boolean;
  setSkipServerPrompt: (skip: boolean) => void;
}

/**
 * Props for HustleProvider component
 */
export interface HustleProviderProps extends HustleConfig {
  children: React.ReactNode;
  /**
   * Unique identifier for this provider instance.
   * Used to scope settings persistence (localStorage) when multiple
   * HustleProviders exist in the same app.
   *
   * If not provided, an auto-generated ID based on mount order is used.
   * For stable persistence with multiple providers, explicit IDs are recommended.
   *
   * @example
   * ```tsx
   * <HustleProvider instanceId="trading-assistant">
   *   <TradingChat />
   * </HustleProvider>
   * <HustleProvider instanceId="support-bot">
   *   <SupportChat />
   * </HustleProvider>
   * ```
   */
  instanceId?: string;
}
