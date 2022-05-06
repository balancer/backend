import { prisma } from '../util/prisma-client';
import { PrismaLastBlockSyncedCategory } from '@prisma/client';
import { changelogSubgraphService } from '../subgraphs/changelog-subgraph/changelog-subgraph.service';
import { poolService } from './pool.service';

class PoolSync {
    public async syncChangedPools(minInterval: number = 500) {
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

            await prisma.prismaLastBlockSynced.update({
                where: { category: PrismaLastBlockSyncedCategory.POOLS },
                data: {
                    blockNumber: latestBlock,
                },
            });

            // we wanna run it max once every 500ms
            setTimeout(this.syncChangedPools, Math.max(0, minInterval - (Date.now() - startTime)));
        } catch (error) {
            console.error('Error syncing changed pools', error);
        }
    }
}
