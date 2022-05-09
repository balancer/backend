import { prisma } from '../util/prisma-client';
import { PrismaLastBlockSyncedCategory } from '@prisma/client';
import { changelogSubgraphService } from '../subgraphs/changelog-subgraph/changelog-subgraph.service';
import { poolService } from './pool.service';

class PoolSyncService {
    public async syncChangedPools() {
        try {
            let lastSync = await prisma.prismaLastBlockSynced.findUnique({
                where: { category: PrismaLastBlockSyncedCategory.POOLS },
            });
            const lastSyncBlock = lastSync?.blockNumber ?? 0;

            const poolChangeEvents = await changelogSubgraphService.getPoolChangeEvents(lastSyncBlock + 1);

            let latestBlock = lastSyncBlock;
            const poolIds = new Set<string>();
            for (const poolChangeEvent of poolChangeEvents) {
                const block = parseInt(poolChangeEvent.block);
                if (block > latestBlock) {
                    latestBlock = block;
                }
                poolIds.add(poolChangeEvent.poolId);
            }
            if (poolIds.size !== 0) {
                console.log(`Syncing ${poolIds.size} pools`);
                await poolService.updateOnChainDataForPools([...poolIds], latestBlock);

                const poolsWithNewSwaps = await poolService.syncSwapsForLast24Hours();
                await poolService.updateVolumeAndFeeValuesForPools(poolsWithNewSwaps);

                await prisma.prismaLastBlockSynced.upsert({
                    where: { category: PrismaLastBlockSyncedCategory.POOLS },
                    update: {
                        blockNumber: latestBlock,
                    },
                    create: {
                        category: PrismaLastBlockSyncedCategory.POOLS,
                        blockNumber: latestBlock,
                    },
                });
            }
        } catch (error) {
            console.error('Error syncing changed pools', error);
        }
    }
}

export const poolSyncService = new PoolSyncService();
