# Emblem Auth + Hustle SDK React Integration

React hooks and components for integrating Emblem Auth and Hustle Incognito SDK into your React/Next.js application.

## Documentation

- **[Design System & Theming](./docs/DESIGN_SYSTEM.md)** - CSS variables, tokens, and customization guide

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

    // Chat
    chat,              // Send message (non-streaming)
    chatStream,        // Send message (streaming)
    uploadFile,        // Upload image attachment

    // Settings
    selectedModel,     // Current model
    setSelectedModel,
    systemPrompt,      // Custom system prompt
    setSystemPrompt,
    skipServerPrompt,  // Skip server's default prompt
    setSkipServerPrompt,
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

Authentication trigger button with vault info dropdown.

```tsx
<ConnectButton
  connectLabel="Sign In"
  loadingLabel="Connecting..."
  onConnect={() => console.log('Connected!')}
  onDisconnect={() => console.log('Disconnected!')}
  showVaultInfo={true}   // Show vault dropdown on hover when connected
/>
```

When connected, displays:
- Green pill: "✓ Connected • 0x1234...5678 ▾"
- Separate power button for disconnect
- Vault info dropdown on hover (Vault ID + wallet address with copy buttons)

### AuthStatus

Simple connection status indicator.

```tsx
<AuthStatus
  showVaultInfo={true}   // Expandable vault details on hover
  showLogout={true}      // Show disconnect button
/>
```

### HustleChat

Complete streaming chat interface.

```tsx
<HustleChat
  placeholder="Type a message..."
  showSettings={true}    // Settings modal (model selector, prompts)
  showDebug={false}      // Show tool call debug info
  initialSystemPrompt="You are a helpful assistant."
  onMessage={(msg) => console.log('Sent:', msg)}
  onToolCall={(tool) => console.log('Tool:', tool)}
  onResponse={(content) => console.log('Response:', content)}
/>
```

The settings modal includes:
- Model selector (grouped by provider)
- Model info (context length, pricing)
- Server system prompt toggle
- Custom system prompt textarea

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

## Multiple Chat Instances

You can use multiple `HustleProvider` instances in the same app. Each instance has isolated settings and plugins.

```tsx
<EmblemAuthProvider appId="your-app">
  {/* Trading assistant */}
  <HustleProvider instanceId="trading">
    <TradingChat />
  </HustleProvider>

  {/* Support bot */}
  <HustleProvider instanceId="support">
    <SupportChat />
  </HustleProvider>
</EmblemAuthProvider>
```

**How it works:**
- Each provider stores settings separately (`hustle-settings-{instanceId}`)
- Plugins are installed globally (`hustle-plugins`) - install once, available everywhere
- Plugin enabled/disabled state is per-instance (`hustle-plugin-state-{instanceId}`)
- If `instanceId` is omitted, an auto-generated ID is used (`instance-1`, `instance-2`, etc.)
- Dev warning appears when multiple providers exist without explicit IDs

## Plugin System

Extend the AI with custom client-side tools using plugins.

### usePlugins Hook

```tsx
import { usePlugins } from './src';

function PluginManager() {
  const {
    plugins,           // All registered plugins
    enabledPlugins,    // Only enabled plugins (with executors)
    registerPlugin,    // Add a plugin
    unregisterPlugin,  // Remove a plugin
    enablePlugin,      // Enable a plugin
    disablePlugin,     // Disable a plugin
    isRegistered,      // Check if registered
    isEnabled,         // Check if enabled
  } = usePlugins();

  return (
    <div>
      {plugins.map(p => (
        <div key={p.name}>
          {p.name} - {p.enabled ? 'On' : 'Off'}
          <button onClick={() => p.enabled ? disablePlugin(p.name) : enablePlugin(p.name)}>
            Toggle
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Available Plugins

Two plugins are included:

**Prediction Market Alpha** (`prediction-market-alpha`)
- Search Polymarket and Kalshi markets
- Get market details, prices, and trades
- Tools: `get_supported_platforms`, `search_prediction_markets`, `get_market_details`, `get_market_prices`, `get_market_trades`

**Migrate.fun Knowledge Base** (`migrate-fun-kb`)
- Embedded Q&A about token migrations
- Tool: `search_migrate_fun_docs`

### Creating Custom Plugins

```tsx
import type { HustlePlugin } from './src';

const myPlugin: HustlePlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather for a city',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
        },
        required: ['city'],
      },
    },
  ],
  executors: {
    get_weather: async (args) => {
      // Your implementation
      return { temp: 72, conditions: 'sunny' };
    },
  },
  hooks: {
    onRegister: () => console.log('Plugin registered!'),
  },
};

// Register it
const { registerPlugin } = usePlugins();
registerPlugin(myPlugin);
```

### Plugin Persistence

- Plugins are persisted in localStorage with serialized `executorCode`
- Executor functions are stored as strings and reconstituted via `eval()` on page refresh
- Enable/disable state is preserved per-instance
- Cross-tab sync via StorageEvent
- **Note:** Existing plugins from older versions need to be uninstalled and reinstalled to use the new serialization format

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
| `instanceId` | string | No | Unique ID for multi-instance scoping (auto-generated if not provided) |

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
