import { cache } from '../cache/cache';

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

export async function subgraphPurgeCacheKeyAtBlock(cacheKey: string, block: number): Promise<number> {
    return cache.deleteKey(`${cacheKey}_${block}`);
}
