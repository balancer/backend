import { env } from '../../apps/env';
import { every } from '../../apps/scheduler/intervals';
import { DeploymentEnv, WorkerJob } from './network-config-types';

/*
    For sub-minute jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3.
    This is needed because the minimum alarm period is 1 minute and we want the alarm to trigger already after 1 minute instead of 3.

    For every 1 days jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3.
    This is needed because the maximum alarm evaluation period is 1 day (period * evaluationPeriod).
    */

export const activeChainWorkerJobsV2: WorkerJob[] = [
    {
        name: 'sync-new-pools-from-subgraph',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(2, 'minutes'),
    },
    {
        name: 'sync-changed-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(30, 'seconds'),
    },
    {
        name: 'sync-join-exits-v2',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(15, 'minutes') : every(1, 'minutes'),
    },
    {
        name: 'sync-swaps-v2',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(15, 'minutes') : every(1, 'minutes'),
    },
    {
        name: 'update-liquidity-24h-ago-v2',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(5, 'minutes'),
    },
];

export const activeChainWorkerJobsV3: WorkerJob[] = [
    {
        name: 'add-pools-v3',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(30, 'seconds'),
    },
    {
        name: 'sync-pools-v3',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(30, 'seconds'),
    },
    {
        name: 'sync-join-exits-v3',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(15, 'minutes') : every(1, 'minutes'),
    },
    {
        name: 'sync-swaps-v3',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(15, 'minutes') : every(1, 'minutes'),
    },
    {
        name: 'sync-hook-data',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(1, 'hours'),
    },
    {
        name: 'update-liquidity-24h-ago-v3',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(5, 'minutes'),
    },
];

export const activeChainWorkerJobsGeneric: WorkerJob[] = [
    {
        name: 'update-liquidity-for-inactive-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(10, 'minutes'),
    },
    {
        name: 'sync-staking-for-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
    },
    {
        name: 'sync-snapshots',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(45, 'minutes') : every(15, 'minutes'),
    },
    {
        name: 'user-sync-wallet-balances-for-all-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(20, 'seconds'),
    },
    {
        name: 'user-sync-staked-balances',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(20, 'seconds'),
    },
    {
        name: 'update-fee-volume-yield-all-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(60, 'minutes') : every(30, 'minutes'),
    },
    {
        name: 'update-pool-apr',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(2, 'minutes'),
    },
    {
        name: 'sync-erc4626-onchain-data',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(60, 'minutes') : every(20, 'minutes'),
    },
    {
        name: 'update-lifetime-values',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(120, 'minutes') : every(60, 'minutes'),
    },
];

export const deprecatedChainWorkerJobs: WorkerJob[] = [
    {
        name: 'update-liquidity-for-inactive-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(40, 'minutes') : every(20, 'minutes'),
    },
    {
        name: 'user-sync-wallet-balances-for-all-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(40, 'seconds'),
    },
    {
        name: 'user-sync-staked-balances',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(40, 'seconds'),
    },
    {
        name: 'update-fee-volume-yield-all-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(120, 'minutes') : every(60, 'minutes'),
    },
    {
        name: 'update-pool-apr',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(60, 'minutes') : every(5, 'minutes'),
    },
    {
        name: 'sync-erc4626-onchain-data',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(120, 'minutes') : every(45, 'minutes'),
    },
    {
        name: 'sync-changed-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'hours') : every(1, 'hours'),
    },
];

export const activeChainWorkerJobsGlobal: WorkerJob[] = [
    {
        name: 'update-token-prices',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(3, 'minutes'),
    },
    {
        name: 'sync-vebal-snapshots',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(2, 'minutes'),
    },
    {
        name: 'sync-vebal-voting-gauges',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(5, 'minutes'),
    },
    {
        name: 'global-purge-old-tokenprices',
        interval: every(1, 'days'),
    },
    {
        name: 'sync-rate-provider-reviews',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'minutes') : every(15, 'minutes'),
    },
    {
        name: 'sync-hook-reviews',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'minutes') : every(15, 'minutes'),
    },
    {
        name: 'sync-erc4626-data',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'minutes') : every(15, 'minutes'),
    },
    {
        name: 'fetch-token-yields',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(40, 'minutes') : every(20, 'minutes'),
    },
    {
        name: 'sync-categories',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'minutes') : every(10, 'minutes'),
    },
    {
        name: 'post-subgraph-lag-metrics',
        interval: every(2, 'minutes'),
    },
    {
        name: 'sync-token-tvl',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(60, 'minutes') : every(30, 'minutes'),
    },
    {
        name: 'sync-token-content-data',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
    },
    {
        name: 'sync-lbps',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(2, 'minutes'),
    },
    {
        name: 'sync-fixed-lbps',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(2, 'minutes'),
    },
];

export const vebalWorkerJobs: WorkerJob[] = [
    {
        name: 'sync-vebal-balances',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(15, 'minutes') : every(3, 'minutes'),
    },
    {
        name: 'sync-vebal-totalSupply',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'minutes') : every(5, 'minutes'),
    },
];

export const fxWorkerJobs: WorkerJob[] = [
    {
        name: 'sync-latest-fx-prices',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(10, 'minutes'),
    },
];

export const cowAmmWorkerJobs: WorkerJob[] = [
    {
        name: 'sync-cow-amm-pools',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(30, 'seconds'),
    },
    {
        name: 'sync-cow-amm-swaps',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(15, 'minutes') : every(1, 'minutes'),
    },
    {
        name: 'sync-cow-amm-join-exits',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(15, 'minutes') : every(1, 'minutes'),
    },
];

export const quantAmmWorkerJobs: WorkerJob[] = [
    {
        name: 'sync-weights',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(60, 'minutes') : every(10, 'minutes'),
    },
];

export const loopsWorkerJobs: WorkerJob[] = [
    {
        name: 'sync-loops-data',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(60, 'minutes') : every(10, 'minutes'),
    },
];

export const stsWorkerJobs: WorkerJob[] = [
    {
        name: 'sync-sts-staking-data',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(20, 'minutes') : every(1, 'minutes'),
    },
    {
        name: 'sync-sts-staking-snapshots',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'minutes') : every(10, 'minutes'),
    },
];

export const reliquaryWorkerJobs: WorkerJob[] = [
    {
        name: 'sync-latest-reliquary-snapshots',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'hours') : every(1, 'hours'),
    },
];

export const datastudioWorkerJobs: WorkerJob[] = [
    {
        name: 'feed-data-to-datastudio',
        interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(10, 'minutes'),
    },
];
