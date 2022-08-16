import { Config } from 'stellate';

const config: Config = {
    config: {
        schema: 'https://backend-v2.beets-ftm-node.com',
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
        ],
        name: 'beetx-backend-v2',
        originUrl: 'https://backend-v2-cdn.beets-ftm-node.com/graphql',
    },
};

export default config;
