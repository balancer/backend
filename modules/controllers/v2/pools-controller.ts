import config from '../../../config';
import { chainIdToChain } from '../../network/chain-id-to-chain';
import { addPools } from '../../actions/v2/pool/add-pools';
import { getV2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import { syncPools, syncChangedPools } from '../../actions/v2/pool';
import { getViemClient } from '../../sources/viem-client';

export function PoolsController(tracer?: any) {
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

            return syncPools(
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

            return syncChangedPools(
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
