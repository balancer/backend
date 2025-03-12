import {
    FarmFragment,
    FarmUserFragment,
    getSdk,
    MasterChef,
    MasterchefFarmsQuery,
    MasterchefFarmsQueryVariables,
    MasterchefPortfolioDataQuery,
    MasterchefPortfolioDataQueryVariables,
    MasterchefUsersQuery,
    MasterchefUsersQueryVariables,
    QueryMasterChefsArgs,
} from './generated/masterchef-subgraph-types';
import { subgraphLoadAll } from '../subgraph-util';
import { Cache, CacheClass } from 'memory-cache';
import { GraphQLClient } from 'graphql-request';

export class MasterchefSubgraphService {
    private readonly cache: CacheClass<string, any>;
    private sdk: ReturnType<typeof getSdk>;

    constructor(subgraphUrl: string) {
        this.cache = new Cache<string, any>();
        this.sdk = getSdk(new GraphQLClient(subgraphUrl));
    }

    public async lastSyncedBlock() {
        const { meta } = await this.sdk.MasterchefGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }

        return Number(meta.block.number);
    }

    public async getMasterChef(args: QueryMasterChefsArgs): Promise<MasterChef> {
        const response = await this.sdk.Masterchefs(args);

        if (!response || response.masterChefs.length === 0) {
            throw new Error('Missing masterchef');
        }

        //There is only ever one
        return response.masterChefs[0];
    }

    public async getFarms(args: MasterchefFarmsQueryVariables): Promise<MasterchefFarmsQuery> {
        return this.sdk.MasterchefFarms(args);
    }

    public async getFarmUsers(args: MasterchefUsersQueryVariables): Promise<MasterchefUsersQuery> {
        return this.sdk.MasterchefUsers(args);
    }

    public async getAllFarms(args: MasterchefFarmsQueryVariables): Promise<FarmFragment[]> {
        return subgraphLoadAll<FarmFragment>(this.sdk.MasterchefFarms, 'farms', args);
    }

    public async getAllFarmUsers(args: MasterchefUsersQueryVariables): Promise<FarmUserFragment[]> {
        return subgraphLoadAll<FarmUserFragment>(this.sdk.MasterchefUsers, 'farmUsers', args);
    }

    public async getPortfolioData(args: MasterchefPortfolioDataQueryVariables): Promise<MasterchefPortfolioDataQuery> {
        return this.sdk.MasterchefPortfolioData(args);
    }

    public getFarmForPoolAddress(poolAddress: string, farms: FarmFragment[]): FarmFragment | null {
        return farms.find((farm) => farm.pair.toLowerCase() === poolAddress.toLowerCase()) || null;
    }
}
