import { every } from './intervals';

export const optimismJobs = [
    {
        name: 'load-token-prices',
        interval: every(1, 'minutes'),
    },
    {
        name: 'update-liquidity-for-inactive-pools',
        interval: every(1, 'days'),
    },
    {
        name: 'update-liquidity-for-active-pools',
        interval: every(1, 'minutes'),
    },
    {
        name: 'update-pool-apr',
        interval: every(1, 'minutes'),
    },
    {
        name: 'load-on-chain-data-for-pools-with-active-updates',
        interval: every(1, 'minutes'),
    },
    {
        name: 'sync-new-pools-from-subgraph',
        interval: every(1, 'minutes'),
    },
    {
        name: 'sync-sanity-pool-data',
        interval: every(3, 'minutes'),
    },
    {
        name: 'sync-tokens-from-pool-tokens',
        interval: every(5, 'minutes'),
    },
    {
        name: 'update-liquidity-24h-ago-for-all-pools',
        interval: every(5, 'minutes'),
    },
    {
        name: 'cache-average-block-time',
        interval: every(30, 'minutes'),
    },
    {
        name: 'sync-token-dynamic-data',
        interval: every(1, 'minutes'),
    },
    {
        name: 'sync-staking-for-pools',
        interval: every(5, 'minutes'),
    },
    {
        name: 'sync-latest-snapshots-for-all-pools',
        interval: every(1, 'hours'),
    },
    {
        name: 'update-lifetime-values-for-all-pools',
        interval: every(20, 'minutes'),
    },
    {
        name: 'sync-changed-pools',
        interval: every(15, 'seconds'),
    },
    {
        name: 'user-sync-wallet-balances-for-all-pools',
        interval: every(10, 'seconds'),
    },
    {
        name: 'user-sync-staked-balances',
        interval: every(10, 'seconds'),
    },
];
