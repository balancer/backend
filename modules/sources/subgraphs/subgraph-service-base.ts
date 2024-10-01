import { GraphQLClient } from 'graphql-request';
import { Cache, CacheClass } from 'memory-cache';
import { retryOnFailureWithRotation } from './retry-on-failure';
import { Chain } from '@prisma/client';

export class SubgraphServiceBase<TSdk> {
    protected cache: CacheClass<string, any>;
    private sdks: TSdk[];

    constructor(
        subgraphUrl: string | string[],
        protected chain: Chain,
        private getSdk: (client: GraphQLClient) => TSdk,
    ) {
        this.cache = new Cache<string, any>();

        if (Array.isArray(subgraphUrl)) {
            this.sdks = subgraphUrl.map((url) => this.getSdk(new GraphQLClient(url)));
        } else {
            this.sdks = [this.getSdk(new GraphQLClient(subgraphUrl))];
        }
    }

    protected async retryOnFailure<T>(fn: (sdk: TSdk) => Promise<T>, retries: number = 3): Promise<T> {
        return retryOnFailureWithRotation(this.sdks, fn, retries);
    }
}
