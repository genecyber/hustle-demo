# Component & Hook Set Plan

## Initial User Prompt (DO NOT REMOVE)
```markdown
ok new plan, we are going to take the '/Users/shannoncode/repo/hustle-demo/index.html' and convert it into a set of components and hooks.
  This demo shows how to use the auth end to end, coupling the auth with the hustle incognito sdk.
  The components and hooks I'm going to provide as examples are outdated, they use a now deprecated auth pattern that used api-key + vaultId
  after initial login and acquisition of the JWT.

  It's VERY important that we do NOT utilize this apikey pattern in our new components/hook. I can't stress it enough, we want this repo to
  demo the coupling and usage of the auth JWT (most of which happens without much thought. by initializing the hustle-incognito sdk using the
  initalized Auth SDK the session lifecycle is fully managed by the libraries.
  Your job, should you choose to accept it is as follows
  Use the currently empty '/Users/shannoncode/repo/hustle-demo/component-hook-set-plan.md' for first discovery, to understand how to utilize
  both SDK's within a next setup as well as how to utilize both of them coupled. Identify the interface each offers and document it with the
  goal being to create a clean set of hooks and components that will just work throught a next / react app.
  As I remember it the flow is this.
  import and initialize the auth sdk using the necessary endpoint overrides to configure the system to run against our dev ntwork
  environment.
  import and initialize the hustle-incognito sdk using the instantiated auth sdk instance and necessary args to communicate with our dev
  network environment.
  With me so far????
  A button needs to exist  that is bound to the hustle sdk to open the connection modal.
  I *think* that the auth sdk takes care of communicating with the modal iframe/popup to ultimately get the returned JWT issued by the remote
  auth server from the modal for use within the app scope.
  I do know that the hustle sdk when initialized with the auth library will automatically handle the usage of th JWT for chat communication,
  as well as the auth sdk will handle token refreshes internally.
  Part of discovery is  identifying and documenting what aspects are simply hanled by th sdk libraries and what should be handled by our
  hook/components. documnenting any events that are available and how to bind them for use within the component/hooks.

  The goal of the plan it to build hooks and components that are as simple as possible to drop into anny next app. Note that Auth is it's own
  first class citizen. While the hustle SDK relies on the auth library, the requirement i not in the other direction. in no way should auth
  require hustle sdk existence.

  Hooks and Components from deprecated auth pattern
  '/Users/shannoncode/repo/login-with-emblem-registration-site/src/components/agent-hustle/AgentHustleStreaming.tsx'
  '/Users/shannoncode/repo/login-with-emblem-registration-site/src/hooks/use-emblem-auth.tsx'
  '/Users/shannoncode/repo/login-with-emblem-registration-site/src/hooks/useAgentHustle.ts'

  Please feel free to explore how these components were utilized within /Users/shannoncode/repo/login-with-emblem-registration-site
```

---

## Phase 1: Discovery

### 1.1 The CORRECT Pattern (from index.html)

The `hustle-demo/index.html` demonstrates the **modern JWT-based pattern** we want to replicate:

```javascript
// Step 1: Initialize Auth SDK
authSDK = new window.EmblemAuth.EmblemAuthSDK({
  appId: CONFIG.emblemAuthAppId,
  apiUrl: CONFIG.emblemAuthApiUrl,
  modalUrl: CONFIG.emblemAuthModalUrl,
  onSuccess: (session) => { /* handle auth success */ },
  onError: (error) => { /* handle auth error */ }
});

// Step 2: Create Hustle client WITH the Auth SDK instance (NOT api key!)
hustleClient = new HustleIncognitoClient({
  sdk: authSDK,           // <-- CORRECT: Pass auth SDK instance
  hustleApiUrl: CONFIG.hustleApiUrl,
  debug: CONFIG.debug
});
```

**Key Point**: The `HustleIncognitoClient` is initialized with `sdk: authSDK` - **NOT** with an `apiKey`. This is the critical difference from the deprecated pattern.

### 1.2 The DEPRECATED Pattern (what to AVOID)

The deprecated hooks use the **api-key pattern**:

```javascript
// WRONG - Deprecated pattern from useAgentHustle.ts
const client = new HustleIncognitoClient({
  apiKey: state.settings.apiKey,  // <-- DEPRECATED: Don't use api keys
  hustleApiUrl: state.settings.baseUrl,
  debug: state.settings.debug
});
```

**Problems with deprecated pattern:**
1. Requires fetching `vaultApiKey` after auth via `sdk.getVaultApiKey()`
2. Manages API key as application state
3. Extra complexity and security concerns (API key exposure)
4. Doesn't leverage the built-in JWT handling

---

## Phase 2: SDK Interface Analysis

### 2.1 EmblemAuthSDK Interface

**Constructor Options:**
```typescript
interface EmblemAuthSDKOptions {
  appId: string;              // Required: Application identifier
  apiUrl?: string;            // API endpoint (default: production)
  modalUrl?: string;          // Auth modal URL (default: production)
  onSuccess?: (session: AuthSession) => void;
  onError?: (error: Error) => void;
}
```

**AuthSession Type:**
```typescript
interface AuthSession {
  user: {
    identifier: string;
    vaultId: string;
    evmAddress?: string;
    solanaAddress?: string;
  };
  authToken: string;          // JWT token
  refreshToken?: string;
  expiresAt: number;
  appId: string;
  scope?: string;
}
```

**Public Methods:**
| Method | Description |
|--------|-------------|
| `openAuthModal()` | Opens the auth modal (returns Promise) |
| `logout()` | Clears session and logs out |
| `getSession()` | Returns current session or null |
| `refreshSession()` | Refreshes the JWT token |
| `getVaultInfo()` | Gets vault details (addresses, metadata) |
| `getVaultApiKey()` | **DEPRECATED** - Don't use in new code |

**Events:**
| Event | Payload | Description |
|-------|---------|-------------|
| `session` | `AuthSession \| null` | Session created/updated |
| `sessionExpired` | `void` | Session has expired |

**What Auth SDK Handles Automatically:**
- JWT token storage (localStorage/cookies)
- Token refresh before expiration
- Modal communication (iframe/popup messaging)
- Session persistence across page refreshes
- Secure token handling

### 2.2 HustleIncognitoClient Interface

**Constructor Options (Modern Pattern):**
```typescript
interface HustleClientOptions {
  sdk: EmblemAuthSDK;         // Required: Auth SDK instance
  hustleApiUrl?: string;      // Hustle API endpoint
  debug?: boolean;            // Enable debug logging
}
```

**Public Methods:**
| Method | Description |
|--------|-------------|
| `chat(options)` | Send message, get complete response |
| `chatStream(options)` | Send message, get streaming response |
| `uploadFile(file)` | Upload image attachment |
| `getModels()` | Get available AI models |
| `getTools()` | Get available tool categories |
| `getSummarizationState()` | Get context summarization state |
| `clearSummarizationState()` | Clear summarization state |

**Chat Options:**
```typescript
interface ChatOptions {
  messages: ChatMessage[];
  model?: string;                    // AI model to use
  systemPrompt?: string;             // Custom system prompt
  overrideSystemPrompt?: boolean;    // Skip server default prompt
  attachments?: Attachment[];        // Image attachments
  selectedToolCategories?: string[]; // Enable specific tools
  processChunks?: boolean;           // For streaming
}
```

**Events:**
| Event | Payload | Description |
|-------|---------|-------------|
| `tool_start` | `{ toolCallId, toolName, args }` | Tool execution started |
| `tool_end` | `{ toolCallId, result }` | Tool execution completed |
| `stream_end` | `{ response }` | Stream finished with full response |

**Stream Chunk Types:**
```typescript
type StreamChunk =
  | { type: 'text'; value: string }
  | { type: 'tool_call'; value: ToolCall }
  | { type: 'tool_result'; value: ToolResult }
  | { type: 'error'; value: Error };
```

**What Hustle SDK Handles Automatically (when initialized with Auth SDK):**
- JWT token injection in API requests
- Token refresh coordination with Auth SDK
- Streaming response parsing
- Tool call/result handling
- File upload with authentication
- Context summarization

---

## Phase 3: Architecture Design

### 3.1 Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │   EmblemAuthProvider │    │      HustleProvider          │  │
│  │   (First Class)      │───▶│   (Depends on Auth)          │  │
│  └──────────────────────┘    └──────────────────────────────┘  │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │   useEmblemAuth()    │    │      useHustle()             │  │
│  │   - session          │    │   - chat / chatStream        │  │
│  │   - isAuthenticated  │    │   - uploadFile               │  │
│  │   - openAuthModal    │    │   - models / tools           │  │
│  │   - logout           │    │   - events                   │  │
│  └──────────────────────┘    └──────────────────────────────┘  │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │   <ConnectButton />  │    │   <HustleChat />             │  │
│  │   <AuthStatus />     │    │   <ModelSelector />          │  │
│  └──────────────────────┘    └──────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Auth is independent. Hustle depends on Auth. Never the reverse.

### 3.2 Proposed File Structure

```
src/
├── providers/
│   ├── EmblemAuthProvider.tsx    # Auth context provider
│   └── HustleProvider.tsx        # Hustle context provider (uses auth)
│
├── hooks/
│   ├── useEmblemAuth.ts          # Auth hook (standalone)
│   └── useHustle.ts              # Hustle hook (requires auth context)
│
├── components/
│   ├── ConnectButton.tsx         # Auth trigger button
│   ├── AuthStatus.tsx            # Connection status display
│   ├── HustleChat.tsx            # Complete chat interface
│   └── ModelSelector.tsx         # Model selection dropdown
│
└── types/
    └── index.ts                  # Shared TypeScript types
```

### 3.3 Usage Example (End Goal)

```tsx
// app/layout.tsx
import { EmblemAuthProvider } from '@/providers/EmblemAuthProvider';
import { HustleProvider } from '@/providers/HustleProvider';

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

// app/page.tsx
import { useEmblemAuth } from '@/hooks/useEmblemAuth';
import { ConnectButton, AuthStatus } from '@/components';
import { HustleChat } from '@/components/HustleChat';

export default function Page() {
  const { isAuthenticated } = useEmblemAuth();

  return (
    <div>
      <header>
        <ConnectButton />
        <AuthStatus />
      </header>

      {isAuthenticated && <HustleChat />}
    </div>
  );
}
```

---

## Phase 4: Detailed Hook Specifications

### 4.1 useEmblemAuth Hook

**Purpose:** Standalone auth management - no Hustle dependency

**Interface:**
```typescript
interface UseEmblemAuthReturn {
  // State
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;

  // User Info (derived from session)
  vaultId: string | null;
  walletAddress: string | null;

  // Actions
  openAuthModal: () => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;

  // Advanced (for Hustle integration)
  authSDK: EmblemAuthSDK | null;
}
```

**Implementation Notes:**
- Uses React Context for state sharing
- Singleton SDK instance (prevents multiple initializations)
- Subscribes to SDK events (`session`, `sessionExpired`)
- Auto-checks for existing session on mount
- **Does NOT expose apiKey** - that's the deprecated pattern

### 4.2 useHustle Hook

**Purpose:** Chat functionality - requires auth context

**Interface:**
```typescript
interface UseHustleReturn {
  // State
  isReady: boolean;              // SDK initialized and authenticated
  models: Model[];               // Available AI models
  tools: ToolCategory[];         // Available tool categories

  // Chat
  chat: (options: ChatOptions) => Promise<ChatResponse>;
  chatStream: (options: ChatOptions) => AsyncIterable<StreamChunk>;

  // File Upload
  uploadFile: (file: File) => Promise<Attachment>;

  // Settings
  selectedModel: string | null;
  setSelectedModel: (model: string) => void;
  selectedTools: string[];
  setSelectedTools: (tools: string[]) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;

  // Events
  onToolStart: (callback: (event: ToolStartEvent) => void) => void;
  onToolEnd: (callback: (event: ToolEndEvent) => void) => void;
  onStreamEnd: (callback: (event: StreamEndEvent) => void) => void;
}
```

**Implementation Notes:**
- Gets `authSDK` from `useEmblemAuth()` context
- Creates `HustleIncognitoClient` with `sdk: authSDK`
- Only creates client when authenticated
- Subscribes to Hustle events
- Memoizes client instance

---

## Phase 5: Component Specifications

### 5.1 ConnectButton

**Purpose:** Simple button to trigger auth modal

**Props:**
```typescript
interface ConnectButtonProps {
  className?: string;
  children?: ReactNode;          // Custom button content
  onConnect?: () => void;        // Callback after successful connect
  onDisconnect?: () => void;     // Callback after disconnect
}
```

**Behavior:**
- Shows "Connect" when not authenticated
- Shows truncated wallet address when connected
- Click toggles between connect modal and disconnect

### 5.2 AuthStatus

**Purpose:** Display connection status and vault info

**Props:**
```typescript
interface AuthStatusProps {
  className?: string;
  showVaultInfo?: boolean;       // Show expandable vault details
  showLogout?: boolean;          // Show logout button
}
```

### 5.3 HustleChat

**Purpose:** Complete streaming chat interface

**Props:**
```typescript
interface HustleChatProps {
  className?: string;
  placeholder?: string;
  showModelSelector?: boolean;
  showToolSelector?: boolean;
  showSettings?: boolean;
  onMessage?: (message: ChatMessage) => void;
  onToolCall?: (toolCall: ToolCall) => void;
}
```

**Features:**
- Message input with send button
- Streaming response display with markdown rendering
- Tool activity indicators
- File upload support
- Model/tool selection (optional)
- Debug mode (optional)

---

## Phase 6: Event Flow Diagrams

### 6.1 Authentication Flow

```
User clicks ConnectButton
         │
         ▼
useEmblemAuth.openAuthModal()
         │
         ▼
EmblemAuthSDK.openAuthModal()
         │
         ▼
Modal opens (iframe/popup)
         │
         ▼
User completes wallet connection
         │
         ▼
Modal communicates JWT back to SDK
         │
         ▼
SDK fires onSuccess callback
         │
         ▼
EmblemAuthProvider updates context
         │
         ▼
useEmblemAuth consumers re-render
         │
         ▼
HustleProvider detects auth change
         │
         ▼
HustleIncognitoClient created with sdk
         │
         ▼
useHustle.isReady becomes true
```

### 6.2 Chat Message Flow

```
User types message and clicks Send
         │
         ▼
useHustle.chatStream(options)
         │
         ▼
HustleIncognitoClient.chatStream()
   (automatically includes JWT from auth SDK)
         │
         ▼
Server streams response chunks
         │
         ├──▶ text chunk → UI updates response
         │
         ├──▶ tool_call → onToolStart event
         │         │
         │         ▼
         │    Tool executes on server
         │         │
         │         ▼
         ├──▶ tool_result → onToolEnd event
         │
         └──▶ stream ends → onStreamEnd event
```

---

## Phase 7: Implementation Checklist

### Hooks
- [x] `useEmblemAuth` - Auth state and actions (`src/hooks/useEmblemAuth.ts`)
- [x] `useHustle` - Chat functionality (`src/hooks/useHustle.ts`)

### Providers
- [x] `EmblemAuthProvider` - Auth context (`src/providers/EmblemAuthProvider.tsx`)
- [x] `HustleProvider` - Hustle context (`src/providers/HustleProvider.tsx`)

### Components
- [x] `ConnectButton` - Auth trigger (`src/components/ConnectButton.tsx`)
- [x] `AuthStatus` - Connection display (`src/components/AuthStatus.tsx`)
- [x] `HustleChat` - Chat interface (`src/components/HustleChat.tsx`)
  - Includes built-in Model Selector in Settings modal
- ~~`ToolSelector`~~ - **Deprecated**: Server now handles auto tool selection

### Types
- [x] `AuthSession` (`src/types/auth.ts`)
- [x] `ChatMessage` (`src/types/hustle.ts`)
- [x] `ChatOptions` (`src/types/hustle.ts`)
- [x] `StreamChunk` (`src/types/hustle.ts`)
- [x] `ToolCall` / `ToolResult` (`src/types/hustle.ts`)
- [x] `Model` / `ToolCategory` (`src/types/hustle.ts`)

### Utilities
- [x] `truncateAddress` - Address formatting (`src/utils/index.ts`)
- [x] `generateId` - Unique ID generation (`src/utils/index.ts`)
- [x] `decodeJwtPayload` - JWT decoding (`src/utils/index.ts`)
- [x] `isJwtExpired` - JWT expiration check (`src/utils/index.ts`)
- [x] `formatFileSize` - File size formatting (`src/utils/index.ts`)

---

## Phase 7.5: Test Coverage

### Test Files
- `tests/utils.test.ts` - Utility function tests (14 tests)
- `tests/providers.test.tsx` - Provider and hook tests (12 tests)
- `tests/plugins.test.ts` - Plugin registry tests (22 tests)
- `tests/settings.test.tsx` - Settings persistence tests (7 tests)

### Test Results: ✅ All Passing (55/55)

**Utils Tests (14 passing):**
- `truncateAddress` - Address truncation with various inputs
- `generateId` - Unique ID generation with prefixes
- `decodeJwtPayload` - JWT decoding, invalid token handling
- `isJwtExpired` - Token expiration checking
- `formatFileSize` - Bytes/KB/MB formatting

**Provider Tests (8 passing):**
- `EmblemAuthProvider` initializes SDK with correct config
- `EmblemAuthProvider` provides `isAuthenticated: false` initially
- `EmblemAuthProvider` throws error when hook used outside provider
- `HustleProvider` creates client with `sdk` parameter (NOT `apiKey`) ⭐
- `HustleProvider` throws error when hook used outside provider
- `HustleProvider` requires `EmblemAuthProvider` as parent
- Auth is first-class citizen (no Hustle dependency)
- Hustle depends on Auth (correct architecture)

### Running Tests
```bash
npm test
```

---

## Phase 8: Configuration

### Environment Variables
```env
# Required
NEXT_PUBLIC_EMBLEM_APP_ID=your-app-id

# Optional (defaults to production)
NEXT_PUBLIC_EMBLEM_API_URL=https://dev-api.emblemvault.ai
NEXT_PUBLIC_EMBLEM_MODAL_URL=https://dev-auth.emblemvault.ai/connect
NEXT_PUBLIC_HUSTLE_API_URL=https://dev.agenthustle.ai
```

### Development Environment (from index.html)
```javascript
const CONFIG = {
  hustleApiUrl: 'https://dev.agenthustle.ai',
  emblemAuthAppId: 'demo-app-id',
  emblemAuthApiUrl: 'https://dev-api.emblemvault.ai',
  emblemAuthModalUrl: 'https://dev-auth.emblemvault.ai/connect',
  debug: false
};
```

---

## Summary: Key Differences from Deprecated Pattern

| Aspect | Deprecated Pattern | New Pattern |
|--------|-------------------|-------------|
| Hustle Client Init | `apiKey: string` | `sdk: EmblemAuthSDK` |
| API Key Management | Fetch & store in state | Not needed |
| Token Refresh | Manual coordination | Automatic |
| Auth Dependency | Tightly coupled | Clean separation |
| Security | API key in client state | JWT only in SDK |

**The single most important change:** Initialize `HustleIncognitoClient` with `sdk: authSDK` instead of `apiKey`.

---

## Phase 9: Plugins

### 9.1 Overview

The Hustle SDK includes a powerful plugin system for extending the AI agent with custom client-side tools. This section outlines how to integrate plugin management into our React components/hooks.

**How Plugins Work:**
1. Plugin defines tool schemas (name, description, JSON schema parameters)
2. Plugin provides executor functions that run client-side
3. When registered via `client.use(plugin)`, schemas are sent to server
4. Server creates Zod schema and registers as available tool for AI
5. When AI calls the tool, SDK executes it locally and returns result

### 9.2 Plugin Interface (from hustle-incognito)

```typescript
interface HustlePlugin {
  name: string;           // Unique plugin identifier
  version: string;        // Semantic version
  tools?: ClientToolDefinition[];  // Tool schemas sent to server
  executors?: Record<string, ToolExecutor>;  // Local execution functions
  hooks?: {
    onRegister?: () => void | Promise<void>;
    beforeRequest?: (req: HustleRequest) => HustleRequest | Promise<HustleRequest>;
    afterResponse?: (res: ProcessedResponse) => void | Promise<void>;
    onError?: (error: Error, context: ErrorContext) => void | Promise<void>;
  };
}

interface ClientToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;  // JSON Schema for tool arguments
}

type ToolExecutor = (args: Record<string, unknown>) => Promise<unknown>;
```

### 9.3 Architecture: Plugin Registry

**Goal:** Expose discovered plugins from browser storage and allow the chat component to detect changes and register them dynamically.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser Storage                              │
│  localStorage['hustle-plugins'] = [                             │
│    { name: 'prediction-market', version: '1.0.0', ... },        │
│    { name: 'custom-tool', version: '1.0.0', ... }               │
│  ]                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PluginRegistry                                │
│  - loadFromStorage(): Plugin[]                                  │
│  - saveToStorage(plugins: Plugin[]): void                       │
│  - register(plugin: Plugin): void                               │
│  - unregister(pluginName: string): void                         │
│  - getAll(): Plugin[]                                           │
│  - onChange(callback): unsubscribe                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    usePlugins() Hook                             │
│  - plugins: Plugin[]          // All registered plugins          │
│  - registerPlugin(plugin)     // Add and persist                 │
│  - unregisterPlugin(name)     // Remove and persist              │
│  - isRegistered(name)         // Check if registered             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HustleProvider                                │
│  - Listens for plugin changes                                   │
│  - Calls hustleClient.use(plugin) for each                      │
│  - Re-registers on plugin list change                           │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Proposed Implementation

#### PluginRegistry (src/utils/pluginRegistry.ts)

```typescript
const STORAGE_KEY = 'hustle-plugins';

interface StoredPlugin {
  name: string;
  version: string;
  tools?: ClientToolDefinition[];
  enabled: boolean;
}

type PluginChangeCallback = (plugins: StoredPlugin[]) => void;

class PluginRegistry {
  private listeners: Set<PluginChangeCallback> = new Set();

  loadFromStorage(): StoredPlugin[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveToStorage(plugins: StoredPlugin[]): void {
    // Store only serializable parts (not executors)
    const serializable = plugins.map(p => ({
      name: p.name,
      version: p.version,
      tools: p.tools,
      enabled: p.enabled,
      // executors are functions - restored via hydration from known plugins
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    this.notifyListeners();
  }

  register(plugin: StoredPlugin): void {
    const plugins = this.loadFromStorage();
    const existing = plugins.findIndex(p => p.name === plugin.name);
    if (existing >= 0) {
      plugins[existing] = plugin;
    } else {
      plugins.push(plugin);
    }
    this.saveToStorage(plugins);
  }

  unregister(pluginName: string): void {
    const plugins = this.loadFromStorage().filter(p => p.name !== pluginName);
    this.saveToStorage(plugins);
  }

  setEnabled(pluginName: string, enabled: boolean): void {
    const plugins = this.loadFromStorage();
    const plugin = plugins.find(p => p.name === pluginName);
    if (plugin) {
      plugin.enabled = enabled;
      this.saveToStorage(plugins);
    }
  }

  onChange(callback: PluginChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const plugins = this.loadFromStorage();
    this.listeners.forEach(cb => cb(plugins));
  }
}

export const pluginRegistry = new PluginRegistry();
```

#### usePlugins Hook (src/hooks/usePlugins.ts)

```typescript
interface StoredPlugin extends HustlePlugin {
  enabled: boolean;  // Persisted enable/disable state
}

interface UsePluginsReturn {
  plugins: StoredPlugin[];
  registerPlugin: (plugin: HustlePlugin) => void;
  unregisterPlugin: (name: string) => void;
  enablePlugin: (name: string) => void;
  disablePlugin: (name: string) => void;
  isRegistered: (name: string) => boolean;
  enabledPlugins: StoredPlugin[];  // Only enabled plugins (for HustleProvider)
}

export function usePlugins(): UsePluginsReturn {
  const [plugins, setPlugins] = useState<StoredPlugin[]>([]);

  useEffect(() => {
    // Load initial plugins
    setPlugins(pluginRegistry.loadFromStorage());

    // Listen for changes (from other tabs/windows too)
    const unsubscribe = pluginRegistry.onChange(setPlugins);

    // Also listen to storage events for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hustle-plugins') {
        setPlugins(pluginRegistry.loadFromStorage());
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return {
    plugins,
    registerPlugin: (plugin) => pluginRegistry.register({ ...plugin, enabled: true }),
    unregisterPlugin: (name) => pluginRegistry.unregister(name),
    enablePlugin: (name) => pluginRegistry.setEnabled(name, true),
    disablePlugin: (name) => pluginRegistry.setEnabled(name, false),
    isRegistered: (name) => plugins.some(p => p.name === name),
    enabledPlugins: plugins.filter(p => p.enabled),
  };
}
```

#### HustleProvider Integration

```typescript
// In HustleProvider.tsx
function HustleProvider({ children, hustleApiUrl }) {
  const { authSDK } = useEmblemAuth();
  const { enabledPlugins } = usePlugins();  // Only enabled plugins
  const [client, setClient] = useState<HustleIncognitoClient | null>(null);

  // Create client when authenticated
  useEffect(() => {
    if (authSDK) {
      const newClient = new HustleIncognitoClient({
        sdk: authSDK,
        hustleApiUrl,
      });
      setClient(newClient);
    }
  }, [authSDK, hustleApiUrl]);

  // Register enabled plugins when client or enabledPlugins change
  useEffect(() => {
    if (client && enabledPlugins.length > 0) {
      const registerAll = async () => {
        for (const plugin of enabledPlugins) {
          // Hydrate executors from known plugin registry
          const hydratedPlugin = hydratePluginExecutors(plugin);
          await client.use(hydratedPlugin);
        }
      };
      registerAll();
    }
  }, [client, enabledPlugins]);

  // ... rest of provider
}
```

### 9.5 Plugin Management in HustleChat Settings Modal

The plugin manager will be integrated directly into the HustleChat settings modal as a new section (alongside Model, System Prompt, etc.). This keeps plugin management discoverable without adding UI complexity.

**Location:** Inside the existing settings modal in `HustleChat.tsx`

**UI Design:**

```
┌────────────────────────────────────────────────┐
│ Settings                                    ×  │
├────────────────────────────────────────────────┤
│                                                │
│ Model                                          │
│ ┌──────────────────────────────────────────┐   │
│ │ anthropic/claude-3.5-sonnet          ▼   │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ Server System Prompt                           │
│ ┌──────────────────────────────────────────┐   │
│ │ Skip server-provided prompt      [═══○]  │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ Custom System Prompt                           │
│ ┌──────────────────────────────────────────┐   │
│ │ You are a helpful assistant...           │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ─────────────────────────────────────────────  │
│                                                │
│ Plugins                                        │
│ Extend the AI with custom tools               │
│                                                │
│ ┌──────────────────────────────────────────┐   │
│ │ 🔌 prediction-market-alpha        [═══●] │   │
│ │    v1.0.0 • 4 tools                      │   │
│ └──────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────┐   │
│ │ 🔌 custom-analytics               [○═══] │   │
│ │    v1.0.0 • 2 tools                      │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ Available                                      │
│ ┌──────────────────────────────────────────┐   │
│ │ 📦 weather-tools            [+ Install]  │   │
│ │    Get weather forecasts                 │   │
│ └──────────────────────────────────────────┘   │
│                                                │
└────────────────────────────────────────────────┘
```

**Implementation in HustleChat.tsx:**

```typescript
// Add to HustleChat component
const { plugins, registerPlugin, unregisterPlugin, enablePlugin, disablePlugin } = usePlugins();

// Inside settings modal body, after Custom System Prompt section:
{/* Plugins Section */}
<div style={styles.settingDivider} />

<div style={styles.settingGroup}>
  <label style={styles.settingLabel}>Plugins</label>
  <p style={styles.settingDescription}>Extend the AI with custom tools</p>

  {/* Installed plugins */}
  {plugins.length > 0 ? (
    <div style={styles.pluginList}>
      {plugins.map(plugin => (
        <div key={plugin.name} style={styles.pluginRow}>
          <div style={styles.pluginInfo}>
            <span style={styles.pluginIcon}>🔌</span>
            <div>
              <span style={styles.pluginName}>{plugin.name}</span>
              <span style={styles.pluginMeta}>
                v{plugin.version} • {plugin.tools?.length || 0} tools
              </span>
            </div>
          </div>
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
        </div>
      ))}
    </div>
  ) : (
    <div style={styles.pluginEmpty}>
      No plugins installed
    </div>
  )}

  {/* Available plugins (hardcoded for PoC) */}
  <div style={styles.availablePluginsHeader}>Available</div>
  {availablePlugins
    .filter(p => !plugins.some(installed => installed.name === p.name))
    .map(plugin => (
      <div key={plugin.name} style={styles.pluginRow}>
        <div style={styles.pluginInfo}>
          <span style={styles.pluginIcon}>📦</span>
          <div>
            <span style={styles.pluginName}>{plugin.name}</span>
            <span style={styles.pluginMeta}>{plugin.description}</span>
          </div>
        </div>
        <button
          style={styles.installBtn}
          onClick={() => registerPlugin(plugin)}
        >
          + Install
        </button>
      </div>
    ))}
</div>
```

**New Styles to Add:**

```typescript
// Add to styles object in HustleChat.tsx
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
},

pluginIcon: {
  fontSize: '20px',
},

pluginName: {
  display: 'block',
  fontWeight: tokens.typography.fontWeightMedium,
  color: tokens.colors.textPrimary,
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
},
```

**Available Plugins Registry (Hardcoded for PoC):**

```typescript
// src/plugins/registry.ts
import { predictionMarketPlugin } from './predictionMarket';

export const availablePlugins = [
  {
    ...predictionMarketPlugin,
    description: 'Search Polymarket prediction markets',
  },
  // Add more plugins here as they're created
];
```

### 9.6 Example Plugin: Prediction Market Alpha

Using the **Dome API** (https://api.domeapi.io) to provide prediction market intelligence.

```typescript
const DOME_API_BASE = 'https://api.domeapi.io/v1';

export const predictionMarketPlugin: HustlePlugin = {
  name: 'prediction-market-alpha',
  version: '1.0.0',

  tools: [
    {
      name: 'search_prediction_markets',
      description: 'Search for prediction markets on Polymarket. Find markets about politics, crypto, sports, and more. Returns market titles, current odds, volume, and status.',
      parameters: {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by tags (e.g., "politics", "crypto", "sports")'
          },
          status: {
            type: 'string',
            enum: ['open', 'closed'],
            description: 'Filter by market status'
          },
          min_volume: {
            type: 'number',
            description: 'Minimum trading volume in USD'
          },
          limit: {
            type: 'number',
            description: 'Number of results (1-100)',
            default: 10
          }
        }
      }
    },
    {
      name: 'get_market_details',
      description: 'Get detailed information about a specific prediction market including current prices, trading history, and resolution source.',
      parameters: {
        type: 'object',
        properties: {
          market_slug: {
            type: 'string',
            description: 'The market slug/identifier'
          }
        },
        required: ['market_slug']
      }
    },
    {
      name: 'get_market_prices',
      description: 'Get current prices/odds for a prediction market. Shows probability for each outcome.',
      parameters: {
        type: 'object',
        properties: {
          market_slug: {
            type: 'string',
            description: 'The market slug/identifier'
          }
        },
        required: ['market_slug']
      }
    },
    {
      name: 'get_market_trades',
      description: 'Get recent trading activity/history for a prediction market.',
      parameters: {
        type: 'object',
        properties: {
          market_slug: {
            type: 'string',
            description: 'The market slug/identifier'
          },
          limit: {
            type: 'number',
            description: 'Number of trades to return',
            default: 20
          }
        },
        required: ['market_slug']
      }
    }
  ],

  executors: {
    search_prediction_markets: async (args) => {
      const params = new URLSearchParams();
      if (args.tags) params.append('tags', (args.tags as string[]).join(','));
      if (args.status) params.append('status', args.status as string);
      if (args.min_volume) params.append('min_volume', String(args.min_volume));
      if (args.limit) params.append('limit', String(args.limit));

      const response = await fetch(`${DOME_API_BASE}/polymarket/markets?${params}`);
      const data = await response.json();

      return {
        markets: data.markets.map((m: any) => ({
          slug: m.market_slug,
          title: m.title,
          status: m.status,
          volume: m.volume_total,
          tags: m.tags,
          outcomes: [
            { label: m.side_a.label, id: m.side_a.id },
            { label: m.side_b.label, id: m.side_b.id }
          ],
          winner: m.winning_side
        })),
        total: data.pagination.total,
        hasMore: data.pagination.has_more
      };
    },

    get_market_details: async (args) => {
      const response = await fetch(
        `${DOME_API_BASE}/polymarket/markets?market_slug=${args.market_slug}`
      );
      const data = await response.json();
      const market = data.markets[0];

      return {
        slug: market.market_slug,
        title: market.title,
        status: market.status,
        startTime: new Date(market.start_time * 1000).toISOString(),
        endTime: market.end_time ? new Date(market.end_time * 1000).toISOString() : null,
        volume: {
          total: market.volume_total,
          week: market.volume_1_week,
          month: market.volume_1_month
        },
        resolutionSource: market.resolution_source,
        outcomes: [
          { label: market.side_a.label, id: market.side_a.id },
          { label: market.side_b.label, id: market.side_b.id }
        ],
        winner: market.winning_side,
        tags: market.tags
      };
    },

    get_market_prices: async (args) => {
      const response = await fetch(
        `${DOME_API_BASE}/polymarket/market-price?market_slug=${args.market_slug}`
      );
      return await response.json();
    },

    get_market_trades: async (args) => {
      const params = new URLSearchParams({
        market_slug: args.market_slug as string,
        limit: String(args.limit || 20)
      });
      const response = await fetch(
        `${DOME_API_BASE}/polymarket/trade-history?${params}`
      );
      return await response.json();
    }
  },

  hooks: {
    onRegister: () => {
      console.log('Prediction Market Alpha plugin registered');
    }
  }
};
```

### 9.7 Usage Example

```tsx
import { predictionMarketPlugin } from './plugins/predictionMarket';
import { usePlugins } from './hooks/usePlugins';

function App() {
  const { registerPlugin, isRegistered } = usePlugins();

  const installPredictionMarket = () => {
    if (!isRegistered('prediction-market-alpha')) {
      registerPlugin(predictionMarketPlugin);
    }
  };

  return (
    <div>
      <button onClick={installPredictionMarket}>
        Install Prediction Market Plugin
      </button>

      <HustleChat />
      {/* User can now ask: "What prediction markets are trending about crypto?" */}
    </div>
  );
}
```

### 9.8 Implementation Checklist

- [x] `PluginRegistry` class (src/utils/pluginRegistry.ts)
- [x] `usePlugins` hook (src/hooks/usePlugins.ts)
- [x] Update `HustleProvider` to register plugins on change
- [x] Add Plugins section to HustleChat settings modal
- [x] Available plugins registry (src/plugins/index.ts)
- [x] Example plugin: Prediction Market Alpha v1.1.0 (src/plugins/predictionMarket.ts)
  - Supports Polymarket + Kalshi platforms
  - 5 tools: `get_supported_platforms`, `search_prediction_markets`, `get_market_details`, `get_market_prices`, `get_market_trades`
- [x] Migrate.fun Knowledge Base plugin (src/plugins/migrateFun.ts)
  - Embedded Q&A knowledge base with keyword search
- [x] Plugin hydration (restore executors from known plugins on page refresh)
- [x] Cross-tab sync via storage events
- [x] Plugin enable/disable state (persisted)
- [x] Types export for plugin authors (src/types/plugin.ts)
- [x] Settings persistence (model, system prompt, skip server prompt) in localStorage

### 9.9 Future Considerations

1. **Remote Plugin Registry**: Fetch available plugins from a central registry
2. **Plugin Marketplace**: UI for discovering and installing community plugins
3. **Plugin Permissions**: Sandboxing/permissions for plugin executors
4. **Plugin Versioning**: Handle plugin updates gracefully
5. **Lazy Loading**: Load plugin executors on-demand
6. **Plugin Dependencies**: Allow plugins to depend on other plugins

---

## Phase 10: Multi-Instance Support & Documentation Gaps

### 10.1 Multi-Instance Support (Implemented)

Added support for multiple `HustleProvider` instances in the same app, each with isolated settings and plugins.

**Implementation:**
- `instanceId` prop on `HustleProvider` (optional)
- Auto-generated IDs based on mount order (`instance-1`, `instance-2`, etc.)
- Instance-scoped localStorage keys:
  - Settings: `hustle-settings-{instanceId}`
  - Plugin enabled state: `hustle-plugin-state-{instanceId}`
- Global localStorage keys:
  - Plugin installations: `hustle-plugins` (install once, available everywhere)
- Dev-mode warning when multiple providers exist without explicit `instanceId`
- `usePlugins` hook accepts `instanceId` parameter

**Plugin Storage Model:**
- Plugins are installed GLOBALLY - install once, available to all instances
- Enabled/disabled state is INSTANCE-SCOPED - each instance controls its own toggles
- This allows sharing plugins across chat instances while maintaining per-instance preferences

**Usage:**
```tsx
// Single provider (uses "instance-1" implicitly)
<HustleProvider>
  <HustleChat />
</HustleProvider>

// Multiple providers with explicit IDs (recommended)
<HustleProvider instanceId="trading-assistant">
  <TradingChat />
</HustleProvider>
<HustleProvider instanceId="support-bot">
  <SupportChat />
</HustleProvider>
```

### 10.2 Test Coverage Gaps

**Currently tested (tests/providers.test.tsx, tests/utils.test.ts):**
- [x] Utils: truncateAddress, generateId, JWT decode/expire, formatFileSize
- [x] EmblemAuthProvider initialization with config
- [x] HustleProvider basic setup with SDK pattern
- [x] Architecture: Auth first-class, Hustle depends on Auth

**Needs tests:**
- [x] `instanceId` prop (explicit ID)
- [x] Auto-generated `instanceId` (mount-order based)
- [x] Multiple HustleProvider instances (dev warning test)
- [x] Settings persistence (localStorage save/load on refresh)
- [x] System prompt injection into messages array
- [x] `pluginRegistry` class methods (22 tests)
- [x] `usePlugins` hook (register, enable, disable, unregister) - via pluginRegistry tests
- [x] Plugin hydration on page refresh
- [ ] Cross-tab sync via StorageEvent (deferred - requires browser environment)

### 10.3 README Documentation Gaps

**Currently documented:**
- [x] Basic setup with providers
- [x] useEmblemAuth hook
- [x] useHustle hook
- [x] ConnectButton, AuthStatus, HustleChat components
- [x] Architecture diagram
- [x] Environment variables
- [x] Provider props table

**Needs documentation:**
- [x] `instanceId` prop on HustleProvider
- [x] Multiple HustleProvider usage pattern
- [x] Plugin system overview
- [x] `usePlugins` hook API
- [x] Available plugins (prediction-market-alpha, migrate-fun-kb)
- [x] Creating custom plugins
- [x] Settings auto-persistence behavior (plugin persistence documented)

### 10.4 Implementation Checklist

**Tests to add (tests/providers.test.tsx):**
- [x] Test: `instanceId` prop creates scoped storage key
- [x] Test: Auto-generated IDs are stable across renders
- [x] Test: Multiple providers have isolated settings
- [x] Test: Dev warning fires for multiple auto-instances

**Tests to add (new file: tests/plugins.test.ts):** ✅ DONE (20 tests)
- [x] Test: `pluginRegistry.register()` adds plugin to storage
- [x] Test: `pluginRegistry.unregister()` removes plugin
- [x] Test: `pluginRegistry.setEnabled()` toggles state
- [x] Test: `pluginRegistry.loadFromStorage()` with instanceId scoping
- [x] Test: `hydratePlugin()` restores executors from knownPlugins
- [x] Test: `usePlugins` returns correct plugin state

**Tests to add (tests/settings.test.tsx):** ✅ DONE (7 tests)
- [x] Test: Settings load from localStorage on mount
- [x] Test: Settings save to localStorage on change
- [x] Test: Different instanceIds have separate settings
- [x] Test: Defaults to empty settings when localStorage is empty
- [x] Test: System prompt prepended to messages array
- [x] Test: No system message when prompt is empty
- [x] Test: options.systemPrompt overrides context systemPrompt

**README sections to add:** ✅ DONE
- [x] Section: "Multiple Chat Instances"
- [x] Section: "Plugin System"
- [x] Section: "usePlugins Hook"
- [x] Update HustleProvider props table with `instanceId`

### 10.5 Files Changed (Since Last Commit)

```
src/hooks/usePlugins.ts          | instanceId parameter added
src/providers/HustleProvider.tsx | instanceId prop, auto-ID, scoped storage
src/types/hustle.ts              | instanceId in HustleProviderProps
src/utils/pluginRegistry.ts      | instanceId scoping for all methods
```
