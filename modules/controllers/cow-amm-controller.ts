import config from '../../config';
import { prisma } from '../../prisma/prisma-client';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getCowAmmSubgraphClient } from '../sources/subgraphs';
import {
    fetchChangedPools,
    fetchNewPools,
    syncPools,
    upsertPools,
    syncSnapshots,
    syncSwaps,
    syncJoinExits,
    updateSurplusAPRs,
} from '../actions/cow-amm';
import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { updateVolumeAndFees } from '../actions/swap/update-volume-and-fees';

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
        async addPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const subgraphClient = getSubgraphClient(chain);
            const newPools = await fetchNewPools(subgraphClient, chain);
            const viemClient = getViemClient(chain);

            const ids = await upsertPools(newPools, viemClient, subgraphClient, chain);

            return ids;
        },
        /**
         * Takes all the pools from subgraph, enriches with onchain data and upserts them to the database
         *
         * @param chainId
         */
        async reloadPools(chainId: string) {
            const chain = chainIdToChain[chainId];

            const subgraphClient = getSubgraphClient(chain);
            const allPools = await subgraphClient.getAllPools({ isInitialized: true });
            const viemClient = getViemClient(chain);

            await upsertPools(
                allPools.map((pool) => pool.id),
                viemClient,
                subgraphClient,
                chain,
            );

            return allPools.map((pool) => pool.id);
        },
        /**
         * Syncs database pools state with the onchain state, based on the events
         *
         * @param chainId
         */
        async syncPools(chainId: string) {
            const chain = chainIdToChain[chainId];
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

            await syncPools(poolsToSync, viemClient, chain, blockToSync);

            await prisma.prismaLastBlockSynced.findFirst({
                where: {
                    category: PrismaLastBlockSyncedCategory.COW_AMM_POOLS,
                },
            });

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
        async syncSnapshots(chainId: string) {
            const chain = chainIdToChain[chainId];
            const subgraphClient = getSubgraphClient(chain);
            const entries = await syncSnapshots(subgraphClient, chain);
            return entries;
        },
        async syncJoinExits(chainId: string) {
            const chain = chainIdToChain[chainId];
            const subgraphClient = getSubgraphClient(chain);
            const entries = await syncJoinExits(subgraphClient, chain);
            return entries;
        },
        async syncSwaps(chainId: string) {
            const chain = chainIdToChain[chainId];
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
        async updateVolumeAndFees(chainId: string) {
            const chain = chainIdToChain[chainId];
            await updateVolumeAndFees(chain);
            return true;
        },
    };
}
