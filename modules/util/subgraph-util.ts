import { BalancerUserFragment } from '../balancer-subgraph/generated/balancer-subgraph-types';
import { cache } from '../cache/cache';
import { thirtyDaysInSeconds } from './time';

export async function subgraphLoadAll<T>(
    request: (variables: any) => Promise<any>,
    resultKey: string,
    args: any,
): Promise<T[]> {
    let all: any[] = [];
    const limit = 1000;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
        const response = await request({
            ...args,
            first: limit,
            skip,
        });

        all = [...all, ...response[resultKey]];
        skip += limit;
        hasMore = response[resultKey].length === limit;

        //TODO: rip this out asap
        if (skip > 5000) {
            console.log('BAILING EARLY FROM A subgraphLoadAll', resultKey, args);
            break;
        }
    }

    return all;
}

export async function subgraphPurgeCacheKeyAtBlock(cacheKey: string, block: number): Promise<number> {
    return cache.deleteKey(`${cacheKey}_${block}`);
}
