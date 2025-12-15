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
import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { syncPools as syncPoolsV3 } from '../actions/pool/v3/sync-pools';
import { syncTokenPairs } from '../actions/pool/v3/sync-tokenpairs';
import { syncHookData } from '../actions/pool/v3/sync-hook-data';
import { getLastSyncedBlock, upsertLastSyncedBlock } from '../actions/last-synced-block';
import { getChangedPoolsV3 } from '../sources/logs';
import { syncBptBalancesFromSubgraph } from '../actions/user/bpt-balances/helpers/sync-bpt-balances-from-subgraph';
import { syncHookReviews } from '../content/lib/sync-hook-reviews';
import { syncErc4626Tokens } from '../actions/token/sync-erc4626-tokens';
import { syncRateProviderReviews } from '../content/lib/sync-rate-provider-reviews';
import { PoolWithMappedJsonFields } from '../../prisma/prisma-types';

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

        async syncOnchainDataForPoolsV2(chain: Chain, poolIds?: string[]) {
            const vaultAddress = config[chain].balancer.v2.vaultAddress;
            const balancerQueriesAddress = config[chain].balancer.v2.balancerQueriesAddress;
            const yieldProtocolFeePercentage = config[chain].balancer.v2.defaultYieldFeePercentage;
            const swapProtocolFeePercentage = config[chain].balancer.v2.defaultSwapFeePercentage;
            const gyroConfig = config[chain].gyro?.config;

            const viemClient = getViemClient(chain);
            const latestBlock = await viemClient.getBlockNumber();

            return syncOnChainDataForPoolsV2(
                Number(latestBlock),
                chain,
                vaultAddress,
                balancerQueriesAddress,
                yieldProtocolFeePercentage,
                swapProtocolFeePercentage,
                gyroConfig,
                poolIds,
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
            const client = getViemClient(chain);

            const poolIds = await prisma.prismaPool
                .findMany({
                    where: { chain, protocolVersion: 2 },
                    select: { id: true },
                })
                .then((results) => results.map((r) => r.id));

            const updates = await updateLiquidity24hAgo(poolIds, chain, client);

            return updates;
        },

        async updateLiquidityValuesForInactivePools(chain: Chain) {
            const poolTokens = await prisma.prismaPoolToken.findMany({
                where: {
                    chain,
                    updatedAt: {
                        // Do the update only when the pool wasn't synced in the last 10 minutes
                        lt: new Date(Date.now() - 60 * 10 * 1000),
                    },
                },
            });

            const ids = [...new Set(poolTokens.map((pt) => pt.poolId))];

            await updateLiquidityValuesForPools(chain, ids);

            return ids;
        },
        async addPoolsV3(chain: Chain, syncNewPoolsOnly = true) {
            const {
                subgraphs: { balancerV3, balancerPoolsV3 },
                balancer: {
                    v3: { vaultAddress },
                },
                hooks,
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3 || !balancerPoolsV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const viemClient = getViemClient(chain);

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3, chain);
            const poolsSubgraphClient = getPoolsSubgraphClient(balancerPoolsV3, chain);
            const subgraphClient = getV3JoinedSubgraphClient(vaultSubgraphClient, poolsSubgraphClient);

            const latestBlock = Number(await viemClient.getBlockNumber());
            const pools = await subgraphClient.getAllInitializedPools();

            if (pools.length === 0) {
                return [];
            }

            const dbIds = (
                await prisma.prismaPool.findMany({
                    where: { chain, protocolVersion: 3 },
                    select: { id: true },
                })
            ).map(({ id }) => id);

            let poolsToSync: V3JoinedSubgraphPool[] = [];
            if (syncNewPoolsOnly) {
                poolsToSync = pools.filter((pool) => !dbIds.includes(pool.id));
            } else {
                poolsToSync = pools;
            }

            if (poolsToSync.length === 0) {
                return [];
            }

            const inserts = await addPoolsV3(poolsToSync, viemClient, vaultAddress, chain, latestBlock);
            await syncBptBalancesFromSubgraph(
                poolsToSync.map((pool) => pool.id),
                vaultSubgraphClient,
                chain,
            );

            // Sync token flags for the new tokens
            await syncErc4626Tokens(
                getViemClient(chain),
                chain,
                inserts.flatMap(({ tokens }) => tokens),
            );

            await syncRateProviderReviews();

            if (hooks) {
                await syncHookReviews();
            }

            await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.ADD_POOLS_V3, latestBlock);

            return poolsToSync.map((pool) => pool.id);
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
                acceptableSGLag,
            } = config[chain];

            // Guard against unconfigured chains
            if (!vaultAddress || !balancerV3 || !balancerPoolsV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const viemClient = getViemClient(chain);
            const subgraphClient = getVaultSubgraphClient(balancerV3, chain);

            const fromBlock = await getLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.POOLS_V3);
            const rpcLatestBlock = await viemClient.getBlockNumber().then(Number);
            const sgLastSyncedBlock = await subgraphClient.lastSyncedBlock();

            // Guard against subgraph lag
            let useSubgraph = true;
            if (rpcLatestBlock - sgLastSyncedBlock > acceptableSGLag) {
                useSubgraph = false;
            }

            const latestBlock = useSubgraph ? sgLastSyncedBlock : rpcLatestBlock;

            if (fromBlock === undefined || fromBlock > latestBlock) {
                return [];
            }

            // Sepolia vault deployment block, uncomment to test from the beginning
            // const fromBlock = 5274748n;

            let changedIds: string[] = [];
            if (useSubgraph) {
                changedIds = await subgraphClient.getChangedPools(fromBlock);
            } else {
                const rpcMaxBlockRange = config[chain].rpcMaxBlockRange;
                const range = Number(latestBlock) - fromBlock;
                const numBatches = Math.ceil(range / rpcMaxBlockRange);

                const allChangedPools = new Set<string>();

                for (let i = 0; i < numBatches; i++) {
                    const from = fromBlock + (i > 0 ? 1 : 0) + i * rpcMaxBlockRange;
                    const to = Math.min(fromBlock + (i + 1) * rpcMaxBlockRange, Number(latestBlock));

                    const changedPools = await getChangedPoolsV3(vaultAddress, viemClient, BigInt(from), BigInt(to));
                    changedPools.forEach((pool) => allChangedPools.add(pool));
                }

                changedIds = Array.from(allChangedPools).map((pool) => pool.toLowerCase());
            }

            if (changedIds.length === 0) {
                return [];
            }

            const dbPools = (await prisma.prismaPool.findMany({
                where: { chain, protocolVersion: 3, id: { in: changedIds } },
                select: { id: true, type: true, hook: true, typeData: true },
            })) as PoolWithMappedJsonFields[];

            const ids = await syncPoolsV3(dbPools, chain, vaultAddress, viemClient, latestBlock);
            await syncTokenPairs(ids, viemClient, routerAddress, chain);
            await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.POOLS_V3, latestBlock);

            return ids;
        },
        async updateLiquidity24hAgoV3(chain: Chain) {
            const client = getViemClient(chain);

            const poolIds = await prisma.prismaPool
                .findMany({
                    where: { chain, protocolVersion: 3 },
                    select: { id: true },
                })
                .then((results) => results.map((r) => r.id));

            const updates = await updateLiquidity24hAgo(poolIds, chain, client);

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
                where: { chain, hook: { path: ['address'], string_starts_with: '0x' } },
            });

            const viemClient = getViemClient(chain);

            const ids = await syncHookData(poolsWithHooks, viemClient);

            return ids;
        },
    };
}
