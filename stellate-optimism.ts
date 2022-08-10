import { Config } from 'stellate';

const config: Config = {
    config: {
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
        name: 'beetx-backend-v2-optimism',
        originUrl: 'http://backend-optimism-v2.eba-xekys3bm.eu-central-1.elasticbeanstalk.com/graphql',
    },
};

export default config;
