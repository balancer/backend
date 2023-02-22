import { ReliquarySnapshotService } from './reliquary-snapshot.service';
import { networkContext } from '../../network/network-context.service';
import { GqlPoolSnapshotDataRange } from '../../../schema';
import { prisma } from '../../../prisma/prisma-client';
import { reliquarySubgraphService } from '../../subgraphs/reliquary-subgraph/reliquary.service';

export class ReliquaryService {
    constructor(private readonly reliquarySnapshotService: ReliquarySnapshotService) {}

    public async getSnapshotsForReliquaryFarm(id: number, range: GqlPoolSnapshotDataRange) {
        return this.reliquarySnapshotService.getSnapshotsForFarm(id, range);
    }

    public async syncLatestReliquarySnapshotsForAllFarms() {
        await this.reliquarySnapshotService.syncLatestSnapshotsForAllFarms();
    }

    public async loadReliquarySnapshotsForAllFarms() {
        await prisma.prismaReliquaryTokenBalanceSnapshot.deleteMany({ where: { chain: networkContext.chain } });
        await prisma.prismaReliquaryLevelSnapshot.deleteMany({ where: { chain: networkContext.chain } });
        await prisma.prismaReliquaryFarmSnapshot.deleteMany({ where: { chain: networkContext.chain } });
        const farms = await prisma.prismaPoolStakingReliquaryFarm.findMany({ where: { chain: networkContext.chain } });
        const farmIds = farms.map((farm) => parseFloat(farm.id));
        for (const farmId of farmIds) {
            await this.reliquarySnapshotService.loadAllSnapshotsForFarm(farmId);
        }
    }
}

export const reliquaryService = new ReliquaryService(new ReliquarySnapshotService(reliquarySubgraphService));
