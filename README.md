# Emblem Auth + Hustle SDK React Integration

React hooks and components for integrating Emblem Auth and Hustle Incognito SDK into your React/Next.js application.

## Installation

```bash
npm install emblem-auth-sdk hustle-incognito react react-dom
```

Then copy the `src/` folder into your project, or install this package directly.

## Quick Start

### 1. Wrap your app with providers

```tsx
// app/layout.tsx (Next.js) or App.tsx (React)
import { EmblemAuthProvider, HustleProvider } from './src';

export default function RootLayout({ children }) {
  return (
    <EmblemAuthProvider
      appId="your-app-id"
      apiUrl="https://dev-api.emblemvault.ai"
      modalUrl="https://dev-auth.emblemvault.ai/connect"
    >
      <HustleProvider hustleApiUrl="https://dev.agenthustle.ai">
        {children}
      </HustleProvider>
    </EmblemAuthProvider>
  );
}
```

### 2. Add auth UI

```tsx
import { ConnectButton, AuthStatus } from './src';

function Header() {
  return (
    <header>
      <ConnectButton />
      <AuthStatus showVaultInfo showLogout />
    </header>
  );
}
```

### 3. Add chat

```tsx
import { HustleChat } from './src';

function ChatPage() {
  return (
    <HustleChat
      showModelSelector
      showSettings
      placeholder="Ask me anything..."
    />
  );
}
```

## Hooks

### useEmblemAuth

Access authentication state and actions.

```tsx
import { useEmblemAuth } from './src';

function MyComponent() {
  const {
    // State
    session,           // Current auth session
    isAuthenticated,   // Boolean
    isLoading,         // Loading state
    error,             // Error object
    vaultId,           // User's vault ID
    walletAddress,     // Connected wallet address
    vaultInfo,         // Full vault details

    // Actions
    openAuthModal,     // Open the auth modal
    logout,            // Log out
    refreshSession,    // Refresh the JWT

    // Advanced
    authSDK,           // Raw SDK instance (for Hustle)
  } = useEmblemAuth();

  return (
    <button onClick={openAuthModal}>
      {isAuthenticated ? `Connected: ${walletAddress}` : 'Connect'}
    </button>
  );
}
```

### useHustle

Access chat functionality (requires authentication).

```tsx
import { useHustle } from './src';

function ChatComponent() {
  const {
    // State
    isReady,           // SDK ready for use
    isLoading,         // Request in progress
    error,             // Error object
    models,            // Available AI models
    tools,             // Available tool categories

    // Chat
    chat,              // Send message (non-streaming)
    chatStream,        // Send message (streaming)
    uploadFile,        // Upload image attachment

    // Settings
    selectedModel,     // Current model
    setSelectedModel,
    selectedTools,     // Enabled tools
    setSelectedTools,
    systemPrompt,      // Custom system prompt
    setSystemPrompt,
  } = useHustle();

  // Non-streaming chat
  const response = await chat({
    messages: [{ role: 'user', content: 'Hello!' }],
  });

  // Streaming chat
  for await (const chunk of chatStream({ messages })) {
    if (chunk.type === 'text') {
      console.log(chunk.value); // Stream text
    } else if (chunk.type === 'tool_call') {
      console.log('Tool:', chunk.value.toolName);
    }
  }
}
```

## Components

### ConnectButton

Authentication trigger button.

```tsx
<ConnectButton
  connectLabel="Sign In"
  connectedLabel={(addr) => `Wallet: ${addr}`}
  loadingLabel="Connecting..."
  onConnect={() => console.log('Connected!')}
  onDisconnect={() => console.log('Disconnected!')}
  showDisconnect={true}
  variant="default" // or "minimal"
/>
```

### AuthStatus

Display connection status and vault info.

```tsx
<AuthStatus
  showVaultInfo={true}   // Expandable vault details
  showLogout={true}      // Show disconnect button
  compact={false}        // Compact mode
/>
```

### HustleChat

Complete streaming chat interface.

```tsx
<HustleChat
  placeholder="Type a message..."
  showModelSelector={true}
  showToolSelector={true}
  showSettings={true}
  showDebug={false}
  initialSystemPrompt="You are a helpful assistant."
  onMessage={(msg) => console.log('Sent:', msg)}
  onToolCall={(tool) => console.log('Tool:', tool)}
  onResponse={(content) => console.log('Response:', content)}
/>
```

## Architecture

```
EmblemAuthProvider (standalone - first class citizen)
    │
    └── HustleProvider (depends on auth)
            │
            └── Your components use hooks freely
```

**Key principle:** Auth is independent. Hustle depends on Auth. Never the reverse.

## The Correct Pattern

This SDK uses the modern JWT-based pattern where the Hustle client is initialized with the Auth SDK instance:

```typescript
// ✅ CORRECT - What this SDK does
const hustleClient = new HustleIncognitoClient({
  sdk: authSDK,  // Pass the auth SDK instance
  hustleApiUrl: 'https://dev.agenthustle.ai',
});

// ❌ DEPRECATED - Don't do this
const hustleClient = new HustleIncognitoClient({
  apiKey: vaultApiKey,  // Don't use API keys
  hustleApiUrl: '...',
});
```

The Auth SDK automatically handles:
- JWT token storage and persistence
- Token refresh before expiration
- Modal communication
- Session lifecycle

The Hustle SDK (when initialized with `sdk:`) automatically handles:
- JWT injection in API requests
- Token refresh coordination
- Streaming response parsing
- Tool call orchestration

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_EMBLEM_APP_ID=your-app-id
NEXT_PUBLIC_EMBLEM_API_URL=https://dev-api.emblemvault.ai
NEXT_PUBLIC_EMBLEM_MODAL_URL=https://dev-auth.emblemvault.ai/connect
NEXT_PUBLIC_HUSTLE_API_URL=https://dev.agenthustle.ai
```

### Provider Props

**EmblemAuthProvider:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `appId` | string | Yes | Your application ID |
| `apiUrl` | string | No | Auth API endpoint |
| `modalUrl` | string | No | Auth modal URL |
| `debug` | boolean | No | Enable debug logging |

**HustleProvider:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `hustleApiUrl` | string | No | Hustle API endpoint |
| `debug` | boolean | No | Enable debug logging |

## Building

```bash
npm install
npm run typecheck  # Validate TypeScript
npm run build      # Build to dist/
```

## File Structure

```
src/
├── index.ts                 # Main exports
├── types/
│   ├── auth.ts              # Auth types
│   └── hustle.ts            # Hustle types
├── providers/
│   ├── EmblemAuthProvider.tsx
│   └── HustleProvider.tsx
├── hooks/
│   ├── useEmblemAuth.ts
│   └── useHustle.ts
├── components/
│   ├── ConnectButton.tsx
│   ├── AuthStatus.tsx
│   └── HustleChat.tsx
└── utils/
    └── index.ts             # Helpers
```

## License

MIT
