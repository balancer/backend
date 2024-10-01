import config from '../../../config';
import { chainIdToChain } from '../../network/chain-id-to-chain';
import { addPools } from '../../actions/pool/v2/add-pools';
import { getV2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import { syncPools, syncChangedPools, syncOnchainStateForAllPools } from '../../actions/pool/v2';
import { getViemClient } from '../../sources/viem-client';
import { getBlockNumbersSubgraphClient } from '../../sources/subgraphs';
import { prisma } from '../../../prisma/prisma-client';
import { updateLiquidity24hAgo } from '../../actions/pool/update-liquidity-24h-ago';

export function PoolsController(tracer?: any) {
    return {
        async addPoolsV2(chainId: string) {
            const chain = chainIdToChain[chainId];
            const subgraphUrl = config[chain].subgraphs.balancer;
            const subgraphService = getV2SubgraphClient(subgraphUrl, Number(chainId));

            return addPools(subgraphService, chain);
        },

        async syncPoolsV2(chainId: string) {
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

        async syncChangedPoolsV2(chainId: string) {
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

        async syncOnchainAllPoolsV2(chainId: string) {
            const chain = chainIdToChain[chainId];
            const vaultAddress = config[chain].balancer.v2.vaultAddress;
            const balancerQueriesAddress = config[chain].balancer.v2.balancerQueriesAddress;
            const yieldProtocolFeePercentage = config[chain].balancer.v2.defaultYieldFeePercentage;
            const swapProtocolFeePercentage = config[chain].balancer.v2.defaultSwapFeePercentage;
            const gyroConfig = config[chain].gyro?.config;

            return syncOnchainStateForAllPools(
                chain,
                vaultAddress,
                balancerQueriesAddress,
                yieldProtocolFeePercentage,
                swapProtocolFeePercentage,
                gyroConfig,
            );
        },

        async updateLiquidity24hAgoV2(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancer, blocks },
            } = config[chain];

            // Guard against unconfigured chains
            const subgraph = balancer && getV2SubgraphClient(balancer, Number(chainId));

            if (!subgraph) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const blocksSubgraph = getBlockNumbersSubgraphClient(blocks);

            const poolIds = await prisma.prismaPoolDynamicData.findMany({
                where: { chain },
                select: { poolId: true },
            });

            const updates = await updateLiquidity24hAgo(
                poolIds.map(({ poolId }) => poolId),
                subgraph,
                blocksSubgraph,
                chain,
            );

            return updates;
        },
    };
}
