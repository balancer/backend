import { Address } from 'viem';
import { SftmxSubgraphService } from '../../sources/subgraphs/sftmx-subgraph/sftmx.service';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

export async function syncSftmxStakingSnapshots(
    stakingContractAddress: Address,
    sftmxSubgraphClient: SftmxSubgraphService,
) {
    const latestSyncedRequest = await prisma.prismaSftmxStakingDataSnapshot.findFirst({
        orderBy: {
            timestamp: 'desc',
        },
    });

    const allSnapshots = await sftmxSubgraphClient.getStakingSnapshotsAfter(latestSyncedRequest?.timestamp || 0);

    const operations = [];
    for (const snapshot of allSnapshots) {
        const snapshotData = {
            id: snapshot.id,
            timestamp: snapshot.snapshotTimestamp,
            freePoolFtmAmount: snapshot.freePoolFtmAmount,
            lockedFtmAmount: snapshot.lockedFtmAmount,
            totalFtmAmount: snapshot.totalFtmAmount,
            exchangeRate: snapshot.exchangeRate,
            ftmStakingId: stakingContractAddress,
        };
        operations.push(
            prisma.prismaSftmxStakingDataSnapshot.upsert({
                where: { id: snapshotData.id },
                create: snapshotData,
                update: snapshotData,
            }),
        );
    }
    await prismaBulkExecuteOperations(operations);
}
