'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { HustleIncognitoClient } from 'hustle-incognito';
import { useEmblemAuth } from './EmblemAuthProvider';
import { usePlugins } from '../hooks/usePlugins';
import type {
  Model,
  ChatOptions,
  StreamOptions,
  StreamChunk,
  ChatResponse,
  Attachment,
  HustleContextValue,
  HustleProviderProps,
  ChatMessage,
  HydratedPlugin,
} from '../types';

/**
 * Hustle context - undefined when not within provider
 */
const HustleContext = createContext<HustleContextValue | undefined>(undefined);

/**
 * Default Hustle API URL
 */
const DEFAULT_HUSTLE_API_URL = 'https://agenthustle.ai';

/**
 * HustleProvider - Provides Hustle SDK functionality to the app
 *
 * IMPORTANT: This provider depends on EmblemAuthProvider and must be nested within it.
 * It uses the modern pattern of passing the auth SDK instance to HustleIncognitoClient,
 * NOT the deprecated api-key pattern.
 *
 * @example
 * ```tsx
 * <EmblemAuthProvider appId="your-app-id">
 *   <HustleProvider hustleApiUrl="https://dev.agenthustle.ai">
 *     <App />
 *   </HustleProvider>
 * </EmblemAuthProvider>
 * ```
 */
export function HustleProvider({
  children,
  hustleApiUrl = DEFAULT_HUSTLE_API_URL,
  debug = false,
}: HustleProviderProps) {
  // Get auth context - this provider REQUIRES EmblemAuthProvider
  const { authSDK, isAuthenticated } = useEmblemAuth();

  // Get plugins
  const { enabledPlugins } = usePlugins();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [models, setModels] = useState<Model[]>([]);

  // Track registered plugins to avoid re-registering
  const registeredPluginsRef = useRef<Set<string>>(new Set());

  // Settings storage key
  const SETTINGS_KEY = 'hustle-settings';

  // Load initial settings from localStorage
  const loadSettings = () => {
    if (typeof window === 'undefined') return { selectedModel: '', systemPrompt: '', skipServerPrompt: false };
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return { selectedModel: '', systemPrompt: '', skipServerPrompt: false };
  };

  const initialSettings = loadSettings();

  // Settings state (initialized from localStorage)
  const [selectedModel, setSelectedModelState] = useState<string>(initialSettings.selectedModel);
  const [systemPrompt, setSystemPromptState] = useState<string>(initialSettings.systemPrompt);
  const [skipServerPrompt, setSkipServerPromptState] = useState<boolean>(initialSettings.skipServerPrompt);

  // Persist settings to localStorage
  const saveSettings = useCallback((settings: { selectedModel: string; systemPrompt: string; skipServerPrompt: boolean }) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Wrapped setters that also persist
  const setSelectedModel = useCallback((value: string) => {
    setSelectedModelState(value);
    saveSettings({ selectedModel: value, systemPrompt, skipServerPrompt });
  }, [systemPrompt, skipServerPrompt, saveSettings]);

  const setSystemPrompt = useCallback((value: string) => {
    setSystemPromptState(value);
    saveSettings({ selectedModel, systemPrompt: value, skipServerPrompt });
  }, [selectedModel, skipServerPrompt, saveSettings]);

  const setSkipServerPrompt = useCallback((value: boolean) => {
    setSkipServerPromptState(value);
    saveSettings({ selectedModel, systemPrompt, skipServerPrompt: value });
  }, [selectedModel, systemPrompt, saveSettings]);

  // Debug logger
  const log = useCallback(
    (message: string, ...args: unknown[]) => {
      if (debug) {
        console.log(`[Hustle] ${message}`, ...args);
      }
    },
    [debug]
  );

  /**
   * Create the Hustle client with the auth SDK
   * This is the CORRECT pattern - using sdk: authSDK, NOT apiKey
   */
  const client = useMemo(() => {
    if (!authSDK || !isAuthenticated) {
      log('Client not created - auth not ready');
      return null;
    }

    log('Creating HustleIncognitoClient with auth SDK');

    try {
      const hustleClient = new HustleIncognitoClient({
        sdk: authSDK, // CORRECT: Pass auth SDK instance, NOT apiKey
        hustleApiUrl,
        debug,
      });

      // Subscribe to events (use any for SDK event types)
      hustleClient.on('tool_start', (event: unknown) => {
        log('Tool start:', event);
      });

      hustleClient.on('tool_end', (event: unknown) => {
        log('Tool end:', event);
      });

      hustleClient.on('stream_end', (event: unknown) => {
        log('Stream end:', event);
      });

      return hustleClient;
    } catch (err) {
      log('Failed to create client:', err);
      setError(err instanceof Error ? err : new Error('Failed to create Hustle client'));
      return null;
    }
  }, [authSDK, isAuthenticated, hustleApiUrl, debug, log]);

  // Is ready when client exists
  const isReady = client !== null;

  /**
   * Register enabled plugins with the client
   */
  useEffect(() => {
    if (!client) return;

    const registerPlugins = async () => {
      // Get the set of enabled plugin names
      const enabledNames = new Set(enabledPlugins.map(p => p.name));

      // Unregister plugins that were disabled
      for (const name of registeredPluginsRef.current) {
        if (!enabledNames.has(name)) {
          log('Unregistering plugin:', name);
          // Note: SDK may not support unregistering - just track locally
          registeredPluginsRef.current.delete(name);
        }
      }

      // Register new plugins
      for (const plugin of enabledPlugins) {
        if (!registeredPluginsRef.current.has(plugin.name)) {
          log('Registering plugin:', plugin.name);
          try {
            // The SDK's use() method registers the plugin
            if (plugin.executors || plugin.hooks) {
              // Cast to SDK's expected type (our types are compatible but TS is strict)
              await client.use({
                name: plugin.name,
                version: plugin.version,
                tools: plugin.tools,
                executors: plugin.executors,
                hooks: plugin.hooks,
              } as Parameters<typeof client.use>[0]);
              registeredPluginsRef.current.add(plugin.name);
              log('Plugin registered:', plugin.name);
            } else {
              log('Plugin has no executors/hooks, skipping registration:', plugin.name);
            }
          } catch (err) {
            log('Failed to register plugin:', plugin.name, err);
          }
        }
      }
    };

    registerPlugins();
  }, [client, enabledPlugins, log]);

  /**
   * Load available models
   */
  const loadModels = useCallback(async (): Promise<Model[]> => {
    if (!client) {
      log('Cannot load models - client not ready');
      return [];
    }

    log('Loading models');
    setIsLoading(true);

    try {
      const modelList = await client.getModels();
      setModels(modelList as Model[]);
      log('Loaded models:', modelList.length);
      return modelList as Model[];
    } catch (err) {
      log('Failed to load models:', err);
      setError(err instanceof Error ? err : new Error('Failed to load models'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [client, log]);

  /**
   * Load models when client becomes ready
   */
  useEffect(() => {
    if (client) {
      loadModels();
    }
  }, [client, loadModels]);

  /**
   * Send a chat message (non-streaming)
   */
  const chat = useCallback(
    async (options: ChatOptions): Promise<ChatResponse> => {
      if (!client) {
        throw new Error('Hustle client not ready. Please authenticate first.');
      }

      log('Chat request:', options.messages.length, 'messages');
      setIsLoading(true);
      setError(null);

      try {
        // The SDK expects messages as first arg and options as second
        // Build the options object for the SDK
        const sdkOptions: Record<string, unknown> = {
          messages: options.messages,
          processChunks: true,
        };

        if (options.model || selectedModel) {
          sdkOptions.model = options.model || selectedModel;
        }
        if (options.systemPrompt || systemPrompt) {
          sdkOptions.systemPrompt = options.systemPrompt || systemPrompt;
        }
        if (options.overrideSystemPrompt ?? skipServerPrompt) {
          sdkOptions.overrideSystemPrompt = true;
        }
        if (options.attachments) {
          sdkOptions.attachments = options.attachments;
        }

        // Call the SDK - it accepts an options object
        const response = await (client as unknown as { chat: (opts: Record<string, unknown>) => Promise<unknown> }).chat(sdkOptions);
        log('Chat response received');
        return response as ChatResponse;
      } catch (err) {
        log('Chat error:', err);
        const error = err instanceof Error ? err : new Error('Chat request failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [client, selectedModel, systemPrompt, skipServerPrompt, log]
  );

  /**
   * Send a chat message with streaming response
   */
  const chatStreamImpl = useCallback(
    (options: StreamOptions): AsyncIterable<StreamChunk> => {
      if (!client) {
        // Return an async iterable that yields an error
        return {
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'error', value: { message: 'Hustle client not ready. Please authenticate first.' } } as StreamChunk;
          },
        };
      }

      log('Chat stream request:', options.messages.length, 'messages');
      setError(null);

      // Build the options object for the SDK
      const sdkOptions: Record<string, unknown> = {
        messages: options.messages,
        processChunks: options.processChunks ?? true,
      };

      if (options.model || selectedModel) {
        sdkOptions.model = options.model || selectedModel;
      }
      if (options.systemPrompt || systemPrompt) {
        sdkOptions.systemPrompt = options.systemPrompt || systemPrompt;
      }
      if (options.overrideSystemPrompt ?? skipServerPrompt) {
        sdkOptions.overrideSystemPrompt = true;
      }
      if (options.attachments) {
        sdkOptions.attachments = options.attachments;
      }

      // Get the stream from the client (cast through unknown for SDK compatibility)
      const stream = client.chatStream(sdkOptions as unknown as Parameters<typeof client.chatStream>[0]);

      // Wrap to add logging and type conversion
      return {
        [Symbol.asyncIterator]: async function* () {
          try {
            for await (const chunk of stream) {
              // Type guard for chunk with type property
              const typedChunk = chunk as { type?: string; value?: unknown };

              if (typedChunk.type === 'text') {
                const textValue = typedChunk.value as string;
                log('Stream text chunk:', textValue?.substring(0, 50));
                yield { type: 'text', value: textValue } as StreamChunk;
              } else if (typedChunk.type === 'tool_call') {
                log('Stream tool call:', typedChunk.value);
                yield { type: 'tool_call', value: typedChunk.value } as StreamChunk;
              } else if (typedChunk.type === 'tool_result') {
                log('Stream tool result');
                yield { type: 'tool_result', value: typedChunk.value } as StreamChunk;
              } else if (typedChunk.type === 'error') {
                const errorValue = typedChunk.value as { message?: string };
                log('Stream error:', errorValue);
                setError(new Error(errorValue?.message || 'Stream error'));
                yield { type: 'error', value: { message: errorValue?.message || 'Stream error' } } as StreamChunk;
              } else {
                // Pass through unknown chunk types
                yield chunk as StreamChunk;
              }
            }
          } catch (err) {
            log('Stream error:', err);
            const error = err instanceof Error ? err : new Error('Stream failed');
            setError(error);
            yield { type: 'error', value: { message: error.message } } as StreamChunk;
          }
        },
      };
    },
    [client, selectedModel, systemPrompt, skipServerPrompt, log]
  );

  /**
   * Upload a file
   */
  const uploadFile = useCallback(
    async (file: File): Promise<Attachment> => {
      if (!client) {
        throw new Error('Hustle client not ready. Please authenticate first.');
      }

      log('Uploading file:', file.name);
      setIsLoading(true);

      try {
        const attachment = await client.uploadFile(file);
        log('File uploaded:', attachment);
        return attachment as Attachment;
      } catch (err) {
        log('Upload error:', err);
        const error = err instanceof Error ? err : new Error('File upload failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [client, log]
  );

  // Context value
  const value: HustleContextValue = {
    // State
    isReady,
    isLoading,
    error,
    models,

    // Client (for advanced use)
    client,

    // Chat methods
    chat,
    chatStream: chatStreamImpl,

    // File upload
    uploadFile,

    // Data fetching
    loadModels,

    // Settings
    selectedModel,
    setSelectedModel,
    systemPrompt,
    setSystemPrompt,
    skipServerPrompt,
    setSkipServerPrompt,
  };

  return (
    <HustleContext.Provider value={value}>
      {children}
    </HustleContext.Provider>
  );
}

/**
 * Hook to access Hustle context
 * Must be used within HustleProvider (which must be within EmblemAuthProvider)
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { isReady, chat, chatStream } = useHustle();
 *
 *   if (!isReady) {
 *     return <div>Please connect to start chatting</div>;
 *   }
 *
 *   // Use chat or chatStream...
 * }
 * ```
 */
export function useHustle(): HustleContextValue {
  const context = useContext(HustleContext);
  if (context === undefined) {
    throw new Error('useHustle must be used within a HustleProvider (which requires EmblemAuthProvider)');
  }
  return context;
}
