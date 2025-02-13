import { Address } from 'viem';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { StsSubgraphService } from '../../sources/subgraphs/sts-subgraph/sts.service';
import config from '../../../config';

export async function syncSonicStakingSnapshots(
    stakingContractAddress: Address,
    stsSubgraphClient: StsSubgraphService,
) {
    const latestSyncedRequest = await prisma.prismaSonicStakingDataSnapshot.findFirst({
        orderBy: {
            timestamp: 'desc',
        },
    });

    const allSnapshots = await stsSubgraphClient.getStakingSnapshotsAfter(latestSyncedRequest?.timestamp || 0);

    const operations = [];
    for (const snapshot of allSnapshots) {
        const sPrice = await prisma.prismaTokenPrice.findFirst({
            where: {
                chain: 'SONIC',
                tokenAddress: config['SONIC'].weth.address,
                timestamp: snapshot.snapshotTimestamp,
            },
        });

        const protocolFee24hrsUsd = parseFloat(snapshot.protocolFee24h) * (sPrice?.price || 0);
        const rewardsClaimed24hUsd = parseFloat(snapshot.rewardsClaimed24h) * (sPrice?.price || 0);

        const snapshotData = {
            id: snapshot.id,
            timestamp: snapshot.snapshotTimestamp,
            totalAssetsPool: snapshot.totalPool,
            totalAssetsDelegated: snapshot.totalDelegated,
            totalAssets: snapshot.totalAssets,
            exchangeRate: snapshot.exchangeRate,
            sonicStakingId: stakingContractAddress,
            protocolFee24h: `${protocolFee24hrsUsd}`,
            rewardsClaimed24h: `${rewardsClaimed24hUsd}`,
        };
        operations.push(
            prisma.prismaSonicStakingDataSnapshot.upsert({
                where: { id: snapshotData.id },
                create: snapshotData,
                update: snapshotData,
            }),
        );
    }
    await prismaBulkExecuteOperations(operations);
}
