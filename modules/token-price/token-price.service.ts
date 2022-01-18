import { Price, TokenHistoricalPrices, TokenPrices } from './token-price-types';
import { coingeckoService } from './lib/coingecko.service';
import { balancerPriceService } from './lib/balancer-price.service';
import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { sleep } from '../util/promise';
import _ from 'lodash';
import { env } from '../../app/env';
import { balancerService } from '../balancer/balancer.service';
import { cache } from '../cache/cache';
import { CacheClass, Cache } from 'memory-cache';
import { BalancerPoolFragment } from '../balancer-subgraph/generated/balancer-subgraph-types';
import { GqlBalancerPool } from '../../schema';

const TOKEN_PRICES_CACHE_KEY = 'token-prices';
const TOKEN_HISTORICAL_PRICES_CACHE_KEY = 'token-historical-prices';

export class TokenPriceService {
    cache: CacheClass<string, any>;

    constructor() {
        this.cache = new Cache<string, any>();
    }

    public async getTokenPrices(): Promise<TokenPrices> {
        const memCached = this.cache.get(TOKEN_PRICES_CACHE_KEY) as TokenPrices | null;

        if (memCached) {
            return memCached;
        }

        const tokenPrices = await cache.getObjectValue<TokenPrices>(TOKEN_PRICES_CACHE_KEY);

        if (tokenPrices) {
            this.cache.put(TOKEN_PRICES_CACHE_KEY, tokenPrices, 5000);
        }

        return tokenPrices || {};
    }

    public async getHistoricalTokenPrices(): Promise<TokenHistoricalPrices> {
        const memCached = this.cache.get(TOKEN_HISTORICAL_PRICES_CACHE_KEY) as TokenHistoricalPrices | null;

        if (memCached) {
            return memCached;
        }

        const tokenPrices = await cache.getObjectValue<TokenHistoricalPrices>(TOKEN_HISTORICAL_PRICES_CACHE_KEY);

        if (tokenPrices) {
            this.cache.put(TOKEN_HISTORICAL_PRICES_CACHE_KEY, tokenPrices, 60000);
        }

        //don't try to refetch the cache, it takes way too long
        return tokenPrices || {};
    }

    public getTokenPricesForTimestamp(timestamp: number, tokenHistoricalPrices: TokenHistoricalPrices): TokenPrices {
        const msTimestamp = timestamp * 1000;
        return _.mapValues(tokenHistoricalPrices, (tokenPrices) => {
            if (tokenPrices.length === 0) {
                return { usd: 0 };
            }

            const closest = tokenPrices.reduce((a, b) => {
                return Math.abs(b.timestamp - msTimestamp) < Math.abs(a.timestamp - msTimestamp) ? b : a;
            });

            return { usd: closest.price };
        });
    }

    public async cacheTokenPrices(): Promise<TokenPrices> {
        //TODO: if we get to a point where we support more than 1000 tokens, we need to paginate this better
        const addresses = await this.getTokenAddresses();
        let coingeckoTokenPrices: TokenPrices = {};
        let nativeAssetPrice: Price | null = null;

        try {
            coingeckoTokenPrices = await coingeckoService.getTokenPrices(addresses);
            nativeAssetPrice = await coingeckoService.getNativeAssetPrice();
        } catch {}

        const missingTokens = addresses.filter((token) => !coingeckoTokenPrices[token]);
        const balancerTokenPrices = await balancerPriceService.getTokenPrices(
            [...missingTokens, env.WRAPPED_NATIVE_ASSET_ADDRESS],
            coingeckoTokenPrices,
        );
        const tokenPrices = {
            ...coingeckoTokenPrices,
            ...balancerTokenPrices,
            [env.NATIVE_ASSET_ADDRESS]: nativeAssetPrice || balancerTokenPrices[env.WRAPPED_NATIVE_ASSET_ADDRESS],
        };

        await cache.putObjectValue(TOKEN_PRICES_CACHE_KEY, tokenPrices, 30);

        return tokenPrices;
    }

    public async cacheHistoricalTokenPrices(): Promise<TokenHistoricalPrices> {
        const addresses = await this.getTokenAddresses();
        const missingTokens: string[] = [];
        const tokenPrices: TokenHistoricalPrices = {};

        for (const token of addresses) {
            try {
                tokenPrices[token] = await coingeckoService.getTokenHistoricalPrices(token, 30);
            } catch {
                missingTokens.push(token);
            }

            //coingecko rate limit is 10 requests per seconds, be generous here so we don't get rate limited
            await sleep(150);
        }

        for (const token of [...missingTokens]) {
            tokenPrices[token] = await balancerPriceService.getHistoricalTokenPrices({
                address: token,
                days: 30,
                coingeckoHistoricalPrices: tokenPrices,
            });
        }

        await cache.putObjectValue(TOKEN_HISTORICAL_PRICES_CACHE_KEY, tokenPrices);

        return tokenPrices;
    }

    private async getTokenAddresses(): Promise<string[]> {
        const pools = await balancerService.getPools();

        return _.uniq(_.flatten(pools.map((pool) => (pool.tokens || []).map((token) => token.address))));
    }
}

export const tokenPriceService = new TokenPriceService();
