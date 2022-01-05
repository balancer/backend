import { GraphQLClient } from 'graphql-request';
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
import { env } from '../../app/env';
import { subgraphLoadAll, subgraphPurgeCacheKeyAtBlock } from '../util/subgraph-util';
import { BalancerUserFragment } from '../balancer-subgraph/generated/balancer-subgraph-types';

const ALL_FARM_USERS_CACHE_KEY = 'masterchef-all-farm-users';

export class MasterchefSubgraphService {
    private readonly client: GraphQLClient;

    constructor() {
        this.client = new GraphQLClient(env.MASTERCHEF_SUBGRAPH);
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

    public async clearCacheAtBlock(block: number) {
        await subgraphPurgeCacheKeyAtBlock(ALL_FARM_USERS_CACHE_KEY, block);
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const masterchefService = new MasterchefSubgraphService();
