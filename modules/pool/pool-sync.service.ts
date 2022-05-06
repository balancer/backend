import { prisma } from '../util/prisma-client';
import { PrismaLastBlockSyncedCategory } from '@prisma/client';
import { changelogSubgraphService } from '../subgraphs/changelog-subgraph/changelog-subgraph.service';
import { poolService } from './pool.service';

class PoolSyncService {
    public async syncChangedPools(minIntervalMs: number = 5000) {
        try {
            const startTime = Date.now();

            let lastSync = await prisma.prismaLastBlockSynced.findUnique({
                where: { category: PrismaLastBlockSyncedCategory.POOLS },
            });
            const lastSyncBlock = lastSync?.blockNumber ?? 0;

            const poolChangeEvents = await changelogSubgraphService.getPoolChangeEvents(lastSyncBlock + 1);

            let latestBlock = lastSyncBlock + 1;
            const poolIds = new Set<string>();
            for (let poolChangeEvent of poolChangeEvents) {
                const block = parseInt(poolChangeEvent.block);
                if (block > latestBlock) {
                    latestBlock = block;
                }
                poolIds.add(poolChangeEvent.poolId);
            }
            console.log(`Syncing ${poolIds.size} pools`);
            await poolService.updateOnChainDataForPools([...poolIds], latestBlock);

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

            const delay = minIntervalMs - (Date.now() - startTime);

            setTimeout(async () => {
                await this.syncChangedPools(minIntervalMs);
            }, Math.max(0, delay));
        } catch (error) {
            console.error('Error syncing changed pools', error);
        }
    }
}

export const poolSyncService = new PoolSyncService();
