/**
 * PII Protection Plugin
 *
 * Demonstrates the beforeRequest/afterResponse hook lifecycle by
 * tokenizing PII (Personally Identifiable Information) before sending
 * to the AI, then restoring it in responses.
 *
 * Supported PII types:
 * - Social Security Numbers (XXX-XX-XXXX)
 * - Email addresses
 * - Phone numbers (various formats)
 * - Credit card numbers
 *
 * This plugin maintains a persistent token map so the same PII value
 * always maps to the same token across requests (prevents re-masking
 * with different tokens on follow-up messages).
 */

import type { HustlePlugin, HustleRequest, ProcessedResponse } from '../types';

/**
 * Storage keys for cross-hook communication
 */
const TOKEN_MAP_KEY = '__piiTokenMaps';
const PERSISTENT_MAP_KEY = '__piiPersistentMap';

/**
 * Get the request-specific token maps (for cleanup)
 */
function getTokenMaps(): Map<string, Map<string, string>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage: Record<string, unknown> = typeof window !== 'undefined' ? (window as any) : (global as any);

  if (!storage[TOKEN_MAP_KEY]) {
    storage[TOKEN_MAP_KEY] = new Map();
  }
  return storage[TOKEN_MAP_KEY] as Map<string, Map<string, string>>;
}

/**
 * Get the persistent PII -> token map (reuses tokens for same PII)
 */
function getPersistentMap(): { piiToToken: Map<string, string>; tokenToPii: Map<string, string>; counter: { value: number } } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage: Record<string, unknown> = typeof window !== 'undefined' ? (window as any) : (global as any);

  if (!storage[PERSISTENT_MAP_KEY]) {
    storage[PERSISTENT_MAP_KEY] = {
      piiToToken: new Map<string, string>(),
      tokenToPii: new Map<string, string>(),
      counter: { value: 0 },
    };
  }
  return storage[PERSISTENT_MAP_KEY] as { piiToToken: Map<string, string>; tokenToPii: Map<string, string>; counter: { value: number } };
}

/**
 * PII Protection Plugin
 *
 * Uses beforeRequest to tokenize PII, afterResponse to restore it.
 * Maintains persistent mapping so same PII always gets same token.
 */
export const piiProtectionPlugin: HustlePlugin = {
  name: 'pii-protection',
  version: '1.0.0',
  description: 'Tokenizes PII before sending to AI, restores in responses',

  tools: [],
  executors: {},

  hooks: {
    onRegister: () => {
      console.log('[PII Protection] Plugin registered - PII will be tokenized in requests');
    },

    beforeRequest: (request: HustleRequest): HustleRequest => {
      const maps = getTokenMaps();
      const persistent = getPersistentMap();
      const requestId = Date.now().toString();
      const requestTokenMap = new Map<string, string>();

      const tokenize = (text: string): string => {
        if (typeof text !== 'string') return text;

        return text
          // SSNs: 123-45-6789
          .replace(/\b\d{3}-\d{2}-\d{4}\b/g, (match) => {
            // Check if we already have a token for this PII
            if (persistent.piiToToken.has(match)) {
              const existingToken = persistent.piiToToken.get(match)!;
              requestTokenMap.set(existingToken, match);
              return existingToken;
            }
            const token = `{{SSN_${++persistent.counter.value}}}`;
            persistent.piiToToken.set(match, token);
            persistent.tokenToPii.set(token, match);
            requestTokenMap.set(token, match);
            return token;
          })
          // Email addresses
          .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, (match) => {
            if (persistent.piiToToken.has(match)) {
              const existingToken = persistent.piiToToken.get(match)!;
              requestTokenMap.set(existingToken, match);
              return existingToken;
            }
            const token = `{{EMAIL_${++persistent.counter.value}}}`;
            persistent.piiToToken.set(match, token);
            persistent.tokenToPii.set(token, match);
            requestTokenMap.set(token, match);
            return token;
          })
          // Phone numbers
          .replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, (match) => {
            if (persistent.piiToToken.has(match)) {
              const existingToken = persistent.piiToToken.get(match)!;
              requestTokenMap.set(existingToken, match);
              return existingToken;
            }
            const token = `{{PHONE_${++persistent.counter.value}}}`;
            persistent.piiToToken.set(match, token);
            persistent.tokenToPii.set(token, match);
            requestTokenMap.set(token, match);
            return token;
          })
          // Credit card numbers
          .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, (match) => {
            if (persistent.piiToToken.has(match)) {
              const existingToken = persistent.piiToToken.get(match)!;
              requestTokenMap.set(existingToken, match);
              return existingToken;
            }
            const token = `{{CARD_${++persistent.counter.value}}}`;
            persistent.piiToToken.set(match, token);
            persistent.tokenToPii.set(token, match);
            requestTokenMap.set(token, match);
            return token;
          });
      };

      // Tokenize PII in each message
      const anonymizedMessages = request.messages.map(msg => ({
        ...msg,
        content: typeof msg.content === 'string' ? tokenize(msg.content) : msg.content,
      }));

      // Store the token map for this request
      if (requestTokenMap.size > 0) {
        maps.set(requestId, requestTokenMap);
        console.log(`[PII Protection] Tokenized ${requestTokenMap.size} PII values`);
      }

      return { ...request, messages: anonymizedMessages };
    },

    afterResponse: (response: ProcessedResponse): void => {
      const persistent = getPersistentMap();

      // Restore tokens using the persistent map
      if (typeof response.content === 'string') {
        let restored = response.content;
        let restoredCount = 0;

        for (const [token, original] of persistent.tokenToPii.entries()) {
          if (restored.includes(token)) {
            restored = restored.split(token).join(original);
            restoredCount++;
          }
        }

        if (restoredCount > 0) {
          response.content = restored;
          console.log(`[PII Protection] Restored ${restoredCount} PII values`);
        }
      }
    },
  },
};
