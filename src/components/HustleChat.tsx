'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useHustle } from '../providers/HustleProvider';
import { useEmblemAuth } from '../providers/EmblemAuthProvider';
import type { ChatMessage, StreamChunk, ToolCall, Attachment } from '../types';

/**
 * Props for HustleChat component
 */
export interface HustleChatProps {
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Show model selector */
  showModelSelector?: boolean;
  /** Show tool selector */
  showToolSelector?: boolean;
  /** Show settings panel */
  showSettings?: boolean;
  /** Show debug info */
  showDebug?: boolean;
  /** Initial system prompt */
  initialSystemPrompt?: string;
  /** Callback when message is sent */
  onMessage?: (message: ChatMessage) => void;
  /** Callback when tool is called */
  onToolCall?: (toolCall: ToolCall) => void;
  /** Callback when response is received */
  onResponse?: (content: string) => void;
}

/**
 * Internal message type for display
 */
interface DisplayMessage extends ChatMessage {
  id: string;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * HustleChat - Complete streaming chat interface
 *
 * @example Basic usage
 * ```tsx
 * <HustleChat />
 * ```
 *
 * @example With options
 * ```tsx
 * <HustleChat
 *   showModelSelector
 *   showToolSelector
 *   showSettings
 *   placeholder="Ask me anything..."
 *   onMessage={(msg) => console.log('Sent:', msg)}
 * />
 * ```
 */
export function HustleChat({
  className = '',
  placeholder = 'Type a message...',
  showModelSelector = false,
  showToolSelector = false,
  showSettings = false,
  showDebug = false,
  initialSystemPrompt = '',
  onMessage,
  onToolCall,
  onResponse,
}: HustleChatProps) {
  const { isAuthenticated } = useEmblemAuth();
  const {
    isReady,
    isLoading,
    error,
    models,
    tools,
    chatStream,
    uploadFile,
    selectedModel,
    setSelectedModel,
    selectedTools,
    setSelectedTools,
    systemPrompt,
    setSystemPrompt,
    skipServerPrompt,
    setSkipServerPrompt,
  } = useHustle();

  // Local state
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCall[]>([]);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial system prompt
  useEffect(() => {
    if (initialSystemPrompt && !systemPrompt) {
      setSystemPrompt(initialSystemPrompt);
    }
  }, [initialSystemPrompt, systemPrompt, setSystemPrompt]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle file upload
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        try {
          const attachment = await uploadFile(file);
          setAttachments(prev => [...prev, attachment]);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadFile]
  );

  /**
   * Remove an attachment
   */
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isStreaming || !isReady) return;

    // Create user message
    const userMessage: DisplayMessage = {
      id: generateId(),
      role: 'user',
      content,
    };

    // Add user message to display
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    onMessage?.(userMessage);

    // Create assistant message placeholder
    const assistantMessage: DisplayMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      isStreaming: true,
      toolCalls: [],
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(true);
    setCurrentToolCalls([]);

    try {
      // Build messages array
      const chatMessages: ChatMessage[] = messages
        .filter(m => !m.isStreaming)
        .map(m => ({ role: m.role, content: m.content }));

      // Add current user message
      chatMessages.push({ role: 'user', content });

      // Stream the response
      const stream = chatStream({
        messages: chatMessages,
        attachments: attachments.length > 0 ? attachments : undefined,
        processChunks: true,
      });

      // Clear attachments after sending
      setAttachments([]);

      let fullContent = '';
      const toolCallsAccumulated: ToolCall[] = [];

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          fullContent += chunk.value;
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, content: fullContent }
                : m
            )
          );
        } else if (chunk.type === 'tool_call') {
          const toolCall = chunk.value;
          toolCallsAccumulated.push(toolCall);
          setCurrentToolCalls([...toolCallsAccumulated]);
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, toolCalls: [...toolCallsAccumulated] }
                : m
            )
          );
          onToolCall?.(toolCall);
        } else if (chunk.type === 'error') {
          console.error('Stream error:', chunk.value);
        }
      }

      // Finalize the message
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, isStreaming: false, content: fullContent || '(No response)' }
            : m
        )
      );

      onResponse?.(fullContent);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, isStreaming: false, content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setCurrentToolCalls([]);
    }
  }, [inputValue, isStreaming, isReady, messages, chatStream, attachments, onMessage, onToolCall, onResponse]);

  /**
   * Handle key press
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  /**
   * Toggle tool selection
   */
  const toggleTool = useCallback(
    (toolId: string) => {
      setSelectedTools(
        selectedTools.includes(toolId)
          ? selectedTools.filter(t => t !== toolId)
          : [...selectedTools, toolId]
      );
    },
    [selectedTools, setSelectedTools]
  );

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Authentication Required</p>
          <p className="text-sm mt-1">Please connect to start chatting</p>
        </div>
      </div>
    );
  }

  // Not ready state
  if (!isReady) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <div className="inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Chat</h2>
        <div className="flex items-center gap-2">
          {/* Model selector */}
          {showModelSelector && models.length > 0 && (
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="text-sm px-2 py-1 border border-gray-300 rounded bg-white"
            >
              <option value="">Default model</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          )}

          {/* Settings toggle */}
          {showSettings && (
            <button
              type="button"
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={`p-2 rounded ${showSettingsPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Settings"
            >
              <SettingsIcon />
            </button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && showSettingsPanel && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 space-y-3">
          {/* System prompt */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none"
            />
          </div>

          {/* Skip server prompt */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={skipServerPrompt}
              onChange={e => setSkipServerPrompt(e.target.checked)}
              className="rounded"
            />
            Skip server system prompt
          </label>

          {/* Tool selector */}
          {showToolSelector && tools.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tools
              </label>
              <div className="flex flex-wrap gap-2">
                {tools.map(tool => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedTools.includes(tool.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tool.title || tool.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p>Start a conversation...</p>
          </div>
        )}

        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            showDebug={showDebug}
          />
        ))}

        {/* Current tool calls indicator */}
        {currentToolCalls.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4">
            {currentToolCalls.map(tool => (
              <span
                key={tool.toolCallId}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full"
              >
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                {tool.toolName}
              </span>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 flex flex-wrap gap-2">
          {attachments.map((att, index) => (
            <div
              key={index}
              className="relative inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
            >
              <span className="truncate max-w-[100px]">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600"
            title="Attach file"
          >
            <AttachIcon />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text input */}
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isStreaming || isLoading}
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isStreaming || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Send'
            )}
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-2 px-3 py-2 bg-red-50 text-red-600 text-sm rounded">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Message bubble component
 */
interface MessageBubbleProps {
  message: DisplayMessage;
  showDebug?: boolean;
}

function MessageBubble({ message, showDebug }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[80%] px-4 py-2 rounded-lg
          ${isUser
            ? 'bg-blue-600 text-white'
            : isSystem
              ? 'bg-gray-200 text-gray-700 text-sm italic'
              : 'bg-gray-100 text-gray-900'
          }
        `}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>

        {/* Tool calls (debug mode) */}
        {showDebug && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
            <div className="font-medium text-gray-600 mb-1">Tool calls:</div>
            {message.toolCalls.map(tool => (
              <div key={tool.toolCallId} className="bg-white/50 rounded p-1 mt-1">
                <span className="font-mono">{tool.toolName}</span>
                {tool.args && (
                  <pre className="mt-1 text-[10px] overflow-auto">
                    {JSON.stringify(tool.args, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Settings icon
 */
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/**
 * Attach icon
 */
function AttachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export default HustleChat;
