/**
 * Migrate.fun Knowledge Base Plugin
 *
 * Provides AI tools for answering questions about token migrations
 * using an embedded knowledge base from real support conversations.
 *
 * Supported topics: Bonk Fun, Pump Fun, Raydium migrations,
 * costs/fees, timelines, post-migration steps, technical details.
 *
 * Example prompts:
 *   - "How does a migration to Pump Fun work?"
 *   - "What does Migrate Fun cost?"
 *   - "What steps do I need to do after the migration?"
 *   - "How long is the migration period?"
 *   - "What is the claim period for migrations?"
 *   - "Has Migrate Fun been audited?"
 *   - "What happens to tokens on exchanges during migration?"
 *   - "Can I change the total supply when migrating?"
 *
 * System prompt suggestion (for optimal results):
 *   You are a support agent for Migrate.fun, the token migration platform on Solana.
 *   You have the `search_migrate_fun_docs` tool - ALWAYS use it when users ask about migrations.
 *   Key facts: 3.75% fee, 90-day claim period, supports Bonk Fun/Pump Fun/Raydium, audited by Halborn.
 *   For complex questions: direct to https://x.com/MigrateFun
 */

import type { HustlePlugin } from '../types';

/**
 * Q&A entry structure
 */
interface QAEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
}

/**
 * Embedded knowledge base from real support conversations
 */
const QA: QAEntry[] = [
  { id: 'migration-steps-bonk', question: 'What are all the steps for migrations to Bonk?', answer: `Here's how MigrateFun migrates your token to BonkFun:\n1) The creator/team sets up a migration portal through migratefun - Create new CA for BonkFun (Ticker, name, image, supply) and set timeline period (1-30 days, 14 days average)\n2) After portal setup, holders commit their tokens to migration - tokens are locked in migration vault until time period ends\n3) Once migration ends, ALL tokens are market sold in a single candle to retrieve as much SOL as possible from the locked liquidity pool\n4) The recovered SOL seeds the new LP paired with appropriate amount of tokens. Set market cap at or slightly below current market cap\n5) Claims open for 90 days - users burn MFTs and receive new tokens`, keywords: ['bonk', 'bonkfun', 'steps', 'process', 'how'], category: 'process' },
  { id: 'migration-steps-pumpfun', question: 'How does a migration work to Pump Fun?', answer: `Here's how the migration to Pump Fun works:\n1) Set up a new CA for pumpfun using MigrateFun creator dashboard (Ticker, CA, image)\n2) Users migrate their tokens in the migration portal for a specific time period\n3) Once migration ends, MigrateFun sells all migrated tokens\n4) MigrateFun takes all recovered SOL and buys out new token's bonding curve + purchases until it reaches old market cap levels\n5) Users return to migratefun and claim their new tokens\n6) 90-day claim period for all users, regardless if they migrated on time or late\n7) The claim period can also be used to swap tokens with centralized exchanges\n8) After 90 days, all unclaimed tokens and remaining SOL are returned to the team`, keywords: ['pump', 'pumpfun', 'steps', 'process', 'how'], category: 'process' },
  { id: 'migration-steps-raydium', question: 'How does Migrate Fun migrate tokens to Raydium?', answer: `1) The creator/team sets up a migration portal through migratefun.com - Create new CA (Ticker, name, image, supply) and set timeline period (1-30 days, 14 days average)\n2) After portal setup, holders commit their tokens to migration and get MFTs in exchange - tokens are locked in migration vault until time period ends\n3) Once migration ends, ALL old tokens are market sold in a single candle to retrieve as much SOL as possible\n4) The recovered SOL seeds the new LP paired with appropriate amount of new tokens. Market Cap is set by the user\n5) Claims open for 90 days - users burn MFTs and receive new tokens. Late migrators can swap at discounted rate\n6) At the end of the 90 day claim window all remaining tokens can be claimed by the team`, keywords: ['raydium', 'steps', 'process', 'how'], category: 'process' },
  { id: 'post-migration-checklist', question: 'What are the steps I need to do after the migration?', answer: `Admin Checklist - places to register your new CA:\n\nPRIMARY:\n- Coingecko (Free + migration application process)\n- Dexscreener ($300)\n- GeckoTerminal (free for 5 days wait)\n- Holderscan (Listing free, Verify $125)\n\nSECONDARY:\n- Solscan (if metadata updates needed)\n- CoinMarketCap ($5000 for immediate listing)\n- Dextools ($300 for verification)\n- Photon (2 SOL)\n- Cookie.fun (Free, DM needed) [For AI accounts]\n- Kaito (DM needed) [For AI accounts]\n\nNote: Coingecko and CoinMarketCap will ask for a post from official twitter with migration details and new CA.`, keywords: ['after', 'post', 'checklist', 'listing', 'dexscreener', 'coingecko'], category: 'post-migration' },
  { id: 'post-migration-approval', question: 'Do we need to do anything after the migration ends?', answer: `Yes, the team needs to approve several steps in the migration portal including:\n1) Selling the migrated tokens into the old LP\n2) Setting the new market cap\n3) Opening the claim portal\n\nVideo tutorial: https://www.youtube.com/watch?v=SjPN-1DnXtM`, keywords: ['after', 'ends', 'approve', 'portal'], category: 'post-migration' },
  { id: 'market-cap-setting', question: 'What market cap should we set?', answer: `Set at or slightly below the ending market cap at migration. For example, if your ending market cap is $1 million, set it to around $950,000. This accounts for the fact you won't receive 1:1 liquidity from the old pool compared to the new pool, which is determined by migration participation.`, keywords: ['market cap', 'marketcap', 'set', 'recommend'], category: 'settings' },
  { id: 'migrate-fun-cost', question: 'What does Migrate Fun cost?', answer: `Migrate Fun charges a flat 3.75% fee on the total SOL unlocked from the old Liquidity Pool. This fee is taken automatically during the migration process.`, keywords: ['cost', 'fee', 'price', 'charge', '3.75', 'percent'], category: 'fees' },
  { id: 'claim-fees-bonk', question: 'How does the team claim their fees on Bonk Fun?', answer: `Go to https://bonk.fun/creator-rewards to claim your creator fees.`, keywords: ['claim', 'fees', 'bonk', 'creator', 'rewards'], category: 'fees' },
  { id: 'claim-fees-raydium', question: 'How do I claim fees on Raydium?', answer: `You can claim fees from https://raydium.io/portfolio/ with the same wallet that set up the migration.`, keywords: ['claim', 'fees', 'raydium', 'portfolio'], category: 'fees' },
  { id: 'claim-fees-pumpfun', question: 'How do I claim fees on Pump Fun?', answer: `Fees are paid automatically to the wallet used to set up the migration. Once migrated to PumpSwap you will receive creator rewards based on their Ascend Program. Details: https://pump.fun/docs/fees`, keywords: ['claim', 'fees', 'pump', 'pumpfun', 'automatic'], category: 'fees' },
  { id: 'audit-info', question: 'Has Migrate Fun been audited?', answer: `Yes. Migrate Fun was audited by Halborn, the same auditing firm used by the Solana Foundation.\nAudit: https://www.halborn.com/audits/emblem-vault/migratefun-8ad34b\nAnnouncement: https://x.com/HalbornSecurity/status/1978869642744811933`, keywords: ['audit', 'audited', 'security', 'halborn', 'safe'], category: 'security' },
  { id: 'user-experience', question: 'What is the process like for the user?', answer: `Super easy - takes less than 20 seconds.\n1) During migration: users swap old tokens for Migrate Fun Tokens (MFTs)\n2) Once migration ends: claim period opens for 90 days, users burn MFTs to claim new tokens\n3) Late migrators: can swap old tokens for new at a discounted rate set by the team\n\nVideo guides:\n- Migration: https://x.com/MigrateFun/status/1971259552856408433\n- Claims: https://x.com/MigrateFun/status/1976376597906325767`, keywords: ['user', 'experience', 'process', 'simple', 'easy'], category: 'user-experience' },
  { id: 'what-is-migrate-fun', question: 'What is Migrate Fun?', answer: `Migrate Fun is the category-defining platform that created the migration meta. It allows users to migrate locked liquidity from one launchpad to another.\n\nAs of October 2025: 15 migrations completed, $5+ million in liquidity moved, largest migration was $35M market cap project. Supports migrations to Bonk Fun, Raydium, and Pump Fun.\n\nLinks:\n- Website: https://migrate.fun/\n- X: https://x.com/MigrateFun\n- Docs: https://github.com/EmblemCompany/Migrate-fun-docs/\n- Audit: https://www.halborn.com/audits/emblem-vault/migratefun-8ad34b\n- Calculator: https://migrate.fun/migration-calculator`, keywords: ['what', 'migrate fun', 'about', 'general', 'overview'], category: 'general' },
  { id: 'sol-recovery-estimate', question: 'How can I see how much SOL we can get from the old LP?', answer: `Use the migration calculator to estimate SOL recovery based on participation percentages: https://migrate.fun/migration-calculator`, keywords: ['sol', 'recovery', 'estimate', 'calculator', 'liquidity', 'how much'], category: 'tools' },
  { id: 'documentation', question: 'Do you have documentation?', answer: `Yes, documentation is available at: https://github.com/EmblemCompany/Migrate-fun-docs/`, keywords: ['documentation', 'docs', 'guide', 'help'], category: 'general' },
  { id: 'rebrand', question: 'What if I want to rebrand?', answer: `The migration enables a full rebrand - reset metadata, image, logo, name, everything. Or keep it all the same if you prefer.`, keywords: ['rebrand', 'change', 'name', 'logo', 'image', 'metadata'], category: 'features' },
  { id: 'sniper-protection', question: 'How do you prevent snipers when migrating to Pump Fun?', answer: `On Solana you can stack transactions. When deploying the bonding curve, you are first to purchase so you can buyout the bonding curve and more in the first transaction, preventing snipers.`, keywords: ['sniper', 'snipers', 'protection', 'front-run', 'mev'], category: 'security' },
  { id: 'claim-period-flexibility', question: 'Is there flexibility on the 90 day claim period?', answer: `The 90-day claim period is mandatory. Reasons:\n- All users need time to claim tokens after migration\n- Those who missed migration need a window\n- Users don't get tokens until after migration completes\n- Allowing team to withdraw during claims would be risky (potential rug)`, keywords: ['90 day', 'claim', 'period', 'flexibility', 'change'], category: 'settings' },
  { id: 'migration-duration', question: 'How long is the migration?', answer: `You can set the migration window for as long as you'd like. Average is 14 days. Some teams choose 7 days (works great), some go up to 30 days.\n\nNote: Majority of participation happens in the first and last 24 hours. Example: 76% participation with 50%+ migrating in first 24 hours and additional 10% on the last day.`, keywords: ['how long', 'duration', 'time', 'days', 'period', 'window'], category: 'settings' },
  { id: 'migration-performance', question: 'Can you give examples of token performance after migration?', answer: `Migration squeeze: When large percentage of old tokens migrate, sell pressure reduces, often causing market cap spike near migration end.\n\nExample charts:\n- ZERA Old: https://dexscreener.com/solana/95at5r4i85gfqeew2yr6byfg8rlry1d9ztps7qrskdvc\n  New: https://dexscreener.com/solana/nn9vmhjtqgg9l9f8sp3geufwc5zvuhradcwehh7n7di\n- HUSTLE Old: https://dexscreener.com/solana/gjckb2eesjk65nuvpaw4tn2rabnr8wmfcwcwpagk5dzs\n  New: https://dexscreener.com/solana/hxo1wrcrdewek8l2j6rxswnolumej2mweh38gajxtw7y\n\nThread: https://x.com/jakegallen_/status/1973051293213028468`, keywords: ['performance', 'charts', 'example', 'before', 'after', 'squeeze'], category: 'examples' },
  { id: 'why-migrate', question: 'Why would teams want to migrate?', answer: `Top reasons:\n- Access to creator rewards\n- Rebrand opportunity\n- Fresh chart\n- Reclaim part of the token supply\n- Reinvigorated community on the other side`, keywords: ['why', 'reasons', 'benefits', 'advantages', 'should'], category: 'general' },
  { id: 'migration-recommendation-steps', question: 'What steps do you recommend when considering a migration?', answer: `1) Discuss with Migrate Fun team: process details, where to move LP (Raydium, Bonk Fun, or Pump Fun)\n2) Discuss benefits with your community, especially whale holders - get buy-in\n3) Announce on all social channels - maximize awareness for maximum participation`, keywords: ['recommend', 'steps', 'considering', 'planning', 'prepare'], category: 'process' },
  { id: 'multiple-wallets', question: 'Do holders with multiple wallets need to consolidate?', answer: `No. Migration is linear - users can migrate all tokens together or separately. Makes no difference.`, keywords: ['multiple', 'wallets', 'consolidate', 'separate'], category: 'user-experience' },
  { id: 'mft-value', question: 'Do MFTs show value in wallets?', answer: `MFTs (Migrate Fun Tokens) are just placeholder tokens for the migration. They are valueless.`, keywords: ['mft', 'migrate fun tokens', 'value', 'placeholder'], category: 'user-experience' },
  { id: 'announcement-examples', question: 'Can you give me sample migration announcements?', answer: `Here are announcements made by teams:\n- https://x.com/radrdotfun/status/1952127168101949620\n- https://x.com/project_89/status/1951345024656089368\n- https://x.com/HKittyOnSol/status/1948925330032349210\n- https://x.com/ModernStoicAI/status/1948129627362218483\n- https://x.com/pokithehamster/status/1950238636928327927\n- https://x.com/IQ6900_/status/1953002036599173499\n- https://x.com/TheBongoCat/status/1965538945132843333`, keywords: ['announcement', 'sample', 'example', 'post', 'twitter'], category: 'examples' },
  { id: 'graphics', question: 'Does Migrate Fun provide graphics for announcements?', answer: `No. For your own migration announcement you create the graphic. Migrate Fun's designer creates group migration announcements only.`, keywords: ['graphics', 'images', 'design', 'announcement'], category: 'general' },
  { id: 'developer-required', question: 'Do I need to be a developer to migrate?', answer: `No development required. The entire process is a few clicks for both pre-migration and post-migration.`, keywords: ['developer', 'technical', 'coding', 'code'], category: 'general' },
  { id: 'exchange-tokens', question: 'What happens to tokens on exchanges or locked in Streamflow?', answer: `They will miss the migration as those tokens are considered circulating supply onchain. Options:\n1) Join as late migrator during 90-day claim window\n2) After 90-day period, team takes possession of unclaimed tokens and can reimburse directly`, keywords: ['exchange', 'streamflow', 'locked', 'vested', 'cex'], category: 'edge-cases' },
  { id: 'unclaimed-tokens', question: 'Can we get unclaimed tokens?', answer: `After the 90-day claim period ends, all unclaimed tokens are returned to whichever wallet set up the migration (the team).`, keywords: ['unclaimed', 'supply', 'remaining', 'tokens', 'team'], category: 'post-migration' },
  { id: 'participation-rate', question: 'What is typical participation percentage?', answer: `Nearly all projects have had over 50% migration participation. View all stats at https://migrate.fun/projects`, keywords: ['participation', 'percentage', 'rate', 'typical', 'average'], category: 'statistics' },
  { id: 'late-penalty', question: 'What penalty can teams set for late migrators?', answer: `Teams can set 0-100% penalty for late migrators who swap during the 90-day claim window. 25% seems to be a good balance - encourages participation without being overly punishing.`, keywords: ['penalty', 'late', 'discount', 'punish', 'percent'], category: 'settings' },
  { id: 'new-ca', question: 'Will we get a new CA or just change the pair?', answer: `A new CA. If migrating to Bonk Fun your CA will end with "bonk". If migrating to Pump Fun it will end with "pump".`, keywords: ['ca', 'contract', 'address', 'new', 'pair'], category: 'process' },
  { id: 'vanity-ca', question: 'Can we create a vanity CA?', answer: `Yes, but if migrating to Bonk Fun it needs to end with "bonk", or for Pump Fun it needs to end with "pump".`, keywords: ['vanity', 'ca', 'custom', 'address', 'contract'], category: 'features' },
  { id: 'vested-tokens', question: 'What about team tokens locked with Streamflow?', answer: `Those tokens can't be migrated. They won't be lost - you'll recapture that supply post-migration. Any unmigrated tokens return to team at full or discounted rate depending on your late migrator penalty setting.`, keywords: ['vested', 'streamflow', 'locked', 'team'], category: 'edge-cases' },
  { id: 'wallet-tracking', question: 'Can I track wallet addresses post-migration?', answer: `At the end of migration, there's a snapshot tool that lets you download a CSV of all wallets holding the old token.`, keywords: ['wallet', 'track', 'snapshot', 'csv', 'addresses'], category: 'tools' },
  { id: 'old-listings', question: 'What happens to old token listings?', answer: `You will need to apply to new directories. Migrate Fun provides a list once you begin the migration process.`, keywords: ['listings', 'directories', 'old', 'new', 'update'], category: 'post-migration' },
  { id: 'lp-locking', question: 'Does the new LP get locked?', answer: `If migrating to Bonk Fun or Pump Fun: LP is locked (their rules). If migrating to Raydium: LP is unlocked and you control it.`, keywords: ['lp', 'locked', 'liquidity', 'pool', 'control'], category: 'process' },
  { id: 'sol-pairs', question: 'Are Bonk migrations confined to SOL pairs?', answer: `As of October 2025, they are SOL migrations. Check with the team to see if USD1 pairs are possible.`, keywords: ['sol', 'pair', 'usd1', 'usdc', 'bonk'], category: 'settings' },
  { id: 'change-penalty', question: 'Can I change the penalty after setup?', answer: `No. The penalty must be set during migration creation and cannot be changed after.`, keywords: ['change', 'penalty', 'modify', 'update', 'after'], category: 'settings' },
  { id: 'unhappy-holders', question: 'What if someone is unhappy about the migration?', answer: `They can sell their tokens and not participate. Migrations are a fresh start - holders who migrate are voting with their tokens that they support the team and believe in the project's future.`, keywords: ['unhappy', 'disagree', 'against', 'sell'], category: 'user-experience' },
  { id: 'sample-announcement', question: 'What is a good announcement template?', answer: `Sample for Bonk Fun migration:\n\n"We're excited to announce that we're migrating with @MigrateFun and officially joining the @bonk_inu ecosystem next month!\n\nWith our 1-year anniversary less than a month away, this migration to @bonk_fun marks the beginning of our next chapter.\n\nWhy Bonk Fun?\n🧰 Purpose-built tools for community projects\n💸 Transaction fee rev share\n🔁 Seamless LP migration\n🤝 Strategic alignment with top meme coin teams\n\nOur migration timeline + holder instructions drop soon."`, keywords: ['announcement', 'template', 'sample', 'post'], category: 'examples' },
  { id: 'share-link', question: 'Do you have a link to share explaining Migrate Fun?', answer: `Overview thread: https://x.com/migratefun/status/1957492884355314035\nDeep dive docs: https://github.com/EmblemCompany/Migrate-fun-docs/`, keywords: ['link', 'share', 'explain', 'overview'], category: 'general' },
  { id: 'exchange-rate', question: 'Is the exchange rate always 1:1?', answer: `Yes, 1 old token = 1 new token for users who participate in migration. Users who miss can swap during the 90-day claim window at a discounted rate set by the team.`, keywords: ['exchange', 'rate', '1:1', 'ratio', 'same'], category: 'process' },
  { id: 'change-supply', question: 'Can I change the total supply?', answer: `Generally yes, with some constraints depending on destination platform. Reach out to Migrate Fun team to discuss specifics.`, keywords: ['supply', 'change', 'total', 'amount'], category: 'features' },
  { id: 'contact', question: 'How can I get in touch with the Migrate Fun team?', answer: `Send a direct message to the Migrate Fun X account: https://x.com/MigrateFun`, keywords: ['contact', 'reach', 'touch', 'dm', 'message', 'talk'], category: 'general' },
  { id: 'ready-to-migrate', question: 'I am ready to migrate, what is next?', answer: `Send a direct message to the Migrate Fun X account: https://x.com/MigrateFun`, keywords: ['ready', 'start', 'begin', 'next'], category: 'general' },
  { id: 'risks', question: 'What are the risks of migrating?', answer: `Main risk: Failed migration where not enough tokens migrate to fund the new LP. In that case, migrated tokens are sold into the old LP and SOL is returned to community members who participated.`, keywords: ['risk', 'danger', 'fail', 'problem', 'issue'], category: 'security' },
  { id: 'how-detect-non-migrators', question: 'How does Migrate Fun know who did not migrate?', answer: `Migrate Fun has a snapshot and claim tool that puts onchain all wallets holding old tokens at migration end. This enables late migrators to swap old tokens for new during the 90-day claim window at the team-set discount.`, keywords: ['snapshot', 'detect', 'know', 'non-migrators'], category: 'tools' },
  { id: 'no-penalty', question: 'What if I do not want to penalize non-migrators?', answer: `Set the late claim penalty to zero. Holders who didn't migrate can then swap old tokens for new at a 1:1 rate during the 90-day claim window.`, keywords: ['no penalty', 'zero', 'fair'], category: 'settings' },
  { id: 'missed-claim-window', question: 'What happens if holders miss both migration and claim window?', answer: `They won't have access to new tokens through Migrate Fun platform. All remaining tokens go to the team after 90-day window closes. The team has a snapshot of all old token holders and can handle at their discretion.`, keywords: ['missed', 'both', 'claim', 'window', 'late'], category: 'edge-cases' },
  { id: 'exchange-options', question: 'What options do exchanges have to swap tokens?', answer: `Two options:\n\nOption 1: Participate onchain through the migration portal (same as retail). Load tokens into Phantom wallet, migrate, then claim. ~10 seconds each step.\n\nOption 2: Admin withdraw function during 90-day claim period. Migration admin can withdraw new tokens from claims vault and manually swap with exchange.\n- 90-day window for exchange procedures\n- Exchange can observe migration complete before acting\n- Can receive new tokens before sending old\n- Can pause trading during process`, keywords: ['exchange', 'cex', 'swap', 'options', 'centralized'], category: 'edge-cases' },
  { id: 'buy-prevent-dump', question: 'Can we buy supply before migration to prevent dumping?', answer: `I would recommend buying now. There is no arb opportunity as you set the market cap of the new token.\n\nTo regain control of non-migrated tokens, you can penalize non-migrators. Example: If 60% migrate, 40% didn't. With a 50% penalty on non-migrators, you'd recoup 20% of total supply if everyone claimed.`, keywords: ['buy', 'dump', 'supply', 'control', 'arb'], category: 'strategy' },
];

/**
 * Search result structure
 */
interface SearchResult {
  rank: number;
  relevance: number;
  question: string;
  answer: string;
  category: string;
}

/**
 * Migrate.fun Knowledge Base Plugin
 *
 * Tools:
 * - search_migrate_fun_docs: Search the knowledge base for migration Q&A
 */
export const migrateFunPlugin: HustlePlugin = {
  name: 'migrate-fun-knowledge',
  version: '1.0.0',
  description: 'Search Migrate.fun knowledge base for token migration answers',

  tools: [
    {
      name: 'search_migrate_fun_docs',
      description:
        'Search the Migrate.fun knowledge base for answers about token migrations. Use this tool when users ask about: how migrations work (Bonk Fun, Pump Fun, Raydium), costs/fees/timelines, post-migration steps, user experience, technical details (LP, CA, penalties), or examples. Returns ranked Q&A pairs from real support conversations.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query - user question or key terms about token migrations',
          },
          topK: {
            type: 'number',
            description: 'Number of results to return (default: 5, max: 10)',
          },
        },
        required: ['query'],
      },
    },
  ],

  executors: {
    search_migrate_fun_docs: async (args) => {
      const query = args.query as string;
      const topK = Math.min(Math.max(1, (args.topK as number) || 5), 10);

      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

      // Score each Q&A entry
      const scored = QA.map(qa => {
        let score = 0;
        const questionLower = qa.question.toLowerCase();
        const answerLower = qa.answer.toLowerCase();
        const keywordsStr = qa.keywords.join(' ').toLowerCase();
        const fullText = `${questionLower} ${answerLower} ${keywordsStr}`;

        // Exact phrase match in question (highest weight)
        if (questionLower.includes(queryLower)) score += 15;

        // Exact phrase match anywhere
        if (fullText.includes(queryLower)) score += 8;

        // Individual word matches
        for (const word of queryWords) {
          // Keyword match (high weight)
          if (qa.keywords.some(kw => kw.toLowerCase().includes(word) || word.includes(kw.toLowerCase()))) {
            score += 4;
          }
          // Question match (medium weight)
          if (questionLower.includes(word)) score += 3;
          // Answer match (low weight)
          if (answerLower.includes(word)) score += 1;
        }

        return { ...qa, score };
      });

      // Filter, sort, and format results
      const results: SearchResult[] = scored
        .filter(qa => qa.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map((qa, i) => ({
          rank: i + 1,
          relevance: Math.round((qa.score / 30) * 100) / 100,
          question: qa.question,
          answer: qa.answer,
          category: qa.category,
        }));

      return {
        success: true,
        query,
        resultCount: results.length,
        results,
        hint: results.length === 0
          ? 'No matches found. Suggest contacting @MigrateFun on X: https://x.com/MigrateFun'
          : 'Use these Q&A pairs to answer. Include relevant links from the answers.',
      };
    },
  },

  hooks: {
    onRegister: () => {
      console.log('[Plugin] Migrate.fun Knowledge Base v1.0.0 registered');
    },
  },
};

export default migrateFunPlugin;
