import { GraphQLClient } from 'graphql-request';
import {
    FarmFragment,
    getSdk,
    MasterChef,
    MasterchefFarmsQuery,
    MasterchefFarmsQueryVariables,
    MasterchefUsersQuery,
    MasterchefUsersQueryVariables,
    QueryMasterChefsArgs,
} from './generated/masterchef-subgraph-types';
import { env } from '../../app/env';

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

    public getFarmForPoolAddress(poolAddress: string, farms: FarmFragment[]): FarmFragment | null {
        return farms.find((farm) => farm.pair.toLowerCase() === poolAddress.toLowerCase()) || null;
    }

    public get sdk() {
        return getSdk(this.client);
    }
}

export const masterchefService = new MasterchefSubgraphService();
