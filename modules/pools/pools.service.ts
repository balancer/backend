import { balancerService } from '../balancer-subgraph/balancer.service';
import {
    BalancerPoolFragment,
    OrderDirection,
    Pool_OrderBy,
} from '../balancer-subgraph/generated/balancer-subgraph-types';
import { sanityClient } from '../sanity/sanity';
import { cache } from '../cache/cache';

const POOLS_CACHE_KEY = 'pools:all';

export class PoolsService {
    constructor() {}

    public async getPools(): Promise<BalancerPoolFragment[]> {
        const pools = await cache.getObjectValue<BalancerPoolFragment[]>(POOLS_CACHE_KEY);

        if (pools) {
            return pools;
        }

        return this.cachePools();
    }

    public async cachePools(): Promise<BalancerPoolFragment[]> {
        const blacklistedPools = await this.getBlacklistedPools();
        const pools = await balancerService.getAllPools({
            orderBy: Pool_OrderBy.TotalLiquidity,
            orderDirection: OrderDirection.Desc,
        });

        const filtered = pools.filter((pool) => {
            if (blacklistedPools.includes(pool.id)) {
                return false;
            }

            if (parseFloat(pool.totalShares) < 0.01) {
                return false;
            }

            return true;
        });

        await cache.putObjectValue(POOLS_CACHE_KEY, filtered, 30);

        return filtered;
    }

    private async getBlacklistedPools() {
        const response = await sanityClient.fetch<string[] | null>(
            `*[_type == "config" && chainId == 250][0].blacklistedPools`,
        );

        return response || [];
    }
}

export const poolsService = new PoolsService();
