import { balancerService } from '../balancer-subgraph/balancer.service';
import {
    BalancerLatestPriceFragment,
    BalancerPoolFragment,
    OrderDirection,
    Pool_OrderBy,
} from '../balancer-subgraph/generated/balancer-subgraph-types';
import { sanityClient } from '../sanity/sanity';
import { cache } from '../cache/cache';

const POOLS_CACHE_KEY = 'pools:all';
const LATEST_PRICE_CACHE_KEY_PREFIX = 'pools:latestPrice:';

export class PoolsService {
    constructor() {}

    public async getPools(): Promise<BalancerPoolFragment[]> {
        const pools = await cache.getObjectValue<BalancerPoolFragment[]>(POOLS_CACHE_KEY);

        if (pools) {
            return pools;
        }

        return this.cachePools();
    }

    public async getLatestPrice(id: string): Promise<BalancerLatestPriceFragment | null> {
        const cached = await cache.getObjectValue<BalancerLatestPriceFragment>(`${LATEST_PRICE_CACHE_KEY_PREFIX}${id}`);

        if (cached) {
            return cached;
        }

        const latestPrice = await balancerService.getLatestPrice(id);

        if (latestPrice) {
            await cache.putObjectValue(`${LATEST_PRICE_CACHE_KEY_PREFIX}${id}`, latestPrice);
        }

        return latestPrice;
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
