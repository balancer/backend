/**
 * @type {import('stellate').Config}
 */
const config = {
    config: {
        schema: 'https://backend-v3.beets-ftm-node.com/graphql',
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
        name: 'backend-v3',
        originUrl: 'https://backend-v3-origin.beets-ftm-node.com/graphql',
        getConsumerIdentifiers:
            "(() => {\n  function getIp(req) {\n    const { ip } = req;\n    // const allowedIps = []\n    // if (allowedIps.includes(ip)) {\n    //   return null\n    // }\n    if (req.headers['X-Forwarded-For']) {\n        return req.headers['X-Forwarded-For'].split(',')[0];\n    }\n    return ip;\n}\n  return (req) => ({\n    ip: getIp(req),\n})\n})()",
        rateLimit: {
            name: 'IP Limit',
            consumerIdentifier: 'ip',
            allowList: [],
            limit: {
                type: 'QueryComplexity',
                budget: 5000,
                window: '5m',
            },
        },
    },
};

export default config;
