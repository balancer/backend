import { GraphQLClient } from 'graphql-request';
import { subgraphLoadAll } from '../subgraph-util';
import {
    DailyPoolSnapshot_OrderBy,
    DailyRelicSnapshot_OrderBy,
    getSdk,
    OrderDirection,
    Relic_OrderBy,
    ReliquaryFarmFragment,
    ReliquaryFarmSnapshotFragment,
    ReliquaryFarmSnapshotsQuery,
    ReliquaryFarmSnapshotsQueryVariables,
    ReliquaryPoolLevelsQuery,
    ReliquaryPoolLevelsQueryVariables,
    ReliquaryPoolsQuery,
    ReliquaryPoolsQueryVariables,
    ReliquaryQuery,
    ReliquaryQueryVariables,
    ReliquaryRelicFragment,
    ReliquaryRelicSnapshotFragment,
    ReliquaryRelicSnapshotsQuery,
    ReliquaryRelicSnapshotsQueryVariables,
    ReliquaryRelicsQuery,
    ReliquaryRelicsQueryVariables,
    ReliquaryUsersQuery,
    ReliquaryUsersQueryVariables,
} from './generated/reliquary-subgraph-types';

export class ReliquarySubgraphService {
    private sdk: ReturnType<typeof getSdk>;

    constructor(subgraphUrl: string) {
        this.sdk = getSdk(new GraphQLClient(subgraphUrl));
    }

    public async lastSyncedBlock() {
        const { meta } = await this.sdk.ReliquaryGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }

        return Number(meta.block.number);
    }

    public async getReliquary(args: ReliquaryQueryVariables): Promise<ReliquaryQuery> {
        return this.sdk.Reliquary(args);
    }

    public async getFarms(args: ReliquaryPoolsQueryVariables): Promise<ReliquaryPoolsQuery> {
        return this.sdk.ReliquaryPools(args);
    }

    public async getReliquaryUsers(args: ReliquaryUsersQueryVariables): Promise<ReliquaryUsersQuery> {
        return this.sdk.ReliquaryUsers(args);
    }

    public async getRelics(args: ReliquaryRelicsQueryVariables): Promise<ReliquaryRelicsQuery> {
        return this.sdk.ReliquaryRelics(args);
    }

    public async getPoolLevels(args: ReliquaryPoolLevelsQueryVariables): Promise<ReliquaryPoolLevelsQuery> {
        return this.sdk.ReliquaryPoolLevels(args);
    }

    public async getAllRelicsWithPaging({
        where,
        block,
    }: Pick<ReliquaryRelicsQueryVariables, 'where' | 'block'>): Promise<ReliquaryRelicFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let relics: ReliquaryRelicFragment[] = [];
        let id = 0;

        while (hasMore) {
            const response = await this.sdk.ReliquaryRelics({
                where: { ...where, relicId_gt: id },
                block,
                orderBy: Relic_OrderBy.relicId,
                orderDirection: OrderDirection.asc,
                first: limit,
            });

            relics = [...relics, ...response.relics];

            if (response.relics.length < limit) {
                hasMore = false;
            } else {
                id = response.relics[response.relics.length - 1].relicId;
            }
        }

        return relics;
    }

    public async getAllFarms(args: ReliquaryPoolsQueryVariables): Promise<ReliquaryFarmFragment[]> {
        return subgraphLoadAll<ReliquaryFarmFragment>(this.sdk.ReliquaryPools, 'farms', args);
    }

    public async getAllRelicSnapshotsSince(timestamp = 0): Promise<ReliquaryRelicSnapshotFragment[]> {
        let allSnapshots: ReliquaryRelicSnapshotFragment[] = [];
        let snapshotId = '0';
        do {
            const result = await this.sdk.ReliquaryRelicSnapshots({
                where: { id_gt: snapshotId, snapshotTimestamp_gte: timestamp },
                first: 1000,
                orderBy: DailyRelicSnapshot_OrderBy.id,
                orderDirection: OrderDirection.desc,
            });
            if (result.relicSnapshots.length === 0) {
                break;
            }
            allSnapshots.push(...result.relicSnapshots);
            snapshotId = result.relicSnapshots[result.relicSnapshots.length - 1].id;

            if (result.relicSnapshots.length < 1000) {
                break;
            }
        } while (true);

        return allSnapshots;
    }

    public async getAllFarmSnapshotsForFarm(farmId: number): Promise<ReliquaryFarmSnapshotFragment[]> {
        const limit = 1000;
        let hasMore = true;
        let snapshots: ReliquaryFarmSnapshotFragment[] = [];
        let timestamp = 0;

        while (hasMore) {
            const response = await this.sdk.ReliquaryFarmSnapshots({
                where: { snapshotTimestamp_gt: timestamp, poolId: farmId },
                orderBy: DailyPoolSnapshot_OrderBy.snapshotTimestamp,
                orderDirection: OrderDirection.asc,
                first: limit,
            });

            snapshots = [...snapshots, ...response.farmSnapshots];

            if (response.farmSnapshots.length < limit) {
                hasMore = false;
            } else {
                timestamp = response.farmSnapshots[response.farmSnapshots.length - 1].snapshotTimestamp;
            }
        }

        return snapshots;
    }

    public async getFarmSnapshots(args: ReliquaryFarmSnapshotsQueryVariables): Promise<ReliquaryFarmSnapshotsQuery> {
        return this.sdk.ReliquaryFarmSnapshots(args);
    }

    public async getRelicSnapshots(args: ReliquaryRelicSnapshotsQueryVariables): Promise<ReliquaryRelicSnapshotsQuery> {
        return this.sdk.ReliquaryRelicSnapshots(args);
    }
}
