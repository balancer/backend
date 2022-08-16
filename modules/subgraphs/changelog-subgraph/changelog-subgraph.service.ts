import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/changelog-subgraph-types';
import { networkConfig } from '../../config/network-config';

export type FarmChangeEvent = {
    __typename: 'FarmChangeEvent';
    action: string;
    farmId: number;
    block: string;
};

export type PoolChangeEvent = {
    __typename: 'PoolChangeEvent';
    action: string;
    poolId: string;
    block: string;
};

class ChangelogSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(networkConfig.subgraphs.changelog);
    }

    public async getEntityChangeLogs(minBlockNumber: number): Promise<Array<FarmChangeEvent | PoolChangeEvent>> {
        const changeLogsQuery = await getSdk(this.client).GetChangeEvents({
            minBlockNumber: minBlockNumber.toString(),
        });
        return changeLogsQuery.entityChangeEvents;
    }

    public async getPoolChangeEvents(minBlockNumber: number): Promise<Array<PoolChangeEvent>> {
        const poolChangesQuery = await getSdk(this.client).GetPoolChangeEvents({
            minBlockNumber: minBlockNumber.toString(),
        });
        return poolChangesQuery.poolChangeEvents;
    }

    public async getFarmChangeEvents(minBlockNumber: number): Promise<Array<FarmChangeEvent>> {
        const farmChangesQuery = await getSdk(this.client).GetFarmChangeEvents({
            minBlockNumber: minBlockNumber.toString(),
        });
        return farmChangesQuery.farmChangeEvents;
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const changelogSubgraphService = new ChangelogSubgraphService();
