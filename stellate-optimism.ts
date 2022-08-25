import { Config } from 'stellate';

const config: Config = {
    config: {
        schema: 'https://backend-optimism-v2.beets-ftm-node.com/graphql',
        queryDepthLimit: 10,
        scopes: {
            AUTHENTICATED: 'header:accountaddress',
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
                        'poolGetUserSwapVolume',
                    ],
                },
                maxAge: 10,
                swr: 15,
                scope: 'AUTHENTICATED',
                description: 'Time critical user queries',
            },
            {
                types: {
                    Query: ['latestSyncedBlocks', 'blocksGetAverageBlockTime'],
                },
                maxAge: 2,
                swr: 5,
                description: 'Time critical block data',
            },
        ],
        name: 'beetx-backend-v2-optimism',
        originUrl: 'https://backend-optimism-v2-cdn.beets-ftm-node.com/graphql',
    },
};

export default config;
