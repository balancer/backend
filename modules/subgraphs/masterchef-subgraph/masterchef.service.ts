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
import { twentyFourHoursInMs } from '../../common/time';
import { Cache, CacheClass } from 'memory-cache';
import { GraphQLClient } from 'graphql-request';
import { networkContext } from '../../network/network-context.service';

const ALL_FARM_USERS_CACHE_KEY = `masterchef-all-farm-users`;

export class MasterchefSubgraphService {
    private readonly cache: CacheClass<string, any>;

    constructor() {
        this.cache = new Cache<string, any>();
    }

    public async getMetadata() {
        const { meta } = await this.sdk.MasterchefGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }

        return meta;
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

    public async getFarmUsersAtBlock(address: string, block: number): Promise<FarmUserFragment[]> {
        const cachedUsers = this.cache.get(`${ALL_FARM_USERS_CACHE_KEY}:${networkContext.chainId}:${block}`) as
            | FarmUserFragment[]
            | null;

        if (cachedUsers) {
            return cachedUsers.filter((user) => user.address === address) || null;
        }

        const users = await this.getAllFarmUsers({ block: { number: block } });

        this.cache.put(`${ALL_FARM_USERS_CACHE_KEY}:${networkContext.chainId}:${block}`, users, twentyFourHoursInMs);

        return users.filter((user) => user.id === address);
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

    public get sdk() {
        const client = new GraphQLClient(networkContext.data.subgraphs.masterchef!);

        return getSdk(client);
    }
}

export const masterchefService = new MasterchefSubgraphService();
