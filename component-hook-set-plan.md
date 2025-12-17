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
- [ ] `useEmblemAuth` - Auth state and actions
- [ ] `useHustle` - Chat functionality

### Providers
- [ ] `EmblemAuthProvider` - Auth context
- [ ] `HustleProvider` - Hustle context (optional, could be in useHustle)

### Components
- [ ] `ConnectButton` - Auth trigger
- [ ] `AuthStatus` - Connection display
- [ ] `HustleChat` - Chat interface
- [ ] `ModelSelector` - Model dropdown (optional)
- [ ] `ToolSelector` - Tool checkboxes (optional)

### Types
- [ ] `AuthSession`
- [ ] `ChatMessage`
- [ ] `ChatOptions`
- [ ] `StreamChunk`
- [ ] `ToolCall` / `ToolResult`
- [ ] `Model` / `ToolCategory`

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
