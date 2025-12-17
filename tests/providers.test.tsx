import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import React from 'react';

// Use vi.hoisted to create mock state that can be accessed from inside vi.mock
const { mockState, MockEmblemAuthSDK, MockHustleIncognitoClient } = vi.hoisted(() => {
  // State to track instances
  const mockState = {
    lastAuthSDK: null as unknown,
    lastHustleClient: null as unknown,
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

    triggerError(error: Error) {
      const onError = this.config.onError as ((e: Error) => void) | undefined;
      onError?.(error);
    }
  }

  // Mock HustleIncognitoClient class
  class MockHustleIncognitoClient {
    config: Record<string, unknown>;
    getModels: () => Promise<unknown[]>;
    getTools: () => Promise<unknown[]>;
    chat: () => Promise<unknown>;
    chatStream: () => void;
    uploadFile: () => Promise<unknown>;
    on: () => void;

    constructor(config: Record<string, unknown>) {
      // Verify the correct pattern is used
      if (!config.sdk) {
        throw new Error('HustleIncognitoClient requires sdk parameter');
      }
      if (config.apiKey) {
        throw new Error('apiKey is deprecated - use sdk parameter');
      }
      this.config = config;
      this.getModels = () => Promise.resolve([]);
      this.getTools = () => Promise.resolve([]);
      this.chat = () => Promise.resolve({ content: 'test' });
      this.chatStream = () => {};
      this.uploadFile = () => Promise.resolve({});
      this.on = () => {};
      mockState.lastHustleClient = this;
    }
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

import { EmblemAuthProvider, useEmblemAuth, resetAuthSDK } from '../src/providers/EmblemAuthProvider';
import { HustleProvider, useHustle } from '../src/providers/HustleProvider';

// Helper to get typed mock instances
function getLastAuthSDK() {
  return mockState.lastAuthSDK as InstanceType<typeof MockEmblemAuthSDK> | null;
}

function getLastHustleClient() {
  return mockState.lastHustleClient as InstanceType<typeof MockHustleIncognitoClient> | null;
}

describe('EmblemAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthSDK();
    mockState.lastAuthSDK = null;
    mockState.lastHustleClient = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes SDK with correct config', () => {
    function TestComponent() {
      const { authSDK } = useEmblemAuth();
      return <div data-testid="sdk">{authSDK ? 'initialized' : 'null'}</div>;
    }

    render(
      <EmblemAuthProvider appId="test-app" apiUrl="https://test.api" modalUrl="https://test.modal">
        <TestComponent />
      </EmblemAuthProvider>
    );

    // Verify SDK was initialized with correct config
    const sdk = getLastAuthSDK();
    expect(sdk).not.toBeNull();
    expect(sdk?.config.appId).toBe('test-app');
    expect(sdk?.config.apiUrl).toBe('https://test.api');
    expect(sdk?.config.modalUrl).toBe('https://test.modal');
  });

  it('provides isAuthenticated: false initially', () => {
    function TestComponent() {
      const { isAuthenticated } = useEmblemAuth();
      return <div data-testid="auth">{String(isAuthenticated)}</div>;
    }

    render(
      <EmblemAuthProvider appId="test">
        <TestComponent />
      </EmblemAuthProvider>
    );

    expect(screen.getByTestId('auth').textContent).toBe('false');
  });

  it('throws error when hook used outside provider', () => {
    function BadComponent() {
      useEmblemAuth();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useEmblemAuth must be used within an EmblemAuthProvider'
    );
  });
});

describe('HustleProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthSDK();
    mockState.lastAuthSDK = null;
    mockState.lastHustleClient = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('creates HustleIncognitoClient with sdk parameter (not apiKey)', async () => {
    const mockSession = {
      user: { vaultId: '123', identifier: 'test' },
      authToken: 'jwt-token',
      expiresAt: Date.now() + 3600000,
      appId: 'test',
    };

    function TestComponent() {
      const { isReady, client } = useHustle();
      return (
        <div>
          <span data-testid="ready">{String(isReady)}</span>
          <span data-testid="client">{client ? 'created' : 'null'}</span>
        </div>
      );
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider hustleApiUrl="https://hustle.test">
          <TestComponent />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    // Initially not ready (not authenticated)
    expect(screen.getByTestId('ready').textContent).toBe('false');

    // Trigger authentication via the SDK callback
    await act(async () => {
      getLastAuthSDK()?.triggerSuccess(mockSession);
    });

    // Now should be ready
    expect(screen.getByTestId('ready').textContent).toBe('true');
    expect(screen.getByTestId('client').textContent).toBe('created');

    // Verify HustleIncognitoClient was called with sdk (not apiKey)
    const hustleClient = getLastHustleClient();
    expect(hustleClient).not.toBeNull();
    expect(hustleClient?.config.sdk).toBeDefined();
    expect(hustleClient?.config.hustleApiUrl).toBe('https://hustle.test');
    expect(hustleClient?.config.apiKey).toBeUndefined();
  });

  it('throws error when hook used outside provider', () => {
    function BadComponent() {
      useHustle();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useHustle must be used within a HustleProvider'
    );
  });

  it('requires EmblemAuthProvider as parent', () => {
    function TestComponent() {
      return <div>test</div>;
    }

    expect(() =>
      render(
        <HustleProvider>
          <TestComponent />
        </HustleProvider>
      )
    ).toThrow('useEmblemAuth must be used within an EmblemAuthProvider');
  });
});

describe('Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthSDK();
    mockState.lastAuthSDK = null;
    mockState.lastHustleClient = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('Auth is first-class citizen (no Hustle dependency)', () => {
    // This test verifies that EmblemAuthProvider can be used standalone
    function TestComponent() {
      const { isAuthenticated, openAuthModal, logout } = useEmblemAuth();
      return (
        <div>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <button onClick={openAuthModal}>Connect</button>
          <button onClick={logout}>Logout</button>
        </div>
      );
    }

    // Should work without HustleProvider
    render(
      <EmblemAuthProvider appId="test">
        <TestComponent />
      </EmblemAuthProvider>
    );

    expect(screen.getByTestId('auth')).toBeDefined();
  });

  it('Hustle depends on Auth', () => {
    // Verify the dependency direction
    function TestComponent() {
      const { authSDK } = useEmblemAuth();
      const { isReady } = useHustle();
      return (
        <div>
          <span data-testid="authSdk">{authSDK ? 'yes' : 'no'}</span>
          <span data-testid="hustleReady">{String(isReady)}</span>
        </div>
      );
    }

    render(
      <EmblemAuthProvider appId="test">
        <HustleProvider>
          <TestComponent />
        </HustleProvider>
      </EmblemAuthProvider>
    );

    // Auth should be available
    expect(screen.getByTestId('authSdk').textContent).toBe('yes');
  });
});
