import { Price, TokenHistoricalPrices, TokenPrices } from './token-price-types';
import { coingeckoService } from './lib/coingecko.service';
import { balancerPriceService } from './lib/balancer-price.service';
import { sleep } from '../util/promise';
import _ from 'lodash';
import { env } from '../../app/env';
import { balancerService } from '../balancer/balancer.service';
import { cache } from '../cache/cache';
import { Cache, CacheClass } from 'memory-cache';

import { getAddress } from 'ethers/lib/utils';
import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { beetsBarService } from '../beets-bar-subgraph/beets-bar.service';

const TOKEN_PRICES_CACHE_KEY = 'token-prices';
const TOKEN_HISTORICAL_PRICES_CACHE_KEY = 'token-historical-prices';
const BEETS_PRICE_CACHE_KEY = 'token-prices:beets-price';
const FBEETS_PRICE_CACHE_KEY = 'token-prices:fbeets-price';

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

    public async cacheTokenPrices(): Promise<void> {
        //TODO: if we get to a point where we support more than 1000 tokens, we need to paginate this better
        const addresses = await this.getTokenAddresses();
        let coingeckoTokenPrices: TokenPrices = {};
        let nativeAssetPrice: Price | null = null;

        try {
            //rate limiting happens quite often, we try to handle it gracefully below
            coingeckoTokenPrices = await coingeckoService.getTokenPrices(addresses);
            nativeAssetPrice = await coingeckoService.getNativeAssetPrice();
        } catch {}

        const missingTokens = addresses.filter(
            (token) =>
                !coingeckoTokenPrices[token] &&
                !coingeckoTokenPrices[getAddress(token)] &&
                !coingeckoTokenPrices[token.toLowerCase()],
        );
        const balancerTokenPrices = await balancerPriceService.getTokenPrices(
            [...missingTokens, env.WRAPPED_NATIVE_ASSET_ADDRESS],
            coingeckoTokenPrices,
        );
        const tokenPrices = {
            ...coingeckoTokenPrices,
            ...balancerTokenPrices,
            [env.NATIVE_ASSET_ADDRESS]: nativeAssetPrice || balancerTokenPrices[env.WRAPPED_NATIVE_ASSET_ADDRESS],
        };

        const cached = await cache.getObjectValue<TokenPrices>(TOKEN_PRICES_CACHE_KEY);
        const coingeckoRequestSuccessful = Object.keys(coingeckoTokenPrices).length > 0;

        //recache if the coingecko request was successful, or if there are no cached token prices
        if (coingeckoRequestSuccessful || cached === null) {
            await cache.putObjectValue(TOKEN_PRICES_CACHE_KEY, tokenPrices, 30);
        }
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

    public getPriceForToken(tokenPrices: TokenPrices, address: string): number {
        return (
            tokenPrices[address]?.usd ||
            tokenPrices[getAddress(address)]?.usd ||
            tokenPrices[address.toLowerCase()]?.usd ||
            0
        );
    }

    public async getBeetsPrice(): Promise<{
        beetsPrice: number;
        fbeetsPrice: number;
    }> {
        const beetsPrice = await cache.getValue(BEETS_PRICE_CACHE_KEY);
        const fbeetsPrice = await cache.getValue(FBEETS_PRICE_CACHE_KEY);

        if (!beetsPrice || !fbeetsPrice) {
            throw new Error('did not find price for beets');
        }

        return {
            beetsPrice: parseFloat(beetsPrice),
            fbeetsPrice: parseFloat(fbeetsPrice),
        };
    }

    public async cacheBeetsPrice() {
        const { pool: beetsUsdcPool } = await balancerSubgraphService.getPool({
            id: '0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015',
        });

        const beets = (beetsUsdcPool?.tokens ?? []).find((token) => token.address === env.BEETS_ADDRESS.toLowerCase());
        const usdc = (beetsUsdcPool?.tokens ?? []).find((token) => token.address !== env.BEETS_ADDRESS.toLowerCase());

        const { pool: beetsFtmPool } = await balancerSubgraphService.getPool({
            id: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
        });

        if (!beets || !usdc || !beetsFtmPool) {
            throw new Error('did not find price for beets');
        }

        const bptPrice = parseFloat(beetsFtmPool.totalLiquidity) / parseFloat(beetsFtmPool.totalShares);
        const beetsBar = await beetsBarService.getBeetsBarNow();
        const fbeetsPrice = bptPrice * parseFloat(beetsBar.ratio);

        const beetsPrice =
            ((parseFloat(beets.weight || '0') / parseFloat(usdc.weight || '1')) * parseFloat(usdc.balance)) /
            parseFloat(beets.balance);

        await cache.putValue(BEETS_PRICE_CACHE_KEY, `${beetsPrice}`, 30);
        await cache.putValue(FBEETS_PRICE_CACHE_KEY, `${fbeetsPrice}`, 30);
    }

    private async getTokenAddresses(): Promise<string[]> {
        const pools = await balancerService.getPools();

        return _.uniq(_.flatten(pools.map((pool) => (pool.tokens || []).map((token) => token.address))));
    }
}

export const tokenPriceService = new TokenPriceService();
