import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import {
    BalancerLatestPriceFragment,
    BalancerPoolFragment,
    OrderDirection,
    Pool_OrderBy,
} from '../balancer-subgraph/generated/balancer-subgraph-types';
import { sanityClient } from '../sanity/sanity';
import { cache } from '../cache/cache';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import { getOnChainBalances } from './src/onchainData';
import { providers } from 'ethers';
import { env } from '../../app/env';
import { BALANCER_NETWORK_CONFIG } from './src/contracts';

const POOLS_CACHE_KEY = 'pools:all';
const PAST_POOLS_CACHE_KEY = 'pools:24h';
const LATEST_PRICE_CACHE_KEY_PREFIX = 'pools:latestPrice:';

export class BalancerService {
    constructor() {}

    public async getPools(): Promise<BalancerPoolFragment[]> {
        const pools = await cache.getObjectValue<BalancerPoolFragment[]>(POOLS_CACHE_KEY);

        if (pools) {
            return pools;
        }

        return this.cachePools();
    }

    public async getPastPools(): Promise<BalancerPoolFragment[]> {
        const pools = await cache.getObjectValue<BalancerPoolFragment[]>(PAST_POOLS_CACHE_KEY);

        if (pools) {
            return pools;
        }

        return this.cachePastPools();
    }

    public async getLatestPrice(id: string): Promise<BalancerLatestPriceFragment | null> {
        const cached = await cache.getObjectValue<BalancerLatestPriceFragment>(`${LATEST_PRICE_CACHE_KEY_PREFIX}${id}`);

        if (cached) {
            return cached;
        }

        const latestPrice = await balancerSubgraphService.getLatestPrice(id);

        if (latestPrice) {
            await cache.putObjectValue(`${LATEST_PRICE_CACHE_KEY_PREFIX}${id}`, latestPrice);
        }

        return latestPrice;
    }

    public async cachePools(): Promise<BalancerPoolFragment[]> {
        const provider = new providers.JsonRpcProvider(env.RPC_URL);
        const blacklistedPools = await this.getBlacklistedPools();
        const pools = await balancerSubgraphService.getAllPools({
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

        const filteredWithOnChainBalances = await getOnChainBalances(
            filtered,
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].multicall,
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].vault,
            provider,
        );

        await cache.putObjectValue(POOLS_CACHE_KEY, filteredWithOnChainBalances, 30);

        return filteredWithOnChainBalances;
    }

    public async cachePastPools(): Promise<BalancerPoolFragment[]> {
        const block = await blocksSubgraphService.getBlockFrom24HoursAgo();
        const blacklistedPools = await this.getBlacklistedPools();
        const pools = await balancerSubgraphService.getAllPools({
            orderBy: Pool_OrderBy.TotalLiquidity,
            orderDirection: OrderDirection.Desc,
            block: { number: parseInt(block.number) },
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

        await cache.putObjectValue(PAST_POOLS_CACHE_KEY, filtered, 30);

        return filtered;
    }

    private async getBlacklistedPools() {
        const response = await sanityClient.fetch<string[] | null>(
            `*[_type == "config" && chainId == 250][0].blacklistedPools`,
        );

        return response || [];
    }
}

export const balancerService = new BalancerService();
