import { ethers } from 'ethers';
import { DeploymentEnv, NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncMasterchefFarmBalanceService } from '../user/lib/user-sync-masterchef-farm-balance.service';
import { UserSyncReliquaryFarmBalanceService } from '../user/lib/user-sync-reliquary-farm-balance.service';
import { every } from '../../apps/scheduler/intervals';
import { env } from '../../apps/env';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';

const fantomNetworkData: NetworkData = config.FANTOM;

export const fantomNetworkConfig: NetworkConfig = {
    data: fantomNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: fantomNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [
        new UserSyncMasterchefFarmBalanceService(
            fantomNetworkData.fbeets!.address,
            fantomNetworkData.fbeets!.farmId,
            fantomNetworkData.masterchef!.address,
            fantomNetworkData.masterchef!.excludedFarmIds,
        ),
        new UserSyncReliquaryFarmBalanceService(fantomNetworkData.reliquary!.address),
    ],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            fantomNetworkData.subgraphs.balancer,
            fantomNetworkData.chain.prismaId,
        ),
    },
    /*
    For sub-minute jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3.
    This is needed because the minimum alarm period is 1 minute and we want the alarm to trigger already after 1 minute instead of 3.

    For every 1 days jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3.
    This is needed because the maximum alarm evaluation period is 1 day (period * evaluationPeriod).
    */
    workerJobs: [
        {
            name: 'update-liquidity-for-inactive-pools',
            interval: every(60, 'minutes'),
        },
        {
            name: 'update-pool-apr',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'hours') : every(2, 'hours'),
        },
        {
            name: 'load-on-chain-data-for-pools-with-active-updates',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'hours') : every(2, 'hours'),
        },
        {
            name: 'cache-protocol-data',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'hours') : every(2, 'hours'),
        },
        {
            name: 'sync-snapshots',
            interval: every(15, 'minutes'),
        },
        {
            name: 'sync-changed-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'hours') : every(1, 'hours'),
        },
        {
            name: 'user-sync-wallet-balances-for-all-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'hours') : every(60, 'minutes'),
        },
        {
            name: 'user-sync-staked-balances',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'hours') : every(60, 'minutes'),
        },
        {
            name: 'update-fee-volume-yield-all-pools',
            interval: every(4, 'hours'),
        },
        {
            name: 'sync-sftmx-staking-data',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'hours') : every(60, 'minutes'),
        },
        {
            name: 'sync-sftmx-withdrawal-requests',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'hours') : every(45, 'minutes'),
        },
    ],
};
