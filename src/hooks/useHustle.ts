/**
 * useHustle hook
 *
 * Re-exported from HustleProvider for convenience.
 * Can be imported from either location:
 *
 * @example
 * ```tsx
 * import { useHustle } from '@/hooks/useHustle';
 * // or
 * import { useHustle } from '@/providers/HustleProvider';
 * ```
 */
export { useHustle } from '../providers/HustleProvider';

// Also export the provider for completeness
export { HustleProvider } from '../providers/HustleProvider';

// Re-export hustle types for convenience
export type {
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
