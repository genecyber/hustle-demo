/**
* Prediction Market Alpha Plugin
*
* Provides AI tools for searching and analyzing prediction markets
* using the Dome API (https://api.domeapi.io)
*
* Supported platforms: Polymarket, Kalshi
* 
*  Get specific market details:
*   - "Get details on the [market-slug] market"
*   - "Tell me more about that Bitcoin prediction market"
*
* Get prices/odds:
*   - "What are the current odds on [market]?"
*   - "What's the probability showing for [market]?"
*
* Get trading activity:
*   - "Show me recent trades on that market"
*   - "What's the trading activity like?"
*   - "What prediction market platforms are supported?"
* - "Search Kalshi for markets about crypto"
* - "Show me prediction markets on Polymarket about politics"
* - "Get details on [ticker] from Kalshi" 
 */

import type { HustlePlugin } from '../types';

const DOME_API_BASE = 'https://api.domeapi.io/v1';

/**
 * Supported prediction market platforms
 */
type Platform = 'polymarket' | 'kalshi';

/**
 * Prediction Market Alpha Plugin
 *
 * Tools:
 * - get_supported_platforms: List supported prediction market platforms
 * - search_prediction_markets: Search for markets on Polymarket or Kalshi
 * - get_market_details: Get detailed info about a specific market
 * - get_market_prices: Get current prices/odds for a market
 * - get_market_trades: Get recent trading activity
 */
export const predictionMarketPlugin: HustlePlugin = {
  name: 'prediction-market-alpha',
  version: '1.1.0',
  description: 'Search and analyze prediction markets on Polymarket and Kalshi',

  tools: [
    {
      name: 'get_supported_platforms',
      description:
        'Get a list of supported prediction market platforms. Call this first to know which platforms are available for querying.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'search_prediction_markets',
      description:
        'Search for prediction markets. Find markets about politics, crypto, sports, and more. Returns market titles, current odds, volume, and status. You MUST provide tags to filter results.',
      parameters: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['polymarket', 'kalshi'],
            description: 'The prediction market platform to search (default: polymarket)',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'REQUIRED: Single word categories or tags to identify a market segment (e.g., "politics", "crypto", "sports", "finance", "entertainment", "ai")',
          },
          status: {
            type: 'string',
            enum: ['open', 'closed'],
            description: 'Filter by market status',
          },
          limit: {
            type: 'number',
            description: 'Number of results (1-100)',
            default: 10,
          },
        },
        required: ['tags'],
      },
    },
    {
      name: 'get_market_details',
      description:
        'Get detailed information about a specific prediction market including current prices, trading history, and resolution source.',
      parameters: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['polymarket', 'kalshi'],
            description: 'The prediction market platform (default: polymarket)',
          },
          market_slug: {
            type: 'string',
            description: 'The market slug/identifier (ticker for Kalshi)',
          },
        },
        required: ['market_slug'],
      },
    },
    {
      name: 'get_market_prices',
      description:
        'Get current prices/odds for a prediction market. Shows probability for each outcome.',
      parameters: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['polymarket', 'kalshi'],
            description: 'The prediction market platform (default: polymarket)',
          },
          market_slug: {
            type: 'string',
            description: 'The market slug/identifier (ticker for Kalshi)',
          },
        },
        required: ['market_slug'],
      },
    },
    {
      name: 'get_market_trades',
      description: 'Get recent orders/trading activity for a prediction market.',
      parameters: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['polymarket', 'kalshi'],
            description: 'The prediction market platform (default: polymarket)',
          },
          market_slug: {
            type: 'string',
            description: 'The market slug/identifier (ticker for Kalshi)',
          },
          limit: {
            type: 'number',
            description: 'Number of orders to return (max 100)',
            default: 20,
          },
        },
        required: ['market_slug'],
      },
    },
  ],

  executors: {
    get_supported_platforms: async () => {
      return {
        platforms: [
          {
            id: 'polymarket',
            name: 'Polymarket',
            description: 'Decentralized prediction market on Polygon',
            features: ['tags', 'volume_filtering'],
          },
          {
            id: 'kalshi',
            name: 'Kalshi',
            description: 'CFTC-regulated prediction market exchange',
            features: ['regulated', 'event_based'],
          },
        ],
      };
    },

    search_prediction_markets: async (args) => {
      const platform = (args.platform as Platform) || 'polymarket';
      const params = new URLSearchParams();

      if (args.limit) params.append('limit', String(args.limit));

      if (platform === 'polymarket') {
        if (args.tags) params.append('tags', (args.tags as string[]).join(','));
        if (args.status) params.append('status', args.status as string);

        const response = await fetch(`${DOME_API_BASE}/polymarket/markets?${params}`);

        if (!response.ok) {
          throw new Error(`Dome API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
          platform: 'polymarket',
          markets: data.markets?.map((m: Record<string, unknown>) => ({
            slug: m.market_slug,
            title: m.title,
            status: m.status,
            volume: m.volume_total,
            tags: m.tags,
            outcomes: [
              { label: (m.side_a as Record<string, unknown>)?.label, id: (m.side_a as Record<string, unknown>)?.id },
              { label: (m.side_b as Record<string, unknown>)?.label, id: (m.side_b as Record<string, unknown>)?.id },
            ],
            winner: m.winning_side,
          })) || [],
          total: data.pagination?.total || 0,
          hasMore: data.pagination?.has_more || false,
        };
      } else if (platform === 'kalshi') {
        if (args.status) params.append('status', args.status as string);

        const response = await fetch(`${DOME_API_BASE}/kalshi/markets?${params}`);

        if (!response.ok) {
          throw new Error(`Dome API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
          platform: 'kalshi',
          markets: data.markets?.map((m: Record<string, unknown>) => ({
            ticker: m.ticker,
            title: m.title,
            status: m.status,
            category: m.category,
            subtitle: m.subtitle,
            yesAsk: m.yes_ask,
            yesBid: m.yes_bid,
            volume: m.volume,
          })) || [],
          total: data.pagination?.total || 0,
          hasMore: data.pagination?.has_more || false,
        };
      }

      throw new Error(`Unsupported platform: ${platform}`);
    },

    get_market_details: async (args) => {
      const platform = (args.platform as Platform) || 'polymarket';

      if (platform === 'polymarket') {
        const response = await fetch(
          `${DOME_API_BASE}/polymarket/markets?market_slug=${args.market_slug}`
        );

        if (!response.ok) {
          throw new Error(`Dome API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const market = data.markets?.[0];

        if (!market) {
          throw new Error(`Market not found: ${args.market_slug}`);
        }

        return {
          platform: 'polymarket',
          slug: market.market_slug,
          title: market.title,
          status: market.status,
          startTime: market.start_time
            ? new Date(market.start_time * 1000).toISOString()
            : null,
          endTime: market.end_time
            ? new Date(market.end_time * 1000).toISOString()
            : null,
          volume: {
            total: market.volume_total,
            week: market.volume_1_week,
            month: market.volume_1_month,
          },
          resolutionSource: market.resolution_source,
          outcomes: [
            { label: market.side_a?.label, id: market.side_a?.id },
            { label: market.side_b?.label, id: market.side_b?.id },
          ],
          winner: market.winning_side,
          tags: market.tags,
        };
      } else if (platform === 'kalshi') {
        const response = await fetch(
          `${DOME_API_BASE}/kalshi/markets?ticker=${args.market_slug}`
        );

        if (!response.ok) {
          throw new Error(`Dome API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const market = data.markets?.[0];

        if (!market) {
          throw new Error(`Market not found: ${args.market_slug}`);
        }

        return {
          platform: 'kalshi',
          ticker: market.ticker,
          title: market.title,
          subtitle: market.subtitle,
          status: market.status,
          category: market.category,
          yesAsk: market.yes_ask,
          yesBid: market.yes_bid,
          volume: market.volume,
          openInterest: market.open_interest,
        };
      }

      throw new Error(`Unsupported platform: ${platform}`);
    },

    get_market_prices: async (args) => {
      const platform = (args.platform as Platform) || 'polymarket';

      if (platform === 'polymarket') {
        const response = await fetch(
          `${DOME_API_BASE}/polymarket/market-price?market_slug=${args.market_slug}`
        );

        if (!response.ok) {
          throw new Error(`Dome API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return { platform: 'polymarket', ...data };
      } else if (platform === 'kalshi') {
        // Kalshi prices are included in the market details
        const response = await fetch(
          `${DOME_API_BASE}/kalshi/markets?ticker=${args.market_slug}`
        );

        if (!response.ok) {
          throw new Error(`Dome API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const market = data.markets?.[0];

        if (!market) {
          throw new Error(`Market not found: ${args.market_slug}`);
        }

        return {
          platform: 'kalshi',
          ticker: market.ticker,
          yesAsk: market.yes_ask,
          yesBid: market.yes_bid,
          lastPrice: market.last_price,
        };
      }

      throw new Error(`Unsupported platform: ${platform}`);
    },

    get_market_trades: async (args) => {
      const platform = (args.platform as Platform) || 'polymarket';
      const limit = String(args.limit || 20);

      if (platform === 'polymarket') {
        const params = new URLSearchParams({
          market_slug: args.market_slug as string,
          limit,
        });

        const response = await fetch(
          `${DOME_API_BASE}/polymarket/orders?${params}`
        );

        if (!response.ok) {
          throw new Error(`Dome API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return { platform: 'polymarket', ...data };
      } else if (platform === 'kalshi') {
        const params = new URLSearchParams({
          ticker: args.market_slug as string,
          limit,
        });

        const response = await fetch(
          `${DOME_API_BASE}/kalshi/trades?${params}`
        );

        if (!response.ok) {
          throw new Error(`Dome API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return { platform: 'kalshi', ...data };
      }

      throw new Error(`Unsupported platform: ${platform}`);
    },
  },

  hooks: {
    onRegister: () => {
      console.log('[Plugin] Prediction Market Alpha v1.1.0 registered (Polymarket + Kalshi)');
    },
  },
};

export default predictionMarketPlugin;
