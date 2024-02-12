/**
 * @type {import('stellate').Config}
 */
const config = {
    config: {
        schema: 'https://backend-v3-canary-origin.beets-ftm-node.com/graphql',
        queryDepthLimit: 10,
        scopes: {
            CHAIN: 'header:chainid',
            AUTHENTICATED: 'header:accountaddress',
            AUTHENTICATED_CHAIN: 'header:accountaddress|header:chainid',
        },
        rootTypeNames: {
            query: 'Query',
            mutation: 'Mutation',
        },
        rules: [
            {
                types: ['Query'],
                maxAge: 15,
                swr: 30,
                scope: 'CHAIN',
                description: 'Cache everything (default)',
            },
            {
                types: {
                    Query: [
                        'userGetSwaps',
                        'userGetStaking',
                        'userGetPoolBalances',
                        'userGetFbeetsBalance',
                        'userGetPoolJoinExits',
                    ],
                },
                maxAge: 10,
                swr: 15,
                scope: 'AUTHENTICATED_CHAIN',
                description: 'Time critical user queries',
            },
            {
                types: {
                    Query: ['latestSyncedBlocks'],
                },
                maxAge: 2,
                swr: 10,
                scope: 'CHAIN',
                description: 'Time critical block data',
            },
            {
                types: {
                    Query: [
                        'tokenGetTokens',
                        'beetsGetFbeetsRatio',
                        'contentGetNewsItems',
                        'protocolMetricsChain',
                        'blocksGetBlocksPerDay',
                        'blocksGetBlocksPerSecond',
                        'blocksGetAverageBlockTime',
                        'poolGetFeaturedPoolGroups',
                        'protocolMetricsAggregated',
                        'tokenGetProtocolTokenPrice',
                    ],
                },
                maxAge: 60,
                swr: 120,
                scope: 'CHAIN',
                description: 'Mostly static, cache for a long time',
            },
        ],
        name: 'backend-v3-canary',
        originUrl: 'https://backend-v3-canary-origin.beets-ftm-node.com/graphql',
        devPortal: {
            enabled: false,
            auth: false,
        },
        rateLimits:
            "(req) => {\n    if (req.headers['stellate-api-token'] &&\n        req.headers['stellate-api-token'] ===\n            'stl8_bcebb2b60910a55e58a82c8e83825034dc763e294582447118fab0a6a1225ebb') {\n        return [\n            {\n                name: 'Specific API Token based limits',\n                state: 'dryRun',\n                group: req.headers['stellate-api-token'],\n                limit: {\n                    type: 'RequestCount',\n                    budget: 20,\n                    window: '1m',\n                },\n            },\n        ];\n    }\n    if (req.headers['stellate-api-token']) {\n        return [\n            {\n                name: 'General API Token based limits',\n                state: 'dryRun',\n                group: req.headers['stellate-api-token'],\n                limit: {\n                    type: 'RequestCount',\n                    budget: 10,\n                    window: '1m',\n                },\n            },\n        ];\n    }\n    const xForwardedFor = Array.isArray(req.headers['x-forwarded-for'])\n        ? req.headers['x-forwarded-for'][0]\n        : req.headers['x-forwarded-for'];\n    return [\n        {\n            name: 'IP based limits',\n            state: 'dryRun',\n            group: xForwardedFor ? xForwardedFor.split(',')[0] : req.ip,\n            limit: {\n                type: 'RequestCount',\n                budget: 5,\n                window: '1m',\n            },\n        },\n    ];\n}",
    },
};

export default config;
