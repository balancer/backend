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
    }

    return all;
}

export async function subgraphLoadAllAtBlock<T>(
    request: (variables: any) => Promise<any>,
    resultKey: string,
    block: number,
    cacheKey: string,
    args: any = {},
    cacheTimeout: number = thirtyDaysInSeconds,
): Promise<T[]> {
    const cachedResults = await cache.getObjectValue<T[]>(`${cacheKey}_${block}`);

    if (cachedResults) {
        return cachedResults;
    }

    const results = await subgraphLoadAll<T>(request, resultKey, { ...args, block: { number: block } });

    await cache.putObjectValue(`${cacheKey}_${block}`, results, cacheTimeout);

    return results;
}

export async function subgraphPurgeCacheKeyAtBlock(cacheKey: string, block: number): Promise<number> {
    return cache.deleteKey(`${cacheKey}_${block}`);
}
