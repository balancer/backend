import { ethers } from 'ethers';
import { NetworkConfig } from './network-config-types';
import { tokenService } from '../token/token.service';
import { BoostedPoolAprService } from '../pool/lib/apr-data-sources/boosted-pool-apr.service';
import { SwapFeeAprService } from '../pool/lib/apr-data-sources/swap-fee-apr.service';
import { GaugeAprService } from '../pool/lib/apr-data-sources/ve-bal-gauge-apr.service';
import { GaugeStakingService } from '../pool/lib/staking/gauge-staking.service';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { every } from '../../worker/intervals';
import { GithubContentService } from '../content/github-content.service';
import { gaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { YbTokensAprService } from '../pool/lib/apr-data-sources/yb-tokens-apr.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';

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
    poolStakingServices: [new GaugeStakingService(gaugeSubgraphService, sepoliaNetworkData.bal!.address)],
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
    ],
};
