import { ethers } from 'ethers';
import { NetworkConfig, NetworkData } from './network-config-types';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import config from '../../config';
import { UserSyncAuraBalanceService } from '../user/lib/user-sync-aura-balance.service';
import { activeChainWorkerJobsGeneric, activeChainWorkerJobsV2, vebalWorkerJobs, fxWorkerJobs } from './worker-jobs';

const polygonNetworkData: NetworkData = config.POLYGON;

export const polygonNetworkConfig: NetworkConfig = {
    data: polygonNetworkData,
    provider: new ethers.providers.JsonRpcProvider({ url: polygonNetworkData.rpcUrl, timeout: 60000 }),
    userStakedBalanceServices: [new UserSyncGaugeBalanceService(), new UserSyncAuraBalanceService()],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            polygonNetworkData.subgraphs.balancer,
            polygonNetworkData.chain.prismaId,
        ),
    },
    workerJobs: [...activeChainWorkerJobsGeneric, ...activeChainWorkerJobsV2, ...vebalWorkerJobs, ...fxWorkerJobs],
};
