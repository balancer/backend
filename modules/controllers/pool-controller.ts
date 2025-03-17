import config from '../../config';
import { addPools as addPoolsV2 } from '../actions/pool/v2/add-pools';
import { addPools as addPoolsV3 } from '../actions/pool/v3/add-pools';
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
import { Chain, PrismaLastBlockSyncedCategory, PrismaPool } from '@prisma/client';
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
import { HookData } from '../sources/transformers';
import { syncErc4626Tokens } from '../actions/token/sync-erc4626-tokens';

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
        async addPoolsV3(chain: Chain) {
            const {
                subgraphs: { balancerV3, balancerPoolsV3 },
                hooks,
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3 || !balancerPoolsV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3, chain);
            const poolsSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3, chain);
            const subgraphClient = getV3JoinedSubgraphClient(vaultSubgraphClient, poolsSubgraphClient);

            const fromBlock = await getLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.ADD_POOLS_V3);
            const latestBlock = await subgraphClient.lastSyncedBlock();
            const changedIds = await subgraphClient.getChangedPools(fromBlock);

            if (changedIds.length === 0) {
                return [];
            }

            const dbIds = (
                await prisma.prismaPool.findMany({
                    where: { chain, protocolVersion: 3 },
                    select: { id: true },
                })
            ).map(({ id }) => id);

            let newIds = changedIds.filter((id) => !dbIds.includes(id));

            if (newIds.length === 0) {
                return [];
            }

            const pools = await subgraphClient.getAllInitializedPools({ id_in: newIds });
            newIds = pools.map(({ id }) => id); // Some pools are missing in pools subgraph and then we don't know it's type

            if (newIds.length === 0) {
                return [];
            }

            const inserts = await addPoolsV3(pools, chain, latestBlock);
            await syncBptBalancesFromSubgraph(newIds, vaultSubgraphClient, chain);

            // Sync token flags for the new tokens
            await syncErc4626Tokens(
                getViemClient(chain),
                chain,
                inserts.flatMap(({ tokens }) => tokens),
            );

            if (hooks) {
                await syncHookReviews();
            }

            await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.ADD_POOLS_V3, latestBlock);

            return newIds;
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

            const viemClient = getViemClient(chain);
            const subgraphClient = getVaultSubgraphClient(balancerV3, chain);

            const fromBlock = await getLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.POOLS_V3);
            const latestBlock = await viemClient.getBlockNumber().then(Number);
            const sgLastSyncedBlock = await subgraphClient.lastSyncedBlock();

            if (!fromBlock || fromBlock > latestBlock) {
                return [];
            }

            // Sepolia vault deployment block, uncomment to test from the beginning
            // const fromBlock = 5274748n;

            // Guard against subgraph lag
            let useSubgraph = true;
            if (latestBlock - sgLastSyncedBlock > acceptableSGLag) {
                useSubgraph = false;
            }

            let changedIds: string[] = [];
            if (useSubgraph) {
                changedIds = await subgraphClient.getChangedPools(fromBlock);
            } else {
                changedIds = await getChangedPoolsV3(vaultAddress, viemClient, BigInt(fromBlock), BigInt(latestBlock));
            }

            if (changedIds.length === 0) {
                return [];
            }

            const dbPools = (await prisma.prismaPool.findMany({
                where: { chain, protocolVersion: 3, id: { in: changedIds } },
            })) as (PrismaPool & { hook?: HookData })[];

            const ids = await upsertPoolsV3(
                dbPools,
                getVaultClient(viemClient, vaultAddress),
                getPoolsClient(viemClient),
                chain,
                latestBlock,
            );
            await syncTokenPairs(ids, viemClient, routerAddress, chain);
            await updateVolumeAndFees(chain, ids);
            await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.POOLS_V3, latestBlock);

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
