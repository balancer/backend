import { prisma } from '../util/prisma-client';
import { PrismaLastBlockSyncedCategory } from '@prisma/client';
import { changelogSubgraphService } from '../subgraphs/changelog-subgraph/changelog-subgraph.service';
import { poolService } from './pool.service';

class PoolSync {
    public async syncChangedPools() {
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
        await poolService.updateOnChainDataForPools([...poolIds], latestBlock);

        await prisma.prismaLastBlockSynced.update({
            where: { category: PrismaLastBlockSyncedCategory.POOLS },
            data: {
                blockNumber: latestBlock,
            },
        });
    }
}
