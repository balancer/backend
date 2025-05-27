import config from '../../config';
import { prisma } from '../../prisma/prisma-client';
import { getViemClient } from '../sources/viem-client';
import { getCowAmmSubgraphClient } from '../sources/subgraphs';
import { fetchChangedPools, upsertPools, syncSwaps, syncJoinExits, updateSurplusAPRs } from '../actions/cow-amm';
import { syncSnapshots } from '../actions/snapshots/sync-snapshots';
import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { syncBptBalancesFromSubgraph } from '../actions/user/bpt-balances/helpers/sync-bpt-balances-from-subgraph';
import { getLastSyncedBlock, upsertLastSyncedBlock } from '../actions/last-synced-block';
import { updateLifetimeValues } from '../actions/pool/update-liftetime-values';
import { syncTokenPairs } from '../actions/pool/v3/sync-tokenpairs';

export function CowAmmController(tracer?: any) {
    const getSubgraphClient = (chain: Chain) => {
        const {
            subgraphs: { cowAmm },
        } = config[chain];

        // Guard against unconfigured chains
        if (!cowAmm) {
            throw new Error(`Chain not configured: ${chain}`);
        }

        const client = getCowAmmSubgraphClient(cowAmm, chain);

        return client;
    };
    return {
        /**
         * Syncs database pools state with the onchain state, based on the events
         *
         * @param chainId
         */
        async syncPools(chain: Chain) {
            const {
                rpcMaxBlockRange,
                acceptableSGLag,
                balancer: {
                    v3: { routerAddress },
                },
            } = config[chain];
            const subgraphClient = getSubgraphClient(chain);
            const viemClient = getViemClient(chain);

            const lastSyncBlock = await getLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.COW_AMM_POOLS);
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

            // Check if subgraph is not lagging behind
            if (useSubgraph && Math.abs(latestBlock - toBlock) > acceptableSGLag) {
                useSubgraph = false;
            }

            const ids: string[] = [];

            // Reload all pools if we are starting from the beginning
            if (fromBlock === 0) {
                const pools = await subgraphClient
                    .getAllPools({ isInitialized: true })
                    .then((pools) => pools.map((pool) => pool.id));
                ids.push(...pools);
            } else if (useSubgraph) {
                const pools = await subgraphClient
                    .getAllPools({
                        isInitialized: true,
                        _change_block: {
                            number_gte: lastSyncBlock,
                        },
                    })
                    .then((pools) => pools.map((pool) => pool.id));
                ids.push(...pools);
            } else {
                const pools = await fetchChangedPools(viemClient, chain, fromBlock, latestBlock, rpcMaxBlockRange);
                ids.push(...pools);
            }

            if (ids.length === 0) {
                return [];
            }

            // When adding new pools, balances need to be added separately
            // Since balance table has a constraint on poolId they cannot be added independently
            const existingIds = await prisma.prismaPool
                .findMany({
                    where: { chain, protocolVersion: 3 },
                    select: { id: true },
                })
                .then((pools) => pools.map(({ id }) => id));

            await upsertPools(ids, viemClient, subgraphClient, chain, latestBlock);
            await syncTokenPairs(ids, viemClient, routerAddress, chain);
            await updateSurplusAPRs(chain, ids);
            // Sync balances for the pools
            const newIds = ids.filter((id) => !existingIds.includes(id));
            await syncBptBalancesFromSubgraph(newIds, subgraphClient, chain);

            await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.COW_AMM_POOLS, toBlock);

            return ids;
        },
        async syncSnapshots(chain: Chain) {
            const subgraphClient = getSubgraphClient(chain);
            const ids = await syncSnapshots(subgraphClient, 'SNAPSHOTS_COW_AMM', chain);
            // update lifetime values based on snapshots
            await updateLifetimeValues(chain, undefined, 'COW_AMM');
            return ids;
        },
        async syncAllSnapshots(chain: Chain) {
            // Run in loop until we end up at todays snapshot (also sync todays)
            const subgraphClient = getSubgraphClient(chain);
            const ids = await syncSnapshots(subgraphClient, 'SNAPSHOTS_COW_AMM', chain, {
                startFromLastSyncedBlock: false,
                syncPoolsWithoutUpdates: true,
            });
            return ids;
        },
        async syncJoinExits(chain: Chain) {
            const subgraphClient = getSubgraphClient(chain);
            const entries = await syncJoinExits(subgraphClient, chain);
            return entries;
        },
        async syncSwaps(chain: Chain) {
            const subgraphClient = getSubgraphClient(chain);
            const swaps = await syncSwaps(subgraphClient, chain);
            const poolIds = swaps
                .map((event) => event.poolId)
                .filter((value, index, self) => self.indexOf(value) === index);
            return poolIds;
        },
        async updateSurplusAprs() {
            const aprs = await updateSurplusAPRs();
            return aprs;
        },
        async syncBalances(chain: Chain) {
            let subgraphClient: ReturnType<typeof getSubgraphClient>;
            try {
                subgraphClient = getSubgraphClient(chain);
            } catch (e) {
                return false;
            }

            await syncBptBalancesFromSubgraph([], subgraphClient, chain);

            return true;
        },
    };
}
