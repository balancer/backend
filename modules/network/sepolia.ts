import { ethers } from 'ethers';
import { DeploymentEnv, NetworkConfig } from './network-config-types';
import { tokenService } from '../token/token.service';
import { BoostedPoolAprService } from '../pool/lib/apr-data-sources/nested-pool-apr.service';
import { SwapFeeAprService } from '../pool/lib/apr-data-sources/swap-fee-apr.service';
import { GaugeAprService } from '../pool/lib/apr-data-sources/ve-bal-gauge-apr.service';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { every } from '../../worker/intervals';
import { GithubContentService } from '../content/github-content.service';
import { YbTokensAprService } from '../pool/lib/apr-data-sources/yb-tokens-apr.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';
import { env } from '../../app/env';

export const sepoliaNetworkData = config.SEPOLIA;

export const sepoliaNetworkConfig: NetworkConfig = {
    data: sepoliaNetworkData,
    contentService: new GithubContentService(),
    provider: new ethers.providers.JsonRpcProvider({ url: sepoliaNetworkData.rpcUrl, timeout: 60000 }),
    poolAprServices: [
        new YbTokensAprService(sepoliaNetworkData.ybAprConfig, sepoliaNetworkData.chain.prismaId),
        new BoostedPoolAprService(),
        new SwapFeeAprService(),
        new GaugeAprService(tokenService, [sepoliaNetworkData.bal!.address]),
    ],
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            sepoliaNetworkData.subgraphs.balancer,
            sepoliaNetworkData.chain.id,
        ),
    },
    /*
    For sub-minute jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3. 
    This is needed because the minimum alarm period is 1 minute and we want the alarm to trigger already after 1 minute instead of 3.

    For every 1 days jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3. 
    This is needed because the maximum alarm evaluation period is 1 day (period * evaluationPeriod).
    */
    workerJobs: [
        // V3 jobs
        {
            name: 'add-pools-v3',
            interval: every(5, 'minutes'),
        },
        {
            name: 'sync-pools-v3',
            interval: every(1, 'minutes'),
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
            name: 'update-swaps-volume-and-fees-v3',
            interval: every(20, 'minutes'),
        },
        {
            name: 'sync-snapshots-v3',
            interval: every(12, 'hours'),
        },
        {
            name: 'sync-hook-data',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-tokens-from-pool-tokens',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
        // COW AMM
        { name: 'add-new-cow-amm-pools', interval: every(5, 'minutes') },
        {
            name: 'sync-cow-amm-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'minutes') : every(30, 'seconds'),
            alarmEvaluationPeriod: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
            alarmDatapointsToAlarm: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
        },
        {
            name: 'sync-cow-amm-swaps',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(1, 'minutes'),
        },
        {
            name: 'sync-cow-amm-join-exits',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(1, 'minutes'),
        },
        { name: 'sync-cow-amm-snapshots', interval: every(90, 'minutes') },
        {
            name: 'update-cow-amm-volume-and-fees',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(60, 'minutes') : every(20, 'minutes'),
        },
    ],
};
