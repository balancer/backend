import config from '../../config';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { addPools } from '../actions/pool/add-pools-v2';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';
import { syncPoolsV2 } from '../actions/pool/sync-pools-v2';
import { getViemClient } from '../sources/viem-client';
import { syncChangedPoolsV2 } from '../actions/pool/sync-changed-pools-v2';

export function PoolsV2Controller(tracer?: any) {
    return {
        async addPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const subgraphUrl = config[chain].subgraphs.balancer;
            const subgraphService = getV2SubgraphClient(subgraphUrl, Number(chainId));

            return addPools(subgraphService, chain);
        },
        async syncPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const vaultAddress = config[chain].balancer.v2.vaultAddress;
            const balancerQueriesAddress = config[chain].balancer.v2.balancerQueriesAddress;
            const yieldProtocolFeePercentage = config[chain].balancer.v2.defaultYieldFeePercentage;
            const swapProtocolFeePercentage = config[chain].balancer.v2.defaultSwapFeePercentage;
            const gyroConfig = config[chain].gyro?.config;

            const viemClient = getViemClient(chain);
            const latestBlock = await viemClient.getBlockNumber();

            return syncPoolsV2(
                Number(latestBlock),
                chain,
                vaultAddress,
                balancerQueriesAddress,
                yieldProtocolFeePercentage,
                swapProtocolFeePercentage,
                gyroConfig,
            );
        },

        async syncChangedPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const vaultAddress = config[chain].balancer.v2.vaultAddress;
            const balancerQueriesAddress = config[chain].balancer.v2.balancerQueriesAddress;
            const yieldProtocolFeePercentage = config[chain].balancer.v2.defaultYieldFeePercentage;
            const swapProtocolFeePercentage = config[chain].balancer.v2.defaultSwapFeePercentage;
            const gyroConfig = config[chain].gyro?.config;

            return syncChangedPoolsV2(
                chain,
                vaultAddress,
                balancerQueriesAddress,
                yieldProtocolFeePercentage,
                swapProtocolFeePercentage,
                gyroConfig,
            );
        },
    };
}
