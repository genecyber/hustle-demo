/**
 * Plugin Registry
 *
 * Available plugins that can be installed by users.
 * This is a hardcoded registry for the PoC - in the future
 * this could be fetched from a remote plugin marketplace.
 *
 * NOTE: Plugins no longer need to be pre-registered. Executor code
 * is now serialized to localStorage as executorCode strings and
 * reconstituted at runtime via eval().
 */

import { predictionMarketPlugin } from './predictionMarket';
import { migrateFunPlugin } from './migrateFun';
import { piiProtectionPlugin } from './piiProtection';
import { userQuestionPlugin } from './userQuestion';
import type { HustlePlugin } from '../types';

/**
 * Available plugin with display metadata
 */
export interface AvailablePlugin extends HustlePlugin {
  /** Short description for UI display */
  description: string;
}

/**
 * All available plugins that can be installed
 */
export const availablePlugins: AvailablePlugin[] = [
  {
    ...predictionMarketPlugin,
    description: 'Search and analyze Polymarket and Kalshi prediction markets',
  },
  {
    ...migrateFunPlugin,
    description: 'Search Migrate.fun knowledge base for token migration answers',
  },
  {
    ...piiProtectionPlugin,
    description: 'Tokenizes PII before sending to AI, restores in responses',
  },
  {
    ...userQuestionPlugin,
    description: 'Allows AI to ask users multiple choice questions via modal',
  },
];

/**
 * Get an available plugin by name
 */
export function getAvailablePlugin(name: string): AvailablePlugin | undefined {
  return availablePlugins.find(p => p.name === name);
}

// Re-export individual plugins
export { predictionMarketPlugin };
export { migrateFunPlugin };
export { piiProtectionPlugin };
export { userQuestionPlugin };
