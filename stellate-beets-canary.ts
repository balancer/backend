// import { Config } from 'stellate';

// const config: Config = {
//     config: {
//         originUrl: 'https://backend-v3-canary-origin.beets-ftm-node.com/graphql',
//         schema: 'https://backend-v3-canary.beets-ftm-node.com/graphql',
//         name: 'backend-v3-canary',
//         devPortal: {
//             enabled: true,
//             auth: false,
//             description: 'IMPORTANT: To stay up to date with changes of our API, please join https://t.me/beetsapi',
//             readme: 'Learn how to use the API ### Query pools for a certain or multiple chains and apply sorting ```graphiql { poolGetPools(where: {chainIn: [FANTOM, OPTIMISM]}, orderBy: totalLiquidity, orderDirection: desc) { id name } } ``` ### Query user balances for one or more chains ```graphiql { userGetPoolBalances( address: "0x4fbe899d37fb7514adf2f41b0630e018ec275a0c" chains: [FANTOM] ) { poolId stakedBalance walletBalance } } ``` Check out the Graphql Schema for endless possibilities.',
//             urls: {
//                 logo: 'https://beethoven-assets.s3.eu-central-1.amazonaws.com/logo-full%402x.png',
//                 favicon: 'https://assets.coingecko.com/coins/images/19158/large/beets-icon-large.png?1634545465',
//                 support: 'https://discord.gg/kbPnYJjvwZ',
//                 website: 'https://beets.fi',
//             },
//         },
//         queryDepthLimit: 10,
//         scopes: {
//             AUTHENTICATED: 'header:accountaddress',
//             CHAIN: 'header:chainid',
//             AUTHENTICATED_CHAIN: 'header:accountaddress|header:chainid',
//         },
//         rootTypeNames: {
//             query: 'Query',
//             mutation: 'Mutation',
//         },
//         rules: [
//             {
//                 types: ['Query'],
//                 maxAge: 15,
//                 swr: 30,
//                 description: 'Cache everything (default)',
//                 scope: 'CHAIN',
//             },
//             {
//                 types: {
//                     Query: [
//                         'userGetSwaps',
//                         'userGetStaking',
//                         'userGetPoolBalances',
//                         'userGetFbeetsBalance',
//                         'userGetPoolJoinExits',
//                     ],
//                 },
//                 maxAge: 10,
//                 swr: 15,
//                 scope: 'AUTHENTICATED_CHAIN',
//                 description: 'Time critical user queries',
//             },
//             {
//                 types: {
//                     Query: ['latestSyncedBlocks'],
//                 },
//                 maxAge: 2,
//                 swr: 10,
//                 description: 'Time critical block data',
//                 scope: 'CHAIN',
//             },
//             {
//                 types: {
//                     Query: [
//                         'protocolMetricsChain',
//                         'protocolMetricsAggregated',
//                         'tokenGetProtocolTokenPrice',
//                         'beetsGetFbeetsRatio',
//                         'blocksGetBlocksPerSecond',
//                         'blocksGetBlocksPerDay',
//                         'blocksGetAverageBlockTime',
//                         'tokenGetTokens',
//                         'poolGetFeaturedPoolGroups',
//                         'contentGetNewsItems',
//                     ],
//                 },
//                 maxAge: 60,
//                 swr: 120,
//                 description: 'Mostly static, cache for a long time',
//                 scope: 'CHAIN',
//             },
//         ],
//         rateLimits: (req) => {
//             if (
//                 req.headers['stellate-api-token'] &&
//                 req.headers['stellate-api-token'] ===
//                     'stl8_bcebb2b60910a55e58a82c8e83825034dc763e294582447118fab0a6a1225ebb'
//             ) {
//                 return [
//                     {
//                         name: 'Specific API Token based limits',
//                         state: 'dryRun',
//                         group: req.headers['stellate-api-token'],
//                         limit: {
//                             type: 'RequestCount',
//                             budget: 20,
//                             window: '1m',
//                         },
//                     },
//                 ];
//             }

//             if (req.headers['stellate-api-token']) {
//                 return [
//                     {
//                         name: 'General API Token based limits',
//                         state: 'dryRun',
//                         group: req.headers['stellate-api-token'],
//                         limit: {
//                             type: 'RequestCount',
//                             budget: 10,
//                             window: '1m',
//                         },
//                     },
//                 ];
//             }

//             const xForwardedFor = Array.isArray(req.headers['x-forwarded-for'])
//                 ? req.headers['x-forwarded-for'][0]
//                 : req.headers['x-forwarded-for'];
//             return [
//                 {
//                     name: 'IP based limits',
//                     state: 'dryRun',
//                     group: xForwardedFor ? xForwardedFor.split(',')[0] : req.ip,
//                     limit: {
//                         type: 'RequestCount',
//                         budget: 5,
//                         window: '1m',
//                     },
//                 },
//             ];
//         },
//     },
// };

// export default config;
