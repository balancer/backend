import { Price, TokenHistoricalPrices, TokenPrices } from './token-price-types';
import { coingeckoService } from './lib/coingecko.service';
import { balancerPriceService } from './lib/balancer-price.service';
import { sleep } from '../util/promise';
import _ from 'lodash';
import { env } from '../../app/env';
import { cache } from '../cache/cache';
import { Cache, CacheClass } from 'memory-cache';

import { getAddress } from 'ethers/lib/utils';
import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { beetsBarService } from '../beets-bar-subgraph/beets-bar.service';
import { getContractAt } from '../ethers/ethers';
import LinearPoolAbi from '../balancer/abi/LinearPool.json';
import { formatFixed } from '@ethersproject/bignumber';
import { BalancerPoolFragment } from '../balancer-subgraph/generated/balancer-subgraph-types';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import moment from 'moment-timezone';
import { SFTMX_ADDRESS, staderStakedFtmService } from './lib/stader-staked-ftm.service';

const TOKEN_PRICES_CACHE_KEY = 'token-prices';
const TOKEN_HISTORICAL_PRICES_CACHE_KEY = 'token-historical-prices';
const NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY = 'nested-bpt-historical-prices';
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
        const nestedBptPrices = await cache.getObjectValue<TokenHistoricalPrices>(
            NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY,
        );

        if (tokenPrices) {
            this.cache.put(TOKEN_HISTORICAL_PRICES_CACHE_KEY, { ...tokenPrices, ...nestedBptPrices }, 60000);
        }

        //don't try to refetch the cache, it takes way too long
        return { ...tokenPrices, ...nestedBptPrices };
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
        const pools = await balancerSubgraphService.getAllPools({});
        //TODO: if we get to a point where we support more than 1000 tokens, we need to paginate this better
        const { tokenAddresses, nestedBptAddresses } = await this.getTokenAddresses(pools);
        let coingeckoTokenPrices: TokenPrices = {};
        let nativeAssetPrice: Price | null = null;

        try {
            //rate limiting happens quite often, we try to handle it gracefully below
            coingeckoTokenPrices = await coingeckoService.getTokenPrices(tokenAddresses);
            nativeAssetPrice = await coingeckoService.getNativeAssetPrice();
        } catch {}

        const missingTokens = tokenAddresses.filter((token) => {
            const tokenPrice =
                coingeckoTokenPrices[token] ||
                coingeckoTokenPrices[getAddress(token)] ||
                coingeckoTokenPrices[token.toLowerCase()];

            return !tokenPrice || !tokenPrice.usd;
        });

        const balancerTokenPrices = await balancerPriceService.getTokenPrices(
            [...missingTokens, env.WRAPPED_NATIVE_ASSET_ADDRESS],
            coingeckoTokenPrices,
        );

        const nestedBptPrices = await this.getNestedBptPrices(nestedBptAddresses, pools, {
            ...coingeckoTokenPrices,
            ...balancerTokenPrices,
        });

        nativeAssetPrice = nativeAssetPrice || balancerTokenPrices[env.WRAPPED_NATIVE_ASSET_ADDRESS];
        const stakedFtmPrice = await staderStakedFtmService.getStakedFtmPrice(nativeAssetPrice.usd);

        const tokenPrices = {
            ...coingeckoTokenPrices,
            ...balancerTokenPrices,
            ...nestedBptPrices,
            [env.NATIVE_ASSET_ADDRESS]: nativeAssetPrice,
            //stader ftmx
            [SFTMX_ADDRESS]: stakedFtmPrice,
        };

        const cached = await cache.getObjectValue<TokenPrices>(TOKEN_PRICES_CACHE_KEY);
        const coingeckoRequestSuccessful = Object.keys(coingeckoTokenPrices).length > 0;

        //recache if the coingecko request was successful, or if there are no cached token prices
        if (coingeckoRequestSuccessful || cached === null) {
            await cache.putObjectValue(TOKEN_PRICES_CACHE_KEY, tokenPrices, 30);
        }
    }

    public async cacheHistoricalTokenPrices(): Promise<TokenHistoricalPrices> {
        const pools = await balancerSubgraphService.getAllPools({});
        const { tokenAddresses } = await this.getTokenAddresses(pools);
        const missingTokens: string[] = [];
        const tokenPrices: TokenHistoricalPrices = {};

        for (const token of tokenAddresses) {
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

    public async cacheHistoricalNestedBptPrices() {
        const pools = await balancerSubgraphService.getAllPools({});
        const { nestedBptAddresses } = await this.getTokenAddresses(pools);
        const historicalTokenPrices = await cache.getObjectValue<TokenHistoricalPrices>(
            TOKEN_HISTORICAL_PRICES_CACHE_KEY,
        );

        if (!historicalTokenPrices) {
            return;
        }

        const nestedBptHistoricalPrices: TokenHistoricalPrices = {};

        const blocks = await blocksSubgraphService.getDailyBlocks(30);

        for (const block of blocks) {
            const timestamp = parseInt(block.timestamp);
            const poolsAtBlock = await balancerSubgraphService.getAllPoolsAtBlock(parseInt(block.number));
            const tokenPricesAtBlock = this.getTokenPricesForTimestamp(timestamp, historicalTokenPrices);
            const nestedBptPrices = await this.getNestedBptPrices(nestedBptAddresses, poolsAtBlock, tokenPricesAtBlock);

            for (const nestedBpt of nestedBptAddresses) {
                if (!nestedBptHistoricalPrices[nestedBpt]) {
                    nestedBptHistoricalPrices[nestedBpt] = [];
                }

                if (nestedBptPrices[nestedBpt]) {
                    nestedBptHistoricalPrices[nestedBpt].push({
                        timestamp: timestamp * 1000,
                        price: nestedBptPrices[nestedBpt].usd,
                    });
                }
            }
        }

        await cache.putObjectValue(NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY, nestedBptHistoricalPrices);
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

    public async getTokenAddresses(
        pools: BalancerPoolFragment[],
    ): Promise<{ tokenAddresses: string[]; nestedBptAddresses: string[] }> {
        const allTokens = _.uniq(_.flatten(pools.map((pool) => (pool.tokens || []).map((token) => token.address))));
        const nestedBptAddresses = allTokens.filter((token) => this.isTokenNestedBpt(token, pools));
        const tokenAddresses = allTokens.filter((token) => !nestedBptAddresses.includes(token));

        return { tokenAddresses, nestedBptAddresses };
    }

    private isTokenNestedBpt(token: string, pools: BalancerPoolFragment[]): boolean {
        return !!pools.find((pool) => token === pool.address);
    }

    public async getNestedBptPrices(
        nestedBptAddresses: string[],
        pools: BalancerPoolFragment[],
        tokenPrices: TokenPrices,
    ): Promise<TokenPrices> {
        const nestedBptTokenPrices: TokenPrices = {};

        for (const nestedBptAddress of nestedBptAddresses) {
            const pool = pools.find((pool) => pool.address === nestedBptAddress);

            if (pool?.poolType === 'Linear') {
                const linearPool = getContractAt(pool.address, LinearPoolAbi);
                const rate = await linearPool.getRate();
                const formattedRate = formatFixed(rate, 18);
                const mainTokenPrice = this.getPriceForToken(tokenPrices, pool.tokensList[pool.mainIndex || 0]);

                nestedBptTokenPrices[nestedBptAddress] = {
                    usd: parseFloat(formattedRate) * mainTokenPrice,
                };

                if (mainTokenPrice && pool.wrappedIndex && pool.tokensList[pool.wrappedIndex]) {
                    const wrappedToken = pool.tokensList[pool.wrappedIndex];
                    const wrappedRate = await linearPool.getWrappedTokenRate();
                    const formattedWrappedRate = formatFixed(wrappedRate, 18);

                    nestedBptTokenPrices[wrappedToken] = {
                        usd: parseFloat(formattedWrappedRate) * mainTokenPrice,
                    };
                }
            }
        }

        for (const nestedBptAddress of nestedBptAddresses) {
            const pool = pools.find((pool) => pool.address === nestedBptAddress);

            //TODO: chance this can fail for stable phantom nested in stable phantom, depending on ordering
            if (pool?.poolType === 'StablePhantom') {
                const totalLiquidity = _.sum(
                    pool.tokens?.map((token) => {
                        const tokenPrice =
                            this.getPriceForToken(tokenPrices, token.address) ||
                            nestedBptTokenPrices[token.address]?.usd ||
                            0;

                        return parseFloat(token.balance) * tokenPrice;
                    }),
                );

                if (totalLiquidity > 0 && parseFloat(pool.totalShares) > 0) {
                    nestedBptTokenPrices[nestedBptAddress] = {
                        usd: totalLiquidity / parseFloat(pool.totalShares),
                    };
                }
            }
        }

        return nestedBptTokenPrices;
    }
}

export const tokenPriceService = new TokenPriceService();
