import config from '../../config';
import { prisma } from '../../prisma/prisma-client';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getCowAmmSubgraphClient } from '../sources/subgraphs';
import {
    fetchChangedPools,
    fetchNewPools,
    upsertPools,
    syncSnapshots,
    syncSwaps,
    syncJoinExits,
    updateSurplusAPRs,
} from '../actions/cow-amm';
import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { updateVolumeAndFees } from '../actions/pool/update-volume-and-fees';
import moment from 'moment';
import { upsertBptBalances } from '../actions/cow-amm/upsert-bpt-balances';

export function CowAmmController(tracer?: any) {
    const getSubgraphClient = (chain: Chain) => {
        const {
            subgraphs: { cowAmm },
        } = config[chain];

        // Guard against unconfigured chains
        if (!cowAmm) {
            throw new Error(`Chain not configured: ${chain}`);
        }

        const client = getCowAmmSubgraphClient(cowAmm);

        return client;
    };
    return {
        /**
         * Adds new pools found in subgraph to the database
         *
         * @param chainId
         */
        async addPools(chain: Chain) {
            const subgraphClient = getSubgraphClient(chain);
            const newPools = await fetchNewPools(subgraphClient, chain);
            const viemClient = getViemClient(chain);
            const blockNumber = await viemClient.getBlockNumber();

            const ids = await upsertPools(newPools, viemClient, subgraphClient, chain, blockNumber);
            // Initialize balances for the new pools
            await upsertBptBalances(subgraphClient, chain, ids);

            return ids;
        },
        /**
         * Takes all the pools from subgraph, enriches with onchain data and upserts them to the database
         *
         * @param chainId
         */
        async reloadPools(chain: Chain) {
            const subgraphClient = getSubgraphClient(chain);
            const allPools = await subgraphClient.getAllPools({ isInitialized: true });
            const viemClient = getViemClient(chain);
            const blockNumber = await viemClient.getBlockNumber();

            await upsertPools(
                allPools.map((pool) => pool.id),
                viemClient,
                subgraphClient,
                chain,
                blockNumber,
            );

            return allPools.map((pool) => pool.id);
        },
        /**
         * Syncs database pools state with the onchain state, based on the events
         *
         * @param chainId
         */
        async syncPools(chain: Chain) {
            const subgraphClient = getSubgraphClient(chain);
            const viemClient = getViemClient(chain);

            // TODO: move prismaLastBlockSynced wrapping to an action
            let fromBlock = (
                await prisma.prismaLastBlockSynced.findFirst({
                    where: {
                        category: PrismaLastBlockSyncedCategory.COW_AMM_POOLS,
                        chain,
                    },
                })
            )?.blockNumber;

            if (!fromBlock) {
                fromBlock = await prisma.prismaPoolEvent
                    .findFirst({
                        where: {
                            chain,
                            protocolVersion: 1,
                        },
                        orderBy: {
                            blockNumber: 'desc',
                        },
                    })
                    .then((pool) => pool?.blockNumber);

                if (fromBlock && fromBlock > 10) {
                    fromBlock = fromBlock - 10; // Safety overlap
                }
            }

            let poolsToSync: string[] = [];
            let blockToSync: bigint;

            if (fromBlock) {
                const { changedPools, latestBlock } = await fetchChangedPools(viemClient, chain, fromBlock);

                if (changedPools.length === 0) {
                    return [];
                }
                poolsToSync = changedPools;
                blockToSync = latestBlock;
            } else {
                poolsToSync = await prisma.prismaPool
                    .findMany({
                        where: {
                            chain,
                            protocolVersion: 1,
                        },
                        select: {
                            id: true,
                        },
                    })
                    .then((pools) => pools.map((pool) => pool.id));
                blockToSync = await viemClient.getBlockNumber();
            }

            await upsertPools(poolsToSync, viemClient, subgraphClient, chain, blockToSync);
            await updateVolumeAndFees(chain, poolsToSync);
            await updateSurplusAPRs();

            const toBlock = await viemClient.getBlockNumber();
            await prisma.prismaLastBlockSynced.upsert({
                where: {
                    category_chain: {
                        category: PrismaLastBlockSyncedCategory.COW_AMM_POOLS,
                        chain,
                    },
                },
                update: {
                    blockNumber: Number(toBlock),
                },
                create: {
                    category: PrismaLastBlockSyncedCategory.COW_AMM_POOLS,
                    blockNumber: Number(toBlock),
                    chain,
                },
            });

            return poolsToSync;
        },
        async syncSnapshots(chain: Chain) {
            const subgraphClient = getSubgraphClient(chain);
            const timestamp = await syncSnapshots(subgraphClient, chain);
            return timestamp;
        },
        async syncAllSnapshots(chain: Chain) {
            // Run in loop until we end up at todays snapshot (also sync todays)
            let allSnapshotsSynced = false;
            let timestamp = 0;
            while (!allSnapshotsSynced) {
                timestamp = await CowAmmController().syncSnapshots(chain);
                allSnapshotsSynced = timestamp === moment().utc().startOf('day').unix();
            }
            return timestamp;
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
        async updateVolumeAndFees(chain: Chain) {
            const cowPools = await prisma.prismaPool.findMany({ where: { chain, type: 'COW_AMM' } });
            await updateVolumeAndFees(
                chain,
                cowPools.map((pool) => pool.id),
            );
            return true;
        },
        async syncBalances(chain: Chain) {
            const subgraphClient = getSubgraphClient(chain);
            await upsertBptBalances(subgraphClient, chain);

            return true;
        },
    };
}
