'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useHustle } from '../providers/HustleProvider';
import { useEmblemAuth } from '../providers/EmblemAuthProvider';
import { usePlugins } from '../hooks/usePlugins';
import { availablePlugins } from '../plugins';
import { tokens, presets, animations } from '../styles';
import { MarkdownContent } from './MarkdownContent';
import type { ChatMessage, StreamChunk, ToolCall, Attachment } from '../types';

// ============================================================================
// Styles using design tokens
// ============================================================================
const styles = {
  // Container
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: tokens.colors.bgSecondary,
    borderRadius: tokens.radius.xl,
    border: `1px solid ${tokens.colors.borderPrimary}`,
    fontFamily: tokens.typography.fontFamily,
    color: tokens.colors.textPrimary,
  },

  // Not ready / auth required states
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.xxl,
    background: tokens.colors.bgSecondary,
    borderRadius: tokens.radius.xl,
    border: `1px solid ${tokens.colors.borderPrimary}`,
  },
  placeholderContent: {
    textAlign: 'center' as const,
    color: tokens.colors.textSecondary,
  },
  placeholderTitle: {
    fontSize: tokens.typography.fontSizeLg,
    fontWeight: tokens.typography.fontWeightMedium,
    marginBottom: tokens.spacing.xs,
  },
  placeholderText: {
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textTertiary,
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    border: `2px solid ${tokens.colors.textTertiary}`,
    borderTopColor: 'transparent',
    borderRadius: tokens.radius.full,
    animation: 'hustle-spin 0.8s linear infinite',
    marginBottom: tokens.spacing.sm,
  },

  // Header - darker shade
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    background: tokens.colors.bgPrimary,
    borderBottom: `1px solid ${tokens.colors.borderPrimary}`,
    borderRadius: `${tokens.radius.xl} ${tokens.radius.xl} 0 0`,
  },
  headerTitle: {
    fontWeight: tokens.typography.fontWeightSemibold,
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSizeMd,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },

  // Model selector
  select: {
    fontSize: tokens.typography.fontSizeSm,
    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
    border: `1px solid ${tokens.colors.borderSecondary}`,
    borderRadius: tokens.radius.md,
    background: tokens.colors.bgTertiary,
    color: tokens.colors.textPrimary,
    outline: 'none',
  },

  // Settings button
  settingsBtn: {
    ...presets.buttonIcon,
    borderRadius: tokens.radius.md,
  } as React.CSSProperties,
  settingsBtnActive: {
    background: tokens.colors.accentPrimaryBg,
    color: tokens.colors.accentPrimary,
  },
  settingsBtnInactive: {
    color: tokens.colors.textSecondary,
  },

  // Settings Modal
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: tokens.colors.bgOverlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: tokens.zIndex.modal,
  },
  modal: {
    background: tokens.colors.bgSecondary,
    borderRadius: tokens.radius.xl,
    border: `1px solid ${tokens.colors.borderPrimary}`,
    width: '100%',
    maxWidth: '440px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: tokens.shadows.xl,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
    borderBottom: `1px solid ${tokens.colors.borderPrimary}`,
  },
  modalTitle: {
    fontSize: tokens.typography.fontSizeLg,
    fontWeight: tokens.typography.fontWeightSemibold,
    color: tokens.colors.textPrimary,
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: tokens.colors.textTertiary,
    fontSize: '20px',
    cursor: 'pointer',
    padding: tokens.spacing.xs,
    lineHeight: 1,
    transition: `color ${tokens.transitions.fast}`,
  },
  modalBody: {
    padding: tokens.spacing.xl,
  },

  // Settings sections
  settingGroup: {
    marginBottom: tokens.spacing.xl,
  },
  settingLabel: {
    display: 'block',
    fontSize: tokens.typography.fontSizeMd,
    fontWeight: tokens.typography.fontWeightMedium,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs,
  },
  settingDescription: {
    fontSize: tokens.typography.fontSizeSm,
    color: tokens.colors.textTertiary,
    marginBottom: tokens.spacing.md,
  },
  settingSelect: {
    width: '100%',
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    fontSize: tokens.typography.fontSizeMd,
    background: tokens.colors.bgTertiary,
    border: `1px solid ${tokens.colors.borderSecondary}`,
    borderRadius: tokens.radius.lg,
    color: tokens.colors.textPrimary,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238892a4' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  },
  modelInfo: {
    fontSize: tokens.typography.fontSizeXs,
    color: tokens.colors.textTertiary,
    marginTop: tokens.spacing.sm,
  },

  // Toggle switch row
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    background: tokens.colors.bgTertiary,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.sm,
  },
  toggleLabel: {
    fontSize: tokens.typography.fontSizeMd,
    color: tokens.colors.textPrimary,
  },
  toggleSwitch: {
    position: 'relative' as const,
    width: '44px',
    height: '24px',
    background: tokens.colors.borderSecondary,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: `background ${tokens.transitions.fast}`,
  },
  toggleSwitchActive: {
    background: tokens.colors.accentPrimary,
  },
  toggleKnob: {
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    background: tokens.colors.textPrimary,
    borderRadius: tokens.radius.full,
    transition: `transform ${tokens.transitions.fast}`,
  },
  toggleKnobActive: {
    transform: 'translateX(20px)',
  },

  // Settings textarea
  settingTextarea: {
    width: '100%',
    minHeight: '100px',
    padding: tokens.spacing.lg,
    fontSize: tokens.typography.fontSizeMd,
    background: tokens.colors.bgTertiary,
    border: `1px solid ${tokens.colors.borderSecondary}`,
    borderRadius: tokens.radius.lg,
    color: tokens.colors.textPrimary,
    outline: 'none',
    resize: 'vertical' as const,
    fontFamily: tokens.typography.fontFamily,
  },

  // Messages area
  messagesArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: tokens.spacing.lg,
    background: tokens.colors.bgSecondary,
  },
  messagesEmpty: {
    textAlign: 'center' as const,
    color: tokens.colors.textTertiary,
    padding: tokens.spacing.xxl,
  },
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacing.lg,
  },

  // Tool calls indicator
  toolCallsIndicator: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: tokens.spacing.sm,
    padding: `0 ${tokens.spacing.lg}`,
  },
  toolCallBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
    fontSize: tokens.typography.fontSizeXs,
    background: tokens.colors.accentWarningBg,
    color: tokens.colors.accentWarning,
    borderRadius: tokens.radius.pill,
  },
  toolCallDot: {
    width: '8px',
    height: '8px',
    background: tokens.colors.accentWarning,
    borderRadius: tokens.radius.full,
    animation: 'hustle-pulse 1s ease-in-out infinite',
  },

  // Attachments preview
  attachmentsPreview: {
    padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
    borderTop: `1px solid ${tokens.colors.borderPrimary}`,
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: tokens.spacing.sm,
  },
  attachmentItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
    background: tokens.colors.bgTertiary,
    borderRadius: tokens.radius.md,
    fontSize: tokens.typography.fontSizeSm,
  },
  attachmentName: {
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  attachmentRemove: {
    background: 'none',
    border: 'none',
    color: tokens.colors.textTertiary,
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
    lineHeight: 1,
  },

  // Input area - slightly darker than messages
  inputArea: {
    padding: tokens.spacing.lg,
    background: tokens.colors.bgPrimary,
    borderTop: `1px solid ${tokens.colors.borderPrimary}`,
    borderRadius: `0 0 ${tokens.radius.xl} ${tokens.radius.xl}`,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  inputContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    background: tokens.colors.bgTertiary,
    border: `1px solid ${tokens.colors.borderSecondary}`,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
  },
  attachBtn: {
    width: '40px',
    height: '40px',
    padding: 0,
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    color: tokens.colors.textTertiary,
    flexShrink: 0,
  } as React.CSSProperties,
  inputWrapper: {
    flex: 1,
  },
  input: {
    width: '100%',
    padding: `${tokens.spacing.md} ${tokens.spacing.sm}`,
    background: 'transparent',
    border: 'none',
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSizeMd,
    outline: 'none',
    resize: 'none' as const,
  } as React.CSSProperties,
  inputDisabled: {
    background: tokens.colors.bgTertiary,
    cursor: 'not-allowed',
  },
  sendBtn: {
    // Inherits global button styles from CSS
    height: '40px',
    padding: `0 ${tokens.spacing.lg}`,
    fontWeight: tokens.typography.fontWeightMedium,
  } as React.CSSProperties,
  sendBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  sendSpinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: tokens.radius.full,
    animation: 'hustle-spin 0.8s linear infinite',
  },

  // Error display
  errorBox: {
    marginTop: tokens.spacing.sm,
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    background: tokens.colors.accentErrorBg,
    color: tokens.colors.accentError,
    fontSize: tokens.typography.fontSizeSm,
    borderRadius: tokens.radius.md,
  },

  // Message bubbles
  messageBubbleContainer: {
    display: 'flex',
  },
  messageBubbleUser: {
    justifyContent: 'flex-end',
  },
  messageBubbleAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
    borderRadius: tokens.radius.lg,
  },
  messageBubbleUserStyle: {
    background: tokens.colors.msgUser,
    color: tokens.colors.textPrimary,
  },
  messageBubbleAssistantStyle: {
    background: tokens.colors.msgAssistant,
    color: tokens.colors.textPrimary,
  },
  messageBubbleSystemStyle: {
    background: tokens.colors.bgTertiary,
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontSizeSm,
    fontStyle: 'italic' as const,
  },
  messageContent: {
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    lineHeight: tokens.typography.lineHeightRelaxed,
  },
  streamingCursor: {
    display: 'inline-block',
    width: '2px',
    height: '16px',
    marginLeft: tokens.spacing.xs,
    background: 'currentColor',
    animation: 'hustle-pulse 0.8s ease-in-out infinite',
  },

  // Tool calls debug
  toolCallsDebug: {
    marginTop: tokens.spacing.sm,
    paddingTop: tokens.spacing.sm,
    borderTop: `1px solid ${tokens.colors.borderSecondary}`,
    fontSize: tokens.typography.fontSizeXs,
  },
  toolCallsDebugTitle: {
    fontWeight: tokens.typography.fontWeightMedium,
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  toolCallDebugItem: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.xs,
    marginTop: tokens.spacing.xs,
  },
  toolCallDebugName: {
    ...presets.mono,
  } as React.CSSProperties,
  toolCallDebugArgs: {
    ...presets.mono,
    marginTop: tokens.spacing.xs,
    fontSize: '10px',
    overflow: 'auto',
  } as React.CSSProperties,

  // Plugin management styles
  settingDivider: {
    height: '1px',
    background: tokens.colors.borderPrimary,
    margin: `${tokens.spacing.xl} 0`,
  },

  pluginList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacing.sm,
  },

  pluginRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    background: tokens.colors.bgTertiary,
    borderRadius: tokens.radius.lg,
  },

  pluginInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.md,
    flex: 1,
    minWidth: 0,
  },

  pluginIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },

  pluginDetails: {
    flex: 1,
    minWidth: 0,
  },

  pluginName: {
    display: 'block',
    fontWeight: tokens.typography.fontWeightMedium,
    color: tokens.colors.textPrimary,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  pluginMeta: {
    display: 'block',
    fontSize: tokens.typography.fontSizeXs,
    color: tokens.colors.textTertiary,
  },

  pluginEmpty: {
    padding: tokens.spacing.lg,
    textAlign: 'center' as const,
    color: tokens.colors.textTertiary,
    fontSize: tokens.typography.fontSizeSm,
  },

  availablePluginsHeader: {
    fontSize: tokens.typography.fontSizeXs,
    fontWeight: tokens.typography.fontWeightSemibold,
    color: tokens.colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
  },

  installBtn: {
    padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
    fontSize: tokens.typography.fontSizeSm,
    background: 'transparent',
    border: `1px solid ${tokens.colors.accentPrimary}`,
    borderRadius: tokens.radius.md,
    color: tokens.colors.accentPrimary,
    cursor: 'pointer',
    transition: `all ${tokens.transitions.fast}`,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  uninstallBtn: {
    padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
    fontSize: tokens.typography.fontSizeSm,
    background: 'transparent',
    border: `1px solid ${tokens.colors.accentError}`,
    borderRadius: tokens.radius.md,
    color: tokens.colors.accentError,
    cursor: 'pointer',
    transition: `all ${tokens.transitions.fast}`,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
};

/**
 * Props for HustleChat component
 */
export interface HustleChatProps {
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Show settings button (opens modal with model selector, prompts, etc.) */
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
 * @example With settings modal
 * ```tsx
 * <HustleChat
 *   showSettings
 *   placeholder="Ask me anything..."
 *   onMessage={(msg) => console.log('Sent:', msg)}
 * />
 * ```
 */
export function HustleChat({
  className = '',
  placeholder = 'Type a message...',
  showSettings = false,
  showDebug = false,
  initialSystemPrompt = '',
  onMessage,
  onToolCall,
  onResponse,
}: HustleChatProps) {
  const { isAuthenticated } = useEmblemAuth();
  const {
    instanceId,
    isReady,
    isLoading,
    error,
    models,
    chatStream,
    uploadFile,
    selectedModel,
    setSelectedModel,
    systemPrompt,
    setSystemPrompt,
    skipServerPrompt,
    setSkipServerPrompt,
  } = useHustle();
  const {
    plugins,
    registerPlugin,
    unregisterPlugin,
    enablePlugin,
    disablePlugin,
  } = usePlugins(instanceId);

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

      // Get the processed response (includes afterResponse hook modifications)
      const processedResponse = await stream.response;

      // Use hook-processed content if available, fallback to streamed content
      const finalContent = processedResponse?.content || fullContent || '(No response)';

      // Finalize the message with hook-processed content
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessage.id
            ? { ...m, isStreaming: false, content: finalContent }
            : m
        )
      );

      onResponse?.(finalContent);
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

  // Determine placeholder message for messages area
  const getPlaceholderMessage = () => {
    if (!isAuthenticated) {
      return 'Connect to start chatting...';
    }
    if (!isReady) {
      return 'Initializing...';
    }
    return 'Start a conversation...';
  };

  // Can interact with chat?
  const canChat = isAuthenticated && isReady;

  return (
    <>
      <style>{animations}</style>
      <div className={className} style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Chat</h2>
          <div style={styles.headerActions}>
            {/* Selected model label */}
            {selectedModel && (
              <span style={{ fontSize: tokens.typography.fontSizeSm, color: tokens.colors.textSecondary }}>
                {selectedModel.split('/').pop()}
              </span>
            )}

            {/* Settings toggle */}
            {showSettings && (
              <button
                type="button"
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                style={{
                  ...styles.settingsBtn,
                  ...(showSettingsPanel ? styles.settingsBtnActive : styles.settingsBtnInactive),
                }}
                title="Settings"
              >
                <SettingsIcon />
              </button>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && showSettingsPanel && (
          <div style={styles.modalOverlay} onClick={() => setShowSettingsPanel(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={styles.modalHeader}>
                <span style={styles.modalTitle}>Settings</span>
                <button
                  type="button"
                  style={styles.modalClose}
                  onClick={() => setShowSettingsPanel(false)}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div style={styles.modalBody}>
                {/* Model Selection */}
                <div style={styles.settingGroup}>
                  <label style={styles.settingLabel}>Model</label>
                  <p style={styles.settingDescription}>Select the AI model to use for chat responses</p>
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    style={styles.settingSelect}
                  >
                    <option value="">Default (server decides)</option>
                    {(() => {
                      // Group models by provider
                      const grouped: Record<string, typeof models> = {};
                      models.forEach(model => {
                        const [provider] = model.id.split('/');
                        if (!grouped[provider]) grouped[provider] = [];
                        grouped[provider].push(model);
                      });
                      return Object.entries(grouped).map(([provider, providerModels]) => (
                        <optgroup key={provider} label={provider.charAt(0).toUpperCase() + provider.slice(1)}>
                          {providerModels.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                  </select>
                  {selectedModel && (() => {
                    const model = models.find(m => m.id === selectedModel);
                    if (!model) return null;
                    const contextK = Math.round(model.context_length / 1000);
                    const promptCost = parseFloat(model.pricing?.prompt || '0') * 1000000;
                    const completionCost = parseFloat(model.pricing?.completion || '0') * 1000000;
                    return (
                      <div style={styles.modelInfo}>
                        Context: {contextK}K tokens | Cost: ${promptCost.toFixed(2)}/${completionCost.toFixed(2)} per 1M tokens
                      </div>
                    );
                  })()}
                </div>

                {/* Server System Prompt */}
                <div style={styles.settingGroup}>
                  <label style={styles.settingLabel}>Server System Prompt</label>
                  <div
                    style={styles.toggleRow}
                    onClick={() => setSkipServerPrompt(!skipServerPrompt)}
                  >
                    <span style={styles.toggleLabel}>Skip server-provided system prompt</span>
                    <div style={{
                      ...styles.toggleSwitch,
                      ...(skipServerPrompt ? styles.toggleSwitchActive : {}),
                    }}>
                      <div style={{
                        ...styles.toggleKnob,
                        ...(skipServerPrompt ? styles.toggleKnobActive : {}),
                      }} />
                    </div>
                  </div>
                  <p style={styles.settingDescription}>
                    When enabled, the server's default system prompt will not be used
                  </p>
                </div>

                {/* Custom System Prompt */}
                <div style={styles.settingGroup}>
                  <label style={styles.settingLabel}>Custom System Prompt</label>
                  <p style={styles.settingDescription}>Provide instructions for how the AI should behave</p>
                  <textarea
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    placeholder="You are a helpful assistant..."
                    style={styles.settingTextarea}
                  />
                </div>

                {/* Divider */}
                <div style={styles.settingDivider} />

                {/* Plugins Section */}
                <div style={{ ...styles.settingGroup, marginBottom: 0 }}>
                  <label style={styles.settingLabel}>Plugins</label>
                  <p style={styles.settingDescription}>Extend the AI with custom tools</p>

                  {/* Installed plugins */}
                  {plugins.length > 0 ? (
                    <div style={styles.pluginList}>
                      {plugins.map(plugin => (
                        <div key={plugin.name} style={styles.pluginRow}>
                          <div style={styles.pluginInfo}>
                            <span style={styles.pluginIcon}>{plugin.enabled ? '🔌' : '⚪'}</span>
                            <div style={styles.pluginDetails}>
                              <span style={styles.pluginName}>{plugin.name}</span>
                              <span style={styles.pluginMeta}>
                                v{plugin.version} • {plugin.tools?.length || 0} tools
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
                            <div
                              style={{
                                ...styles.toggleSwitch,
                                ...(plugin.enabled ? styles.toggleSwitchActive : {}),
                              }}
                              onClick={() => plugin.enabled
                                ? disablePlugin(plugin.name)
                                : enablePlugin(plugin.name)
                              }
                            >
                              <div style={{
                                ...styles.toggleKnob,
                                ...(plugin.enabled ? styles.toggleKnobActive : {}),
                              }} />
                            </div>
                            <button
                              type="button"
                              style={styles.uninstallBtn}
                              onClick={() => unregisterPlugin(plugin.name)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.pluginEmpty}>
                      No plugins installed
                    </div>
                  )}

                  {/* Available plugins */}
                  {availablePlugins.filter(p => !plugins.some(installed => installed.name === p.name)).length > 0 && (
                    <>
                      <div style={styles.availablePluginsHeader}>Available</div>
                      <div style={styles.pluginList}>
                        {availablePlugins
                          .filter(p => !plugins.some(installed => installed.name === p.name))
                          .map(plugin => (
                            <div key={plugin.name} style={styles.pluginRow}>
                              <div style={styles.pluginInfo}>
                                <span style={styles.pluginIcon}>📦</span>
                                <div style={styles.pluginDetails}>
                                  <span style={styles.pluginName}>{plugin.name}</span>
                                  <span style={styles.pluginMeta}>{plugin.description}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                style={styles.installBtn}
                                onClick={() => registerPlugin(plugin)}
                              >
                                + Install
                              </button>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div style={styles.messagesArea}>
          {messages.length === 0 && (
            <div style={styles.messagesEmpty}>
              <p>{getPlaceholderMessage()}</p>
            </div>
          )}

          <div style={styles.messagesContainer}>
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                showDebug={showDebug}
              />
            ))}
          </div>

          {/* Current tool calls indicator */}
          {currentToolCalls.length > 0 && (
            <div style={styles.toolCallsIndicator}>
              {currentToolCalls.map(tool => (
                <span key={tool.toolCallId} style={styles.toolCallBadge}>
                  <span style={styles.toolCallDot} />
                  {tool.toolName}
                </span>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div style={styles.attachmentsPreview}>
            {attachments.map((att, index) => (
              <div key={index} style={styles.attachmentItem}>
                <span style={styles.attachmentName}>{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  style={styles.attachmentRemove}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div style={styles.inputArea}>
          <div style={styles.inputRow}>
            {/* Input container with attached file button */}
            <div style={styles.inputContainer}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={styles.attachBtn}
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
                style={{ display: 'none' }}
              />
              <div style={styles.inputWrapper}>
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  disabled={!canChat || isStreaming || isLoading}
                  rows={1}
                  style={{
                    ...styles.input,
                    ...(!canChat || isStreaming || isLoading ? styles.inputDisabled : {}),
                  }}
                />
              </div>
            </div>

            {/* Send button */}
            <button
              type="button"
              onClick={sendMessage}
              disabled={!canChat || !inputValue.trim() || isStreaming || isLoading}
              style={{
                ...styles.sendBtn,
                ...(!canChat || !inputValue.trim() || isStreaming || isLoading
                  ? styles.sendBtnDisabled
                  : {}),
              }}
            >
              {isStreaming ? (
                <span style={styles.sendSpinner} />
              ) : (
                'Send'
              )}
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div style={styles.errorBox}>
              {error.message}
            </div>
          )}
        </div>
      </div>
    </>
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

  const containerStyle = {
    ...styles.messageBubbleContainer,
    ...(isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant),
  };

  const bubbleStyle = {
    ...styles.messageBubble,
    ...(isUser
      ? styles.messageBubbleUserStyle
      : isSystem
        ? styles.messageBubbleSystemStyle
        : styles.messageBubbleAssistantStyle),
  };

  return (
    <div style={containerStyle}>
      <div style={bubbleStyle}>
        {/* Message content */}
        <div style={styles.messageContent}>
          {isUser || isSystem ? (
            // User and system messages: plain text
            message.content
          ) : (
            // Assistant messages: render markdown
            <MarkdownContent content={message.content} />
          )}
          {message.isStreaming && (
            <span style={styles.streamingCursor} />
          )}
        </div>

        {/* Tool calls (debug mode) */}
        {showDebug && message.toolCalls && message.toolCalls.length > 0 && (
          <div style={styles.toolCallsDebug}>
            <div style={styles.toolCallsDebugTitle}>Tool calls:</div>
            {message.toolCalls.map(tool => (
              <div key={tool.toolCallId} style={styles.toolCallDebugItem}>
                <span style={styles.toolCallDebugName}>{tool.toolName}</span>
                {tool.args && (
                  <pre style={styles.toolCallDebugArgs}>
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
