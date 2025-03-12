import config from '../../config';
import { addPools as addPoolsV2 } from '../actions/pool/v2/add-pools';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';
import {
    syncOnchainDataForAllPools as syncOnchainDataForAllPoolsV2,
    syncChangedPools as syncChangedPoolsV2,
    syncOnChainDataForPools as syncOnChainDataForPoolsV2,
} from '../actions/pool/v2';
import { getViemClient } from '../sources/viem-client';
import {
    getPoolsSubgraphClient,
    getV3JoinedSubgraphClient,
    getVaultSubgraphClient,
    V3JoinedSubgraphPool,
} from '../sources/subgraphs';
import { prisma } from '../../prisma/prisma-client';
import { updateLiquidity24hAgo, updateLiquidityValuesForPools } from '../actions/pool/update-liquidity';
import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { getVaultClient } from '../sources/contracts/v3/vault-client';
import { upsertPools as upsertPoolsV3 } from '../actions/pool/v3/upsert-pools';
import { syncTokenPairs } from '../actions/pool/v3/sync-tokenpairs';
import { syncHookData } from '../actions/pool/v3/sync-hook-data';
import { getLastSyncedBlock, upsertLastSyncedBlock } from '../actions/last-synced-block';
import { getChangedPoolsV3 } from '../sources/logs';
import { getPoolsClient } from '../sources/contracts';
import { syncBptBalancesFromSubgraph } from '../actions/user/bpt-balances/helpers/sync-bpt-balances-from-subgraph';
import { updateVolumeAndFees } from '../actions/pool/update-volume-and-fees';
import { syncHookReviews } from '../actions/content/sync-hook-reviews';

export function PoolController(tracer?: any) {
    return {
        async addPoolsV2(chain: Chain) {
            const subgraphUrl = config[chain].subgraphs.balancer;
            const subgraphService = getV2SubgraphClient(subgraphUrl, chain);

            return addPoolsV2(subgraphService, chain);
        },

        async syncOnchainDataForAllPoolsV2(chain: Chain) {
            const vaultAddress = config[chain].balancer.v2.vaultAddress;
            const balancerQueriesAddress = config[chain].balancer.v2.balancerQueriesAddress;
            const yieldProtocolFeePercentage = config[chain].balancer.v2.defaultYieldFeePercentage;
            const swapProtocolFeePercentage = config[chain].balancer.v2.defaultSwapFeePercentage;
            const gyroConfig = config[chain].gyro?.config;

            const viemClient = getViemClient(chain);
            const latestBlock = await viemClient.getBlockNumber();

            return syncOnchainDataForAllPoolsV2(
                Number(latestBlock),
                chain,
                vaultAddress,
                balancerQueriesAddress,
                yieldProtocolFeePercentage,
                swapProtocolFeePercentage,
                gyroConfig,
            );
        },

        async syncOnchainDataForPoolsV2(chain: Chain, poolIds: string[]) {
            const vaultAddress = config[chain].balancer.v2.vaultAddress;
            const balancerQueriesAddress = config[chain].balancer.v2.balancerQueriesAddress;
            const yieldProtocolFeePercentage = config[chain].balancer.v2.defaultYieldFeePercentage;
            const swapProtocolFeePercentage = config[chain].balancer.v2.defaultSwapFeePercentage;
            const gyroConfig = config[chain].gyro?.config;

            const viemClient = getViemClient(chain);
            const latestBlock = await viemClient.getBlockNumber();

            return syncOnChainDataForPoolsV2(
                poolIds,
                Number(latestBlock),
                chain,
                vaultAddress,
                balancerQueriesAddress,
                yieldProtocolFeePercentage,
                swapProtocolFeePercentage,
                gyroConfig,
            );
        },

        async syncChangedPoolsV2(chain: Chain) {
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

        async updateLiquidity24hAgoV2(chain: Chain) {
            const {
                subgraphs: { balancer },
            } = config[chain];

            // Guard against unconfigured chains
            const subgraph = balancer && getV2SubgraphClient(balancer, chain);

            if (!subgraph) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const poolIds = await prisma.prismaPoolDynamicData.findMany({
                where: { chain },
                select: { poolId: true },
            });

            const updates = await updateLiquidity24hAgo(
                poolIds.map(({ poolId }) => poolId),
                subgraph,
                chain,
            );

            return updates;
        },

        async updateLiquidityValuesForActivePools(chain: Chain) {
            const pools = await prisma.prismaPool.findMany({
                where: {
                    chain,
                    dynamicData: {
                        totalSharesNum: { gt: 0.00000000001 },
                    },
                },
                select: { id: true },
            });

            await updateLiquidityValuesForPools(
                chain,
                pools.map(({ id }) => id),
            );
        },
        async updateLiquidityValuesForInactivePools(chain: Chain) {
            const pools = await prisma.prismaPool.findMany({
                where: {
                    chain,
                    dynamicData: {
                        totalSharesNum: { lte: 0.00000000001 },
                    },
                },
                select: { id: true },
            });

            await updateLiquidityValuesForPools(
                chain,
                pools.map(({ id }) => id),
            );
        },
        /**
         * Syncs database pools state with the onchain state
         *
         * @param chainId
         */
        async syncPoolsV3(chain: Chain) {
            const {
                subgraphs: { balancerV3, balancerPoolsV3 },
                balancer: {
                    v3: { vaultAddress, routerAddress },
                },
                hooks,
                acceptableSGLag,
            } = config[chain];

            // Guard against unconfigured chains
            if (!vaultAddress || !balancerV3 || !balancerPoolsV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3, chain);
            const poolsSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3, chain);
            const subgraphClient = getV3JoinedSubgraphClient(vaultSubgraphClient, poolsSubgraphClient);
            const viemClient = getViemClient(chain);

            const lastSyncBlock = await getLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.POOLS_V3);
            const fromBlock = Math.max(0, lastSyncBlock - 1);
            const latestBlock = await viemClient.getBlockNumber().then(Number);

            // no new blocks have been minted, needed for slow networks
            if (fromBlock > Number(latestBlock)) {
                return [];
            }

            let toBlock = latestBlock;
            let useSubgraph = true;
            try {
                // Handle bad indexers etc.
                toBlock = await subgraphClient.lastSyncedBlock();
            } catch (e) {
                useSubgraph = false;
            }

            // Sepolia vault deployment block, uncomment to test from the beginning
            // const fromBlock = 5274748n;

            // no new blocks have been minted, needed for slow networks
            if (fromBlock > latestBlock) {
                return [];
            }

            // Check if subgraph is not lagging behind
            if (useSubgraph && Math.abs(latestBlock - toBlock) > acceptableSGLag) {
                useSubgraph = false;
            }

            const pools: V3JoinedSubgraphPool[] = [];

            // Reload all pools if we are starting from the beginning
            if (fromBlock === 0) {
                const sgPools = await subgraphClient.getAllInitializedPools({});
                pools.push(...sgPools);
            } else if (useSubgraph) {
                const sgPools = await subgraphClient.getAllInitializedPools({
                    _change_block: {
                        number_gte: lastSyncBlock,
                    },
                });
                pools.push(...sgPools);
            } else {
                const ids = await getChangedPoolsV3(vaultAddress, viemClient, BigInt(fromBlock), BigInt(latestBlock));
                const sgPools = await subgraphClient.getAllInitializedPools({ id_in: ids });
                pools.push(...sgPools);
            }

            if (pools.length === 0) {
                return [];
            }

            // When adding new pools, balances need to be added separately
            // Since balance table has a constraint on poolId they cannot be added independently
            const dbPools = await prisma.prismaPool.findMany({
                where: { chain, protocolVersion: 3 },
            });

            const ids = await upsertPoolsV3(
                dbPools,
                pools,
                getVaultClient(viemClient, vaultAddress),
                getPoolsClient(viemClient),
                chain,
                latestBlock,
            );
            await syncTokenPairs(ids, viemClient, routerAddress, chain);
            await updateVolumeAndFees(chain, ids);

            // Sync balances for the pools
            const existingIds = dbPools.map(({ id }) => id);
            const newIds = ids.filter((id) => !existingIds.includes(id));
            await syncBptBalancesFromSubgraph(newIds, vaultSubgraphClient, chain);

            if (hooks && newIds) {
                await syncHookReviews();
            }

            await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.POOLS_V3, toBlock);

            return ids;
        },
        async updateLiquidity24hAgoV3(chain: Chain) {
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            const subgraph = balancerV3 && getVaultSubgraphClient(balancerV3, chain);

            if (!subgraph) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const poolIds = await prisma.prismaPoolDynamicData.findMany({
                where: { chain },
                select: { poolId: true },
            });

            const updates = await updateLiquidity24hAgo(
                poolIds.map(({ poolId }) => poolId),
                subgraph,
                chain,
            );

            return updates;
        },
        async syncHookData(chain: Chain) {
            const { hooks } = config[chain];

            // Guard against unconfigured chains
            if (!hooks) {
                // Chain doesn't have hooks
                return;
            }

            // Get hook addresses from the database
            const poolsWithHooks = await prisma.prismaPool.findMany({
                where: { chain, hook: { not: {} } },
            });

            const viemClient = getViemClient(chain);

            await syncHookData(poolsWithHooks, viemClient);
        },
    };
}
