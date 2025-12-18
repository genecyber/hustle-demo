import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import React from 'react';

// Use vi.hoisted to create mock state that can be accessed from inside vi.mock
const { mockState, MockEmblemAuthSDK, MockHustleIncognitoClient } = vi.hoisted(() => {
  // State to track instances
  const mockState = {
    lastAuthSDK: null as unknown,
    lastHustleClient: null as unknown,
    chatCalls: [] as Array<{ messages: Array<{ role: string; content: string }> }>,
  };

  // Mock EmblemAuthSDK class
  class MockEmblemAuthSDK {
    config: Record<string, unknown>;
    openAuthModal: () => Promise<void>;
    logout: () => void;
    getSession: () => unknown;
    refreshSession: () => Promise<unknown>;
    getVaultInfo: () => Promise<unknown>;
    on: () => void;
    off: () => void;

    constructor(config: Record<string, unknown>) {
      this.config = config;
      this.openAuthModal = () => Promise.resolve();
      this.logout = () => {};
      this.getSession = () => null;
      this.refreshSession = () => Promise.resolve(null);
      this.getVaultInfo = () => Promise.resolve(null);
      this.on = () => {};
      this.off = () => {};
      mockState.lastAuthSDK = this;
    }

    triggerSuccess(session: unknown) {
      const onSuccess = this.config.onSuccess as ((s: unknown) => void) | undefined;
      onSuccess?.(session);
    }
  }

  // Mock HustleIncognitoClient class
  class MockHustleIncognitoClient {
    config: Record<string, unknown>;
    getModels: () => Promise<unknown[]>;
    getTools: () => Promise<unknown[]>;
    uploadFile: () => Promise<unknown>;
    on: () => void;
    use: () => Promise<void>;

    constructor(config: Record<string, unknown>) {
      if (!config.sdk) {
        throw new Error('HustleIncognitoClient requires sdk parameter');
      }
      this.config = config;
      this.getModels = () => Promise.resolve([]);
      this.getTools = () => Promise.resolve([]);
      this.uploadFile = () => Promise.resolve({});
      this.on = () => {};
      this.use = () => Promise.resolve();
      mockState.lastHustleClient = this;
    }

    // Track chat calls to verify system prompt injection
    chat = async (opts: Record<string, unknown>) => {
      mockState.chatCalls.push({ messages: opts.messages as Array<{ role: string; content: string }> });
      return { content: 'test response' };
    };

    chatStream = function* () {
      yield { type: 'text', value: 'test' };
    };
  }

  return { mockState, MockEmblemAuthSDK, MockHustleIncognitoClient };
});

// Mock the SDKs
vi.mock('emblem-auth-sdk', () => ({
  EmblemAuthSDK: MockEmblemAuthSDK,
}));

vi.mock('hustle-incognito', () => ({
  HustleIncognitoClient: MockHustleIncognitoClient,
}));

import { EmblemAuthProvider, resetAuthSDK } from '../src/providers/EmblemAuthProvider';
import { HustleProvider, useHustle } from '../src/providers/HustleProvider';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Helper to get typed mock instances
function getLastAuthSDK() {
  return mockState.lastAuthSDK as InstanceType<typeof MockEmblemAuthSDK> | null;
}

describe('Settings Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthSDK();
    mockState.lastAuthSDK = null;
    mockState.lastHustleClient = null;
    mockState.chatCalls = [];
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('loads settings from localStorage on mount', async () => {
    // Pre-populate localStorage with settings
    const savedSettings = {
      selectedModel: 'anthropic/claude-3.5-sonnet',
      systemPrompt: 'You are a helpful assistant',
      skipServerPrompt: true,
    };
    localStorageMock.setItem('hustle-settings-test-instance', JSON.stringify(savedSettings));

    function TestComponent() {
      const { selectedModel, systemPrompt, skipServerPrompt } = useHustle();
      return (
        <div>
          <span data-testid="model">{selectedModel}</span>
          <span data-testid="prompt">{systemPrompt}</span>
          <span data-testid="skip">{String(skipServerPrompt)}</span>
        </div>
      );
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider instanceId="test-instance">
          <TestComponent />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    expect(screen.getByTestId('model').textContent).toBe('anthropic/claude-3.5-sonnet');
    expect(screen.getByTestId('prompt').textContent).toBe('You are a helpful assistant');
    expect(screen.getByTestId('skip').textContent).toBe('true');
  });

  it('saves settings to localStorage when they change', async () => {
    function TestComponent() {
      const { setSelectedModel, setSystemPrompt, setSkipServerPrompt } = useHustle();

      React.useEffect(() => {
        // Change settings
        setSelectedModel('openai/gpt-4');
        setSystemPrompt('Custom prompt');
        setSkipServerPrompt(true);
      }, [setSelectedModel, setSystemPrompt, setSkipServerPrompt]);

      return <div>test</div>;
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider instanceId="save-test">
          <TestComponent />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    // Check that localStorage was updated
    const stored = localStorageMock.getItem('hustle-settings-save-test');
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.selectedModel).toBe('openai/gpt-4');
    expect(parsed.systemPrompt).toBe('Custom prompt');
    expect(parsed.skipServerPrompt).toBe(true);
  });

  it('different instanceIds have separate settings', () => {
    // Pre-populate different settings for different instances
    localStorageMock.setItem(
      'hustle-settings-instance-a',
      JSON.stringify({ selectedModel: 'model-a', systemPrompt: 'prompt-a', skipServerPrompt: false })
    );
    localStorageMock.setItem(
      'hustle-settings-instance-b',
      JSON.stringify({ selectedModel: 'model-b', systemPrompt: 'prompt-b', skipServerPrompt: true })
    );

    function TestComponentA() {
      const { selectedModel, systemPrompt } = useHustle();
      return (
        <div>
          <span data-testid="model-a">{selectedModel}</span>
          <span data-testid="prompt-a">{systemPrompt}</span>
        </div>
      );
    }

    function TestComponentB() {
      const { selectedModel, systemPrompt } = useHustle();
      return (
        <div>
          <span data-testid="model-b">{selectedModel}</span>
          <span data-testid="prompt-b">{systemPrompt}</span>
        </div>
      );
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider instanceId="instance-a">
          <TestComponentA />
        </HustleProvider>
        <HustleProvider instanceId="instance-b">
          <TestComponentB />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    // Instance A should have its settings
    expect(screen.getByTestId('model-a').textContent).toBe('model-a');
    expect(screen.getByTestId('prompt-a').textContent).toBe('prompt-a');

    // Instance B should have its separate settings
    expect(screen.getByTestId('model-b').textContent).toBe('model-b');
    expect(screen.getByTestId('prompt-b').textContent).toBe('prompt-b');
  });

  it('defaults to empty settings when localStorage is empty', () => {
    function TestComponent() {
      const { selectedModel, systemPrompt, skipServerPrompt } = useHustle();
      return (
        <div>
          <span data-testid="model">{selectedModel || 'empty'}</span>
          <span data-testid="prompt">{systemPrompt || 'empty'}</span>
          <span data-testid="skip">{String(skipServerPrompt)}</span>
        </div>
      );
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider instanceId="empty-test">
          <TestComponent />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    expect(screen.getByTestId('model').textContent).toBe('empty');
    expect(screen.getByTestId('prompt').textContent).toBe('empty');
    expect(screen.getByTestId('skip').textContent).toBe('false');
  });
});

describe('System Prompt Injection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthSDK();
    mockState.lastAuthSDK = null;
    mockState.lastHustleClient = null;
    mockState.chatCalls = [];
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('prepends system prompt to messages array', async () => {
    const mockSession = {
      user: { vaultId: '123', identifier: 'test' },
      authToken: 'jwt-token',
      expiresAt: Date.now() + 3600000,
      appId: 'test',
    };

    function TestComponent() {
      const { chat, isReady, setSystemPrompt } = useHustle();

      React.useEffect(() => {
        setSystemPrompt('You are a test assistant');
      }, [setSystemPrompt]);

      const handleChat = async () => {
        if (isReady) {
          await chat({
            messages: [{ role: 'user', content: 'Hello' }],
          });
        }
      };

      return (
        <div>
          <span data-testid="ready">{String(isReady)}</span>
          <button data-testid="chat-btn" onClick={handleChat}>Chat</button>
        </div>
      );
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider instanceId="prompt-test">
          <TestComponent />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    // Trigger authentication
    await act(async () => {
      getLastAuthSDK()?.triggerSuccess(mockSession);
    });

    // Wait for client to be ready
    expect(screen.getByTestId('ready').textContent).toBe('true');

    // Trigger chat
    await act(async () => {
      screen.getByTestId('chat-btn').click();
    });

    // Wait a tick for the chat call to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify the messages array has system prompt prepended
    expect(mockState.chatCalls.length).toBeGreaterThan(0);
    const lastCall = mockState.chatCalls[mockState.chatCalls.length - 1];
    expect(lastCall.messages[0]).toEqual({
      role: 'system',
      content: 'You are a test assistant',
    });
    expect(lastCall.messages[1]).toEqual({
      role: 'user',
      content: 'Hello',
    });
  });

  it('does not prepend system message when systemPrompt is empty', async () => {
    const mockSession = {
      user: { vaultId: '123', identifier: 'test' },
      authToken: 'jwt-token',
      expiresAt: Date.now() + 3600000,
      appId: 'test',
    };

    function TestComponent() {
      const { chat, isReady } = useHustle();

      const handleChat = async () => {
        if (isReady) {
          await chat({
            messages: [{ role: 'user', content: 'Hello' }],
          });
        }
      };

      return (
        <div>
          <span data-testid="ready">{String(isReady)}</span>
          <button data-testid="chat-btn" onClick={handleChat}>Chat</button>
        </div>
      );
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider instanceId="no-prompt-test">
          <TestComponent />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    // Trigger authentication
    await act(async () => {
      getLastAuthSDK()?.triggerSuccess(mockSession);
    });

    // Trigger chat
    await act(async () => {
      screen.getByTestId('chat-btn').click();
    });

    // Wait a tick
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify messages array only has user message (no system prepended)
    expect(mockState.chatCalls.length).toBeGreaterThan(0);
    const lastCall = mockState.chatCalls[mockState.chatCalls.length - 1];
    expect(lastCall.messages.length).toBe(1);
    expect(lastCall.messages[0].role).toBe('user');
  });

  it('options.systemPrompt overrides context systemPrompt', async () => {
    const mockSession = {
      user: { vaultId: '123', identifier: 'test' },
      authToken: 'jwt-token',
      expiresAt: Date.now() + 3600000,
      appId: 'test',
    };

    function TestComponent() {
      const { chat, isReady, setSystemPrompt } = useHustle();

      React.useEffect(() => {
        setSystemPrompt('Context prompt');
      }, [setSystemPrompt]);

      const handleChat = async () => {
        if (isReady) {
          await chat({
            messages: [{ role: 'user', content: 'Hello' }],
            systemPrompt: 'Override prompt', // This should take precedence
          });
        }
      };

      return (
        <div>
          <span data-testid="ready">{String(isReady)}</span>
          <button data-testid="chat-btn" onClick={handleChat}>Chat</button>
        </div>
      );
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider instanceId="override-test">
          <TestComponent />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    // Trigger authentication
    await act(async () => {
      getLastAuthSDK()?.triggerSuccess(mockSession);
    });

    // Trigger chat
    await act(async () => {
      screen.getByTestId('chat-btn').click();
    });

    // Wait a tick
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify the override prompt was used
    expect(mockState.chatCalls.length).toBeGreaterThan(0);
    const lastCall = mockState.chatCalls[mockState.chatCalls.length - 1];
    expect(lastCall.messages[0]).toEqual({
      role: 'system',
      content: 'Override prompt',
    });
  });
});
