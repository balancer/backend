import { Chain } from '@prisma/client';
import { GraphQLClient } from 'graphql-request';
import { PoolSchema, PoolSchemaFragment, getSdk } from './generated/aura-subgraph-types';
import { chainToIdMap } from '../../../network/network-config';

export class AuraSubgraphService {
    private sdk: ReturnType<typeof getSdk>;

    constructor(subgraphUrl: string) {
        this.sdk = getSdk(new GraphQLClient(subgraphUrl));
    }

    public async getAllPools(chains: Chain[]): Promise<PoolSchemaFragment[]> {
        const chainIds = chains.map((chain) => parseFloat(chainToIdMap[chain]));

        const result = await this.sdk.allPools({
            chainIds: chainIds,
        });

        return result.allPools;
    }
}
