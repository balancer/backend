import { ethers } from 'ethers';
import { DeploymentEnv, NetworkConfig, NetworkData } from './network-config-types';
import { every } from '../../apps/scheduler/intervals';
import { env } from '../../apps/env';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';

const hyperEvmNetworkData: NetworkData = config.HYPEREVM;

export const hyperevmNetworkConfig: NetworkConfig = {
    data: hyperEvmNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: hyperEvmNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            hyperEvmNetworkData.subgraphs.balancer,
            hyperEvmNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [
        {
            name: 'update-liquidity-for-inactive-pools',
            interval: every(10, 'minutes'),
        },
        {
            name: 'update-pool-apr',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(6, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'user-sync-wallet-balances-for-all-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(20, 'seconds'),
        },
        {
            name: 'update-fee-volume-yield-all-pools',
            interval: every(30, 'minutes'),
        },
        // V3 Jobs
        {
            name: 'add-pools-v3',
            interval: every(30, 'seconds'),
        },
        {
            name: 'sync-pools-v3',
            interval: every(30, 'seconds'),
        },
        {
            name: 'sync-join-exits-v3',
            interval: every(1, 'minutes'),
        },
        {
            name: 'sync-swaps-v3',
            interval: every(1, 'minutes'),
        },
        {
            name: 'sync-snapshots-v3',
            interval: every(10, 'minutes'),
        },
        {
            name: 'forward-fill-snapshots-v3',
            interval: every(1, 'hours'),
        },

        {
            name: 'sync-hook-data',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-erc4626-onchain-data',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(60, 'minutes') : every(20, 'minutes'),
        },
    ],
};
