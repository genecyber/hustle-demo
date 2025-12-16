# Agent Hustle Demo

A minimal example showing how to build AI-powered browser applications with the Emblem Vault AI suite.

## Installation

Both SDKs are available on npm and work in vanilla JavaScript or any framework:

```bash
npm install hustle-incognito emblem-auth-sdk
```

## Usage Options

### Option 1: Vanilla HTML/JavaScript (CDN)

No build step required. Load directly from CDN:

```html
<!-- Emblem Auth SDK -->
<script src="https://unpkg.com/emblem-auth-sdk@latest/dist/emblem-auth.min.js"></script>

<!-- Hustle Incognito SDK -->
<script type="module">
  import { HustleIncognitoClient } from 'https://unpkg.com/hustle-incognito@latest/dist/browser/hustle-incognito.esm.js';

  // Initialize and use...
</script>
```

This demo uses vanilla JS - run `npm start` and open `http://localhost:8080`.

### Option 2: React / Next.js

```jsx
import { useMemo, useState, useCallback } from 'react';
import { HustleIncognitoClient } from 'hustle-incognito';
import { EmblemAuthSDK } from 'emblem-auth-sdk';

function useHustleClient(settings) {
  const client = useMemo(() => {
    if (!settings.apiKey) return null;

    try {
      return new HustleIncognitoClient({
        apiKey: settings.apiKey,
        hustleApiUrl: settings.baseUrl,
        debug: settings.debug
      });
    } catch (error) {
      console.error('Failed to create HustleIncognitoClient:', error);
      return null;
    }
  }, [settings.apiKey, settings.baseUrl, settings.debug]);

  return client;
}

function useEmblemAuth(appId) {
  const [session, setSession] = useState(null);

  const authSDK = useMemo(() => {
    return new EmblemAuthSDK({
      appId,
      onSuccess: (session) => setSession(session),
      onError: (error) => console.error('Auth error:', error)
    });
  }, [appId]);

  const connect = useCallback(() => authSDK.openAuthModal(), [authSDK]);
  const disconnect = useCallback(() => {
    authSDK.logout();
    setSession(null);
  }, [authSDK]);

  return { authSDK, session, connect, disconnect };
}
```

### Option 3: With Emblem Auth (Wallet-Based)

For wallet authentication instead of API keys:

```javascript
const authSDK = new EmblemAuthSDK({
  appId: 'your-app-id',
  onSuccess: (session) => {
    // Create client with auth SDK - no API key needed
    const client = new HustleIncognitoClient({
      sdk: authSDK,
      hustleApiUrl: 'https://agenthustle.ai'
    });
  }
});

authSDK.openAuthModal();
```

## Why a Server?

Browsers block requests from `file://` URLs and CORS policies prevent direct API calls. This simple static server solves both - just serve your files and everything works.

```bash
npm start
# Open http://localhost:8080
```

## Emblem Auth

Handles wallet connection and session management:

```javascript
const authSDK = new EmblemAuthSDK({
  appId: 'your-app-id',
  onSuccess: (session) => {
    console.log('Connected! Vault:', session.user.vaultId);
  },
  onError: (error) => {
    console.error('Auth failed:', error.message);
  }
});

// Open wallet connection modal
authSDK.openAuthModal();

// Check for existing session on page load
const existingSession = authSDK.getSession();

// Logout
authSDK.logout();
```

## Hustle Incognito

Two authentication modes:

```javascript
// With Emblem Auth (wallet-based)
const client = new HustleIncognitoClient({
  sdk: authSDK,
  hustleApiUrl: 'https://agenthustle.ai'
});

// With API key (server-side or trusted environments)
const client = new HustleIncognitoClient({
  apiKey: 'your-api-key',
  hustleApiUrl: 'https://agenthustle.ai'
});
```

## Sending Messages

### Streaming (Recommended)

```javascript
const stream = hustleClient.chatStream({
  messages: [
    { role: 'user', content: 'What are the trending tokens on Solana?' }
  ]
});

for await (const chunk of stream) {
  switch (chunk.type) {
    case 'text':
      // Append text to your UI
      console.log(chunk.value);
      break;
    case 'tool_call':
      // AI is using a tool
      console.log('Using tool:', chunk.value.toolName);
      break;
    case 'tool_result':
      // Tool returned data
      console.log('Tool result:', chunk.value);
      break;
  }
}
```

### Non-Streaming

```javascript
const response = await hustleClient.chat([
  { role: 'user', content: 'What is the price of SOL?' }
]);

console.log(response.content);
```

## Image Uploads

Upload images and include them in your messages:

```javascript
// Upload a file (accepts File object in browser)
const attachment = await hustleClient.uploadFile(fileInput.files[0]);

// Include in your chat request
const stream = hustleClient.chatStream({
  messages: [{ role: 'user', content: 'What do you see in this image?' }],
  attachments: [attachment]
});
```

## Events

Subscribe to events for UI feedback:

```javascript
hustleClient.on('tool_start', (event) => {
  console.log('Tool started:', event.toolName);
});

hustleClient.on('tool_end', (event) => {
  console.log('Tool finished:', event.toolCallId);
});

hustleClient.on('stream_end', (event) => {
  console.log('Response complete:', event.response);
});
```

## Plugins

Plugins let you add custom client-side tools that the AI can call. Unlike server tools, these execute in your browser.

### Example: Magic 8-Ball Plugin

```javascript
const magic8BallPlugin = {
  name: 'magic-8-ball',
  version: '1.0.0',

  tools: [
    {
      name: 'shake_magic_8_ball',
      description: 'Shake a magic 8-ball to get mystical guidance on yes/no questions',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'The yes/no question to ask' }
        },
        required: ['question']
      }
    }
  ],

  executors: {
    shake_magic_8_ball: async ({ question }) => {
      const responses = [
        'It is certain.', 'Without a doubt.', 'Yes, definitely.',
        'Reply hazy, try again.', 'Ask again later.', 'Cannot predict now.',
        'Don\'t count on it.', 'My sources say no.', 'Outlook not so good.'
      ];
      const answer = responses[Math.floor(Math.random() * responses.length)];
      return { question, answer, mysticalEnergy: Math.random() > 0.5 ? 'high' : 'low' };
    }
  }
};
```

Now when you ask "Should I buy this token?" the AI might shake the magic 8-ball for guidance.

### Plugin Structure

```javascript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',

  // Tools the AI can call
  tools: [
    {
      name: 'tool_name',
      description: 'What this tool does',
      parameters: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'Description' }
        }
      }
    }
  ],

  // Functions that execute when tools are called
  executors: {
    tool_name: async (args) => {
      return { result: 'data' };
    }
  },

  // Optional lifecycle hooks
  hooks: {
    onRegister: () => {},        // Called when plugin is registered
    beforeRequest: (req) => req, // Can modify outgoing requests
    afterResponse: (res) => {},  // React to responses
    onError: (error) => {}       // Handle errors
  }
};
```

### Registering Plugins

```javascript
await hustleClient.use(myPlugin);

// Now when you chat, the AI can use your custom tools
const stream = hustleClient.chatStream({
  messages: [{ role: 'user', content: 'What page am I on?' }]
});
// The AI may call get_page_info and respond with the page title
```

### Multiple Plugins

```javascript
await hustleClient.use(analyticsPlugin);
await hustleClient.use(browserToolsPlugin);
await hustleClient.use(customPlugin);
```

## Options

### Chat Options

```javascript
hustleClient.chatStream({
  messages: [...],           // Required: conversation history
  attachments: [...],        // Optional: uploaded images
  model: 'anthropic/claude-sonnet-4', // Optional: specific model
  overrideSystemPrompt: true // Optional: skip server's default prompt
});
```

### Available Models

```javascript
const models = await hustleClient.getModels();
// Returns array of available models with pricing info
```

## Project Structure

```
index.html   - The demo application
styles.css   - Styling
server.js    - Static file server
```

## Built With

- [Hustle Incognito SDK](https://www.npmjs.com/package/hustle-incognito) - AI chat with automatic tool use
- [Emblem Auth SDK](https://www.npmjs.com/package/emblem-auth-sdk) - Wallet authentication

## License

MIT
