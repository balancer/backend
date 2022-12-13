import { GraphQLClient } from 'graphql-request';
import { networkConfig } from '../../config/network-config';
import { subgraphLoadAll } from '../subgraph-util';
import {
    getSdk,
    ReliquaryFarmFragment,
    ReliquaryFarmSnapshotsQuery,
    ReliquaryFarmSnapshotsQueryVariables,
    ReliquaryPoolLevelsQuery,
    ReliquaryPoolLevelsQueryVariables,
    ReliquaryPoolsQuery,
    ReliquaryPoolsQueryVariables,
    ReliquaryQuery,
    ReliquaryQueryVariables,
    ReliquaryRelicFragment,
    ReliquaryRelicSnapshotsQuery,
    ReliquaryRelicSnapshotsQueryVariables,
    ReliquaryRelicsQuery,
    ReliquaryRelicsQueryVariables,
    ReliquaryUsersQuery,
    ReliquaryUsersQueryVariables,
} from './generated/reliquary-subgraph-types';

export class ReliquarySubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(networkConfig.subgraphs.reliquary!);
    }

    public async getMetadata() {
        const { meta } = await this.sdk.ReliquaryGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }

        return meta;
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

    public async getAllRelics(args: ReliquaryRelicsQueryVariables): Promise<ReliquaryRelicFragment[]> {
        return subgraphLoadAll<ReliquaryRelicFragment>(this.sdk.ReliquaryRelics, 'relics', args);
    }

    public async getAllFarms(args: ReliquaryPoolsQueryVariables): Promise<ReliquaryFarmFragment[]> {
        return subgraphLoadAll<ReliquaryFarmFragment>(this.sdk.ReliquaryPools, 'farms', args);
    }

    public async getFarmSnapshots(args: ReliquaryFarmSnapshotsQueryVariables): Promise<ReliquaryFarmSnapshotsQuery> {
        return this.sdk.ReliquaryFarmSnapshots(args);
    }

    public async getRelicSnapshots(args: ReliquaryRelicSnapshotsQueryVariables): Promise<ReliquaryRelicSnapshotsQuery> {
        return this.sdk.ReliquaryRelicSnapshots(args);
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const reliquarySubgraphService = new ReliquarySubgraphService();
